"""PDF document loader and text chunker for the RAG pipeline.

Uses LangChain's PyPDFLoader to extract text from PDF files, then
RecursiveCharacterTextSplitter to split into manageable chunks.
Each chunk preserves source filename and page metadata for citation.
"""

from typing import List

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


def load_and_split_pdf(
    file_path: str,
    chunk_size: int = 400,
    chunk_overlap: int = 50,
) -> List[Document]:
    """Load a PDF file and split it into text chunks.

    Each chunk retains metadata for source tracing:
      - source: the original PDF filename
      - page:   the page number the chunk came from

    Args:
        file_path:     Path to the PDF file.
        chunk_size:    Maximum characters per chunk (default 400).
        chunk_overlap: Overlap between consecutive chunks (default 50).

    Returns:
        A list of LangChain Document objects with page_content and metadata.
    """
    # Step 1: load raw pages from PDF
    loader = PyPDFLoader(file_path)
    pages = loader.load()

    # Step 2: split pages into smaller chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", "。", "！", "？", "；", "，", " ", ""],
    )
    chunks = splitter.split_documents(pages)

    # Step 3: normalise metadata — ensure every chunk carries source + page
    for chunk in chunks:
        source = chunk.metadata.get("source", file_path)
        page = chunk.metadata.get("page", 0)
        chunk.metadata = {"source": source, "page": page}

    return chunks
