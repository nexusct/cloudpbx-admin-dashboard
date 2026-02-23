from __future__ import annotations

from typing import Dict, Tuple


def detect_drift(features: Dict[str, float]) -> Tuple[bool, str, str, float, float]:
    magnitude = sum(abs(float(v)) for v in features.values())
    normalized = min(1.0, magnitude / max(1, len(features) * 3))
    threshold = 0.68

    if normalized >= 0.82:
        severity = "high"
    elif normalized >= threshold:
        severity = "medium"
    else:
        severity = "low"

    return normalized >= threshold, severity, "feature_magnitude", normalized, threshold
