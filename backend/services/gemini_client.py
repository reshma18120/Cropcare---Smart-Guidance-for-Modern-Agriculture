import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY missing in .env")

client = genai.Client(api_key=GEMINI_API_KEY)

# ✅ LOCKED MODEL (from your model list)
MODEL_NAME = "models/gemini-2.5-flash"
