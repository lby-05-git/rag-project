# Implementation Plan: 企业研报智能问答系统

**Branch**: `001-core-rag-pipeline` | **Date**: 2026-07-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `.speckit/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command.

## Summary

构建一个全本地运行的基于 RAG 的企业研报智能问答系统。用户可上传 PDF 研报，
系统自动解析、分块、嵌入后存入 FAISS 索引；用户提问时检索 Top-5 相关段落，
经 Qwen2.5:0.5b 生成带来源引用的回答。前端提供参数调节滑块和历史记录功能。

## Technical Context

**Language/Version**: Python 3.12+ (backend), TypeScript 5.x (frontend)

**Primary Dependencies**:
- Backend: FastAPI, LangChain, SQLAlchemy, PyMuPDF, faiss-cpu, httpx
- Frontend: React 19, Vite, Ant Design 5, axios
- AI: Ollama (Qwen2.5:0.5b, bge-large-zh-v1.5)

**Storage**: SQLite (metadata + history), FAISS local index (vectors), `data/` (PDF files)

**Testing**: pytest (backend), Vitest (frontend)

**Target Platform**: Local desktop (localhost server + browser)

**Project Type**: Full-stack web application (backend API + frontend SPA)

**Performance Goals**:
- 问答响应时间 ≤ 10 秒
- 30 页 PDF 索引用时 ≤ 3 分钟
- 单机运行，无并发用户压力

**Constraints**:
- 全本地运行，数据不出本机
- Qwen2.5:0.5b 上下文窗口 32K tokens
- FAISS 纯内存索引，重启需重新加载
- MVP 阶段 ≤ 100 份研报 / 10 万文本块

**Scale/Scope**: MVP 单机单用户，后续可扩展为多用户

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 宪法原则 | 合规状态 | 说明 |
|---------|---------|------|
| I. Spec-Driven Development | ✅ 合规 | 按 Spec → Plan → Tasks → Implement 流程执行 |
| II. Document-First RAG Pipeline | ✅ 合规 | PDF 解析→分块→嵌入→检索→生成，来源可追溯 |
| III. Test-First (NON-NEGOTIABLE) | ✅ 合规 | TDD 适用于所有核心 RAG 组件 |
| IV. Modular & Composable Design | ✅ 合规 | 各服务层通过接口解耦，可独立替换 |
| V. Observability & Quality Assurance | ⚠️ 需关注 | 日志和可观测性在 Polish 阶段补充 |

**Gates**: 通过。Phase 0 无需调研外部依赖（技术选型已明确）。
Phase 1 设计完成后需重新检查模块化原则合规性。

## Project Structure

### Documentation (this feature)

```text
.speckit/
├── constitution.md     # Project constitution
├── spec.md             # Feature specification
├── plan.md             # Implementation plan (this file)
└── tasks.md            # Task list

docs/
└── brainstorm.md       # Brainstorming summary
```

### Source Code (repository root)

```text
rag-project/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI entry, CORS, lifespan events
│   │   ├── config.py            # Settings from .env
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── report.py        # Report ORM model
│   │   │   ├── qa_record.py     # QA Record ORM model
│   │   │   └── session.py       # QASession ORM model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── report.py        # Pydantic schemas for Report
│   │   │   ├── qa.py            # Pydantic schemas for Q&A
│   │   │   └── parameter.py     # Pydantic schemas for params
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── document_processor.py  # PDF extraction + chunking
│   │   │   ├── embedding_service.py   # Ollama embedding client
│   │   │   ├── vector_store.py        # FAISS wrapper
│   │   │   ├── retrieval_service.py   # Search + filter
│   │   │   ├── qa_service.py          # Prompt assembly + LLM call
│   │   │   └── history_service.py     # Q&A history CRUD
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── reports.py       # /api/reports/*
│   │       ├── qa.py            # /api/qa/*
│   │       ├── parameters.py    # /api/parameters/*
│   │       └── history.py       # /api/history/*
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/
│   │   │   └── client.ts        # Axios API client
│   │   ├── pages/
│   │   │   ├── HomePage.tsx     # Q&A chat interface
│   │   │   ├── ReportsPage.tsx  # Report management
│   │   │   └── HistoryPage.tsx  # History browsing
│   │   ├── components/
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── ParameterPanel.tsx
│   │   │   ├── ReportUploader.tsx
│   │   │   ├── ReportList.tsx
│   │   │   ├── SourceCitation.tsx
│   │   │   └── HistoryList.tsx
│   │   └── styles/
│   │       └── global.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── data/
│   └── .gitkeep
└── .gitignore
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

无违反项。

## Phase 0: Research

详见 [research.md](research.md)

## Phase 1: Design

详见 [data-model.md](data-model.md)、[contracts/](contracts/)、[quickstart.md](quickstart.md)
