from typing import Optional, List
from google.genai import types

from services.gemini_client import client, MODEL_NAME
from services.vector_store import search_knowledge
from services.weather import get_weather_by_region
from services.web_service import web_search

from langdetect import detect
from deep_translator import GoogleTranslator
from services.disease_detection import detect_disease
from google.genai.errors import ServerError
import time


def generate_with_retry(prompt, retries=5):
    for attempt in range(retries):
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=[types.Content(role="user", parts=[types.Part(text=prompt)])],
                config=types.GenerateContentConfig(
                    temperature=0.25,
                    max_output_tokens=2048
                )
            )
            return response

        except ServerError as e:
            # 503 handling
            if attempt < retries - 1:
                time.sleep(3 + attempt * 2)  # 1s, 2s, 4s
            else:
                return None

        except Exception as e:
            print("GEMINI ERROR:", str(e))
            return None

# ==================================================
# LANGUAGE SUPPORT
# ==================================================

LANGUAGE_MAP = {
    "en": "English",
    "hi": "Hindi",
    "te": "Telugu"
}

SUPPORTED_LANGS = {"en", "hi", "te"}


# ==================================================
# GREETINGS
# ==================================================

GREETINGS = [
    "hi", "hello", "hey", "hai",
    "namaste", "namaskar",
    "vanakkam", "salam", "adaab",
    "good morning", "good afternoon", "good evening"
]

GREET_MESSAGES = {
    "en": (
        "Hello 👋\n"
        "I am CropCare Assistant 🌱.\n"
        "You can ask me about crops, farming methods, "
        "plant diseases, irrigation, organic farming, "
        "kitchen or terrace gardening, and other agriculture topics."
    ),
    "te": (
        "హలో 👋\n"
        "నేను CropCare సహాయకుడిని 🌱.\n"
        "పంటలు, వ్యవసాయం, ఎరువులు, "
        "పంట రోగాలు, సాగు విధానాలు, "
        "వంటగది లేదా టెర్రస్ తోటల గురించి అడగవచ్చు."
    ),
    "hi": (
        "नमस्ते 👋\n"
        "मैं CropCare सहायक हूँ 🌱।\n"
        "आप फसलों, खेती के तरीकों, "
        "पौधों की बीमारियों, सिंचाई, "
        "जैविक खेती और किचन गार्डन के बारे में पूछ सकते हैं।"
    )
}

DOMAIN_REJECT_MESSAGES = {
    "en": "Please ask questions related to agriculture only.",
    "te": "దయచేసి వ్యవసాయానికి సంబంధించిన ప్రశ్నలు మాత్రమే అడగండి.",
    "hi": "कृपया केवल कृषि से संबंधित प्रश्न ही पूछें।"
}


# ==================================================
# AGRICULTURE KEYWORDS (ENGLISH – FOR LOGIC ONLY)
# ==================================================

AGRI_KEYWORDS = [

    # General
    "agriculture", "farming", "farm", "farmer", "cultivation",
    "crop", "crops", "crop cycle", "crop rotation",
    "yield", "harvest", "sowing", "transplanting",
    "nursery", "seed", "seedling", "germination",

    # Soil
    "soil", "soil type", "soil health", "soil testing",
    "ph", "organic matter", "nutrients",
    "nitrogen", "phosphorus", "potassium",
    "micronutrients", "zinc", "iron",

    # Fertilizers
    "fertilizer", "urea", "dap", "npk",
    "biofertilizer", "organic fertilizer",
    "manure", "cow dung", "compost",
    "vermicompost", "green manure",
    "jeevamrutham", "panchagavya",

    # Irrigation
    "irrigation", "drip irrigation", "sprinkler",
    "flood irrigation", "water management",
    "moisture", "soil moisture", "mulching",

    # Pests & diseases
    "pest", "pests", "insects",
    "disease", "fungal disease", "bacterial disease", "viral disease",
    "leaf curl", "leaf spot", "blight", "wilt", "rot",
    "pesticide", "insecticide", "fungicide",
    "biopesticide", "neem oil",

    # Crops
    "rice", "paddy", "wheat", "maize", "corn",
    "cotton", "sugarcane",
    "millets", "ragi", "jowar",
    "pulses", "dal", "lentils",
    "vegetables", "tomato", "chilli", "brinjal", "okra",
    "fruits", "banana", "mango", "grapes",

    # Modern farming
    "organic farming", "natural farming",
    "hydroponics", "aquaponics",
    "vertical farming", "polyhouse", "greenhouse",
    "precision farming", "smart farming",

    # Gardening
    "kitchen gardening", "terrace gardening",
    "home garden", "backyard garden",
    "container gardening",

    # Weather
    "weather", "rainfall", "temperature",
    "humidity", "climate", "monsoon",
    "drought", "flood",

    # Advisory
    "crop recommendation", "best crop",
    "market price", "msp",
    "profit", "cost of cultivation",
    "seasonal crop", "kharif", "rabi", "zaid"
]


# ==================================================
# LANGUAGE UTILITIES
# ==================================================

def detect_language_safe(text: str) -> str:
    try:
        lang = detect(text)
        return lang if lang in SUPPORTED_LANGS else "en"
    except Exception:
        return "en"


def translate_to_english(text: str, lang: str) -> str:
    if lang == "en":
        return text
    try:
        return GoogleTranslator(source=lang, target="en").translate(text)
    except Exception:
        return text


def is_greeting(text: str) -> bool:
    t = text.lower().strip()
    return any(t == g or t.startswith(g + " ") for g in GREETINGS)


def is_agriculture_query(english_text: str) -> bool:
    q = english_text.lower()
    return any(word in q for word in AGRI_KEYWORDS)


# ==================================================
# MAIN CHAT FUNCTION
# ==================================================
def extract_last_image_result(history: Optional[List[dict]]) -> Optional[dict]:
    if not history:
        return None

    for msg in reversed(history):
        if msg.get("image_result"):
            return msg["image_result"]

    return None

def chat_with_farmer(
    question: str,
    language: str = "en",
    location: Optional[str] = None,
    image: Optional[bytes] = None,
    image_result: Optional[dict] = None,
    history: Optional[List[dict]] = None
) -> dict:

    # ---------------------------
    # DETECT USER LANGUAGE
    # ---------------------------
    detected_lang = detect_language_safe(question)
    if detected_lang not in SUPPORTED_LANGS:
        detected_lang = "en"

    output_language = LANGUAGE_MAP[detected_lang]

    # ---------------------------
    # IMAGE → CNN DIAGNOSIS (ONLY ONCE)
    # ---------------------------
    if image and not image_result:
        try:
            image_result = detect_disease(
                file_bytes=image,
                language=detected_lang
            )
        except Exception:
            image_result = None

    # ---------------------------
    # IMAGE MEMORY FROM HISTORY
    # ---------------------------
    if not image_result and history:
        image_result = extract_last_image_result(history)

    # ---------------------------
    # TRANSLATE TO ENGLISH (LOGIC + RAG)
    # ---------------------------
    english_question = translate_to_english(question, detected_lang)

    # ---------------------------
    # IMAGE QUESTION AUTO-EXPAND
    # ---------------------------
    if image_result:
        if len(english_question.split()) <= 4:
            english_question = (
                "Explain the diagnosed crop disease in detail and guide the farmer "
                "with clear organic and chemical treatment steps."
            )

    # ---------------------------
    # GREETING
    # ---------------------------
    if is_greeting(english_question):
        return {
            "text": GREET_MESSAGES.get(detected_lang, GREET_MESSAGES["en"]),
            "language": detected_lang,
            "image_analysis": None
        }

    # Allow follow-up questions if previous image or history exists
    if history and len(history) > 0:
        skip_domain_check = True
    else:
        skip_domain_check = False

    # ---------------------------
    # DOMAIN CHECK
    # ---------------------------
    # ---------------------------

    if not skip_domain_check and not is_agriculture_query(english_question):
        # If image diagnosis already exists, allow follow-up questions
        if not image_result:
            return {
                "text": DOMAIN_REJECT_MESSAGES.get(detected_lang, DOMAIN_REJECT_MESSAGES["en"]),
                "language": detected_lang,
                "image_analysis": None
            }


    # ---------------------------
    # WEATHER CONTEXT
    # ---------------------------
    weather_context = ""
    if location:
        try:
            w = get_weather_by_region(location)
            weather_context = (
                f"Weather in {location}:\n"
                f"Temperature {w['temperature']} Celsius.\n"
                f"Humidity {w['humidity']} percent.\n"
                f"Rainfall {w['rainfall']} millimeters.\n"
            )
        except Exception:
            pass

    # ---------------------------
    # VECTOR RAG (ENGLISH ONLY)
    # ---------------------------
    docs = search_knowledge(english_question, k=2)
    rag_context = "\n".join(docs)

    # ---------------------------
    # WEB FALLBACK
    # ---------------------------
    web_context = ""
    if len(docs) < 2 and len(english_question.split()) > 4:
        web_context = web_search(english_question)

    # ---------------------------
    # HISTORY (ENGLISH ONLY)
    # ---------------------------
    history_text = ""
    if history:
        for msg in history[-3:]:
            content_en = translate_to_english(msg["content"], detect_language_safe(msg["content"]))
            history_text += f"{msg['role']}: {content_en}\n"

    # ---------------------------
    # IMAGE CONTEXT (CNN OUTPUT ONLY)
    # ---------------------------
    image_instruction = ""
    if image_result:
        image_instruction = f"""
    IMPORTANT IMAGE DIAGNOSIS PROVIDED.

    This diagnosis is FINAL and VERIFIED using a trained CNN model.

    Disease name: {image_result["disease"]}
    Confidence level: {image_result["confidence"]}

    Cause explanation:
    {image_result.get("cause", "Cause information not available")}

    Organic treatment steps:
    {". ".join(image_result["organic_treatment"])}

    Chemical treatment steps:
    {". ".join(image_result["chemical_treatment"])}

    Precaution:
    {image_result["precaution"]}

    MANDATORY RULES:
    - You MUST base your answer ONLY on this diagnosis.
    - You MUST NOT identify, guess, or suggest any other disease.
    - You MUST NOT say "it looks like" or "it may be".
    - You MUST explain treatments clearly for a farmer.
    - You MUST assume the diagnosis is correct.
    """
    # ---------------------------
    # PROMPT (ENGLISH ONLY)
    # ---------------------------
    prompt = f"""
You are CropCare Assistant, a professional agriculture advisor created to help farmers.

YOUR ROLE:
- Help farmers with agriculture-related problems only.
- Provide practical, clear, and trustworthy advice.

STRICT RULES (DO NOT BREAK):
1. Answer ONLY agriculture-related topics such as:
   crops, farming methods, soil, fertilizers, irrigation, pests, diseases,
   crop recommendations, organic farming, hydroponics, vertical farming,
   kitchen gardening, terrace gardening, weather-based farming advice.
2. Respond ONLY in the user's language: {output_language}.
   - If the user asks in Telugu → reply in Telugu.
   - If the user asks in Hindi → reply in Hindi.
   - If the user asks in English → reply in English.
3. Do NOT mix languages.
4. Use SIMPLE, farmer-friendly language.
5. If the farmer asks for steps, method, process, or how to do something,
   then give step-by-step guidance.
   Otherwise, explain in clear sentences without numbering.
6. Prefer ORGANIC or eco-friendly solutions first.
7. Mention ONE important precaution.
8. If information is uncertain or unavailable, clearly say:
   "I do not have enough reliable information for this."
9. Do NOT mention AI, models, tools, training data, or sources.
10. Do NOT use markdown, bold text, headings, or bullet symbols.
11. The answer MUST contain at least 7 to 8 clear sentences.
12. Do NOT give shorter answers, even if the question is simple.
13. If the farmer asks for steps, method, or how to do something,
    explain using spoken steps like:
    Step one. Step two. Step three.
14. If steps are NOT requested, explain in full sentences without steps.
15. When giving steps, use spoken numbering like:
    Step one. Step two. Step three.
    Do not use symbols or numbers.

KNOWLEDGE USAGE PRIORITY:
1. First use the provided Knowledge Base (trusted agriculture data).
2. Use Weather information only if relevant.
3. Use Web information ONLY if local knowledge is insufficient.
4. Never invent facts.

VOICE RULES (VERY IMPORTANT):
- The answer MUST be suitable for voice playback.
- Use short, clear sentences.
- Avoid long paragraphs.
- Avoid symbols, emojis, or formatting.
- Speak naturally as if explaining to a farmer.
- Each sentence must be meaningful and complete.
- Do not compress multiple ideas into one sentence.

IMAGE RULES:
- If an image is provided, analyze visible crop symptoms carefully.
- Describe findings simply.
- Suggest practical treatment steps.
If image prediction is provided,
you MUST use only that prediction.
Do NOT guess.
Do NOT suggest other diseases.
If image diagnosis data is provided, you MUST rely only on it.
Never identify disease by yourself.
Never override the CNN result.

CONTEXT PROVIDED TO YOU:
- Farmer Location
- Weather details (if available)
- Trusted Knowledge Base content
- Web reference (only if needed)
- Image analysis instructions
- Conversation history

Now answer the farmer’s question clearly and helpfully.

Location:
{location or "Not provided"}

Weather:
{weather_context}

Knowledge Base:
{rag_context or "No local knowledge available."}

Web Reference:
{web_context or "None"}

Image Notes:
{image_instruction or "No image provided."}

Conversation History:
{history_text or "None"}

Farmer Question:
{question}

Final Answer ({output_language} only):
"""

    # ---------------------------
    # GEMINI CALL
    # ---------------------------
    response = generate_with_retry(prompt)
    if response is None:
        if response is None:
            return {
                "text": "Currently the AI assistant is experiencing high load. Please try again after a few seconds.",
                "language": detected_lang,
                "image_analysis": None
            }

    # ---------------------------
    # EXTRACT ANSWER
    # ---------------------------
    answer_en = ""

    try:
        if response.candidates:
            content = response.candidates[0].content
            if content and content.parts:
                for part in content.parts:
                    if hasattr(part, "text") and part.text:
                        answer_en += part.text
        else:
            answer_en = response.text or ""
    except Exception:
        answer_en = response.text or ""

    answer_en = answer_en.strip()

    # ---------------------------
    # TRANSLATE BACK TO USER LANGUAGE
    # ---------------------------
    final_answer = answer_en
    if detected_lang != "en":
        try:
            final_answer = GoogleTranslator(
                source="en",
                target=detected_lang
            ).translate(answer_en)
        except Exception:
            pass

    return {
        "text": final_answer if final_answer else "No response generated.",
        "language": detected_lang,
        "image_analysis": {
            "used": bool(image),
            "note": "Image analyzed for visible crop symptoms." if image else None
        }
    }