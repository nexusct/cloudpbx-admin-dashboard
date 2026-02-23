from __future__ import annotations

from dataclasses import dataclass
from typing import Dict


@dataclass
class ForecastOutput:
    probability: float
    uncertainty: float
    confidence: float
    factors: Dict[str, float]


def run_forecast(features: Dict[str, float], market_prob: float) -> ForecastOutput:
    sentiment = float(features.get("sentiment", 0.0))
    momentum = float(features.get("momentum", 0.0))
    spread_pct = float(features.get("spreadPct", 0.0))
    liquidity_score = float(features.get("liquidityScore", 0.5))

    edge_shift = sentiment * 0.035 + momentum * 0.02 - spread_pct * 0.015 + liquidity_score * 0.01
    probability = min(0.98, max(0.02, market_prob + edge_shift))

    uncertainty = min(0.4, max(0.02, 0.22 - abs(sentiment) * 0.06 - liquidity_score * 0.05 + spread_pct * 0.2))
    confidence = min(0.95, max(0.35, 0.55 + abs(momentum) * 0.2 + liquidity_score * 0.15 - spread_pct * 0.1))

    return ForecastOutput(
        probability=probability,
        uncertainty=uncertainty,
        confidence=confidence,
        factors={
            "sentiment": sentiment,
            "momentum": momentum,
            "spreadPct": spread_pct,
            "liquidityScore": liquidity_score,
        },
    )
