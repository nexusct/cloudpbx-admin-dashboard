import type { TradingMarket } from "@shared/trading-schema";
import { ModelServiceClient } from "../model-client";
import type { ResearchResult, SignalResult } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class SignalAgent {
  constructor(private readonly modelClient: ModelServiceClient) {}

  async run(market: TradingMarket, research: ResearchResult): Promise<SignalResult> {
    const marketProb = ((market.yesPriceBps || 5000) / 10_000);

    const forecast = await this.modelClient.forecast({
      marketId: market.id,
      question: market.question,
      features: research.features,
      marketProb,
    });

    const calibrated = await this.modelClient.calibrate({
      marketId: market.id,
      probability: forecast.probability,
    });

    const fairProb = clamp(calibrated.calibratedProbability, 0.01, 0.99);
    const rawEdgeBps = Math.round((fairProb - marketProb) * 10_000);
    const side = rawEdgeBps >= 0 ? "YES" : "NO";
    const edgeBps = Math.abs(rawEdgeBps);

    const confidence = clamp(
      forecast.confidence * (1 - forecast.uncertainty * 0.5) * (research.sourceReliability / 100),
      0,
      1,
    );

    const devilAdvocatePenalty =
      research.features.volatilityProxy > 0.65 ? 0.08 : 0;
    const backtestStabilityPenalty =
      research.features.spreadPct > 0.02 ? 0.06 : 0;

    const adjustedConfidence = clamp(confidence - devilAdvocatePenalty - backtestStabilityPenalty, 0, 1);

    const shouldTrade = edgeBps >= 40 && adjustedConfidence >= 0.45;
    const status = shouldTrade ? "validated" : "skipped";

    const validatorNotes = [
      `Calibration error: ${calibrated.calibrationError.toFixed(4)}`,
      `Volatility proxy: ${(research.features.volatilityProxy || 0).toFixed(3)}`,
      `Devil advocate penalty: ${devilAdvocatePenalty.toFixed(3)}`,
      `Backtester stability penalty: ${backtestStabilityPenalty.toFixed(3)}`,
    ].join(" | ");

    return {
      shouldTrade,
      status,
      side,
      edgeBps,
      confidence: adjustedConfidence,
      fairProb,
      marketProb,
      rationale: [
        `Forecast probability ${(forecast.probability * 100).toFixed(2)}% calibrated to ${(fairProb * 100).toFixed(2)}%.`,
        `Observed market probability ${(marketProb * 100).toFixed(2)}% creates ${edgeBps} bps edge on ${side}.`,
      ].join(" "),
      validatorNotes,
    };
  }
}
