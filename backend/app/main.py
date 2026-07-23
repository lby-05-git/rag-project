"""FastAPI application entry point for 企业研报智能问答系统."""

import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.document_loader import load_and_split_pdf
from app.rag_chain import rag_query
from app.schemas.api import (
    ConfigResponse,
    DocumentItem,
    DocumentListResponse,
    QueryRequest,
    QueryResponse,
    SourceItem,
    UploadResponse,
)
from app.vector_store import (
    check_ollama_connection,
    create_vector_store,
    load_vector_store,
    save_vector_store,
)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(title=settings.app_name, version="0.1.0")

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# In-memory state
# ---------------------------------------------------------------------------

store: Optional["FAISS"] = None  # type: ignore
documents: List[dict] = []

DATA_DIR = Path("data")
FAISS_DIR = DATA_DIR / "faiss_index"
UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Lifespan events (startup / shutdown)
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def startup():
    global store
    faiss_path = str(FAISS_DIR)
    if FAISS_DIR.is_dir():
        loaded = load_vector_store(faiss_path)
        if loaded is not None:
            store = loaded


@app.on_event("shutdown")
async def shutdown():
    global store
    if store is not None:
        save_vector_store(store, str(FAISS_DIR))


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    """Health check."""
    return {"status": "ok"}


@app.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    chunk_size: int = Query(default=400, ge=200, le=1000),
):
    """Upload a PDF, parse it, and add to the vector store."""
    global store

    # 1. Validate
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "仅支持 PDF 格式文件")

    # 2. Save temp file
    temp_path = UPLOAD_DIR / file.filename
    with open(temp_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        # 3. Parse & chunk
        docs = load_and_split_pdf(str(temp_path), chunk_size=chunk_size)

        if not docs:
            raise HTTPException(400, "未能从 PDF 中提取到文本内容")

        # 4. Add to vector store
        if store is None:
            store = create_vector_store(docs)
        else:
            from langchain_community.vectorstores import FAISS
            from app.vector_store import _get_embeddings

            embeddings = _get_embeddings()
            store.add_documents(docs)

        # 5. Persist
        save_vector_store(store, str(FAISS_DIR))

        # 6. Track
        documents.append({
            "filename": file.filename,
            "chunks": len(docs),
            "uploaded_at": datetime.now(timezone.utc),
            "chunk_size": chunk_size,
        })

        return UploadResponse(
            filename=file.filename,
            chunks=len(docs),
            message=f"成功导入 {file.filename}（{len(docs)} 个文本块）",
        )

    except Exception as e:
        raise HTTPException(500, f"处理失败：{str(e)}")

    finally:
        # Cleanup temp file
        if temp_path.exists():
            temp_path.unlink()


@app.post("/query", response_model=QueryResponse)
async def query(req: QueryRequest):
    """Ask a question and get an answer with source citations."""
    global store

    if store is None:
        raise HTTPException(400, "请先上传研报")

    if not check_ollama_connection():
        raise HTTPException(503, "Ollama 服务未连接，请确认 Ollama 已启动")

    try:
        result = rag_query(
            store,
            req.question,
            k=5,
            similarity_threshold=req.similarity_threshold,
        )
        return QueryResponse(
            answer=result["answer"],
            sources=[SourceItem(**s) for s in result["sources"]],
        )

    except Exception as e:
        raise HTTPException(500, f"查询失败：{str(e)}")


@app.get("/documents", response_model=DocumentListResponse)
async def list_documents():
    """List all uploaded documents."""
    return DocumentListResponse(
        documents=[
            DocumentItem(
                filename=d["filename"],
                chunks=d["chunks"],
                uploaded_at=d["uploaded_at"],
            )
            for d in documents
        ]
    )


@app.get("/config", response_model=ConfigResponse)
async def get_config():
    """Return current system configuration."""
    ollama_ok = check_ollama_connection()
    return ConfigResponse(
        ollama_status="connected" if ollama_ok else "disconnected",
        document_count=len(documents),
    )


@app.delete("/reports")
async def delete_report(filename: str = Query(..., description="要删除的研报文件名")):
    """Delete an uploaded report by filename."""
    global documents

    # 1. Find and remove from list
    idx = None
    for i, d in enumerate(documents):
        if d["filename"] == filename:
            idx = i
            break

    if idx is None:
        raise HTTPException(404, f"研报不存在：{filename}")

    removed = documents.pop(idx)

    # 2. Remove uploaded file if exists
    file_path = UPLOAD_DIR / filename
    if file_path.exists():
        file_path.unlink()

    return {
        "message": f"已删除 {removed['filename']}（{removed['chunks']} 个文本块）"
    }
