# 📊 企业研报智能问答系统 — 技术全景讲解

> 本文档整合了项目全部技术栈信息及设计文档（spec.md / plan.md / tasks.md / data-model.md / research.md / quickstart.md / 契约文档）的核心内容，可用于技术分享、方案评审或新人 onboarding。

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈全景](#2-技术栈全景)
3. [系统架构](#3-系统架构)
4. [RAG 流水线详解](#4-rag-流水线详解)
5. [数据模型设计](#5-数据模型设计)
6. [API 契约](#6-api-契约)
7. [设计文档体系](#7-设计文档体系)
8. [功能模块与用户故事](#8-功能模块与用户故事)
9. [技术选型调研（Phase 0 Research）](#9-技术选型调研phase-0-research)
10. [实现任务分解（Plan → Tasks）](#10-实现任务分解plan--tasks)
11. [快速验证指南](#11-快速验证指南)
12. [开发规范与宪法](#12-开发规范与宪法)

---

## 1. 项目概述

### 1.1 要解决什么问题

企业研究员和投资分析人员每天需要阅读大量券商研报（PDF 格式）。传统的查阅方式是手动翻阅、关键词搜索，效率低下。本项目利用 **RAG（检索增强生成）** 技术，实现以下核心流程：

```
用户上传 PDF 研报 → 系统自动解析 → 向量化存储 →
用户自然语言提问 → 系统检索相关段落 → LLM 生成带来源引用回答
```

### 1.2 核心价值

| 价值点 | 说明 |
|--------|------|
| **跨文档检索** | 一次查询可跨越数十份研报检索信息 |
| **自然语言交互** | 用问答替代翻阅和关键词搜索 |
| **来源可追溯** | 每个回答标注研报名称 + 页码，金融场景刚需 |
| **全本地运行** | 数据不出本机，满足合规要求 |
| **参数可调** | 分块大小、相似度阈值等支持实时调节 |

### 1.3 目标用户

- **企业研究员** — 快速从研报中提取关键数据
- **投资分析人员** — 多份研报交叉对比分析
- **系统调优者** — 调节检索参数，优化 RAG 效果

---

## 2. 技术栈全景

### 2.1 技术栈一览表

| 层级 | 技术 | 版本 | 选型理由 |
|------|------|------|---------|
| **后端语言** | Python | >= 3.12 | 生态丰富，AI/ML 领域首选 |
| **Web 框架** | FastAPI | >= 0.110 | 异步支持、自动生成 API 文档、类型安全 |
| **ASGI 服务器** | Uvicorn | >= 0.29 | 轻量快速，与 FastAPI 原生集成 |
| **RAG 编排** | LangChain | >= 0.2 | 标准化的 RAG 组件集成框架 |
| **向量数据库** | FAISS (faiss-cpu) | >= 1.8 | 轻量级本地索引，无需独立服务 |
| **嵌入模型** | bge-large-zh-v1.5 (Ollama) | — | 中文优化，1024 维向量 |
| **LLM** | Qwen2.5:0.5b (Ollama) | — | 0.5B 参数，CPU 可运行，中文优秀 |
| **ORM** | SQLAlchemy | >= 2.0 | Python 最成熟的 ORM 框架 |
| **PDF 解析** | PyMuPDF (fitz) | >= 1.24 | CJK 支持好，纯 Python，速度快 |
| **文本分块** | RecursiveCharacterTextSplitter | — | 层级递归分割，保留语义完整性 |
| **HTTP 客户端** | httpx | >= 0.27 | 异步支持，调用 Ollama API |
| **数据验证** | pydantic / pydantic-settings | >= 2.0 | 类型安全配置管理 |
| **前端框架** | React | 19 | 最新稳定版，Hooks 生态成熟 |
| **构建工具** | Vite | 5 | 极速 HMR，开发体验好 |
| **UI 组件库** | Ant Design | 5 | 组件丰富，中文文档完善 |
| **HTTP 客户端（前端）** | axios | >= 1.6 | 拦截器、类型安全 |
| **类型安全** | TypeScript | 6 | 前端类型检查，减少运行时错误 |

### 2.2 运行时依赖（Ollama）

```bash
# 嵌入模型（中文优化）
ollama pull dengcao/bge-large-zh-v1.5
# 或备选：ollama pull bge-m3

# 大语言模型（轻量级）
ollama pull qwen2.5:0.5b
```

### 2.3 配置管理

通过 `backend/.env` 文件进行配置，由 `pydantic-settings` 自动加载：

```ini
OLLAMA_HOST=http://localhost:11434
LLM_MODEL=qwen2.5:0.5b
EMBEDDING_MODEL=dengcao/bge-large-zh-v1.5
FAISS_INDEX_PATH=data/faiss_index
DATABASE_URL=sqlite:///./data/rag.db
APP_NAME=企业研报智能问答系统
```

配置类自动处理 Ollama 地址标准化（如 `0.0.0.0` → `http://localhost:11434`）。

---

## 3. 系统架构

### 3.1 整体架构图

```
┌──────────────────────────────────────────────────────────────┐
│                       前端 (Frontend)                         │
│  React 19 + TypeScript + Vite + Ant Design 5                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  pages/                     components/                  │ │
│  │  ├── ChatPanel (问答面板)    ├── SourceCitation          │ │
│  │  ├── ReportsPage (研报管理)  ├── ReportUploader          │ │
│  │  └── HistoryPage (历史记录)  ├── HistoryList             │ │
│  │                             ├── ParameterPanel           │ │
│  │  api/client.ts (axios)      └── UploadModal              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                        localhost:5173                         │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP (REST API)
                       ▼
┌──────────────────────────────────────────────────────────────┐
│                       后端 (Backend)                          │
│  Python 3.12+ + FastAPI + Uvicorn                            │
│                        localhost:8000                         │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  routers/          services/           models/        │   │
│  │  ├── reports.py    ├── document_      ├── report.py   │   │
│  │  ├── qa.py         │   processor.py   ├── session.py  │   │
│  │  ├── parameters.py ├── embedding_      └── qa_record   │   │
│  │  └── history.py    │   service.py        .py          │   │
│  │                    ├── vector_store.py                  │   │
│  │                    ├── retrieval_      schemas/         │   │
│  │                    │   service.py      ├── api.py       │   │
│  │                    ├── qa_service.py   └── ...          │   │
│  │                    └── history_                          │   │
│  │                        service.py     config.py         │   │
│  └──────────────────────────────────────────────────────┘   │
│                      │           ▲                           │
└──────────────────────┼───────────┼───────────────────────────┘
                       │           │
         ┌─────────────▼───────────┼──────────────┐
         │          SQLite         │   FAISS      │
         │  (研报元数据 + 问答历史)  │   (向量索引)  │
         │  data/rag.db            │   data/      │
         └─────────────────────────┘   faiss_     │
                                       index/     │
                                       └──────────┘
                              │
                              ▼
                   ┌──────────────────────┐
                   │       Ollama          │
                   │  localhost:11434      │
                   │  ┌────────────────┐   │
                   │  │ Qwen2.5:0.5b   │   │
                   │  │ (LLM 生成)      │   │
                   │  └────────────────┘   │
                   │  ┌────────────────┐   │
                   │  │ bge-large-zh   │   │
                   │  │ -v1.5 (嵌入)   │   │
                   │  └────────────────┘   │
                   └──────────────────────┘
```

### 3.2 通信方式

| 通信对 | 协议 | 端口 |
|--------|------|------|
| 浏览器 ↔ 前端开发服务器 | HTTP | 5173 |
| 前端 ↔ 后端 API | HTTP (REST) | 8000 |
| 后端 ↔ Ollama | HTTP (REST) | 11434 |

### 3.3 数据流向

```
上传流:
  PDF → POST /upload → 保存临时文件 → PyMuPDF 解析全文 →
  RecursiveCharacterTextSplitter 分块 → bge-large-zh-v1.5 嵌入 →
  存入 FAISS 索引(SQLite 保存元数据)

问答流:
  用户问题 → POST /query → bge-large-zh-v1.5 嵌入问题 →
  FAISS 检索 Top-5 → 相似度阈值过滤 →
  组装 Prompt (System + 检索段落 + 历史上下文) →
  Qwen2.5:0.5b 生成回答 → 提取来源标注 → 返回给前端
```

---

## 4. RAG 流水线详解

### 4.1 流水线阶段

RAG 系统由 5 个独立但可组合的阶段组成：

#### 阶段 1：PDF 解析（document_loader.py）

| 属性 | 说明 |
|------|------|
| **技术** | PyMuPDF (fitz) |
| **功能** | 提取 PDF 全文文本，逐页保留 |
| **优势** | 原生支持 CJK，30 页 PDF < 1 秒 |
| **限制** | 不支持扫描件/图片型 PDF（需要 OCR） |

#### 阶段 2：文本分块（document_loader.py）

| 属性 | 说明 |
|------|------|
| **技术** | LangChain RecursiveCharacterTextSplitter |
| **策略** | 递归分割：段落 → 句子 → 固定长度 |
| **分隔符** | `["\n\n", "\n", "。", "！", "？", "；", "，", " ", ""]`— 针对中文优化 |
| **chunk_size** | 200-1000（可配置，默认 400） |
| **重叠** | chunk_size × 10%（约 50 字符） |

#### 阶段 3：向量嵌入（vector_store.py）

| 属性 | 说明 |
|------|------|
| **模型** | bge-large-zh-v1.5（BAAI 出品，中文榜单领先） |
| **维度** | 1024 维 |
| **运行方式** | 通过 Ollama 本地运行 |
| **框架** | LangChain OllamaEmbeddings |

#### 阶段 4：向量检索（vector_store.py / rag_chain.py）

| 属性 | 说明 |
|------|------|
| **索引类型** | FAISS IndexFlatL2（精确 L2 距离） |
| **检索方式** | similarity_search_with_relevance_scores |
| **Top-K** | 5（可配置） |
| **相似度阈值** | 0-1.0（可配置，默认 0.3） |

#### 阶段 5：LLM 生成（rag_chain.py）

| 属性 | 说明 |
|------|------|
| **模型** | Qwen2.5:0.5b（通义千问 0.5B） |
| **运行方式** | Ollama /api/generate |
| **温度** | 0.3（低温度，忠实于资料） |
| **输出长度** | 最多 512 tokens |
| **上下文窗口** | 32K tokens |

### 4.2 Token 预算

```
System Prompt:    ~300 tokens
检索段落 × 5:     ~1000 tokens（平均每段 200 tokens）
3 轮历史对话:      ~1500 tokens
当前问题:          ~50 tokens
─────────────────────────────
总计:             ~2850 tokens（远低于 32K 限制）
```

### 4.3 Prompt 模板

```
根据以下资料回答问题。如果资料中没有答案，就说'未找到相关信息'。

资料：
[来源：研报名称 第X页]
（检索到的文本内容）
...
问题：（用户问题）
回答：
```

### 4.4 关键代码结构

```
rag_chain.py
├── retrieve()        — FAISS 检索 + 阈值过滤
├── build_prompt()    — 组装 System + Context + Question
├── generate()        — 调用 Ollama Qwen2.5:0.5b 生成
├── rag_query()       — 完整流水线（检索 → 生成）
└── class RAGChain    — 便捷封装类

vector_store.py
├── check_ollama_connection()  — Ollama 健康检查
├── _get_embeddings()          — 获取嵌入模型实例
├── create_vector_store()      — 创建 FAISS 索引
├── save_vector_store()        — 持久化到磁盘
└── load_vector_store()        — 从磁盘加载
```

---

## 5. 数据模型设计

### 5.1 存储策略

系统使用 **两种存储**：

| 存储 | 用途 | 特点 |
|------|------|------|
| **SQLite** | 结构化数据 | 研报元数据、问答记录、会话信息、参数设置 |
| **FAISS** | 向量索引 | 文本块的 1024 维嵌入向量 |

### 5.2 实体关系图

```
┌──────────────┐       ┌──────────────────┐
│    Report    │ 1──N  │  ChunkMetadata   │
│  (研报)      │       │  (文本块元数据)   │
├──────────────┤       ├──────────────────┤
│ id           │       │ id               │
│ filename     │       │ report_id (FK)   │
│ file_size    │       │ chunk_index      │
│ page_count   │       │ content (文本)    │
│ status       │       │ page_number      │
│ chunk_count  │       └────────┬─────────┘
│ created_at   │                │ FAISS ID mapping
└──────────────┘                ▼
                         ┌──────────────────┐
                         │  FAISS Vector    │
                         │   IndexFlatL2    │
                         │  (1024 维向量)   │
                         └──────────────────┘

┌──────────────┐       ┌──────────────────┐
│  QASession   │ 1──N  │    QARecord      │
│ (问答会话)   │       │  (问答记录)      │
├──────────────┤       ├──────────────────┤
│ id           │       │ id               │
│ title        │       │ session_id (FK)  │
│ created_at   │       │ turn_number      │
│ updated_at   │       │ question         │
└──────────────┘       │ answer           │
                       │ sources (JSON)   │
┌──────────────────┐   │ params_used      │
│ ParameterSetting │   │ created_at       │
│ (参数设置-单例)  │   └──────────────────┘
├──────────────────┤
│ chunk_size       │
│ sim_threshold    │
│ top_k            │
│ updated_at       │
└──────────────────┘
```

### 5.3 核心实体详表

#### Report（研报）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer PK | 主键 |
| filename | String(255) | 原始文件名 |
| file_path | String(512) | 存储路径 |
| file_size | Integer | 字节数 |
| page_count | Integer | PDF 总页数 |
| status | String(20) | pending → processing → completed / failed |
| chunk_count | Integer | 分块数量 |
| created_at | DateTime | 上传时间 |

#### QARecord（问答记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| question | Text | 用户问题 |
| answer | Text | 系统回答 |
| sources | Text(JSON) | `[{"report_name":"","page_number":N,"chunk_content":""}]` |
| chunk_size | Integer | 本次回答使用的分块大小 |
| similarity_threshold | Float | 相似度阈值 |
| turn_number | Integer | 会话内轮次 |

### 5.4 状态流转

```
Report.status:
  pending → processing → completed
                     ↘ failed

ParameterSetting:
  单例模式 — 全局只有一行参数记录，滑块调节即更新

QASession:
  自动创建 — 首次提问时生成，首问截取前 40 字符作为标题
```

---

## 6. API 契约

API 采用 RESTful 风格，所有接口以 `/api/` 为前缀。
实际实现中因简化采用了根路径路由（`/upload`、`/query` 等），契约文档中规划了完整的 `/api/` 前缀路径。

### 6.1 研报管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/reports/upload | 上传 PDF 研报 |
| GET | /api/reports | 获取研报列表 |
| GET | /api/reports/{id} | 获取研报详情 |
| DELETE | /api/reports/{id} | 删除研报 |

**POST /api/reports/upload**
```
Request:  multipart/form-data (file: PDF, max 50MB)
Response: { "id": 1, "filename": "...", "file_size": 2450000,
            "status": "processing", "created_at": "..." }
Error 400: { "detail": "仅支持 PDF 格式文件" }
```

### 6.2 智能问答 API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/qa/ask | 提问（新建会话或续传） |
| GET | /api/qa/sessions | 获取会话列表 |
| GET | /api/qa/sessions/{id} | 获取会话详情 |

**POST /api/qa/ask**
```json
// Request
{ "session_id": null, "question": "宁德时代2025年营收预测是多少" }

// Response (正常)
{ "session_id": 1, "answer": "根据东吴证券研报...",
  "sources": [{"report_name": "...", "page_number": 3, "chunk_content": "..."}],
  "params_used": {"chunk_size": 500, "similarity_threshold": 0.3, "top_k": 5},
  "created_at": "..." }

// Response (无结果)
{ "answer": "未找到相关信息。请尝试换个问题或确认研报中是否包含相关内容。",
  "sources": [], "params_used": {...} }

// Error 503
{ "detail": "Ollama 服务未连接，请确认 Ollama 已启动" }
```

### 6.3 参数调节 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/parameters | 获取当前参数 |
| PUT | /api/parameters | 更新参数 |

**PUT /api/parameters**
```json
// Request
{ "chunk_size": 300, "similarity_threshold": 0.7 }

// Response
{ "chunk_size": 300, "similarity_threshold": 0.7,
  "top_k": 5, "updated_at": "..." }
```

### 6.4 历史记录 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/history | 分页获取历史会话 |
| GET | /api/history/{id} | 获取会话完整记录 |
| DELETE | /api/history/{id} | 删除单条会话 |
| DELETE | /api/history | 清空所有历史 |

### 6.5 实际实现的路由

当前 `backend/app/main.py` 中实际实现的路由：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /health | 健康检查 |
| POST | /upload | 上传 PDF 研报 |
| POST | /query | 智能问答 |
| GET | /documents | 研报列表 |
| GET | /config | 系统配置状态 |
| GET | /qa/sessions | 会话列表 |
| GET | /qa/sessions/{id} | 会话详情 |
| DELETE | /qa/sessions/{id} | 删除会话 |
| DELETE | /qa/sessions | 清空全部会话 |
| DELETE | /reports | 删除指定研报 |

---

## 7. 设计文档体系

本项目采用 **Spec-Driven Development** 方法论，每个功能特性在代码编写之前都会经过完整的文档流程。以下是当前特性 `001-core-rag-pipeline` 的文档结构：

### 7.1 文档目录

```
specs/001-core-rag-pipeline/
├── spec.md           # 功能规格说明书（用户故事 + 功能需求 + 验收标准）
├── plan.md           # 实现方案设计（技术选型 + 架构 + 项目结构）
├── tasks.md          # 任务分解（按阶段和用户故事组织的可执行任务）
├── data-model.md     # 数据模型设计（ER 图 + 字段定义 + 数据流）
├── research.md       # 技术调研（Phase 0 Research — 选型对比与决策）
├── quickstart.md     # 快速验证指南（端到端场景验证）
├── contracts/        # API 契约定义
│   ├── api-reports.yaml    # 研报管理 API
│   ├── api-qa.yaml         # 智能问答 API
│   ├── api-parameters.yaml # 参数调节 API
│   └── api-history.yaml    # 历史记录 API
└── checklists/
    └── requirements.md     # Spec 质量检查清单
```

### 7.2 文档作用与关系

```
               头脑风暴 (docs/brainstorm.md)
                      │
                      ▼
   ┌─────────────────────────────────────┐
   │           spec.md                   │
   │  (用户故事 + 功能需求 + 验收标准)     │
   │  定义 "做什么"                       │
   └────────────┬────────────────────────┘
                │ 输入
                ▼
   ┌─────────────────────────────────────┐
   │           plan.md                   │
   │  (技术方案 + 架构设计 + 项目结构)     │
   │  定义 "怎么做"                       │
   ├─────────────────────────────────────┤
   │  research.md (Phase 0) — 技术选型   │
   │  data-model.md (Phase 1) — 数据模型 │
   │  contracts/ (Phase 1) — API 契约    │
   │  quickstart.md (Phase 1) — 验证指南 │
   └────────────┬────────────────────────┘
                │ 输入
                ▼
   ┌─────────────────────────────────────┐
   │           tasks.md                  │
   │  (可执行任务 + 依赖排序 + 检查点)     │
   │  定义 "谁先做"                       │
   └─────────────────────────────────────┘
```

### 7.3 每个文档的核心内容

#### spec.md — 功能规格说明书
- **用户故事 × 4**：研报上传、智能问答、参数调节、历史记录
- **优先级**：P1（MVP）→ P2 → P3
- **验收场景**：Given-When-Then 格式，每个故事 3 个场景
- **功能需求**：FR-001 到 FR-020，按模块分组
- **边界情况**：空结果、超长查询、并发、参数极端值、重复上传
- **成功标准**：8 个可量化指标（响应时间、准确率、幻觉率等）
- **关键实体定义**：Report / Chunk / Embedding / QA Record / Parameter Setting

#### plan.md — 实现方案设计
- **技术上下文**：语言版本、依赖、存储方案、性能目标、约束
- **宪法合规检查**：5 项原则逐条评估
- **项目结构**：后端 app/ 目录和前端的完整目录树
- **开发阶段**：Phase 0（调研）→ Phase 1（设计）

#### tasks.md — 任务分解
- **7 个阶段**：Setup → Foundational → US1 → US2 → US3 → US4 → Polish
- **62 个任务**：每个任务有标签（[P]=可并行，[US#]=所属用户故事）
- **依赖关系**：Phase 依赖 + 并行机会标识
- **检查点**：每个阶段结束有明确的完成验证标准

#### data-model.md — 数据模型设计
- **5 个实体**：Report / ChunkMetadata / QASession / QARecord / ParameterSetting
- **FAISS 细节**：IndexFlatL2、1024 维、ID 映射方式
- **数据流**：上传流 → 查询流 → 参数变更流

#### research.md — 技术调研
- **9 项决策**：PDF 解析（PyMuPDF）、分块策略、嵌入模型、LLM、向量数据库、相似度检索、Ollama 集成、前端框架、依赖版本
- **备选方案**：每个决策都有备选方案对比
- **Token 预算**：详细计算每轮查询的 token 消耗

#### quickstart.md — 快速验证指南
- **8 个验证场景**：上传索引、智能问答、无结果处理、多轮对话、参数调节、参数极限、历史记录、错误处理
- **curl 命令**：可直接运行的 API 测试命令

---

## 8. 功能模块与用户故事

### 8.1 四大功能模块

| 模块 | 优先级 | 用户故事 | 核心接口 |
|------|--------|---------|---------|
| **研报管理** | P1 | US1 — 上传 PDF，自动解析索引 | POST /upload, GET /documents, DELETE /reports |
| **智能问答** | P1 | US2 — 自然语言问答 + 来源追溯 | POST /query, GET /qa/sessions |
| **参数调节** | P2 | US3 — 实时调节检索参数 | GET /config (含参数范围), 参数在 query 中传入 |
| **历史记录** | P3 | US4 — 问答历史保存与回顾 | GET/DELETE /qa/sessions |

### 8.2 用户故事详解

#### US1 — 研报上传与自动索引（P1）

> **作为** 企业研究员，
> **我希望** 上传 PDF 研报后系统自动完成文本解析、分块和向量化存储，
> **以便** 我能立即对研报内容进行提问。

**验收场景**：
1. 上传 PDF → 自动解析分块 → 存入 FAISS
2. 查看研报列表 → 展示名称、页数、导入时间
3. 上传非 PDF → 返回明确错误提示

**功能需求**：FR-001 ~ FR-007

#### US2 — 智能问答与来源追溯（P1）

> **作为** 企业研究员，
> **我希望** 用自然语言提问，系统基于研报内容生成带来源引用的回答，
> **以便** 快速获取经得起验证的信息。

**验收场景**：
1. 提问 → 返回带研报名称+页码的回答
2. 无关问题 → 回复"未找到相关信息"
3. 追问 → 结合历史上下文正确理解

**关键设计决策**：Top-5 检索 + 最近 3 轮历史作上下文

#### US3 — 检索参数实时调节（P2）

> **作为** 高级用户，
> **我希望** 在前端界面上实时调节 chunk_size 和检索相似度阈值，
> **以便** 找到最优参数组合。

**参数范围**：
- chunk_size: 200-1000，步长 50，默认 400
- similarity_threshold: 0.0-1.0，步长 0.05，默认 0.3

#### US4 — 问答历史记录（P3）

> **作为** 用户，
> **我希望** 系统自动保存我的问答历史，
> **以便** 回顾之前的分析过程，无需重复提问。

**功能需求**：FR-017 ~ FR-020（自动保存、历史浏览、恢复对话、删除记录）

### 8.3 边界情况处理

| 场景 | 处理方式 |
|------|---------|
| 无关问题 | 回复"未找到相关信息" |
| 超长查询（> 500 char） | 截断或清晰提示 |
| 参数极端值（threshold=1.0） | 无匹配时优雅降级提示 |
| 重复上传 | 提示重复（暂未实现自动覆盖） |
| 无研报时提问 | 提示"请先上传研报" |
| Ollama 断开 | 返回 503 + 友好提示 |
| 空结果查询 | 回复无相关信息 |

---

## 9. 技术选型调研（Phase 0 Research）

> 对应文档：`research.md` — 在写 plan 之前完成的技术选型调研

### 9.1 PDF 解析方案对比

| 方案 | 优点 | 缺点 | 结论 |
|------|------|------|------|
| **PyMuPDF (fitz)** ✅ | CJK 支持好，纯 Python，30页 < 1秒 | 不支持扫描件 | 选用 |
| pdfplumber | 表格提取强 | 速度慢 | 备选 |
| PDFMiner | 功能完整 | API 复杂 | 备选 |
| PaddleOCR | 支持扫描件 | 需要 GPU，MVP 不做 | 后续迭代 |

### 9.2 分块策略决策

选用 **LangChain RecursiveCharacterTextSplitter**，分隔符针对中文优化：

```python
separators = ["\n\n", "\n", "。", "！", "？", "；", "，", " ", ""]
```

层级递归：段落 → 句子 → 从句 → 固定长度，确保语义完整性。

### 9.3 嵌入模型对比

| 模型 | 维度 | 中文能力 | 本地部署 | 结论 |
|------|------|---------|---------|------|
| **bge-large-zh-v1.5** ✅ | 1024 | 优（C-MTEB 中文榜领先） | Ollama | 选用 |
| bge-m3 | 1024 | 优（多语言） | Ollama | 备选 |
| text2vec-large-chinese | 1024 | 优 | 需自行部署 | 备选 |

### 9.4 LLM 对比

| 模型 | 参数量 | 中文能力 | CPU 运行 | 上下文 | 结论 |
|------|--------|---------|---------|--------|------|
| **Qwen2.5:0.5b** ✅ | 0.5B | 优秀 | ✅ | 32K | 选用 |
| Qwen2.5:7b | 7B | 更优 | ❌ 需 GPU | 32K | 后续升级 |
| llama3.2:1b | 1B | 一般 | ✅ | 128K | 备选 |

### 9.5 向量数据库对比

| 方案 | 部署方式 | MVP 适用 | 扩展性 | 结论 |
|------|---------|---------|--------|------|
| **FAISS** ✅ | 本地索引，无服务 | ✅ < 10万文档 | 需切换 | 选用 |
| Chroma | 本地服务 | ✅ | 中等 | 备选 |
| Qdrant | Docker 服务 | ❌ 太重 | 好 | 后续 |

### 9.6 Ollama 集成要点

- API 端点：`http://localhost:11434/api/generate` + `/api/embed`
- 启动时检查连接，失败不崩溃
- Embedding 和 LLM 共用同一 Ollama 实例
- 默认低温度（0.3），限制输出长度（512 tokens）

---

## 10. 实现任务分解（Plan → Tasks）

> 对应文档：`plan.md` + `tasks.md` — 从方案到可执行任务的拆解

### 10.1 7 个实施阶段

```
Phase 1: Setup         初始化项目结构           无依赖
Phase 2: Foundational  核心基础设施搭建        依赖 Phase 1
Phase 3: US1           研报上传与自动索引       依赖 Phase 2
Phase 4: US2           智能问答与来源追溯       依赖 Phase 2+3  ← MVP 完成
Phase 5: US3           参数实时调节            依赖 Phase 2
Phase 6: US4           问答历史记录            依赖 Phase 2
Phase 7: Polish        错误处理 + 文档        依赖所有前期
```

### 10.2 关键检查点

| 检查点 | 验证内容 |
|--------|---------|
| Foundation Ready | 后端 /health 返回 ok，前端编译成功 |
| US1 Complete | 上传 PDF → 研报列表显示"completed" |
| **MVP DONE** | US1 + US2 — 上传 → 提问 → 拿到带来源的回答 |
| US3 Complete | 调节参数 → 下次查询使用新参数 |
| US4 Complete | 历史记录保存 → 可还原继续追问 |
| Polish Complete | 所有页面有 error/loading/empty 状态 |

### 10.3 62 个任务分布

| 阶段 | 任务数 | 可并行任务 |
|------|--------|-----------|
| Phase 1: Setup | 6 | T001-T006 |
| Phase 2: Foundational | 5 | T007-T011 |
| Phase 3: US1 | 14 | T012+T013, T022+T023 |
| Phase 4: US2 | 13 | T026+T027, T035+T036 |
| Phase 5: US3 | 9 | T039+T040, T046+T047 |
| Phase 6: US4 | 7 | T048+T052 |
| Phase 7: Polish | 8 | — |

### 10.4 执行策略

```
MVP = Phase 1-4（38 个任务）
├── Setup → Foundational → Foundation Ready
├── US1: 上传研报，自动索引 → 独立测试
├── US2: 智能问答带来源引用 → **MVP 完成**
└── US3 + US4: 可选增强
    └── Polish: 错误处理 + 文档完善
```

### 10.5 依赖关系

```
Phase 1 (Setup) ───→ Phase 2 (Foundational)
                            ├──→ Phase 3 (US1) ──→ Phase 4 (US2) ──→ Phase 7 (Polish)
                            ├──→ Phase 5 (US3) ──────────────────────↗
                            └──→ Phase 6 (US4) ──────────────────────↗
```

---

## 11. 快速验证指南

> 对应文档：`quickstart.md` — 端到端验证

### 11.1 前置条件

```bash
# 1. 启动 Ollama
ollama serve

# 2. 拉取模型
ollama pull qwen2.5:0.5b
ollama pull dengcao/bge-large-zh-v1.5

# 3. 启动后端
cd backend
python -m venv .venv
source .venv/bin/activate   # Linux/Mac
# .venv\Scripts\activate    # Windows
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000

# 4. 启动前端
cd frontend
npm install
npm run dev     # → http://localhost:5173
```

### 11.2 8 个验证场景

| 场景 | 操作 | 预期结果 |
|------|------|---------|
| 1. 上传研报 | 研报管理页 → 上传 PDF | 列表显示"已完成" |
| 2. 智能问答 | 提问"宁德时代营收预测" | ≤10s 返回带来源回答 |
| 3. 无结果 | 提问"今天天气" | 回复"未找到相关信息" |
| 4. 多轮对话 | 提问 → 追问"那净利润呢" | 正确理解追问语境 |
| 5. 参数调节 | 调低 chunk_size | 下次查询引用不同段落 |
| 6. 参数极限 | threshold → 1.0 | 提示无匹配结果 |
| 7. 历史记录 | 多轮对话后查看历史 | 完整保存，可还原继续 |
| 8. 错误处理 | 上传 .txt 文件 | 提示"仅支持 PDF 格式" |

### 11.3 快速 API 测试

```bash
# 上传
curl -X POST http://localhost:8000/upload -F "file=@data/report.pdf"

# 提问
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "宁德时代营收预测"}'

# 查看状态
curl http://localhost:8000/health
curl http://localhost:8000/documents
```

---

## 12. 开发规范与宪法

> 对应文档：`.specify/memory/constitution.md` — 项目治理的"最高法律"

### 12.1 五大核心原则

| 原则 | 内容 | 不可妥协 |
|------|------|---------|
| **I. 规范驱动** | 每个功能从书面规范开始，无规范无代码 | ✅ |
| **II. 文档优先的 RAG 流水线** | 导入→分块→嵌入→存储→检索→生成，来源可追溯 | ✅ |
| **III. 测试优先** | 先写测试确认失败（红-绿-重构） | ✅ |
| **IV. 模块化可组合** | 各组件接口解耦，可独立替换 | — |
| **V. 可观测性** | 每个操作必须可度量、可记录 | — |

### 12.2 功能开发生命周期

```
规范 → 方案 → 任务 → 实现 → 评审 → 收敛
│       │       │       │       │       │
spec   plan   tasks   code   review  verify
.md     .md     .md    + test  + QA   vs spec
```

每一步对应一个 Speckit 技能命令：
1. `/speckit-specify` — 编写含用户故事和验收标准的规范
2. `/speckit-plan` — 设计架构、数据模型和契约
3. `/speckit-tasks` — 从设计方案生成有序的任务列表
4. `/speckit-implement` — 按任务构建，测试优先
5. `/speckit-converge` — 验证实现与规范一致

### 12.3 质量门禁

- **宪法检查**：每个方案在调研前和设计后各检查一次合规性
- **测试门禁**：所有测试必须通过才能合并；新功能需要新测试
- **评审门禁**：需要进行代码评审

### 12.4 分支管理

```
###-feature-name
```
例：`001-core-rag-pipeline`（当前特性）

### 12.5 版本号规则（宪法本身）

| 变更类型 | 示例 | 版本号 |
|---------|------|--------|
| MAJOR | 不兼容的原则变更 | 1.0.0 → 2.0.0 |
| MINOR | 新增原则或扩展 | 1.0.0 → 1.1.0 |
| PATCH | 澄清、措辞修正 | 1.0.0 → 1.0.1 |

当前宪法版本：**1.0.0**（2026-07-23 批准）

---

## 附录 A：项目文件索引

| 文件 | 用途 |
|------|------|
| `backend/app/main.py` | FastAPI 入口 + 路由 |
| `backend/app/config.py` | 配置管理（pydantic-settings） |
| `backend/app/document_loader.py` | PDF 解析 + 文本分块 |
| `backend/app/rag_chain.py` | RAG 核心链（检索 + 生成） |
| `backend/app/vector_store.py` | FAISS 向量库操作 |
| `backend/app/schemas/api.py` | Pydantic 请求/响应模型 |
| `backend/requirements.txt` | Python 依赖 |
| `backend/.env.example` | 配置文件模板 |
| `frontend/src/App.tsx` | 前端主应用布局 |
| `frontend/src/api/client.ts` | axios API 客户端 |
| `frontend/src/components/ChatPanel.tsx` | 问答对话面板 |
| `frontend/src/components/ParameterPanel.tsx` | 参数调节面板 |
| `frontend/src/pages/ReportsPage.tsx` | 研报管理页面 |
| `frontend/src/pages/HistoryPage.tsx` | 历史记录页面 |
| `specs/001-core-rag-pipeline/spec.md` | 功能规格说明书 |
| `specs/001-core-rag-pipeline/plan.md` | 实现方案设计 |
| `specs/001-core-rag-pipeline/tasks.md` | 任务分解清单 |
| `specs/001-core-rag-pipeline/data-model.md` | 数据模型设计 |
| `specs/001-core-rag-pipeline/research.md` | 技术选型调研 |
| `specs/001-core-rag-pipeline/quickstart.md` | 快速验证指南 |
| `docs/brainstorm.md` | 头脑风暴原始记录 |
| `.specify/memory/constitution.md` | 项目宪法（治理规范） |
| `README.md` | 项目说明文档 |

## 附录 B：技术栈速查表

```
Language:      Python 3.12+ ── FastAPI ── Uvicorn
                          ├── LangChain ── FAISS
                          ├── SQLAlchemy ── SQLite
                          ├── PyMuPDF ── PDF
                          └── httpx ── Ollama

Frontend:      React 19 ── Vite ── TypeScript
                          └── Ant Design 5 ── axios

AI Runtime:    Ollama
               ├── Qwen2.5:0.5b (LLM Generation)
               └── bge-large-zh-v1.5 (Embedding)
```

---

*本文档由 `spec.md`、`plan.md`、`tasks.md`、`data-model.md`、`research.md`、`quickstart.md`、API 契约文件及项目源代码综合整理而成。*

