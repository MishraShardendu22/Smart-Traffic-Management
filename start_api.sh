#!/bin/bash
# Start Traffic Prediction ML Service
cd "$(dirname "$0")/ml-service-python"
../.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
