import joblib
import numpy as np
import os
from datetime import datetime

from services.weather import get_weather_by_region
from services.soil_defaults import get_soil_defaults
from services.season import detect_season_auto
from services.rule_engine import get_candidate_crops

# ==================================================
# PATHS
# ==================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "crop_model.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "feature_encoders.pkl")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError("❌ crop_model.pkl not found. Train the model first.")

if not os.path.exists(ENCODER_PATH):
    raise FileNotFoundError("❌ feature_encoders.pkl not found. Train the model first.")

# ==================================================
# LOAD MODEL & ENCODERS
# ==================================================

model = joblib.load(MODEL_PATH)
encoders = joblib.load(ENCODER_PATH)

season_encoder = encoders["season_encoder"]
FEATURE_COLUMNS = encoders["features"]

# ==================================================
# AGRICULTURAL METADATA (DISPLAY PURPOSE ONLY)
# ==================================================

CROP_METADATA = {
    "rice": {"sowing": "June – July", "harvest": "Oct – Nov", "water": "High"},
    "wheat": {"sowing": "Oct – Nov", "harvest": "Mar – Apr", "water": "Moderate"},
    "maize": {"sowing": "June – July", "harvest": "Sep – Oct", "water": "Moderate"},
    "cotton": {"sowing": "Apr – May", "harvest": "Oct – Jan", "water": "Moderate"},
    "banana": {"sowing": "Any season", "harvest": "12–15 months", "water": "High"},
    "apple": {"sowing": "Winter", "harvest": "Jul – Oct", "water": "Moderate"},
}

# ==================================================
# MAIN PREDICTION FUNCTION
# ==================================================

def predict_crop(region: str) -> dict:
    """
    🌱 Hybrid Crop Recommendation Engine

    ✔ Country-aware season detection
    ✔ Rule-based crop filtering
    ✔ ML-based ranking
    ✔ Never returns same crops everywhere
    ✔ Works globally
    """

    # -----------------------------
    # 1️⃣ WEATHER & SOIL CONTEXT
    # -----------------------------
    weather = get_weather_by_region(region)
    soil = get_soil_defaults(region)

    # -----------------------------
    # 2️⃣ SEASON (COUNTRY AWARE)
    # -----------------------------
    season = detect_season_auto(region).lower()

    # Normalize season label for ML encoder
    season_map = {
        "kharif": "kharif",
        "kharif (monsoon)": "kharif",
        "rabi": "rabi",
        "rabi (winter)": "rabi",
        "zaid": "summer",
        "zaid (summer)": "summer",
        "summer": "summer"
    }

    season_for_ml = season_map.get(season, "summer")

    # Safe encoding (never crash)
    if season_for_ml not in season_encoder.classes_:
        season_for_ml = season_encoder.classes_[0]

    season_encoded = season_encoder.transform([season_for_ml])[0]

    # -----------------------------
    # 3️⃣ FEATURE VECTOR (STRICT ORDER)
    # -----------------------------
    features = np.array([[ 
        soil["N"],
        soil["P"],
        soil["K"],
        soil["ph"],
        weather["temperature"],
        weather["humidity"],
        weather["rainfall"],
        season_encoded
    ]])

    # -----------------------------
    # 4️⃣ ML PROBABILITIES
    # -----------------------------
    probabilities = model.predict_proba(features)[0]
    crop_classes = model.classes_

    # -----------------------------
    # 5️⃣ RULE-BASED FILTERING (REGION + SEASON)
    # -----------------------------
    allowed_crops = get_candidate_crops(region, season)

    ranked = []
    for i, crop in enumerate(crop_classes):
        crop_l = crop.lower()

        # Strict regional filtering if rules exist
        if allowed_crops and crop_l not in allowed_crops:
            continue

        ranked.append((crop, probabilities[i]))

    # Fallback → ML only (never fail)
    if not ranked:
        ranked = list(zip(crop_classes, probabilities))

    # -----------------------------
    # 6️⃣ SORT & TOP-3
    # -----------------------------
    ranked.sort(key=lambda x: x[1], reverse=True)
    top_3 = ranked[:3]

    top_3_crops = []
    for crop, prob in top_3:
        meta = CROP_METADATA.get(crop.lower(), {})
        top_3_crops.append({
            "crop": crop,
            "confidence": round(prob * 100, 2),
            "sowing_time": meta.get("sowing", "N/A"),
            "harvest_time": meta.get("harvest", "N/A"),
            "water_requirement": meta.get("water", "Moderate")
        })

    best = top_3_crops[0]

    # -----------------------------
    # 7️⃣ HUMAN-FRIENDLY EXPLANATION
    # -----------------------------
    explanation = (
        f"{best['crop']} is recommended for {region} during the {season.capitalize()} season. "
        f"This recommendation considers local climate, soil conditions, and crop calendars. "
        f"Current temperature ({weather['temperature']}°C), rainfall ({weather['rainfall']} mm), "
        f"and soil pH ({soil['ph']}) support healthy crop growth. "
        f"Among suitable crops, it shows the highest predicted success rate."
    )

    # -----------------------------
    # 8️⃣ FINAL RESPONSE
    # -----------------------------
    return {
        "region": region,
        "season": season,
        "recommended_crop": best["crop"],
        "confidence_percent": best["confidence"],
        "why_this_crop": explanation,
        "top_3_crops": top_3_crops,
        "weather": weather
    }
