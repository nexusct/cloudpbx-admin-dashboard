from __future__ import annotations

from fastapi import FastAPI
from pydantic import BaseModel, Field

from pipelines import calibrate_probability, detect_drift, explain, run_forecast

app = FastAPI(title="Trading Model Worker", version="1.0.0")


class ForecastRequest(BaseModel):
    marketId: int
    question: str
    features: dict[str, float] = Field(default_factory=dict)
    marketProb: float = Field(ge=0, le=1)


class CalibrateRequest(BaseModel):
    marketId: int
    probability: float = Field(ge=0, le=1)


class DriftRequest(BaseModel):
    marketId: int
    features: dict[str, float] = Field(default_factory=dict)


class AttributionRequest(BaseModel):
    marketId: int
    features: dict[str, float] = Field(default_factory=dict)
    probability: float = Field(ge=0, le=1)


@app.get("/internal/models/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/internal/models/forecast")
def forecast(request: ForecastRequest) -> dict[str, object]:
    output = run_forecast(request.features, request.marketProb)
    return {
        "probability": output.probability,
        "uncertainty": output.uncertainty,
        "confidence": output.confidence,
        "modelVersion": "py-forecast-v1",
        "factors": output.factors,
    }


@app.post("/internal/models/calibrate")
def calibrate(request: CalibrateRequest) -> dict[str, object]:
    calibrated, calibration_error = calibrate_probability(request.probability)
    return {
        "calibratedProbability": calibrated,
        "calibrationError": calibration_error,
        "modelVersion": "py-calibrator-v1",
    }


@app.post("/internal/models/drift-check")
def drift_check(request: DriftRequest) -> dict[str, object]:
    drift_detected, severity, metric, value, threshold = detect_drift(request.features)
    return {
        "driftDetected": drift_detected,
        "severity": severity,
        "metric": metric,
        "value": value,
        "threshold": threshold,
    }


@app.post("/internal/models/attribution")
def attribution(request: AttributionRequest) -> dict[str, object]:
    factors = explain(request.features)
    return {
        "factors": factors,
        "confidence": 0.65,
        "modelVersion": "py-attribution-v1",
    }
