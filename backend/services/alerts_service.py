from services.weather import get_weather_by_region

def generate_alerts(region: str):
    weather = get_weather_by_region(region)

    # ✅ DEBUG LOG
    print("REGION:", region)
    print("WEATHER:", weather)

    # ❗ fallback if API fails
    if not weather:
        weather = {
            "temperature": 30,
            "humidity": 85,
            "rainfall": 0
        }
    # ✅ FIX: initialize alerts list
    alerts = []

    # 🌧 High pest risk (humidity + temp)
    if weather["humidity"] > 60 and weather["temperature"] > 25:
        alerts.append({
            "id": "weather_pest_risk",
            "title": "High Pest Risk",
            "description": "Weather conditions favor pest outbreak.",
            "priority": "High",
            "crop": "General",
            "weather": {
                "reason": "High humidity and warm temperature",
                "temperature": weather["temperature"],
                "rainfall": weather["rainfall"]
            },
            "timestamp": "Now"
        })

    # 🌱 Low moisture alert
    if weather["rainfall"] < 150:
        alerts.append({
            "id": "low_soil_moisture",
            "title": "Low Soil Moisture",
            "description": "Soil moisture may be below optimal level.",
            "priority": "Medium",
            "crop": "General",
            "weather": {
                "reason": "Low rainfall",
                "rainfall": weather["rainfall"]
            },
            "timestamp": "Today"
        })

    return alerts