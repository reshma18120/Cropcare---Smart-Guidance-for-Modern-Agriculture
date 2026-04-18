"""
Global soil defaults with agro-climatic features.
"""

REGION_PROFILES = {
    "andhra pradesh": {
        "soil_type": "red",
        "agro_zone": "coastal",
        "annual_rainfall_avg": 900,
        "annual_temp_avg": 28,
        "N": 80,
        "P": 40,
        "K": 40,
        "ph": 6.8
    },
    "bihar": {
        "soil_type": "alluvial",
        "agro_zone": "gangetic_plain",
        "annual_rainfall_avg": 1200,
        "annual_temp_avg": 26,
        "N": 78,
        "P": 34,
        "K": 42,
        "ph": 6.6
    },
    "punjab": {
        "soil_type": "alluvial",
        "agro_zone": "plains",
        "annual_rainfall_avg": 650,
        "annual_temp_avg": 24,
        "N": 90,
        "P": 50,
        "K": 50,
        "ph": 7.2
    }
}

GLOBAL_PROFILE = {
    "soil_type": "alluvial",
    "agro_zone": "plains",
    "annual_rainfall_avg": 1000,
    "annual_temp_avg": 25,
    "N": 70,
    "P": 30,
    "K": 30,
    "ph": 6.5
}

def get_soil_defaults(region: str) -> dict:
    if not region:
        return GLOBAL_PROFILE

    region_key = region.lower().strip()

    for key in REGION_PROFILES:
        if key in region_key:
            return REGION_PROFILES[key]

    return GLOBAL_PROFILE
