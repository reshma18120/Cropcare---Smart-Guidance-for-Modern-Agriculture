import os
from typing import List
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

# ===============================
# CONFIG
# ===============================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "../datasets")
VECTOR_DB_DIR = os.path.join(BASE_DIR, "../vector_db")

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"

# ===============================
# GLOBAL CACHE (IMPORTANT)
# ===============================

_vectorstore: FAISS | None = None


# ===============================
# LOAD TEXT FILES
# ===============================

def load_text_files(folder_path: str) -> List[Document]:
    documents = []

    for filename in os.listdir(folder_path):
        if filename.endswith(".txt"):
            with open(
                os.path.join(folder_path, filename),
                "r",
                encoding="utf-8"
            ) as f:
                documents.append(
                    Document(
                        page_content=f.read(),
                        metadata={"source": filename}
                    )
                )
    return documents


# ===============================
# BUILD VECTOR STORE
# ===============================

def build_vector_store() -> FAISS:
    if not os.path.exists(DATASET_DIR):
        raise FileNotFoundError("❌ datasets folder not found")

    docs = load_text_files(DATASET_DIR)
    if not docs:
        raise ValueError("❌ No text files found in datasets")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=80
    )

    split_docs = splitter.split_documents(docs)

    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL
    )

    vectorstore = FAISS.from_documents(
        split_docs,
        embeddings
    )

    os.makedirs(VECTOR_DB_DIR, exist_ok=True)
    vectorstore.save_local(VECTOR_DB_DIR)

    return vectorstore


# ===============================
# LOAD VECTOR STORE (CACHED)
# ===============================

def load_vector_store() -> FAISS:
    global _vectorstore

    if _vectorstore is not None:
        return _vectorstore

    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL
    )

    if not os.path.exists(VECTOR_DB_DIR):
        _vectorstore = build_vector_store()
    else:
        _vectorstore = FAISS.load_local(
            VECTOR_DB_DIR,
            embeddings,
            allow_dangerous_deserialization=True
        )

    return _vectorstore


# ===============================
# QUERY VECTOR STORE
# ===============================

def search_knowledge(query: str, k: int = 4) -> List[str]:
    vectorstore = load_vector_store()
    docs = vectorstore.similarity_search(query, k=k)
    return [doc.page_content for doc in docs]


# ===============================
# CLI SUPPORT
# ===============================

if __name__ == "__main__":
    build_vector_store()
