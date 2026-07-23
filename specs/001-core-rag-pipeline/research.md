# Phase 0 Research: 企业研报智能问答系统

> 技术选型与最佳实践调研结果

## 1. PDF 解析方案

**Decision**: PyMuPDF (fitz)

**Rationale**:
- 原生支持 CJK 字符集，对中文 PDF 兼容性最佳
- 纯 Python 实现，无需外部依赖（如 poppler）
- 可精确提取文本与页码对应关系
- 处理速度快，30 页 PDF 解析耗时 < 1 秒

**Alternatives considered**:
- pdfplumber: 更适合表格提取，但速度较慢
- PDFMiner: 功能完整但 API 较复杂
- OCR (PaddleOCR): 需要扫描件时才启用，MVP 不做

## 2. 分块策略

**Decision**: LangChain RecursiveCharacterTextSplitter

**Rationale**:
- 支持按分隔符层级递归分割（段落 → 句子 → 固定长度）
- 原生支持 overlap 配置（设为 chunk_size 的 10%）
- 与 LangChain 框架集成无缝
- chunk_size 范围 200-1000，默认 500，步长 50

**Chunk overlap**: chunk_size × 10%（确保跨块语义不丢失）

## 3. 嵌入模型：bge-large-zh-v1.5

**Decision**: BAAI/bge-large-zh-v1.5 (通过 Ollama 运行)

**Rationale**:
- 专为中文优化，在 C-MTEB 中文榜单排名前列
- 输出维度 1024，在精度和存储间取得平衡
- 通过 Ollama 本地运行，数据不出本机
- Ollama 模型名: `shaw/dmeta-embedding-zh` 或 `bge-m3`（视 Ollama 支持情况）

**Fallback**: 如 bge-large-zh-v1.5 在 Ollama 中不可用，使用 `bge-m3`（支持多语言，1024 维）

## 4. LLM：Qwen2.5:0.5b

**Decision**: Qwen2.5:0.5b (通过 Ollama 运行)

**Rationale**:
- 0.5B 参数，推理速度快，CPU 也可运行
- 中文能力优秀，适合金融领域问答
- 上下文窗口 32K tokens，可容纳 Top-5 段落 + 3 轮对话历史
- Ollama 模型名: `qwen2.5:0.5b`

**Token 预算估算**:
| 组件 | 估算 tokens |
|------|------------|
| System Prompt | ~300 |
| 检索段落 × 5（平均每段 200 tokens） | ~1000 |
| 最近 3 轮对话历史 | ~1500 |
| 当前问题 | ~50 |
| **总计** | **~2850** |

32K 窗口完全满足，超出时截断最早的历史轮次。

## 5. 向量数据库：FAISS

**Decision**: FAISS (faiss-cpu) 本地索引

**Rationale**:
- 轻量级，无需启动独立服务
- MVP 数据量级（< 10 万文本块）完全胜任
- 通过 LangChain `FAISS` 类集成方便
- 支持保存/加载到本地文件（`faiss_index/`）

**Persistence**: 索引文件保存到 `data/faiss_index/`，应用启动时自动加载，关闭时自动保存

## 6. 相似度检索参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 检索方式 | L2 距离（默认） | FAISS `IndexFlatL2` |
| Top-K | 5 | 返回最相似的 5 个段落 |
| 相似度阈值 | 0.1-1.0，默认 0.5 | L2 距离越小越相似，需反归一化为相似度分数 |

## 7. Ollama 集成

**API 端点**: `http://localhost:11434/api/generate`（Ollama 默认端口）

**关键考量**:
- 应用启动时检查 Ollama 连接和模型可用性
- 连接失败时返回友好错误提示，不崩溃
- Embedding 请求和 LLM 请求共用同一 Ollama 实例

## 8. 前端框架选择

**Decision**: React 19 + Vite + Ant Design 5

**Rationale**:
- React 19 最新稳定版，性能优化显著
- Vite 开发体验优秀（HMR 快速）
- Ant Design 5 组件丰富（Upload、Slider、Table、Menu 等直接可用）
- TypeScript 提供类型安全保障

## 9. 项目依赖版本

| 依赖 | 版本建议 | 用途 |
|------|---------|------|
| fastapi | ≥0.110 | Web 框架 |
| uvicorn | ≥0.29 | ASGI 服务器 |
| langchain | ≥0.2 | RAG 编排 |
| langchain-community | ≥0.2 | FAISS 集成 |
| sqlalchemy | ≥2.0 | ORM |
| pymupdf | ≥1.24 | PDF 解析 |
| faiss-cpu | ≥1.8 | 向量检索 |
| httpx | ≥0.27 | Ollama HTTP 客户端 |
