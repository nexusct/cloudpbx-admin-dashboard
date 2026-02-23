import { ModelServiceClient } from "../model-client";
import type { LearningInsights } from "./types";

interface LearningInput {
  marketId: number;
  features: Record<string, number>;
  probability: number;
  pnlUsd: number;
}

export class LearningAgent {
  constructor(private readonly modelClient: ModelServiceClient) {}

  async run(input: LearningInput): Promise<LearningInsights> {
    const [drift, attribution] = await Promise.all([
      this.modelClient.driftCheck({
        marketId: input.marketId,
        features: input.features,
      }),
      this.modelClient.attribution({
        marketId: input.marketId,
        features: input.features,
        probability: input.probability,
      }),
    ]);

    const attributionMap = attribution.factors.reduce<Record<string, number>>((acc, factor) => {
      acc[factor.factor] = factor.contribution;
      return acc;
    }, {});

    const summary = [
      `Top attribution factors: ${attribution.factors.map((item) => `${item.factor}=${item.contribution.toFixed(3)}`).join(", ") || "none"}.`,
      `Current cycle PnL estimate: ${input.pnlUsd >= 0 ? "+" : ""}${input.pnlUsd.toFixed(2)} USD.`,
      drift.driftDetected
        ? `Drift detected (${drift.severity}) on ${drift.metric}: ${drift.value.toFixed(3)} > ${drift.threshold.toFixed(3)}.`
        : `No significant drift detected on ${drift.metric}.`,
    ].join(" ");

    return {
      summary,
      attribution: attributionMap,
      driftDetected: drift.driftDetected,
      driftSeverity: drift.severity,
      driftMetric: drift.metric,
      driftValue: drift.value,
      driftThreshold: drift.threshold,
    };
  }
}
