"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with defaults for local development."""

    # Ollama
    ollama_host: str = "http://localhost:11434"
    llm_model: str = "qwen2.5:0.5b"
    embedding_model: str = "bge-m3"

    # FAISS
    faiss_index_path: str = "data/faiss_index"

    # Database
    database_url: str = "sqlite:///./data/rag.db"

    # App
    app_name: str = "企业研报智能问答系统"
    debug: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
