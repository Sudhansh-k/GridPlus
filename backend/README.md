# Autonomous Microgrid Energy Management — Intermediate Prototype

This is a small educational prototype built with a **synthetic dataset**. It predicts renewable energy production and returns a simple energy-management recommendation.

## Files
- `microgrid_dataset.csv`: 1200 rows and 11 columns.
- `linear_regression_pipeline.pkl`: fitted preprocessing + Linear Regression pipeline.
- `decision_tree_pipeline.pkl`: fitted preprocessing + Decision Tree Regression pipeline.
- `backend.py`: FastAPI backend that loads both pipelines.
- `requirements.txt`: Python dependencies.
- `evaluation_metrics.json`: held-out test metrics.

## Dataset
Target: `Energy_Production_kW` (regression).
The dataset is generated for demonstration and does not represent measured real-world microgrid operation.

## Evaluation (80/20 random train/test split)
{
  "Linear Regression": {
    "train_r2": 0.6025,
    "test_r2": 0.5649,
    "test_mae": 60.0135,
    "test_rmse": 77.7748
  },
  "Decision Tree": {
    "train_r2": 0.9629,
    "test_r2": 0.8642,
    "test_mae": 28.1392,
    "test_rmse": 43.4489
  }
}

## Run locally
Use Python 3.10+ recommended.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend:app --reload
```

Open `http://127.0.0.1:8000/docs` to test the API.

## API
`POST /predict` accepts the 10 feature columns (all columns except `Energy_Production_kW`) and returns both model predictions plus a simple battery/grid recommendation.

## Example JSON
```json
{
  "Renewable_Type": "Solar",
  "Installed_Capacity_kW": 250,
  "Solar_Irradiance_W_m2": 750,
  "Temperature_C": 29,
  "Wind_Speed_m_s": 5,
  "Energy_Consumption_kW": 140,
  "Battery_Capacity_kWh": 400,
  "Battery_SOC_Percent": 55,
  "Grid_Available": 1,
  "Electricity_Tariff_USD_per_kWh": 0.16
}
```

Safety: this API is a software demonstration only. It is not a certified microgrid controller and must not control real electrical equipment.
