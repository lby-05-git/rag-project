"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with defaults for local development."""

    # Ollama
    ollama_host: str = "http://localhost:11434"
    llm_model: str = "qwen2.5:0.5b"
    embedding_model: str = "dengcao/bge-large-zh-v1.5"

    # FAISS
    faiss_index_path: str = "data/faiss_index"

    # Database
    database_url: str = "sqlite:///./data/rag.db"

    # App
    app_name: str = "企业研报智能问答系统"
    debug: bool = False

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Normalise Ollama host URL
        host = self.ollama_host
        if host:
            # "0.0.0.0" is a bind address — use localhost for connecting
            if host == "0.0.0.0" or host == "http://0.0.0.0":
                host = "http://localhost:11434"
            # Bare hostname / IP without protocol
            elif not host.startswith("http"):
                host = f"http://{host}"
            # Has protocol but no port — append default Ollama port
            if host.startswith("http://") and ":" not in host.split("://")[1]:
                host = f"{host}:11434"
        self.ollama_host = host


settings = Settings()
