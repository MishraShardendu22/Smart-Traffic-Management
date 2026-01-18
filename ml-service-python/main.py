"""
FastAPI ML Inference Service
Serves predictions for Average Speed and Congestion Level
"""

import pickle
from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Traffic Prediction ML Service")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model paths
MODEL_DIR = Path(__file__).parent
SPEED_MODEL_PATH = MODEL_DIR / "speed_model.pkl"
CONGESTION_MODEL_PATH = MODEL_DIR / "congestion_model.pkl"

# Global model references
speed_model = None
congestion_model = None


@app.on_event("startup")
def load_models():
    """Load pre-trained models at startup."""
    global speed_model, congestion_model

    if not SPEED_MODEL_PATH.exists():
        raise RuntimeError(f"Speed model not found: {SPEED_MODEL_PATH}")
    if not CONGESTION_MODEL_PATH.exists():
        raise RuntimeError(f"Congestion model not found: {CONGESTION_MODEL_PATH}")

    with open(SPEED_MODEL_PATH, "rb") as f:
        speed_model = pickle.load(f)

    with open(CONGESTION_MODEL_PATH, "rb") as f:
        congestion_model = pickle.load(f)

    print("Models loaded successfully.")


class PredictionInput(BaseModel):
    """Generic input model - accepts any features as key-value pairs."""
    class Config:
        extra = "allow"


class SpeedResponse(BaseModel):
    predicted_speed: float


class CongestionResponse(BaseModel):
    predicted_congestion: str | int | float


@app.post("/predict_speed", response_model=SpeedResponse)
def predict_speed(data: PredictionInput):
    """Predict average speed using the regression model."""
    if speed_model is None:
        raise HTTPException(status_code=503, detail="Speed model not loaded")

    try:
        # Convert input to DataFrame (single row)
        df = pd.DataFrame([data.model_dump()])
        # Reorder columns to match training order
        df = df[speed_model.feature_names_in_]
        prediction = speed_model.predict(df)
        return SpeedResponse(predicted_speed=float(prediction[0]))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/predict_congestion", response_model=CongestionResponse)
def predict_congestion(data: PredictionInput):
    """Predict congestion level using the classification model."""
    if congestion_model is None:
        raise HTTPException(status_code=503, detail="Congestion model not loaded")

    try:
        # Convert input to DataFrame (single row)
        df = pd.DataFrame([data.model_dump()])
        # Reorder columns to match training order
        df = df[congestion_model.feature_names_in_]
        prediction = congestion_model.predict(df)
        result = prediction[0]
        # Handle numpy types
        if hasattr(result, "item"):
            result = result.item()
        return CongestionResponse(predicted_congestion=result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok"}
