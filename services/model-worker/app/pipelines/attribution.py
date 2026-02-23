from __future__ import annotations

from typing import Dict, List


def explain(features: Dict[str, float]) -> List[dict[str, float | str]]:
    ranked = sorted(features.items(), key=lambda item: abs(float(item[1])), reverse=True)
    return [
        {
            "factor": key,
            "contribution": float(value),
        }
        for key, value in ranked[:5]
    ]
