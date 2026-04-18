# backend/models/disease_detection/train.py

import os
import json
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# ================= CONFIG =================
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 20

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "../../datasets/PlantVillage")

MODEL_PATH = os.path.join(BASE_DIR, "cnn_model.h5")
LABELS_PATH = os.path.join(BASE_DIR, "labels.json")

# ================= DATA GENERATOR =================
train_datagen = ImageDataGenerator(
    rescale=1.0 / 255,
    validation_split=0.2,
    rotation_range=20,
    zoom_range=0.2,
    horizontal_flip=True
)

train_generator = train_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    subset="training"
)

val_generator = train_datagen.flow_from_directory(
    DATASET_DIR,
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    subset="validation"
)

NUM_CLASSES = train_generator.num_classes

# ================= BASE MODEL =================
base_model = MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights="imagenet"
)

base_model.trainable = False

# ================= CUSTOM HEAD =================
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(128, activation="relu")(x)
output = Dense(NUM_CLASSES, activation="softmax")(x)

model = Model(inputs=base_model.input, outputs=output)

# ================= COMPILE =================
model.compile(
    optimizer="adam",
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

# ================= TRAIN =================
model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=EPOCHS
)

# ================= SAVE MODEL =================
model.save(MODEL_PATH)

labels = {v: k for k, v in train_generator.class_indices.items()}
with open(LABELS_PATH, "w") as f:
    json.dump(labels, f)

print("✅ Training complete")
print("✅ Model saved at:", MODEL_PATH)
print("✅ Labels saved at:", LABELS_PATH)