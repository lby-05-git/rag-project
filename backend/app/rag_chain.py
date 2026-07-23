"""RAG 核心链：检索 → 生成。

将向量检索与 LLM 生成串联为一条简洁流水线。
"""

from typing import List, Optional

import httpx
from langchain_community.vectorstores import FAISS

from app.config import settings
from app.vector_store import _get_embeddings


# ---------------------------------------------------------------------------
# 检索
# ---------------------------------------------------------------------------

def retrieve(
    store: FAISS,
    question: str,
    k: int = 5,
    similarity_threshold: float = 0.0,
) -> List[dict]:
    """检索与问题最相关的文本块。

    Args:
        store:                FAISS 向量库。
        question:             用户问题。
        k:                    返回 Top-K 条。
        similarity_threshold: 相似度阈值（0-1），低于此值的结果将被过滤掉。
                              0 表示不过滤。

    Returns:
        按相似度降序排列的列表，每项含 content / source / page / score。
    """
    results = store.similarity_search_with_relevance_scores(question, k=k)

    hits = []
    for doc, score in results:
        if score < similarity_threshold:
            continue
        hits.append({
            "content": doc.page_content,
            "source": doc.metadata.get("source", ""),
            "page": doc.metadata.get("page", 0),
            "score": round(score, 4),
        })
    return hits


# ---------------------------------------------------------------------------
# Prompt 组装
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """根据以下资料回答问题。如果资料中没有答案，就说'未找到相关信息'。

资料：
{context}

问题：{question}
回答："""


def build_prompt(question: str, context: str) -> str:
    """构造发送给 LLM 的完整 Prompt。"""
    return SYSTEM_PROMPT.format(context=context, question=question)


# ---------------------------------------------------------------------------
# LLM 生成
# ---------------------------------------------------------------------------

def generate(
    question: str,
    context: str,
    *,
    host: Optional[str] = None,
    model: Optional[str] = None,
) -> str:
    """调用 Ollama Qwen2.5:0.5b 生成回答。

    Args:
        question: 用户问题。
        context:  检索到的文本块（组装成一段文字）。
        host:     Ollama 地址，默认使用 settings。
        model:    模型名，默认使用 settings.llm_model。

    Returns:
        模型生成的文本。
    """
    prompt = build_prompt(question, context)
    base = (host or settings.ollama_host).rstrip("/")
    model_name = model or settings.llm_model

    resp = httpx.post(
        f"{base}/api/generate",
        json={
            "model": model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.3,   # 低温度，更忠实于资料
                "num_predict": 512,   # 限制输出长度，防止胡编
            },
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json().get("response", "").strip()


# ---------------------------------------------------------------------------
# RAG 完整流水线
# ---------------------------------------------------------------------------

DEFAULT_THRESHOLD = 0.3


def rag_query(
    store: FAISS,
    question: str,
    *,
    k: int = 5,
    similarity_threshold: float = DEFAULT_THRESHOLD,
    llm_host: Optional[str] = None,
    llm_model: Optional[str] = None,
) -> dict:
    """检索 + 生成完整流水线。

    Args:
        store:                FAISS 向量库。
        question:             用户问题。
        k:                    检索 Top-K。
        similarity_threshold: 相似度阈值（低于此值的结果不送入 LLM）。
        llm_host:             Ollama 地址。
        llm_model:            生成模型名。

    Returns:
        {"answer": str, "sources": [...]}
    """
    # 1. 检索
    hits = retrieve(store, question, k=k, similarity_threshold=similarity_threshold)

    # 2. 无结果处理
    if not hits:
        return {
            "answer": "未找到相关信息。请尝试换个问题或确认研报中是否包含相关内容。",
            "sources": [],
        }

    # 3. 组装 context
    context_parts = []
    for h in hits:
        context_parts.append(f"[来源：{h['source']} 第{h['page']}页]\n{h['content']}")
    context = "\n\n".join(context_parts)

    # 4. 生成
    answer = generate(question, context, host=llm_host, model=llm_model)

    # 5. 返回
    return {
        "answer": answer,
        "sources": [
            {
                "content": h["content"],
                "source": h["source"],
                "page": h["page"],
                "score": h["score"],
            }
            for h in hits
        ],
    }


# ---------------------------------------------------------------------------
# 便捷类封装
# ---------------------------------------------------------------------------

class RAGChain:
    """RAG 链的便捷类接口。

    用法::

        chain = RAGChain("data/faiss_index")
        result = chain.query("宁德时代营收预测")
    """

    def __init__(
        self,
        faiss_path: str,
        *,
        k: int = 5,
        similarity_threshold: float = DEFAULT_THRESHOLD,
    ):
        from app.vector_store import load_vector_store

        self.store = load_vector_store(faiss_path)
        if self.store is None:
            raise FileNotFoundError(f"无法加载 FAISS 索引：{faiss_path}")
        self.k = k
        self.similarity_threshold = similarity_threshold

    def query(self, question: str, **kwargs) -> dict:
        """执行一次 RAG 查询。

        Args:
            question: 用户问题。
            **kwargs: 覆盖默认的 k / similarity_threshold / llm_host / llm_model。

        Returns:
            {"answer": str, "sources": [...]}
        """
        return rag_query(
            self.store,
            question,
            k=kwargs.get("k", self.k),
            similarity_threshold=kwargs.get(
                "similarity_threshold", self.similarity_threshold
            ),
            llm_host=kwargs.get("llm_host"),
            llm_model=kwargs.get("llm_model"),
        )
