import { ResearchAgent } from "../agents/research-agent";
import { SignalAgent } from "../agents/signal-agent";
import type { SignalResult } from "../agents/types";
import type { TradeSignalRow, TradingMarket } from "@shared/trading-schema";
import type { IngestedMarketContext } from "./ingestion-worker";
import { TradingRepository } from "../repository";

export interface SignalCandidate {
  market: TradingMarket;
  signal: SignalResult;
  signalRow: TradeSignalRow;
  features: Record<string, number>;
  orderBookSpreadPct: number;
  depthWithin150BpsUsd: number;
}

export class DecisionWorker {
  private readonly researchAgent = new ResearchAgent();

  constructor(
    private readonly repository: TradingRepository,
    private readonly signalAgent: SignalAgent,
  ) {}

  async run(cycleId: string, contexts: IngestedMarketContext[]): Promise<SignalCandidate[]> {
    const runId = await this.repository.createAgentRun({
      layer: "L1-L2",
      agentName: "Research + Signal",
      cycleId,
      inputRef: JSON.stringify({ contextCount: contexts.length }),
    });

    try {
      const candidates: SignalCandidate[] = [];

      for (const context of contexts.slice(0, 10)) {
        const research = await this.researchAgent.run({
          market: context.market,
          features: context.features,
          cycleId,
        });

        const packet = await this.repository.createResearchPacket({
          marketId: context.market.id,
          features: research.features,
          entityGraphRefs: research.entityGraphRefs,
          sourceReliability: research.sourceReliability,
          narrativeSummary: research.narrativeSummary,
          raw: research.raw,
        });

        const signal = await this.signalAgent.run(context.market, research);
        const signalRow = await this.repository.createSignal({
          marketId: context.market.id,
          researchPacketId: packet.id,
          side: signal.side,
          edgeBps: signal.edgeBps,
          confidenceBps: Math.round(signal.confidence * 10_000),
          fairProbBps: Math.round(signal.fairProb * 10_000),
          marketProbBps: Math.round(signal.marketProb * 10_000),
          rationale: signal.rationale,
          status: signal.status,
          validatorNotes: signal.validatorNotes,
          cycleId,
        });

        if (!signal.shouldTrade) {
          continue;
        }

        candidates.push({
          market: context.market,
          signal,
          signalRow,
          features: research.features,
          orderBookSpreadPct: (context.orderBook.spreadBps || 0) / 10_000,
          depthWithin150BpsUsd: context.orderBook.depthWithin150BpsUsd,
        });
      }

      await this.repository.completeAgentRun(runId, {
        status: "completed",
        outputRef: JSON.stringify({ candidates: candidates.length }),
        metrics: {
          candidates: candidates.length,
        },
      });

      return candidates;
    } catch (error) {
      await this.repository.completeAgentRun(runId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Decision worker failed",
      });
      throw error;
    }
  }
}
