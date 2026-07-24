# 📊 企业研报智能问答系统

基于 **RAG（Retrieval-Augmented Generation）** 架构的智能问答系统，支持上传 PDF 格式的券商研报，对研报内容进行向量化存储，并提供自然语言问答能力。

---

## ✨ 功能

- **📄 研报上传** — 支持 PDF 格式研报上传，自动解析、分块并存入向量库
- **💬 智能问答** — 基于检索增强生成，回答内容忠实于原文，并附来源引用
- **🔗 来源追溯** — 每个回答均标注信息来源（文件名 + 页码 + 相似度分数）
- **📚 研报管理** — 查看已上传研报列表，支持删除
- **📜 历史记录** — 自动保存问答历史，支持回顾与检索历史会话
- **⚙️ 可配置参数** — 分块大小、相似度阈值等均可调节

## 🏗 技术栈

| 层级 | 技术 |
|------|------|
| **后端框架** | Python 3.12+, FastAPI |
| **RAG 框架** | LangChain |
| **向量数据库** | FAISS (IndexFlatL2) |
| **嵌入模型** | bge-large-zh-v1.5 (via Ollama) |
| **LLM** | Qwen2.5:0.5b (via Ollama) |
| **前端** | React 19 + TypeScript + Vite |
| **UI 组件** | Ant Design 6 |
| **文档解析** | PyPDFLoader / pypdf |

## 🗺 系统架构

```
┌─────────────┐     ┌─────────────────────────────────────┐     ┌──────────┐
│   Frontend  │     │            Backend (FastAPI)         │     │  Ollama  │
│  (React +   │────▶│                                     │────▶│ ──────── │
│   Antd)     │     │  POST /upload    → PDF → Chunks     │     │ Qwen2.5  │
│             │     │  POST /query     → Retrieve + Gen    │     │ bge-zh   │
│  localhost: │     │  GET  /documents → Report list       │     └──────────┘
│    5173     │     │  GET  /qa/sessions → History         │
└─────────────┘     └─────────────────────────────────────┘
                            │         ▲
                            ▼         │
                     ┌──────────────────┐
                     │   FAISS Index    │
                     │  (data/faiss_    │
                     │   index/)        │
                     └──────────────────┘
```

### RAG 流水线

```
PDF ──▶ 加载 (PyPDFLoader)
         ──▶ 分块 (RecursiveCharacterTextSplitter)
               ──▶ 向量化 (bge-large-zh-v1.5)
                     ──▶ 存储 (FAISS)
                           ──▶ 检索 (Top-K Similarity)
                                 ──▶ 生成 (Qwen2.5:0.5b)
                                       ──▶ 回答 + 来源引用
```

## 🚀 快速开始

### 前置条件

1. **安装 Ollama** — [ollama.ai](https://ollama.ai)
2. **拉取所需模型**
   ```bash
   ollama pull qwen2.5:0.5b
   ollama pull dengcao/bge-large-zh-v1.5
   ```
3. **确保 Ollama 服务运行中**
   ```bash
   ollama serve
   ```

### 后端启动

```bash
# 进入后端目录
cd backend

# 创建虚拟环境（推荐）
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# 或 .venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 复制配置文件
cp .env.example .env
# 按需编辑 .env 中的配置

# 启动服务
uvicorn app.main:app --reload --port 8000
```

后端启动后访问 http://localhost:8000/docs 查看自动生成的 API 文档。

### 前端启动

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 http://localhost:5173。

### 使用流程

1. 打开前端页面
2. 点击「上传研报」按钮，选择 PDF 文件
3. 上传完成后，在对话框输入问题
4. 系统返回基于研报内容的回答，并附信息来源

## 🌐 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/health` | 健康检查 |
| `POST` | `/upload` | 上传 PDF 研报 |
| `POST` | `/query` | 发起问答查询 |
| `GET` | `/documents` | 获取已上传研报列表 |
| `GET` | `/config` | 获取系统配置状态 |
| `GET` | `/qa/sessions` | 获取问答会话列表 |
| `GET` | `/qa/sessions/{id}` | 获取会话详情 |
| `DELETE` | `/qa/sessions/{id}` | 删除会话 |
| `DELETE` | `/qa/sessions` | 清空所有会话 |
| `DELETE` | `/reports` | 删除指定研报 |

## ⚙️ 配置

通过 `backend/.env` 文件配置：

```ini
OLLAMA_HOST=http://localhost:11434
LLM_MODEL=qwen2.5:0.5b
EMBEDDING_MODEL=dengcao/bge-large-zh-v1.5
FAISS_INDEX_PATH=data/faiss_index
DATABASE_URL=sqlite:///./data/rag.db
APP_NAME=企业研报智能问答系统
```

## 📁 项目结构

```
rag-project/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI 入口 & 路由
│   │   ├── config.py            # 配置管理
│   │   ├── document_loader.py   # PDF 加载与分块
│   │   ├── rag_chain.py         # RAG 核心链（检索 + 生成）
│   │   ├── vector_store.py      # FAISS 向量库操作
│   │   ├── models/              # 数据模型
│   │   ├── schemas/             # API 请求/响应 schema
│   │   └── services/            # 业务服务层
│   ├── data/                    # 数据目录（git 忽略）
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # 应用主入口
│   │   ├── api/client.ts        # API 客户端
│   │   ├── components/          # UI 组件
│   │   ├── pages/               # 页面组件
│   │   └── styles/              # 样式文件
│   ├── package.json
│   └── vite.config.ts
├── docs/                        # 文档与架构图
├── specs/                       # 规范与设计文档
└── data/                        # 测试用研报 PDF（git 忽略）
```

## 📌 注意事项

- **数据隐私**：所有计算均在本地完成，研报数据不上传至云端
- **Ollama 依赖**：系统依赖本地 Ollama 服务，请确保其正常运行
- **PDF 解析**：受限于 PDF 格式复杂性，部分扫描件或图片型 PDF 可能解析效果不佳
- **模型大小**：默认使用 Qwen2.5:0.5b 小模型，对回答质量有更高要求可替换为更大模型

## 🧪 开发

本项目遵循 **Spec-Driven Development** 方法论，所有功能从规范开始：

```
规范 → 方案 → 任务 → 实现 → 评审 → 收敛
```

详见 `.specify/` 和 `.speckit/` 目录。
