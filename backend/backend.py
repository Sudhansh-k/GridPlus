from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
lr_model = joblib.load(BASE_DIR / "linear_regression_pipeline.pkl")
dt_model = joblib.load(BASE_DIR / "decision_tree_pipeline.pkl")

app = FastAPI(
    title="Autonomous Microgrid Energy Management API",
    description="Educational demo using synthetic microgrid data. Predictions are not for controlling real electrical equipment.",
    version="1.0.0",
)
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class MicrogridInput(BaseModel):
    Renewable_Type: Literal["Solar", "Wind", "Hydro"]
    Installed_Capacity_kW: float = Field(gt=0, le=10000)
    Solar_Irradiance_W_m2: float = Field(ge=0, le=1400)
    Temperature_C: float = Field(ge=-30, le=70)
    Wind_Speed_m_s: float = Field(ge=0, le=60)
    Energy_Consumption_kW: float = Field(ge=0, le=10000)
    Battery_Capacity_kWh: float = Field(ge=0, le=100000)
    Battery_SOC_Percent: float = Field(ge=0, le=100)
    Grid_Available: int = Field(ge=0, le=1)
    Electricity_Tariff_USD_per_kWh: float = Field(ge=0, le=10)

def recommend_action(predicted_production_kw: float, data: MicrogridInput):
    balance = predicted_production_kw - data.Energy_Consumption_kW

    if balance > 5 and data.Battery_SOC_Percent < 95:
        action = "CHARGE_BATTERY"
        reason = "Predicted generation exceeds demand and battery has room."
    elif balance < -5 and data.Battery_SOC_Percent > 20:
        action = "DISCHARGE_BATTERY"
        reason = "Predicted generation is below demand and battery has stored energy."
    elif balance < -5 and data.Grid_Available == 1:
        action = "IMPORT_FROM_GRID"
        reason = "Generation is below demand; grid is available."
    elif balance < -5 and data.Grid_Available == 0:
        action = "ENERGY_SHORTAGE_ALERT"
        reason = "Generation is below demand and the grid is unavailable; prioritize critical loads."
    else:
        action = "BALANCED"
        reason = "Predicted generation is close to demand."

    return {
        "predicted_surplus_kw": round(float(balance), 2),
        "recommended_action": action,
        "reason": reason,
    }

@app.get("/")
def root():
    return {"message": "Microgrid Energy Management API", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
def predict(data: MicrogridInput):
    row = pd.DataFrame([data.model_dump()])
    try:
        lr_prediction = max(0.0, float(lr_model.predict(row)[0]))
        dt_prediction = max(0.0, float(dt_model.predict(row)[0]))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}")

    # Decision Tree is used as the default estimate for the demo; both outputs are returned for comparison.
    dispatch = recommend_action(dt_prediction, data)
    return {
        "linear_regression_prediction_kw": round(lr_prediction, 2),
        "decision_tree_prediction_kw": round(dt_prediction, 2),
        "target": "Energy_Production_kW",
        "units": "kW",
        "energy_management": dispatch,
        "note": "Synthetic educational demo only; do not connect to real equipment."
    }
