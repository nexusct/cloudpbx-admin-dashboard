import type { TradingMarket } from "@shared/trading-schema";
import type { RiskPolicy, TradeSide } from "@shared/trading-types";

export interface MarketContext {
  market: TradingMarket;
  features: Record<string, number>;
  cycleId: string;
}

export interface ResearchResult {
  features: Record<string, number>;
  sourceReliability: number;
  narrativeSummary: string;
  entityGraphRefs: string[];
  raw: Record<string, unknown>;
}

export interface SignalResult {
  shouldTrade: boolean;
  status: "validated" | "skipped";
  side: TradeSide;
  edgeBps: number;
  confidence: number;
  fairProb: number;
  marketProb: number;
  rationale: string;
  validatorNotes: string;
}

export interface RiskAssessment {
  approved: boolean;
  positionSizeUsd: number;
  ruleHits: string[];
  blockingReasons: string[];
  riskScoreBps: number;
  policySnapshot: RiskPolicy;
}

export interface ExecutionPlan {
  placeOrder: boolean;
  side: TradeSide;
  orderType: "limit" | "market";
  targetPriceBps: number;
  sizeUsd: number;
  maxSlippageBps: number;
  timeInForce: "gtc" | "ioc";
  reason: string;
}

export interface LearningInsights {
  summary: string;
  attribution: Record<string, number>;
  driftDetected: boolean;
  driftSeverity: "low" | "medium" | "high";
  driftMetric: string;
  driftValue: number;
  driftThreshold: number;
}
