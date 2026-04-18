import json
import os

# --------------------------------------------------
# LOAD CROP RULES
# --------------------------------------------------

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RULE_PATH = os.path.join(BASE_DIR, "../datasets/rules/crop_rules.json")

with open(RULE_PATH, "r", encoding="utf-8") as f:
    CROP_RULES = json.load(f)

# --------------------------------------------------
# NORMALIZATION (CRITICAL)
# --------------------------------------------------

def normalize_region(region: str) -> str:
    if not region:
        return ""
    region = region.lower()
    region = region.replace(", india", "")
    region = region.replace(" state", "")
    return region.strip()

# --------------------------------------------------
# MAIN FUNCTION (THIS NAME MUST MATCH IMPORT)
# --------------------------------------------------

def get_candidate_crops(region: str, season: str):
    """
    India state-wise + season-wise crop rules
    """

    region = normalize_region(region).lower()
    season = season.lower().strip()

    # -----------------------------
    # STATE-WISE RULES
    # -----------------------------
    STATE_CROPS = {

        # 🌾 ANDHRA / TELANGANA
        "andhra pradesh": {
            "kharif": ["rice", "cotton", "maize"],
            "rabi": ["rice", "groundnut", "chillies"],
            "zaid": ["watermelon", "banana"]
        },
        "telangana": {
            "kharif": ["rice", "cotton", "maize"],
            "rabi": ["maize", "groundnut"],
            "zaid": ["vegetables", "watermelon"]
        },

        # 🌾 TAMIL NADU / KERALA / KARNATAKA
        "tamil nadu": {
            "kharif": ["rice", "sugarcane"],
            "rabi": ["rice", "millets"],
            "zaid": ["banana", "vegetables"]
        },
        "karnataka": {
            "kharif": ["rice", "maize", "cotton"],
            "rabi": ["wheat", "sunflower"],
            "zaid": ["vegetables", "watermelon"]
        },
        "kerala": {
            "kharif": ["rice", "coconut"],
            "rabi": ["banana", "vegetables"],
            "zaid": ["spices", "vegetables"]
        },

        # 🌾 NORTH INDIA
        "punjab": {
            "kharif": ["rice", "maize"],
            "rabi": ["wheat", "mustard"],
            "zaid": ["vegetables", "watermelon"]
        },
        "haryana": {
            "kharif": ["rice", "cotton"],
            "rabi": ["wheat", "mustard"],
            "zaid": ["vegetables"]
        },
        "uttar pradesh": {
            "kharif": ["rice", "maize"],
            "rabi": ["wheat", "peas"],
            "zaid": ["vegetables", "watermelon"]
        },

        # 🌾 RAJASTHAN / GUJARAT
        "rajasthan": {
            "kharif": ["bajra", "cotton", "groundnut"],
            "rabi": ["wheat", "mustard", "gram"],
            "zaid": ["muskmelon", "watermelon"]
        },
        "gujarat": {
            "kharif": ["cotton", "groundnut"],
            "rabi": ["wheat", "cumin"],
            "zaid": ["vegetables", "watermelon"]
        },

        # 🌾 MAHARASHTRA
        "maharashtra": {
            "kharif": ["soybean", "cotton"],
            "rabi": ["wheat", "gram"],
            "zaid": ["vegetables", "watermelon"]
        },

        # 🌾 EAST INDIA
        "bihar": {
            "kharif": ["rice", "maize"],
            "rabi": ["wheat", "lentil"],
            "zaid": ["vegetables"]
        },
        "west bengal": {
            "kharif": ["rice", "jute"],
            "rabi": ["potato", "wheat"],
            "zaid": ["vegetables"]
        },
        "odisha": {
            "kharif": ["rice"],
            "rabi": ["pulses"],
            "zaid": ["vegetables"]
        },

        # 🌾 CENTRAL INDIA
        "madhya pradesh": {
            "kharif": ["soybean", "maize"],
            "rabi": ["wheat", "gram"],
            "zaid": ["vegetables"]
        },
        "chhattisgarh": {
            "kharif": ["rice"],
            "rabi": ["wheat"],
            "zaid": ["vegetables"]
        },

        # 🌾 HILL STATES
        "himachal pradesh": {
            "kharif": ["maize"],
            "rabi": ["wheat"],
            "zaid": ["apple"]
        },
        "uttarakhand": {
            "kharif": ["rice"],
            "rabi": ["wheat"],
            "zaid": ["vegetables"]
        }
    }

    # -----------------------------
    # MATCH REGION
    # -----------------------------
    for state, crops in STATE_CROPS.items():
        if state in region:
            return crops.get(season, [])

    # -----------------------------
    # DEFAULT INDIA FALLBACK
    # -----------------------------
    if season == "kharif":
        return ["rice", "maize"]
    elif season == "rabi":
        return ["wheat", "mustard"]
    elif season == "zaid":
        return ["vegetables", "watermelon"]

    return []