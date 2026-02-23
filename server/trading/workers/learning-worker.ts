import { LearningAgent } from "../agents/learning-agent";
import type { SignalCandidate } from "./decision-worker";
import { TradingRepository } from "../repository";

export class LearningWorker {
  constructor(
    private readonly repository: TradingRepository,
    private readonly learningAgent: LearningAgent,
  ) {}

  async run(cycleId: string, candidates: SignalCandidate[]): Promise<void> {
    const runId = await this.repository.createAgentRun({
      layer: "L5",
      agentName: "Monitoring + Learning",
      cycleId,
      inputRef: JSON.stringify({ candidates: candidates.length }),
    });

    try {
      for (const candidate of candidates.slice(0, 5)) {
        const insights = await this.learningAgent.run({
          marketId: candidate.market.id,
          features: candidate.features,
          probability: candidate.signal.fairProb,
          pnlUsd: 0,
        });

        await this.repository.createAttributionReport({
          marketId: candidate.market.id,
          window: "latest_cycle",
          summary: insights.summary,
          report: {
            cycleId,
            attribution: insights.attribution,
            confidence: candidate.signal.confidence,
            edgeBps: candidate.signal.edgeBps,
          },
        });

        if (insights.driftDetected) {
          await this.repository.createDriftEvent({
            marketId: candidate.market.id,
            severity: insights.driftSeverity,
            metric: insights.driftMetric,
            value: insights.driftValue.toFixed(4),
            threshold: insights.driftThreshold.toFixed(4),
            action: insights.driftSeverity === "high" ? "fallback_model" : "monitor",
            metadata: {
              cycleId,
              summary: insights.summary,
            },
          });

          if (insights.driftSeverity === "high") {
            await this.repository.createGovernanceAction({
              actor: "learning_worker",
              actionType: "drift_guard_fallback",
              reason: `High drift detected for market ${candidate.market.externalId}`,
              details: {
                cycleId,
                metric: insights.driftMetric,
                value: insights.driftValue,
                threshold: insights.driftThreshold,
              },
            });
          }
        }
      }

      await this.repository.completeAgentRun(runId, {
        status: "completed",
        metrics: {
          learnedFrom: Math.min(candidates.length, 5),
        },
      });
    } catch (error) {
      await this.repository.completeAgentRun(runId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Learning worker failed",
      });
      throw error;
    }
  }
}
