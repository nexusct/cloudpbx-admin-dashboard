import type {
  AttributionResult,
  CalibrationResult,
  DriftCheckResult,
  ForecastResult,
} from "@shared/trading-types";

interface RequestOptions {
  timeoutMs?: number;
}

interface ForecastPayload {
  marketId: number;
  question: string;
  features: Record<string, number>;
  marketProb: number;
}

interface CalibratePayload {
  probability: number;
  marketId: number;
}

interface DriftPayload {
  marketId: number;
  features: Record<string, number>;
}

interface AttributionPayload {
  marketId: number;
  features: Record<string, number>;
  probability: number;
}

export class ModelServiceClient {
  private readonly baseUrl = process.env.TRADING_MODEL_WORKER_URL || "http://127.0.0.1:8001";

  async health(): Promise<boolean> {
    try {
      const response = await this.request<{ status: string }>("/internal/models/health", undefined, {
        timeoutMs: 1200,
      });
      return response.status === "ok";
    } catch {
      return false;
    }
  }

  async forecast(payload: ForecastPayload): Promise<ForecastResult> {
    return this.request<ForecastResult>("/internal/models/forecast", payload, {
      timeoutMs: 1800,
    }).catch(() => this.fallbackForecast(payload));
  }

  async calibrate(payload: CalibratePayload): Promise<CalibrationResult> {
    return this.request<CalibrationResult>("/internal/models/calibrate", payload, {
      timeoutMs: 1200,
    }).catch(() => {
      return {
        calibratedProbability: payload.probability,
        calibrationError: Math.abs(0.5 - payload.probability) * 0.08,
        modelVersion: "local-fallback-calibrator-v1",
      };
    });
  }

  async driftCheck(payload: DriftPayload): Promise<DriftCheckResult> {
    return this.request<DriftCheckResult>("/internal/models/drift-check", payload, {
      timeoutMs: 1200,
    }).catch(() => {
      const featureMagnitude = Object.values(payload.features).reduce((sum, value) => sum + Math.abs(value), 0);
      const driftValue = Math.min(1, featureMagnitude / 500);
      return {
        driftDetected: driftValue > 0.65,
        severity: driftValue > 0.8 ? "high" : driftValue > 0.65 ? "medium" : "low",
        metric: "feature_magnitude",
        value: driftValue,
        threshold: 0.65,
      };
    });
  }

  async attribution(payload: AttributionPayload): Promise<AttributionResult> {
    return this.request<AttributionResult>("/internal/models/attribution", payload, {
      timeoutMs: 1600,
    }).catch(() => {
      const ranked = Object.entries(payload.features)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 5)
        .map(([factor, contribution]) => ({ factor, contribution }));
      return {
        factors: ranked,
        confidence: 0.56,
        modelVersion: "local-fallback-attribution-v1",
      };
    });
  }

  private async request<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    const timeoutMs = options?.timeoutMs ?? 1500;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: body ? "POST" : "GET",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Model service error (${response.status})`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }

  private fallbackForecast(payload: ForecastPayload): ForecastResult {
    const sentiment = payload.features.sentiment ?? 0;
    const momentum = payload.features.momentum ?? 0;
    const liquidityPenalty = payload.features.spreadPct ?? 0;
    const edgeShift = sentiment * 0.03 + momentum * 0.02 - liquidityPenalty * 0.01;
    const probability = Math.min(0.95, Math.max(0.05, payload.marketProb + edgeShift));

    return {
      probability,
      uncertainty: Math.max(0.02, 0.18 - Math.abs(sentiment) * 0.05),
      confidence: Math.max(0.45, Math.min(0.9, 0.55 + Math.abs(momentum) * 0.25)),
      modelVersion: "local-fallback-forecast-v1",
      factors: {
        sentiment,
        momentum,
        liquidityPenalty,
      },
    };
  }
}
