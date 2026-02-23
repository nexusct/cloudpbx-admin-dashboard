import type { TradingMarket } from "@shared/trading-schema";
import type { ExecutionPlan, RiskAssessment, SignalResult } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class ExecutionAgent {
  run(market: TradingMarket, signal: SignalResult, risk: RiskAssessment): ExecutionPlan {
    if (!risk.approved) {
      return {
        placeOrder: false,
        side: signal.side,
        orderType: "limit",
        targetPriceBps: signal.side === "YES" ? market.yesPriceBps || 5000 : market.noPriceBps || 5000,
        sizeUsd: 0,
        maxSlippageBps: 150,
        timeInForce: "gtc",
        reason: "Risk agent rejected signal",
      };
    }

    const marketPriceBps = signal.side === "YES" ? market.yesPriceBps || 5000 : market.noPriceBps || 5000;
    const aggressionBps = Math.round(Math.min(80, signal.edgeBps * 0.2));
    const targetPriceBps = clamp(marketPriceBps + (signal.side === "YES" ? aggressionBps : aggressionBps), 50, 9950);

    return {
      placeOrder: true,
      side: signal.side,
      orderType: "limit",
      targetPriceBps,
      sizeUsd: risk.positionSizeUsd,
      maxSlippageBps: risk.policySnapshot.maxDepthWindowBps,
      timeInForce: "gtc",
      reason: "Signal validated and approved by risk guardrails",
    };
  }
}
