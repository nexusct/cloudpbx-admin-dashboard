from __future__ import annotations


def calibrate_probability(probability: float) -> tuple[float, float]:
    # Mild shrinkage toward 0.5 for calibration stability in low-sample regimes.
    calibrated = 0.5 + (probability - 0.5) * 0.92
    calibration_error = abs(calibrated - probability) * 0.5
    return calibrated, calibration_error
