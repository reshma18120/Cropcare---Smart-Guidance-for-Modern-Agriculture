from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import base64
import io

# ===============================
# ML MODELS
# ===============================
from models.crop_recommendation.predict import predict_crop
from models.disease_detection.predict import predict_disease

# ===============================
# SERVICES
# ===============================
from services.season import detect_season_auto
from services.weather import get_weather_by_region
from services.soil_moisture import estimate_soil_moisture
from services.soil_defaults import get_soil_defaults
from services.market_service import get_market_price
from services.disease_detection import detect_disease
from services.alerts_service import generate_alerts

# ✅ Import analytics router ONLY
from fastapi import APIRouter
from pydantic import BaseModel
from services.analytics_service import get_agri_analytics

# ✅ NEW CHATBOT SERVICE
from services.chatbot_service import chat_with_farmer
import pandas as pd
import os
from pathlib import Path

from fastapi import WebSocket
from fastapi import WebSocketDisconnect
import asyncio

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DATA = os.path.join(BASE_DIR, "datasets", "raw")

MARKET_PRICE_CSV = os.path.join(RAW_DATA, "market_price.csv")
COMBINED_CSV = os.path.join(RAW_DATA, "Combined_Crops_2010_2025.csv")

# ===============================
# FASTAPI INIT
# ===============================
app = FastAPI(
    title="CropCare AI Backend",
    description="AI-powered agriculture platform",
    version="5.0.0"
)

# ===============================
# INCLUDE ANALYTICS ROUTER
# ===============================


# ===============================
# CORS
# ===============================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===============================
# ROOT
# ===============================
@app.get("/")
def root():
    return {
        "status": "CropCare AI backend running",
        "docs": "/docs"
    }

@app.get("/alerts")
def get_alerts(region: str):
    return {
        "alerts": generate_alerts(region)
    }

@app.websocket("/ws/alerts/{region}")
async def websocket_alerts(ws: WebSocket, region: str):
    await ws.accept()

    try:
        while True:
            alerts = generate_alerts(region)
            await ws.send_json({"alerts": alerts})
            await asyncio.sleep(10)

    except WebSocketDisconnect:
        print("Client disconnected")

# ==================================================
# DASHBOARD OVERVIEW
# ==================================================
@app.get("/dashboard/overview")
def dashboard_overview(lat: float, lon: float):

    region = get_region_from_coords(lat, lon)

    season = detect_season_auto(region)
    weather = get_weather_by_region(region)
    soil_defaults = get_soil_defaults(region)

    soil_moisture = estimate_soil_moisture(
        weather=weather,
        soil_defaults=soil_defaults,
        season=season
    )

    crop_health = "Healthy" if soil_moisture == "Optimal" else "Monitor"

    risk_level = (
        "Low" if soil_moisture == "Optimal"
        else "Medium" if soil_moisture == "Moderate"
        else "High"
    )

    return {
        "location": region,
        "season": season,
        "weather": weather,
        "soil": {
            "type": soil_defaults["soil_type"],
            "ph": soil_defaults["ph"]
        },
        "soilMoisture": soil_moisture,
        "cropHealth": crop_health,
        "riskLevel": risk_level,
        "actions": [],
        "todayTip": "Stay consistent with irrigation."
    }
from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="cropcare_app")

def get_region_from_coords(lat, lon):
    try:
        location = geolocator.reverse((lat, lon), language="en")
        address = location.raw.get("address", {})
        return address.get("state", "India")
    except:
        return "India"

# ==================================================
# CROP RECOMMENDATION
# ==================================================
@app.post("/predict-crop")
def predict_crop_auto(region: str):
    season = detect_season_auto(region)
    result = predict_crop(region)

    return {
        "success": True,
        "region": region,
        "season": season,
        **result
    }

# ==================================================
# DISEASE DETECTION (IMAGE)
# ==================================================

@app.post("/diagnose")
async def diagnose_crop(
    file: UploadFile = File(...),
    language: str = "en"
):
    image_bytes = await file.read()
    return detect_disease(image_bytes, language)

# ==================================================
# CHATBOT (MULTI-LANGUAGE + IMAGE + MEMORY)
# ==================================================

class ChatHistoryItem(BaseModel):
    role: str
    content: str
    image: Optional[str] = None
    language: Optional[str] = None

class ChatRequest(BaseModel):
    question: str
    language: str = "en"
    location: Optional[str] = None
    image: Optional[str] = None
    history: List[ChatHistoryItem] = []

class ChatResponse(BaseModel):
    text: str
    language: str
    image_analysis: Optional[dict] = None

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(payload: ChatRequest):

    history = [
        {
            "role": item.role,
            "content": item.content
        }
        for item in payload.history
    ] if payload.history else None

    image_bytes = None
    image_result = None

    # ✅ HANDLE BASE64 IMAGE (NO CNN HERE)
    if payload.image and payload.image.startswith("data:image"):
        try:
            base64_data = payload.image.split(",")[1]
            image_bytes = base64.b64decode(base64_data)
        except Exception as e:
            print("Image decode error:", e)
            image_bytes = None

    result = chat_with_farmer(
        question=payload.question,
        language=payload.language,
        location=payload.location,
        image=image_bytes,   # ✅ bytes, not base64 string
        image_result=image_result,
        history=history
    )

    return result

# ==================================================
# MARKET PRICE PREDICTION
# ==================================================
class MarketRequest(BaseModel):
    crop: str
    type: str
    year: int

class MarketResponse(BaseModel):
    crop: str
    type: str
    year: int
    predicted_price: float
    min_price: float
    max_price: float
    confidence: float

@app.post("/market/predict", response_model=MarketResponse)
def market_predict(payload: MarketRequest):
    return get_market_price(payload.dict())

@app.get("/market/trend")
def market_trend(crop: str, category: str):
    df = pd.read_csv(COMBINED_CSV)

    df["crop"] = df["crop"].str.lower()
    df["category"] = df["category"].str.lower()

    filtered = df[
        (df["crop"] == crop.lower()) &
        (df["category"] == category.lower())
    ]

    return [
        {
            "year": int(row["year"]),
            "price": float(row["price"])
        }
        for _, row in filtered.iterrows()
    ]
# ===============================
# ANALYTICS ROUTER
# ===============================

analytics_router = APIRouter()

class AnalyticsRequest(BaseModel):
    region: str
    year: int
    crop_type: str = "vegetable"

@analytics_router.post("/analytics")
def analytics(payload: AnalyticsRequest):
    return get_agri_analytics(
        payload.region,
        payload.year,
        payload.crop_type
    )

# ✅ IMPORTANT: REGISTER ROUTER
app.include_router(analytics_router)

