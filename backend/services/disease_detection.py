import sys
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

import json
from typing import Dict
from PIL import Image
import io

from models.disease_detection.predict import predict_disease
from services.weather import get_weather_by_region


# ==================================================
# CONFIG
# ==================================================
SUPPORTED_LANGUAGES = {"en", "te", "hi"}
CONFIDENCE_THRESHOLD = 0.6


# ==================================================
# LOAD DISEASE DATABASE
# ==================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DISEASE_JSON_PATH = os.path.join(BASE_DIR, "disease_info.json")

with open(DISEASE_JSON_PATH, "r", encoding="utf-8") as f:
    raw_db = json.load(f)

# normalize keys to lowercase
DISEASE_DATABASE = {
    k.lower(): v for k, v in raw_db.items()
}

# ==================================================
# IMAGE PROCESSING
# ==================================================
def preprocess_image(file_bytes: bytes) -> Image.Image:
    """
    Convert uploaded bytes to PIL Image
    """
    image = Image.open(io.BytesIO(file_bytes))
    image = image.convert("RGB")
    image = image.resize((224, 224))
    return image


def normalize_label(label: str) -> str:
    """
    Normalize labels from PlantVillage dataset
    Example:
    Tomato___Early_blight -> Tomato_Early_blight
    """
    return label.replace("___", "_").replace("__", "_").strip().lower()


def human_readable_name(label: str) -> str:
    """
    Convert label to user friendly format
    Tomato_Early_blight -> Tomato Early blight
    """
    return label.replace("_", " ")


# ==================================================
# SEVERITY LOGIC
# ==================================================
def get_severity_and_action(confidence: float, label: str):

    if confidence >= 0.90:
        return "Severe", "Treat within 24 hours"

    if confidence >= 0.75:
        return "Moderate", "Treat within 3 days"

    return "Mild", "Monitor plant and apply preventive spray"


# ==================================================
# SPREAD RISK
# ==================================================
def get_spread_risk(language: str):

    messages = {
        "en": "Disease may spread through water splash, wind, or tools.",
        "te": "వర్షపు నీరు, గాలి లేదా పరికరాల ద్వారా వ్యాపించవచ్చు.",
        "hi": "बारिश, हवा या औजारों से फैल सकता है।"
    }

    return {
        "level": "High",
        "message": messages[language]
    }


# ==================================================
# CONDITIONS
# ==================================================
def get_conditions(language: str):

    conditions = {
        "en": [
            "High humidity",
            "Overwatering",
            "Poor air circulation",
            "Dense planting"
        ],

        "te": [
            "అధిక తేమ",
            "అధిక నీటిపారుదల",
            "గాలి ప్రసరణ తక్కువ",
            "సాంద్రంగా నాటడం"
        ],

        "hi": [
            "अधिक नमी",
            "अधिक सिंचाई",
            "हवा का कम प्रवाह",
            "घनी रोपाई"
        ]
    }

    return conditions[language]


# ==================================================
# SPRAY SAFETY
# ==================================================
def get_dosage_and_safety(language: str):

    tips = {
        "en": [
            "Do not exceed recommended dosage.",
            "Spray early morning or evening.",
            "Wear gloves and mask during spraying."
        ],

        "te": [
            "సిఫార్సు చేసిన మోతాదును మించవద్దు.",
            "ఉదయం లేదా సాయంత్రం పిచికారీ చేయండి.",
            "గ్లోవ్స్ మరియు మాస్క్ ధరించండి."
        ],

        "hi": [
            "सिफारिश की गई मात्रा से अधिक न डालें।",
            "सुबह या शाम को छिड़काव करें।",
            "दस्ताने और मास्क पहनें।"
        ]
    }

    return tips[language]


# ==================================================
# WEATHER SPRAY LOGIC
# ==================================================
def get_weather_spray_status(weather: dict, language: str):

    rainfall = weather.get("rainfall", 0)
    humidity = weather.get("humidity", 0)

    if rainfall > 5:
        return {
            "lock_chemical": True,
            "message": {
                "en": "Chemical spray disabled due to rainfall.",
                "te": "వర్షం కారణంగా రసాయన పిచికారీ నిలిపివేయబడింది.",
                "hi": "बारिश के कारण रासायनिक छिड़काव रोकें।"
            }[language]
        }

    if humidity > 85:
        return {
            "lock_chemical": False,
            "message": {
                "en": "High humidity. Spray early morning.",
                "te": "అధిక తేమ. ఉదయం పిచికారీ చేయండి.",
                "hi": "अधिक नमी। सुबह छिड़काव करें।"
            }[language]
        }

    return {
        "lock_chemical": False,
        "message": {
            "en": "Weather suitable for spraying.",
            "te": "వాతావరణం పిచికారీకి అనుకూలంగా ఉంది.",
            "hi": "मौसम छिड़काव के लिए अनुकूल है।"
        }[language]
    }


# ==================================================
# MAIN DISEASE DETECTION FUNCTION
# ==================================================
def detect_disease(file_bytes: bytes, language: str = "en") -> Dict:

    if language not in SUPPORTED_LANGUAGES:
        language = "en"

    # Convert bytes → image
    image = preprocess_image(file_bytes)

    # CNN prediction
    prediction = predict_disease(image)

    label_raw = prediction.get("label", "Unknown")
    confidence = float(prediction.get("confidence", 0.0))

    label = normalize_label(label_raw).lower()
    display_name = human_readable_name(label)

    # Low confidence
    if confidence < CONFIDENCE_THRESHOLD:
        return {
            "disease": "Uncertain",
            "confidence": round(confidence, 2),
            "message": {
                "en": "Image unclear. Please upload a clear leaf photo.",
                "te": "చిత్రం స్పష్టంగా లేదు. స్పష్టమైన ఆకుల ఫోటో పంపండి.",
                "hi": "तस्वीर साफ नहीं है। कृपया स्पष्ट फोटो भेजें।"
            }[language]
        }

    # Disease not in database
    if label not in DISEASE_DATABASE:

        is_healthy = "healthy" in label

        return {
            "disease": display_name,
            "confidence": round(confidence, 2),

            "cause": "No detailed data available.",

            "organic_treatment": [
                "Maintain proper watering",
                "Use organic compost",
                "Monitor plant regularly"
            ],

            "chemical_treatment": [] if is_healthy else [
                "Consult agricultural expert before applying chemicals"
            ],

            "precaution": [
                "Observe plant daily for changes"
            ],

            "severity": "Unknown",
            "action_priority": "Monitor plant",

            "why_this_occurred": get_conditions(language),

            "spread_risk": get_spread_risk(language),

            "dosage_and_safety": get_dosage_and_safety(language),

            "weather_spray_advice": "Weather data unavailable",
            "lock_chemical_spray": False
        }

    disease_data = DISEASE_DATABASE[label]

    is_healthy = "healthy" in label

    organic = disease_data["organic"][language]
    chemical = disease_data["chemical"][language]

    # 🔒 FORCE RULE
    if is_healthy:
        chemical = []   # no chemical for healthy
    severity, action_priority = get_severity_and_action(confidence, label)

    # Weather integration
    try:
        weather = get_weather_by_region("Visakhapatnam, Andhra Pradesh")
        weather_status = get_weather_spray_status(weather, language)
    except:
        weather_status = {
            "lock_chemical": False,
            "message": {
                "en": "Weather data unavailable.",
                "te": "వాతావరణ సమాచారం లేదు.",
                "hi": "मौसम डेटा उपलब्ध नहीं है।"
            }[language]
        }

    return {

        "disease": display_name,
        "confidence": round(confidence, 2),

        "cause": disease_data["cause"][language],

        "organic_treatment": disease_data["organic"][language],
        "chemical_treatment": disease_data["chemical"][language],

        "precaution": [disease_data["precaution"][language]],

        "severity": severity,
        "action_priority": action_priority,

        "why_this_occurred": get_conditions(language),

        "spread_risk": get_spread_risk(language),

        "dosage_and_safety": get_dosage_and_safety(language),

        "weather_spray_advice": weather_status["message"],
        "lock_chemical_spray": weather_status["lock_chemical"]
    }