"""
Train and save ML models for Traffic Prediction System.
Run this script once to generate the .pkl model files.
"""

import warnings
warnings.filterwarnings('ignore')

import pickle
import kagglehub
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier

print("=" * 50)
print("Traffic Prediction Model Training")
print("=" * 50)

# Download dataset
print("\n[1/6] Downloading Bangalore Traffic Dataset...")
path = kagglehub.dataset_download("preethamgouda/banglore-city-traffic-dataset")
print(f"Dataset path: {path}")

# Load and preprocess data
print("\n[2/6] Loading and preprocessing data...")
df = pd.read_csv(path + "/Banglore_traffic_Dataset.csv")
df = df.dropna()
df = df.drop_duplicates()
df = df.drop(columns=["Date"])

df["Roadwork and Construction Activity"] = (
    df["Roadwork and Construction Activity"]
    .str.strip()
    .str.lower()
    .map({"yes": 1, "no": 0})
)

print(f"Dataset shape: {df.shape}")

# ============================================
# SPEED MODEL (Regression)
# ============================================
print("\n[3/6] Training Speed Prediction Model (GradientBoostingRegressor)...")

y_speed = df["Average Speed"].copy()
X_speed = df.drop(columns=[
    "Average Speed",
    "Congestion Level",
    "Environmental Impact",
    "Area Name",
    "Road/Intersection Name",
])
X_speed = pd.get_dummies(X_speed, columns=["Weather Conditions"], drop_first=True)

X_train_s, X_test_s, y_train_s, y_test_s = train_test_split(
    X_speed, y_speed, test_size=0.20, random_state=42
)

speed_model = GradientBoostingRegressor(
    n_estimators=500,
    learning_rate=0.03,
    max_depth=3,
    random_state=42
)
speed_model.fit(X_train_s, y_train_s)

speed_r2 = speed_model.score(X_test_s, y_test_s)
print(f"Speed Model R² Score: {speed_r2:.4f}")
print(f"Features: {list(X_speed.columns)}")

# ============================================
# CONGESTION MODEL (Classification)
# ============================================
print("\n[4/6] Training Congestion Prediction Model (RandomForestClassifier)...")

def categorize_congestion(value):
    if value < 40:
        return 0  # Low
    elif value < 70:
        return 1  # Medium
    else:
        return 2  # High

df['Congestion_Category'] = df['Congestion Level'].apply(categorize_congestion)

y_cong = df["Congestion_Category"].copy()
X_cong = df.drop(columns=[
    "Congestion Level",
    "Congestion_Category",
    "Environmental Impact",
    "Area Name",
    "Road/Intersection Name",
])
X_cong = pd.get_dummies(X_cong, columns=["Weather Conditions"], drop_first=True)

X_train_c, X_test_c, y_train_c, y_test_c = train_test_split(
    X_cong, y_cong, test_size=0.20, random_state=42, stratify=y_cong
)

congestion_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=15,
    min_samples_split=10,
    min_samples_leaf=5,
    random_state=42,
    n_jobs=-1
)
congestion_model.fit(X_train_c, y_train_c)

from sklearn.metrics import accuracy_score, f1_score
cong_pred = congestion_model.predict(X_test_c)
cong_acc = accuracy_score(y_test_c, cong_pred)
cong_f1 = f1_score(y_test_c, cong_pred, average='weighted')
print(f"Congestion Model Accuracy: {cong_acc:.4f}")
print(f"Congestion Model F1-Score: {cong_f1:.4f}")
print(f"Features: {list(X_cong.columns)}")

# ============================================
# SAVE MODELS
# ============================================
print("\n[5/6] Saving models...")

with open("speed_model.pkl", "wb") as f:
    pickle.dump(speed_model, f)
print("✓ Saved: speed_model.pkl")

with open("congestion_model.pkl", "wb") as f:
    pickle.dump(congestion_model, f)
print("✓ Saved: congestion_model.pkl")

# ============================================
# VERIFY MODELS
# ============================================
print("\n[6/6] Verifying saved models...")

with open("speed_model.pkl", "rb") as f:
    loaded_speed = pickle.load(f)

with open("congestion_model.pkl", "rb") as f:
    loaded_cong = pickle.load(f)

# Test prediction
test_input_speed = X_test_s.iloc[0:1]
test_input_cong = X_test_c.iloc[0:1]

speed_pred = loaded_speed.predict(test_input_speed)[0]
cong_pred = loaded_cong.predict(test_input_cong)[0]

category_map = {0: 'Low', 1: 'Medium', 2: 'High'}

print(f"\nTest Speed Prediction: {speed_pred:.2f} km/h")
print(f"Test Congestion Prediction: {category_map[cong_pred]}")

print("\n" + "=" * 50)
print("✓ Models trained and saved successfully!")
print("=" * 50)
print("\nExpected input features for Speed Model:")
for col in X_speed.columns:
    print(f"  - {col}")

print("\nExpected input features for Congestion Model:")
for col in X_cong.columns:
    print(f"  - {col}")
