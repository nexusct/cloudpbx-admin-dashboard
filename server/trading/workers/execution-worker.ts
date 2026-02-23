import { ExecutionAgent } from "../agents/execution-agent";
import { RiskAgent } from "../agents/risk-agent";
import type { SignalCandidate } from "./decision-worker";
import { TradingRepository } from "../repository";
import { PolymarketProvider } from "../providers/polymarket";

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class ExecutionWorker {
  private readonly riskAgent = new RiskAgent();
  private readonly executionAgent = new ExecutionAgent();

  constructor(
    private readonly repository: TradingRepository,
    private readonly provider: PolymarketProvider,
  ) {}

  async run(cycleId: string, candidates: SignalCandidate[]): Promise<void> {
    const runId = await this.repository.createAgentRun({
      layer: "L3-L4",
      agentName: "Risk + Execution",
      cycleId,
      inputRef: JSON.stringify({ candidateCount: candidates.length }),
    });

    try {
      const state = await this.repository.ensurePortfolioState();
      const policy = await this.repository.getRiskPolicy();
      const positions = await this.repository.listPositions();
      const marketCatalog = await this.repository.getMarkets(300);
      const marketCategory = new Map(marketCatalog.map((market) => [market.id, market.category || "unknown"]));

      for (const candidate of candidates) {
        const marketExposureUsd = positions
          .filter((position) => position.marketId === candidate.market.id)
          .reduce((total, position) => total + position.sizeUsd, 0);

        const category = marketCategory.get(candidate.market.id) || "unknown";
        const categoryExposureUsd = positions
          .filter((position) => marketCategory.get(position.marketId) === category)
          .reduce((total, position) => total + position.sizeUsd, 0);

        const risk = this.riskAgent.run(candidate.signal, policy, {
          bankrollUsd: state.bankrollUsd,
          marketExposureUsd,
          categoryExposureUsd,
          dailyDrawdownPct: state.dailyDrawdownBps / 100,
          weeklyDrawdownPct: state.weeklyDrawdownBps / 100,
          spreadPct: candidate.orderBookSpreadPct,
          depthWithin150BpsUsd: candidate.depthWithin150BpsUsd,
        });

        const riskDecision = await this.repository.createRiskDecision({
          signalId: candidate.signalRow.id,
          approved: risk.approved,
          positionSizeUsd: risk.positionSizeUsd,
          ruleHits: risk.ruleHits,
          blockingReasons: risk.blockingReasons,
          policySnapshot: risk.policySnapshot,
          riskScoreBps: risk.riskScoreBps,
        });

        if (!risk.approved) {
          await this.repository.updateSignalStatus(candidate.signalRow.id, "rejected", risk.blockingReasons.join(" | "));
          continue;
        }

        const plan = this.executionAgent.run(candidate.market, candidate.signal, risk);
        if (!plan.placeOrder) {
          await this.repository.updateSignalStatus(candidate.signalRow.id, "skipped", plan.reason);
          continue;
        }

        const order = await this.repository.createOrder({
          marketId: candidate.market.id,
          signalId: candidate.signalRow.id,
          riskDecisionId: riskDecision.id,
          side: plan.side,
          orderType: plan.orderType,
          status: "pending",
          priceBps: plan.targetPriceBps,
          sizeUsd: plan.sizeUsd,
          timeInForce: plan.timeInForce,
          maxSlippageBps: plan.maxSlippageBps,
          metadata: {
            cycleId,
            reason: plan.reason,
          },
        });

        try {
          const placed = await this.provider.placeOrder({
            marketExternalId: candidate.market.externalId,
            side: plan.side,
            orderType: plan.orderType,
            priceBps: plan.targetPriceBps,
            sizeUsd: plan.sizeUsd,
            timeInForce: plan.timeInForce,
            maxSlippageBps: plan.maxSlippageBps,
            clientOrderId: uid("signal"),
          });

          await this.repository.updateOrderStatus(order.id, placed.status, {
            providerOrderId: placed.providerOrderId,
            metadata: {
              ...placed.metadata,
              placedAt: new Date().toISOString(),
            },
          });

          if (placed.status === "filled") {
            await this.repository.createFill({
              orderId: order.id,
              priceBps: placed.fillPriceBps || plan.targetPriceBps,
              sizeUsd: placed.filledSizeUsd,
              feeUsd: Math.round(placed.filledSizeUsd * 0.01),
              liquidityFlag: "taker",
              providerFillId: uid("fill"),
              metadata: placed.metadata,
            });

            await this.repository.upsertPosition({
              marketId: candidate.market.id,
              side: plan.side,
              sizeUsd: placed.filledSizeUsd,
              entryBps: placed.fillPriceBps || plan.targetPriceBps,
              markBps: candidate.market.yesPriceBps || plan.targetPriceBps,
            });

            await this.repository.updateSignalStatus(candidate.signalRow.id, "executed", "Order filled");
          } else {
            await this.repository.updateSignalStatus(candidate.signalRow.id, "approved", `Order ${placed.status}`);
          }
        } catch (error) {
          await this.repository.updateOrderStatus(order.id, "rejected", {
            cancelReason: "execution_error",
            metadata: {
              message: error instanceof Error ? error.message : "Execution failed",
            },
          });

          await this.repository.updateSignalStatus(
            candidate.signalRow.id,
            "rejected",
            error instanceof Error ? error.message : "Execution failed",
          );
        }
      }

      await this.repository.completeAgentRun(runId, {
        status: "completed",
        metrics: {
          candidateCount: candidates.length,
        },
      });
    } catch (error) {
      await this.repository.completeAgentRun(runId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Execution worker failed",
      });
      throw error;
    }
  }
}
