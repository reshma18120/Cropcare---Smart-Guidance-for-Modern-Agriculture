import pandas as pd
import os
import joblib
import json
import numpy as np

# ===============================
# PATHS
# ===============================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

MODEL_PATH = os.path.join(BASE_DIR, "models", "market_prediction", "price_model.pkl")
DATA_PATH = os.path.join(BASE_DIR, "datasets", "combined_market_data.csv")

CROP_ENCODER_PATH = os.path.join(BASE_DIR, "models", "market_prediction", "crop_encoder.pkl")
TYPE_ENCODER_PATH = os.path.join(BASE_DIR, "models", "market_prediction", "type_encoder.pkl")
STATE_ENCODER_PATH = os.path.join(BASE_DIR, "models", "market_prediction", "state_encoder.pkl")
MARKET_ENCODER_PATH = os.path.join(BASE_DIR, "models", "market_prediction", "market_encoder.pkl")

# ===============================
# LOAD MODEL + ENCODERS
# ===============================

print("Loading model and encoders...")

model = joblib.load(MODEL_PATH)
crop_encoder = joblib.load(CROP_ENCODER_PATH)
type_encoder = joblib.load(TYPE_ENCODER_PATH)
state_encoder = joblib.load(STATE_ENCODER_PATH)
market_encoder = joblib.load(MARKET_ENCODER_PATH)

# ===============================
# LOAD DATASET
# ===============================

print("Loading dataset...")
data = pd.read_csv(DATA_PATH)

# ===============================
# SAFE ENCODER FUNCTION
# ===============================

def safe_encode(encoder, value):
    value = value.lower()
    if value in encoder.classes_:
        return encoder.transform([value])[0]
    return 0

# ===============================
# PREDICTION FUNCTION
# ===============================

def predict_price(crop, type_, state, market, year, month):
    crop = crop.lower()
    type_ = type_.lower()
    state = state.lower()
    market = market.lower()

    # Filter crop data
    crop_data = data[data["crop"] == crop]
    if crop_data.empty:
        return {"error": "Crop not found in dataset"}

    # ===============================
    # CALCULATE STATISTICS
    # ===============================
    min_price = crop_data["price"].min()
    max_price = crop_data["price"].max()
    crop_avg_price = crop_data["price"].mean()

    year_data = data[data["year"] == year]
    year_avg_price = year_data["price"].mean() if not year_data.empty else data["price"].mean()

    # ===============================
    # ENCODING
    # ===============================
    crop_encoded = safe_encode(crop_encoder, crop)
    type_encoded = safe_encode(type_encoder, type_)
    state_encoded = safe_encode(state_encoder, state)
    market_encoded = safe_encode(market_encoder, market)

    # ===============================
    # MODEL INPUT
    # ===============================
    input_data = pd.DataFrame([[
        crop_encoded,
        type_encoded,
        state_encoded,
        market_encoded,
        year,
        month,
        min_price,
        max_price,
        crop_avg_price,
        year_avg_price
    ]], columns=[
        "crop","type","state","market","year","month",
        "min_price","max_price","crop_avg_price","year_avg_price"
    ])

    # ===============================
    # PREDICTION
    # ===============================
    prediction = model.predict(input_data)[0]

    # ===============================
    # CONFIDENCE (simple estimation)
    # ===============================
    price_range = max_price - min_price
    if price_range == 0:
        confidence = 90
    else:
        confidence = max(70, 100 - abs(prediction - crop_avg_price) / price_range * 100)

    # ===============================
    # TREND DATA
    # ===============================
    trend = []
    for y in range(2010, 2026):
        year_crop = data[(data["crop"] == crop) & (data["year"] == y)]
        avg = year_crop["price"].mean() if not year_crop.empty else crop_avg_price
        trend.append({"year": int(y), "price": round(avg, 2)})

    # ===============================
    # RESULT
    # ===============================
    result = {
        "crop": crop,
        "type": type_,
        "year": year,
        "state": state,
        "market": market,
        "predicted_price": round(float(prediction), 2),
        "min_price": round(float(min_price), 2),
        "max_price": round(float(max_price), 2),
        "confidence": round(float(confidence), 2),
        "trend": trend
    }

    return result

# ===============================
# TEST RUN
# ===============================
if __name__ == "__main__":
    result = predict_price(
        crop="rice",
        type_="other",
        state="andhra pradesh",
        market="visakhapatnam",
        year=2026,
        month=6
    )
    print("\nPrediction Result\n")
    print(json.dumps(result, indent=4))