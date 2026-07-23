---

description: "Task list for 企业研报智能问答系统 MVP implementation"

---

# Tasks: 企业研报智能问答系统

**Input**: Design documents from `specs/001-core-rag-pipeline/`

**Prerequisites**: plan.md (required), spec.md (required), data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Tech Stack

- **Backend**: Python 3.12+, FastAPI, LangChain, SQLAlchemy, PyMuPDF, faiss-cpu, httpx
- **Frontend**: React 19 + Vite + TypeScript + Ant Design 5 + axios
- **AI**: Ollama — Qwen2.5:0.5b (LLM), bge-m3 (Embedding, 1024维)
- **Storage**: SQLite (metadata + history), FAISS IndexFlatL2 (vectors), `data/` (PDF files)

## Project Structure

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
│   │   │   ├── qa_record.py     # QARecord ORM model
│   │   │   └── session.py       # QASession ORM model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── report.py        # Pydantic schemas
│   │   │   ├── qa.py
│   │   │   └── parameter.py
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
│   │   │   ├── HomePage.tsx     # Q&A chat + parameter panel
│   │   │   ├── ReportsPage.tsx  # Report upload + list
│   │   │   └── HistoryPage.tsx  # Session history
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

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize backend and frontend projects with dependencies

- [ ] T001 Create `backend/` directory structure with `app/` sub-packages (models, schemas, services, routers)
- [ ] T002 Create `backend/requirements.txt` with: fastapi, uvicorn, langchain, langchain-community, sqlalchemy, pymupdf, faiss-cpu, httpx, python-multipart
- [ ] T003 Create `backend/.env.example` with: OLLAMA_HOST, OLLAMA_PORT, FAISS_INDEX_PATH, DATABASE_URL, LLM_MODEL, EMBEDDING_MODEL
- [ ] T004 Initialize frontend with Vite + React 19 + TypeScript in `frontend/`
- [ ] T005 Create `frontend/package.json` with: react, react-dom, antd, axios, @ant-design/icons
- [ ] T006 Create `.gitignore` excluding `data/`, `__pycache__/`, `.venv/`, `.env`, `frontend/node_modules/`, `*.db`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure shared by all user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Implement `backend/app/config.py` with pydantic-settings (Ollama host:port, model names, FAISS path, DB URL)
- [ ] T008 Implement `backend/app/database.py` with SQLAlchemy engine, SessionLocal, Base, get_db dependency
- [ ] T009 Implement `backend/app/main.py` — FastAPI app with CORS middleware, lifespan events (FAISS load on startup)
- [ ] T010 Configure `frontend/vite.config.ts` with API proxy from `/api` to `http://localhost:8000`
- [ ] T011 Create `frontend/src/api/client.ts` with axios instance and base URL

**Checkpoint**: Foundation ready — backend serves health check, frontend compiles and proxies API calls

---

## Phase 3: User Story 1 — 研报上传与自动索引 (Priority: P1) 🎯 MVP

**Goal**: Upload PDF reports → auto-extract text → chunk → embed with bge-m3 → store in FAISS

**Independent Test**: Upload a known PDF, verify it appears in report list with status "completed" and chunk_count > 0

### Data Model Entities

- Report: id, filename, file_path, file_size, page_count, status (pending/processing/completed/failed), error_message, chunk_count, chunk_size_used, timestamps
- ChunkMetadata: id, report_id (FK), chunk_index, content, page_number, chunk_size, token_count (SQLite)
- Vector: 1024-dim embedding in FAISS IndexFlatL2 with chunk_metadata.id as ID

### API Contracts

- `POST /api/reports/upload` — multipart file upload
- `GET /api/reports` — list all reports
- `GET /api/reports/{id}` — report detail
- `DELETE /api/reports/{id}` — delete report + its chunks + vectors

### Implementation Tasks

- [ ] T012 [P] [US1] Create Report ORM model in `backend/app/models/report.py` (fields per data-model.md)
- [ ] T013 [P] [US1] Create Report Pydantic schemas in `backend/app/schemas/report.py` (ReportCreate, ReportRead, ReportList)
- [ ] T014 [US1] Implement PDF text extraction with PyMuPDF in `backend/app/services/document_processor.py` (extract per-page text + metadata)
- [ ] T015 [US1] Implement text chunking with LangChain RecursiveCharacterTextSplitter (chunk_size configurable, overlap 10%) in `backend/app/services/document_processor.py`
- [ ] T016 [US1] Implement Ollama embedding client for bge-m3 in `backend/app/services/embedding_service.py` (POST /api/embed, handle 1024-dim response)
- [ ] T017 [US1] Implement FAISS vector store wrapper in `backend/app/services/vector_store.py` (IndexFlatL2, save/load from `data/faiss_index/`, add/delete by ID)
- [ ] T018 [US1] Implement upload API: POST /api/reports/upload in `backend/app/routers/reports.py` (save file → process async → update status)
- [ ] T019 [US1] Implement list API: GET /api/reports in `backend/app/routers/reports.py`
- [ ] T020 [US1] Implement detail API: GET /api/reports/{id} in `backend/app/routers/reports.py`
- [ ] T021 [US1] Implement delete API: DELETE /api/reports/{id} in `backend/app/routers/reports.py` (remove file + chunks + FAISS vectors)
- [ ] T022 [P] [US1] Build ReportUploader component in `frontend/src/components/ReportUploader.tsx` (Ant Design Upload with drag-and-drop, PDF-only filter)
- [ ] T023 [P] [US1] Build ReportList component in `frontend/src/components/ReportList.tsx` (Ant Design Table with status Tag, delete button)
- [ ] T024 [US1] Build ReportsPage combining uploader + list in `frontend/src/pages/ReportsPage.tsx`
- [ ] T025 [US1] Add /reports route with navigation menu item in `frontend/src/App.tsx`

**Checkpoint**: At this point, US1 is fully functional — upload, view, detail, delete reports

---

## Phase 4: User Story 2 — 智能问答与来源追溯 (Priority: P1) 🎯 MVP

**Goal**: Ask questions → FAISS search Top-5 → filter by similarity threshold → assemble Prompt → Qwen2.5:0.5b generate → return cited answer

**Independent Test**: Upload a report, ask a question about its content, verify answer includes correct source (report name + page)

### Data Model Entities

- QASession: id, title, timestamps
- QARecord: id, session_id (FK), turn_number, question, answer, sources (JSON), chunk_size, similarity_threshold, timestamps
- ParameterSetting: singleton — chunk_size, similarity_threshold, top_k

### API Contracts

- `POST /api/qa/ask` — ask question (session_id null=new session, or existing)
- `GET /api/qa/sessions` — list sessions
- `GET /api/qa/sessions/{id}` — get full session with all records

### Implementation Tasks

- [ ] T026 [P] [US1] Create QASession and QARecord ORM models in `backend/app/models/session.py` and `backend/app/models/qa_record.py`
- [ ] T027 [P] [US1] Create QA Pydantic schemas in `backend/app/schemas/qa.py` (AskRequest, QAResponse, SessionRead)
- [ ] T028 [US2] Implement retrieval service in `backend/app/services/retrieval_service.py` (embed question → FAISS search Top-5 → filter by threshold → load chunk content from SQLite)
- [ ] T029 [US2] Implement QA service in `backend/app/services/qa_service.py` (assemble Prompt: System + Top-5 chunks + last 3 turns history + question)
- [ ] T030 [US2] Implement Ollama LLM call (Qwen2.5:0.5b) with httpx in `backend/app/services/qa_service.py` (POST /api/generate, stream=false)
- [ ] T031 [US2] Extract source citations from retrieved chunks (report_name + page_number) in `backend/app/services/qa_service.py`
- [ ] T032 [US2] Implement ask API: POST /api/qa/ask in `backend/app/routers/qa.py` (create session if null, save record, return answer + sources)
- [ ] T033 [US2] Implement sessions list API: GET /api/qa/sessions in `backend/app/routers/qa.py`
- [ ] T034 [US2] Implement session detail API: GET /api/qa/sessions/{id} in `backend/app/routers/qa.py`
- [ ] T035 [P] [US2] Build SourceCitation component in `frontend/src/components/SourceCitation.tsx` (report name + page tag, clickable)
- [ ] T036 [P] [US2] Build ChatPanel component in `frontend/src/components/ChatPanel.tsx` (message list with Ant Design Bubble, input box, send button, loading state)
- [ ] T037 [US2] Build HomePage with ChatPanel in `frontend/src/pages/HomePage.tsx`
- [ ] T038 [US2] Add / route to HomePage in `frontend/src/App.tsx`

**Checkpoint**: US1 + US2 work together — upload → ask → get cited answer (MVP complete!)

---

## Phase 5: User Story 3 — 参数实时调节 (Priority: P2)

**Goal**: Frontend sliders for chunk_size (200-1000) and similarity_threshold (0.1-1.0), changes take effect on next query

**Independent Test**: Change chunk_size from 500 to 200, ask same question, verify different chunks retrieved and answer reflects new param

### Data Model Entities

- ParameterSetting: singleton row — chunk_size (default 500), similarity_threshold (default 0.5), top_k (default 5)

### API Contracts

- `GET /api/parameters` — get current params
- `PUT /api/parameters` — update params

### Implementation Tasks

- [ ] T039 [P] [US3] Create ParameterSetting ORM model and auto-init singleton in `backend/app/models/` (add to existing or new file)
- [ ] T040 [P] [US3] Create Parameter Pydantic schemas in `backend/app/schemas/parameter.py`
- [ ] T041 [US3] Implement parameter get/set logic: `backend/app/services/` (read/update singleton row)
- [ ] T042 [US3] Implement GET /api/parameters in `backend/app/routers/parameters.py`
- [ ] T043 [US3] Implement PUT /api/parameters in `backend/app/routers/parameters.py` (validate range, update, return new values)
- [ ] T044 [US3] Wire chunk_size into document_processor.py — re-chunk affected reports on param change
- [ ] T045 [US3] Wire similarity_threshold into retrieval_service.py — filter FAISS results by threshold
- [ ] T046 [P] [US3] Build ParameterPanel component in `frontend/src/components/ParameterPanel.tsx` (two Ant Design Sliders with labels + current values)
- [ ] T047 [US3] Integrate ParameterPanel into HomePage, display params below each answer

**Checkpoint**: Users can tune parameters and see real-time impact on Q&A

---

## Phase 6: User Story 4 — 问答历史记录 (Priority: P3)

**Goal**: Auto-save all Q&A sessions, browse history, restore and continue conversations

**Independent Test**: Complete multi-turn chat, refresh page, open history, click session → conversation restored

### API Contracts

- `GET /api/history` — paginated session list
- `GET /api/history/{session_id}` — full session records
- `DELETE /api/history/{session_id}` — delete one session
- `DELETE /api/history` — delete all

### Implementation Tasks

- [ ] T048 [P] [US4] Implement history list API: GET /api/history in `backend/app/routers/history.py` (paginated, ordered by last_asked desc)
- [ ] T049 [US4] Implement session detail API: GET /api/history/{id} in `backend/app/routers/history.py`
- [ ] T050 [US4] Implement delete APIs: DELETE /api/history/{id} and DELETE /api/history in `backend/app/routers/history.py`
- [ ] T051 [US4] Implement history CRUD logic in `backend/app/services/history_service.py`
- [ ] T052 [P] [US4] Build HistoryList component in `frontend/src/components/HistoryList.tsx` (Ant Design List with title, turn count, timestamp, delete button)
- [ ] T053 [US4] Build HistoryPage in `frontend/src/pages/HistoryPage.tsx`
- [ ] T054 [US4] Add /history route in `frontend/src/App.tsx`

**Checkpoint**: All 4 user stories functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality-of-life improvements, error handling, documentation

- [ ] T055 [P] Build app navigation layout with Ant Design Menu + Layout (sidebar: Reports / Q&A / History)
- [ ] T056 Add Ollama connection check on backend startup (health endpoint `/api/health` returning ollama_status)
- [ ] T057 Add frontend Ollama-disconnected error state (banner/toast when /api/health fails)
- [ ] T058 Add file upload validation (PDF-only, max 50MB, duplicate filename check)
- [ ] T059 Add loading spinners and empty states for all pages (Spin + Empty components)
- [ ] T060 Implement FAISS index persistence (auto-save on shutdown via lifespan event, auto-load on startup)
- [ ] T061 Create `README.md` with: project overview, setup steps, Ollama model pull commands, run instructions
- [ ] T062 Final review: verify all API responses match contract specs, all frontend pages have error/loading/empty states

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all stories
- **US1 研报管理 (Phase 3)**: Depends on Foundational
- **US2 智能问答 (Phase 4)**: Depends on Foundational + US1 (needs indexed reports)
- **US3 参数调节 (Phase 5)**: Depends on US2 (enhances Q&A)
- **US4 历史记录 (Phase 6)**: Depends on US2 (records Q&A data)
- **Polish (Phase 7)**: Depends on all stories

### Parallel Opportunities

- T012 & T013 (US1 models + schemas)
- T022 & T023 (US1 frontend components)
- T026 & T027 (US2 models + schemas)
- T035 & T036 (US2 frontend components)
- T039 & T040 (US3 model + schema)
- T046 & T047 (US3 frontend)
- T048 & T052 (US4 backend + frontend)
- US3 and US4 share no file conflicts — can be developed in parallel if staffed

### Implementation Strategy

**MVP (Phase 1-4, 38 tasks)**: Upload → Ask → Get cited answer
1. Setup → Foundational → Foundation ready
2. US1: Upload reports, auto-index → Test independently
3. US2: Ask questions with citations → **MVP DONE**
4. US3 (optional): Parameter tuning → Enhanced
5. US4 (optional): History → Complete
6. Polish: Error handling, docs

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to user story for traceability
- Each user story is independently completable and testable
- Backend: `http://localhost:8000`, Frontend: `http://localhost:5173` (proxied)
- FAISS index path: `data/faiss_index/`
- Ollama API: `http://localhost:11434`
