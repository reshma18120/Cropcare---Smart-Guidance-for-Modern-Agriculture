import pandas as pd
import os
import joblib
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
from xgboost import XGBRegressor

# ======================================
# BASE PATH
# ======================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DATASET1 = os.path.join(BASE_DIR, "datasets", "data_collection", "agmarknet_market_prices_large.csv")
DATASET2 = os.path.join(BASE_DIR, "datasets", "raw", "Combined_Crops_2010_2025.csv")
DATASET3 = os.path.join(BASE_DIR, "datasets", "raw", "market_price.csv")

COMBINED_DATASET = os.path.join(BASE_DIR, "datasets", "combined_market_data.csv")

# ======================================
# LOAD DATASETS
# ======================================

print("\nLoading datasets...")
d1 = pd.read_csv(DATASET1)
d2 = pd.read_csv(DATASET2)
d3 = pd.read_csv(DATASET3)

print("Dataset1:", d1.shape)
print("Dataset2:", d2.shape)
print("Dataset3:", d3.shape)

# ======================================
# DATASET 1 FORMAT
# ======================================

d1 = d1.rename(columns={
    "commodity": "crop",
    "variety": "type",
    "modal_price": "price"
})
d1["arrival_date"] = pd.to_datetime(d1["arrival_date"], errors="coerce")
d1["year"] = d1["arrival_date"].dt.year
d1["month"] = d1["arrival_date"].dt.month

d1 = d1[["state","market","crop","type","year","month","min_price","max_price","price"]]

# ======================================
# DATASET 2 FORMAT
# ======================================

d2 = d2.rename(columns={"price_per_kg": "price"})
d2["state"] = "unknown"
d2["market"] = "unknown"
d2["month"] = 1
d2["min_price"] = d2["price"]
d2["max_price"] = d2["price"]
d2 = d2[["state","market","crop","type","year","month","min_price","max_price","price"]]

# ======================================
# DATASET 3 FORMAT
# ======================================

d3["state"] = "unknown"
d3["market"] = "unknown"
d3["month"] = 1
d3["min_price"] = d3["price"]
d3["max_price"] = d3["price"]
d3 = d3[["state","market","crop","type","year","month","min_price","max_price","price"]]

# ======================================
# MERGE DATASETS
# ======================================

data = pd.concat([d1,d2,d3], ignore_index=True)
print("\nCombined Dataset:", data.shape)

# ======================================
# CLEAN DATA
# ======================================

data = data.dropna()
data["crop"] = data["crop"].astype(str).str.lower()
data["type"] = data["type"].astype(str).str.lower()
data = data[data["price"] > 0]

# ======================================
# FEATURE ENGINEERING
# ======================================

data["crop_avg_price"] = data.groupby("crop")["price"].transform("mean")
data["year_avg_price"] = data.groupby("year")["price"].transform("mean")

print("\nAvailable Crops:")
print(sorted(data["crop"].unique()))

# ======================================
# SAVE COMBINED DATASET
# ======================================

os.makedirs(os.path.join(BASE_DIR, "datasets"), exist_ok=True)
data.to_csv(COMBINED_DATASET, index=False)
print("\nCombined dataset saved:", COMBINED_DATASET)

# ======================================
# ENCODERS
# ======================================

crop_encoder = LabelEncoder()
type_encoder = LabelEncoder()
state_encoder = LabelEncoder()
market_encoder = LabelEncoder()

data["crop"] = crop_encoder.fit_transform(data["crop"])
data["type"] = type_encoder.fit_transform(data["type"])
data["state"] = state_encoder.fit_transform(data["state"])
data["market"] = market_encoder.fit_transform(data["market"])

# ======================================
# FEATURES
# ======================================

X = data[[
    "crop","type","state","market","year","month","min_price","max_price","crop_avg_price","year_avg_price"
]]
y = data["price"]

# ======================================
# TRAIN TEST SPLIT
# ======================================

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# ======================================
# MODEL
# ======================================

model = XGBRegressor(
    n_estimators=1500,
    learning_rate=0.02,
    max_depth=8,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42
)

model.fit(X_train, y_train)

# ======================================
# EVALUATION
# ======================================

pred = model.predict(X_test)
mae = mean_absolute_error(y_test, pred)
rmse = np.sqrt(mean_squared_error(y_test, pred))
r2 = r2_score(y_test, pred)

print("\nModel Evaluation")
print("---------------------------")
print("MAE :", round(mae,2))
print("RMSE :", round(rmse,2))
print("R2 Score :", round(r2,2))
print("Accuracy :", round(r2*100,2), "%")

# ======================================
# SAVE MODEL
# ======================================

MODEL_DIR = os.path.join(BASE_DIR, "models", "market_prediction")
os.makedirs(MODEL_DIR, exist_ok=True)

joblib.dump(model, os.path.join(MODEL_DIR, "price_model.pkl"))
joblib.dump(crop_encoder, os.path.join(MODEL_DIR, "crop_encoder.pkl"))
joblib.dump(type_encoder, os.path.join(MODEL_DIR, "type_encoder.pkl"))
joblib.dump(state_encoder, os.path.join(MODEL_DIR, "state_encoder.pkl"))
joblib.dump(market_encoder, os.path.join(MODEL_DIR, "market_encoder.pkl"))

print("\nModel saved successfully!")