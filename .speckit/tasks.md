---

description: "Task list for 企业研报智能问答系统 MVP implementation"

---

# Tasks: 企业研报智能问答系统

**Input**: Design documents from `.speckit/`

**Prerequisites**: plan.md (required), spec.md (required)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Tech Stack

- **Backend**: Python 3.12+, FastAPI, LangChain, SQLAlchemy, PyMuPDF, faiss-cpu, httpx
- **Frontend**: React 19 + Vite + TypeScript + Ant Design 5 + axios
- **AI**: Ollama Qwen2.5:0.5b (LLM), bge-m3 (Embedding, 1024维)
- **Storage**: SQLite (metadata + history), FAISS IndexFlatL2 (vectors), data/ (PDF files)

## Project Structure

```text
rag-project/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── report.py
│   │   │   ├── qa_record.py
│   │   │   └── session.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── report.py
│   │   │   ├── qa.py
│   │   │   └── parameter.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── document_processor.py
│   │   │   ├── embedding_service.py
│   │   │   ├── vector_store.py
│   │   │   ├── retrieval_service.py
│   │   │   ├── qa_service.py
│   │   │   └── history_service.py
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── reports.py
│   │       ├── qa.py
│   │       ├── parameters.py
│   │       └── history.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/client.ts
│   │   ├── pages/
│   │   │   ├── HomePage.tsx
│   │   │   ├── ReportsPage.tsx
│   │   │   └── HistoryPage.tsx
│   │   ├── components/
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── ParameterPanel.tsx
│   │   │   ├── ReportUploader.tsx
│   │   │   ├── ReportList.tsx
│   │   │   ├── SourceCitation.tsx
│   │   │   └── HistoryList.tsx
│   │   └── styles/global.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── data/.gitkeep
└── .gitignore
```

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize backend and frontend projects with dependencies

- [ ] T001 Create backend/ directory structure with app/ sub-packages
- [ ] T002 Create backend/requirements.txt with all dependencies
- [ ] T003 Create backend/.env.example with configuration keys
- [ ] T004 Initialize frontend with Vite + React 19 + TypeScript
- [ ] T005 Create frontend/package.json with all dependencies
- [ ] T006 Create .gitignore excluding data/, __pycache__/, .venv/, .env, node_modules/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure shared by all user stories

- [ ] T007 Implement backend/app/config.py with pydantic-settings
- [ ] T008 Implement backend/app/database.py with SQLAlchemy
- [ ] T009 Implement backend/app/main.py with FastAPI + CORS + lifespan
- [ ] T010 Configure frontend/vite.config.ts with API proxy
- [ ] T011 Create frontend/src/api/client.ts with axios instance

---

## Phase 3: User Story 1 - 研报上传与自动索引 (P1) MVP

**Goal**: Upload PDF, auto-parse, chunk, embed, index in FAISS

- [ ] T012 [P] [US1] Create Report ORM model in backend/app/models/report.py
- [ ] T013 [P] [US1] Create Report Pydantic schemas in backend/app/schemas/report.py
- [ ] T014 [US1] PDF extraction with PyMuPDF in backend/app/services/document_processor.py
- [ ] T015 [US1] Text chunking with LangChain in backend/app/services/document_processor.py
- [ ] T016 [US1] Ollama embedding client in backend/app/services/embedding_service.py
- [ ] T017 [US1] FAISS vector store wrapper in backend/app/services/vector_store.py
- [ ] T018 [US1] POST /api/reports/upload in backend/app/routers/reports.py
- [ ] T019 [US1] GET /api/reports in backend/app/routers/reports.py
- [ ] T020 [US1] GET /api/reports/{id} in backend/app/routers/reports.py
- [ ] T021 [US1] DELETE /api/reports/{id} in backend/app/routers/reports.py
- [ ] T022 [P] [US1] ReportUploader component in frontend/src/components/ReportUploader.tsx
- [ ] T023 [P] [US1] ReportList component in frontend/src/components/ReportList.tsx
- [ ] T024 [US1] ReportsPage in frontend/src/pages/ReportsPage.tsx
- [ ] T025 [US1] Add /reports route in frontend/src/App.tsx

---

## Phase 4: User Story 2 - 智能问答与来源追溯 (P1) MVP

**Goal**: Ask questions, FAISS search Top-5, filter by threshold, Qwen generate, return cited answer

- [ ] T026 [P] [US1] Create QASession + QARecord ORM models
- [ ] T027 [P] [US1] Create QA Pydantic schemas
- [ ] T028 [US2] Retrieval service in backend/app/services/retrieval_service.py
- [ ] T029 [US2] QA service with Prompt assembly in backend/app/services/qa_service.py
- [ ] T030 [US2] Ollama LLM call in backend/app/services/qa_service.py
- [ ] T031 [US2] Source citation extraction in backend/app/services/qa_service.py
- [ ] T032 [US2] POST /api/qa/ask in backend/app/routers/qa.py
- [ ] T033 [US2] GET /api/qa/sessions in backend/app/routers/qa.py
- [ ] T034 [US2] GET /api/qa/sessions/{id} in backend/app/routers/qa.py
- [ ] T035 [P] [US2] SourceCitation component in frontend/src/components/SourceCitation.tsx
- [ ] T036 [P] [US2] ChatPanel component in frontend/src/components/ChatPanel.tsx
- [ ] T037 [US2] HomePage in frontend/src/pages/HomePage.tsx
- [ ] T038 [US2] Add / route in frontend/src/App.tsx

---

## Phase 5: User Story 3 - 参数实时调节 (P2)

**Goal**: Frontend sliders for chunk_size and similarity_threshold

- [ ] T039 [P] [US3] ParameterSetting ORM model
- [ ] T040 [P] [US3] Parameter Pydantic schemas
- [ ] T041 [US3] Parameter CRUD service
- [ ] T042 [US3] GET /api/parameters in backend/app/routers/parameters.py
- [ ] T043 [US3] PUT /api/parameters in backend/app/routers/parameters.py
- [ ] T044 [US3] Wire chunk_size into document_processor for re-chunking
- [ ] T045 [US3] Wire similarity_threshold into retrieval_service
- [ ] T046 [P] [US3] ParameterPanel component in frontend/src/components/ParameterPanel.tsx
- [ ] T047 [US3] Integrate ParameterPanel into HomePage

---

## Phase 6: User Story 4 - 问答历史记录 (P3)

**Goal**: Auto-save Q&A sessions, browse and restore history

- [ ] T048 [P] [US4] GET /api/history in backend/app/routers/history.py
- [ ] T049 [US4] GET /api/history/{id} in backend/app/routers/history.py
- [ ] T050 [US4] DELETE /api/history in backend/app/routers/history.py
- [ ] T051 [US4] History CRUD in backend/app/services/history_service.py
- [ ] T052 [P] [US4] HistoryList component in frontend/src/components/HistoryList.tsx
- [ ] T053 [US4] HistoryPage in frontend/src/pages/HistoryPage.tsx
- [ ] T054 [US4] Add /history route in frontend/src/App.tsx

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T055 Build navigation layout with Ant Design Menu + Layout
- [ ] T056 Add Ollama health check on backend startup
- [ ] T057 Add frontend Ollama-disconnected error state
- [ ] T058 Add file upload validation (PDF, max 50MB)
- [ ] T059 Add loading spinners and empty states
- [ ] T060 FAISS index persistence (save/load on shutdown/startup)
- [ ] T061 Create README.md with setup instructions
- [ ] T062 Final review of all API responses and frontend states

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all stories
- **US1 (Phase 3)**: Depends on Foundational
- **US2 (Phase 4)**: Depends on Foundational + US1
- **US3 (Phase 5)**: Depends on US2
- **US4 (Phase 6)**: Depends on US2
- **Polish (Phase 7)**: Depends on all stories

**MVP scope**: Phase 1 + 2 + 3 + 4 = 38 tasks (upload, ask, get cited answer)
