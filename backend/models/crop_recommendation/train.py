import pandas as pd
import joblib
import os

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report

# ==================================================
# PATHS
# ==================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "../../datasets/raw/Crop_recommendation.csv")

MODEL_PATH = os.path.join(BASE_DIR, "crop_model.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "feature_encoders.pkl")

# ==================================================
# LOAD DATA
# ==================================================

data = pd.read_csv(DATASET_PATH)

required_cols = {
    "N", "P", "K",
    "temperature", "humidity", "ph", "rainfall",
    "label"
}

missing = required_cols - set(data.columns)
if missing:
    raise ValueError(f"❌ Missing required columns in dataset: {missing}")

# ==================================================
# SEASON INFERENCE (CRITICAL FIX)
# ==================================================

def infer_season(temp, rain):
    """
    Generic global agricultural season logic
    """
    if rain >= 180:
        return "kharif"
    elif temp <= 20:
        return "rabi"
    else:
        return "summer"

data["season"] = data.apply(
    lambda r: infer_season(r["temperature"], r["rainfall"]),
    axis=1
)

# ==================================================
# ENCODE SEASON
# ==================================================

season_encoder = LabelEncoder()
data["season_encoded"] = season_encoder.fit_transform(data["season"])

# ==================================================
# FEATURES & LABEL (MATCH predict.py ORDER)
# ==================================================

FEATURE_COLUMNS = [
    "N",
    "P",
    "K",
    "ph",
    "temperature",
    "humidity",
    "rainfall",
    "season_encoded"
]

X = data[FEATURE_COLUMNS]
y = data["label"].str.lower()

# ==================================================
# TRAIN / TEST SPLIT
# ==================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# ==================================================
# MODEL
# ==================================================

model = RandomForestClassifier(
    n_estimators=300,
    max_depth=18,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)

# ==================================================
# EVALUATION
# ==================================================

y_pred = model.predict(X_test)

print("\n📊 Model Evaluation")
print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

# ==================================================
# SAVE
# ==================================================

joblib.dump(model, MODEL_PATH)
joblib.dump(
    {
        "season_encoder": season_encoder,
        "features": FEATURE_COLUMNS
    },
    ENCODER_PATH
)

print("\n✅ Crop recommendation model trained successfully")
