"""Vector store module using FAISS with Ollama embeddings.

Provides create, save, and load operations for the FAISS vector index.
All embeddings are generated locally via Ollama (bge-large-zh-v1.5).
"""

from typing import List, Optional

import httpx
from langchain_core.documents import Document
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import FAISS

from app.config import settings


def check_ollama_connection(host: Optional[str] = None) -> bool:
    """Check whether the Ollama server is reachable.

    Returns True if Ollama responds at the configured host, False otherwise.
    """
    base = (host or settings.ollama_host).rstrip("/")
    try:
        resp = httpx.get(f"{base}/api/tags", timeout=5.0)
        return resp.status_code == 200
    except (httpx.ConnectError, httpx.TimeoutException):
        return False


def _get_embeddings(model: Optional[str] = None) -> OllamaEmbeddings:
    """Build an OllamaEmbeddings instance pointing at the configured host."""
    return OllamaEmbeddings(
        model=model or settings.embedding_model,
        base_url=settings.ollama_host,
    )


def create_vector_store(
    docs: List[Document],
    model: Optional[str] = None,
) -> FAISS:
    """Create a FAISS vector store from a list of documents.

    Each document is embedded using the specified Ollama model and stored
    in an in-memory FAISS index (IndexFlatL2).

    Args:
        docs:   List of LangChain Document objects to index.
        model:  Ollama embedding model name (default: bge-large-zh-v1.5).

    Returns:
        A FAISS vector store ready for similarity search.

    Raises:
        ConnectionError: If the Ollama server is not reachable.
    """
    if not check_ollama_connection():
        raise ConnectionError(
            "Ollama 服务未连接，请确认 Ollama 已启动。\n"
            f"当前配置：{settings.ollama_host}\n"
            "启动命令：ollama serve"
        )

    embeddings = _get_embeddings(model)
    store = FAISS.from_documents(docs, embeddings)
    return store


def save_vector_store(store: FAISS, path: str) -> None:
    """Persist a FAISS vector store to disk.

    Args:
        store: The FAISS vector store to save.
        path:  Local directory path (e.g. ``data/faiss_index``).
    """
    store.save_local(path)


def load_vector_store(
    path: str,
    model: Optional[str] = None,
    allow_dangerous: bool = True,
) -> Optional[FAISS]:
    """Load a previously persisted FAISS vector store from disk.

    Args:
        path:                       Local directory path.
        model:                      Ollama embedding model name.
        allow_dangerous:            If True, allow pickle deserialisation
                                    (safe for local-only indices).

    Returns:
        The deserialised FAISS vector store, or None if the path does not
        exist or loading fails.
    """
    import os

    if not os.path.isdir(path):
        return None

    embeddings = _get_embeddings(model)
    try:
        return FAISS.load_local(
            path,
            embeddings,
            allow_dangerous_deserialization=allow_dangerous,
        )
    except Exception:
        return None
