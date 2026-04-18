def estimate_soil_moisture(weather: dict, soil_defaults: dict, season: str) -> str:
    """
    Estimate soil moisture using:
    - Current rainfall
    - Humidity
    - Seasonal pattern
    """

    rainfall = weather.get("rainfall", 0)
    humidity = weather.get("humidity", 0)

    # Rule-based, explainable logic
    if rainfall > 5 or humidity >= 75:
        return "Optimal"
    elif rainfall > 1 or humidity >= 55:
        return "Moderate"
    else:
        return "Dry"
