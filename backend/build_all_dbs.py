import os
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

# ===============================
# CONFIG
# ===============================

DATASET_DIR = "datasets"
VECTOR_DB_DIR = "vectorstores"

os.makedirs(VECTOR_DB_DIR, exist_ok=True)

# ===============================
# EMBEDDINGS
# ===============================

print("🔄 Loading embeddings...")
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

# ===============================
# DATA FILES
# ===============================

DATA_FILES = {
    "crop_diseases": "crop_diseases.txt",
    "hydrophonics": "hydrophonic.txt",
    "irrigation": "irrigation.txt",
    "organic_farming": "organic_farming.txt",
    "seasonal_crops": "seasonal_crops.txt",
    "kitchen_garden": "kitchen_garden.txt",
    "terrace_gardening": "terracegardening.txt",
    "vertical_farming": "vertical_farming.txt"
}

# ===============================
# UTILS
# ===============================

def load_text(file_path: str):
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"❌ File not found: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    # Split by paragraphs for better retrieval
    chunks = [p.strip() for p in text.split("\n\n") if len(p.strip()) > 50]
    return chunks


def build_faiss_db(name: str, texts: list):
    print(f"📦 Building vector DB for: {name}")
    db = FAISS.from_texts(texts, embeddings)
    save_path = os.path.join(VECTOR_DB_DIR, name)
    db.save_local(save_path)
    print(f"✅ Saved FAISS DB at: {save_path}\n")


# ===============================
# MAIN PIPELINE
# ===============================

def main():
    print("🌱 CropCare AI — Building Knowledge Databases\n")

    for db_name, file_name in DATA_FILES.items():
        file_path = os.path.join(DATASET_DIR, file_name)

        try:
            texts = load_text(file_path)
            build_faiss_db(db_name, texts)

        except Exception as e:
            print(f"⚠️ Skipped {db_name}: {e}\n")

    print("🎉 All vector databases built successfully!")


# ===============================
# RUN
# ===============================

if __name__ == "__main__":
    main()
