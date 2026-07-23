"""Pydantic 请求/响应模型 for API endpoints."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Query
# ---------------------------------------------------------------------------

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, description="用户问题")
    chunk_size: int = Field(default=400, ge=200, le=1000, description="分块大小")
    similarity_threshold: float = Field(default=0.3, ge=0.0, le=1.0, description="相似度阈值")


class SourceItem(BaseModel):
    content: str
    source: str
    page: int
    score: float


class QueryResponse(BaseModel):
    answer: str
    sources: List[SourceItem]


# ---------------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------------

class UploadResponse(BaseModel):
    filename: str
    chunks: int
    message: str


# ---------------------------------------------------------------------------
# Document list
# ---------------------------------------------------------------------------

class DocumentItem(BaseModel):
    filename: str
    chunks: int
    uploaded_at: datetime


class DocumentListResponse(BaseModel):
    documents: List[DocumentItem]


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

class ConfigResponse(BaseModel):
    chunk_size_min: int = 200
    chunk_size_max: int = 1000
    chunk_size_default: int = 400
    chunk_size_step: int = 50
    threshold_min: float = 0.0
    threshold_max: float = 1.0
    threshold_default: float = 0.3
    threshold_step: float = 0.05
    top_k_default: int = 5
    ollama_status: str = "unknown"
    document_count: int = 0
