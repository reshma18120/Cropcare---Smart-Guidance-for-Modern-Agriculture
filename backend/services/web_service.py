"""
web_service.py
----------------
Provides controlled external knowledge from:
- Wikipedia
- Arxiv
- DuckDuckGo

Used ONLY when local RAG (FAISS) is insufficient.
Safe, limited, agriculture-focused.
"""

from langchain_community.tools import (
    WikipediaQueryRun,
    ArxivQueryRun,
    DuckDuckGoSearchRun,
)
from langchain_community.utilities import (
    WikipediaAPIWrapper,
    ArxivAPIWrapper,
    DuckDuckGoSearchAPIWrapper,
)

# ===============================
# TOOL INITIALIZATION
# ===============================

# Wikipedia (short + focused)
wiki = WikipediaQueryRun(
    api_wrapper=WikipediaAPIWrapper(
        top_k_results=1,
        doc_content_chars_max=400
    )
)

# Arxiv (research-based farming topics)
arxiv = ArxivQueryRun(
    api_wrapper=ArxivAPIWrapper(
        top_k_results=1,
        doc_content_chars_max=400
    )
)

# DuckDuckGo (general + regional)
duckduckgo = DuckDuckGoSearchRun(
    api_wrapper=DuckDuckGoSearchAPIWrapper(
        region="in-en",
        time="y",
        max_results=2
    )
)

# ===============================
# MAIN SEARCH FUNCTION
# ===============================

def web_search(query: str) -> str:
    """
    Perform limited web search using trusted sources.
    Returns combined, clean text for LLM context.
    """

    results = []

    # ---------------------------
    # Wikipedia
    # ---------------------------
    try:
        wiki_result = wiki.run(query)
        if wiki_result:
            results.append("Wikipedia:\n" + wiki_result)
    except Exception:
        pass

    # ---------------------------
    # Arxiv (only for research-like queries)
    # ---------------------------
    try:
        if any(word in query.lower() for word in ["research", "study", "paper", "yield", "disease"]):
            arxiv_result = arxiv.run(query)
            if arxiv_result:
                results.append("Arxiv Research:\n" + arxiv_result)
    except Exception:
        pass

    # ---------------------------
    # DuckDuckGo (fallback)
    # ---------------------------
    try:
        ddg_result = duckduckgo.run(query)
        if ddg_result:
            results.append("Web Search:\n" + ddg_result)
    except Exception:
        pass

    # ---------------------------
    # FINAL MERGE
    # ---------------------------
    if not results:
        return ""

    return "\n\n".join(results)
