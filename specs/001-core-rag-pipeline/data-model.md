# Data Model: 企业研报智能问答系统

## Overview

系统使用两种存储：
- **SQLite**：结构化数据（研报元数据、问答记录、会话信息）
- **FAISS**：向量索引（文本块嵌入）

---

## Entity: Report（研报）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Integer | PK, Auto | 主键 |
| filename | String(255) | NOT NULL | 原始文件名 |
| file_path | String(512) | NOT NULL | 文件在 `data/` 中的存储路径 |
| file_size | Integer | NOT NULL | 文件大小（字节） |
| page_count | Integer | NOT NULL, DEFAULT 0 | PDF 总页数 |
| status | String(20) | NOT NULL, DEFAULT 'pending' | 处理状态：pending/processing/completed/failed |
| error_message | Text | NULLABLE | 处理失败时的错误信息 |
| chunk_count | Integer | DEFAULT 0 | 分块数量 |
| chunk_size_used | Integer | NULLABLE | 处理时使用的 chunk_size |
| created_at | DateTime | NOT NULL, DEFAULT now | 上传时间 |
| updated_at | DateTime | NOT NULL, DEFAULT now, ON UPDATE | 更新时间 |

**状态流转**:
```
pending → processing → completed
                   ↘ failed
```

**索引**: `idx_report_status` on (status)

---

## Entity: Chunk（文本块 — FAISS + SQLite）

Chunk 数据跨两种存储：FAISS 存向量，SQLite 存元数据。

### SQLite: chunk_metadata

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Integer | PK, Auto | 主键 |
| report_id | Integer | FK → report.id, NOT NULL | 所属研报 |
| chunk_index | Integer | NOT NULL | 在研报内的块序号 |
| content | Text | NOT NULL | 文本内容 |
| page_number | Integer | NULLABLE | 来源页码 |
| chunk_size | Integer | NOT NULL | 分块时使用的 chunk_size |
| token_count | Integer | NULLABLE | 估算 token 数 |
| created_at | DateTime | NOT NULL, DEFAULT now | 创建时间 |

**索引**: `idx_chunk_report` on (report_id), `idx_chunk_report_chunk` on (report_id, chunk_index)

### FAISS: vector_index

| 维度 | 说明 |
|------|------|
| 向量维度 | 1024（bge-large-zh-v1.5 输出） |
| 索引类型 | IndexFlatL2（精确 L2 距离） |
| ID 映射 | `chunk_metadata.id` 作为 FAISS ID |
| 存储路径 | `data/faiss_index/` |
| 持久化文件 | `index.faiss` + `index.pkl` |

---

## Entity: QASession（问答会话）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Integer | PK, Auto | 主键 |
| title | String(255) | NULLABLE | 自动生成的会话标题（首问截取） |
| created_at | DateTime | NOT NULL, DEFAULT now | 创建时间 |
| updated_at | DateTime | NOT NULL, DEFAULT now | 最后活动时间 |

---

## Entity: QARecord（问答记录）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Integer | PK, Auto | 主键 |
| session_id | Integer | FK → qa_session.id, NOT NULL | 所属会话 |
| turn_number | Integer | NOT NULL | 会话内轮次序号（从 1 开始） |
| question | Text | NOT NULL | 用户问题 |
| answer | Text | NOT NULL | 系统回答 |
| sources | Text | NOT NULL | JSON: [{"report_name": "", "page_number": N, "chunk_content": ""}] |
| chunk_size | Integer | NOT NULL | 回答时使用的 chunk_size |
| similarity_threshold | Float | NOT NULL | 回答时使用的阈值 |
| retrieval_top5 | Text | NULLABLE | JSON: 检索到的 Top-5 段落（用于调试） |
| created_at | DateTime | NOT NULL, DEFAULT now | 提问时间 |

**索引**: `idx_qa_session` on (session_id), `idx_qa_session_turn` on (session_id, turn_number)

---

## Entity: ParameterSetting（参数设置）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | Integer | PK, Auto | 主键 |
| chunk_size | Integer | NOT NULL, DEFAULT 500 | 分块大小，范围 200-1000 |
| similarity_threshold | Float | NOT NULL, DEFAULT 0.5 | 相似度阈值，范围 0.1-1.0 |
| top_k | Integer | NOT NULL, DEFAULT 5 | 检索段落数 |
| updated_at | DateTime | NOT NULL, DEFAULT now | 最后更新时间 |

> 系统只有一行全局参数设置。每次用户通过滑块调节后，更新此行记录。

---

## Entity Relationships

```text
Report (1) ──── (N) ChunkMetadata
                    │
                    │ FAISS ID mapping
                    │
                    ▼
              FAISS Vector Index

QASession (1) ──── (N) QARecord

ParameterSetting (singleton)
```

## Data Flow

### Upload Flow
```
PDF Upload → save to data/ → extract text → chunk (chunk_size) → 
embed (bge-large-zh-v1.5) → store vector in FAISS + metadata in SQLite
```

### Query Flow
```
User Question → embed question → FAISS search (Top-5, threshold) →
load chunk content from SQLite → assemble Prompt (System + chunks + history) →
Qwen2.5:0.5b generate → parse sources → return answer + save QARecord
```

### Parameter Change Flow
```
User adjusts slider → update ParameterSetting → 
next query: re-chunk affected reports with new chunk_size → 
re-embed → replace FAISS index for those chunks → query with new params
```
