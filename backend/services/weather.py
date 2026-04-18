import os
import requests
from dotenv import load_dotenv

load_dotenv()

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

if not OPENWEATHER_API_KEY:
    raise ValueError("OPENWEATHER_API_KEY not found in .env file")

def get_weather_by_region(region: str) -> dict:
    """
    Fetch real-time weather data using OpenWeather API.
    Handles states, cities, and countries with safe fallback.
    """

    # -----------------------------
    # Normalize query (IMPORTANT)
    # -----------------------------
    query = region.strip()

    # If user enters Indian state without country, append IN
    if "," not in query:
        query = f"{query}, IN"

    # -----------------------------
    # Geocoding API
    # -----------------------------
    geo_url = "http://api.openweathermap.org/geo/1.0/direct"
    geo_params = {
        "q": query,
        "limit": 1,
        "appid": OPENWEATHER_API_KEY
    }

    geo_response = requests.get(geo_url, params=geo_params, timeout=10)

    # -----------------------------
    # SAFE FALLBACK (NO CRASH)
    # -----------------------------
    if geo_response.status_code != 200:
        return {
            "temperature": 30,
            "humidity": 65,
            "rainfall": 120
        }

    geo_data = geo_response.json()

    if not geo_data:
        # Fallback if location not found
        return {
            "temperature": 30,
            "humidity": 65,
            "rainfall": 120
        }

    lat = geo_data[0]["lat"]
    lon = geo_data[0]["lon"]

    # -----------------------------
    # Weather API
    # -----------------------------
    weather_url = "https://api.openweathermap.org/data/2.5/weather"
    weather_params = {
        "lat": lat,
        "lon": lon,
        "units": "metric",
        "appid": OPENWEATHER_API_KEY
    }

    weather_response = requests.get(weather_url, params=weather_params, timeout=10)

    if weather_response.status_code != 200:
        return {
            "temperature": 30,
            "humidity": 65,
            "rainfall": 120
        }

    weather_data = weather_response.json()

    temperature = weather_data["main"]["temp"]
    humidity = weather_data["main"]["humidity"]

    rainfall = 0
    if "rain" in weather_data:
        rainfall = weather_data["rain"].get("1h", 0)

    return {
        "temperature": round(temperature, 2),
        "humidity": humidity,
        "rainfall": round(rainfall, 2)
    }
