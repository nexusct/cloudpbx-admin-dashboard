export const tradeSides = ["YES", "NO"] as const;
export type TradeSide = (typeof tradeSides)[number];

export const signalStatuses = ["generated", "validated", "skipped", "approved", "rejected", "executed"] as const;
export type SignalStatus = (typeof signalStatuses)[number];

export const orderTypes = ["limit", "market"] as const;
export type OrderType = (typeof orderTypes)[number];

export const orderStatuses = ["pending", "open", "partially_filled", "filled", "cancelled", "rejected"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export interface ResearchPacket {
  marketId: number;
  timestamp: string;
  features: Record<string, number>;
  entityGraphRefs: string[];
  sourceReliability: number;
  narrativeSummary: string;
}

export interface TradeSignal {
  marketId: number;
  side: TradeSide;
  edgeBps: number;
  confidence: number;
  fairProb: number;
  marketProb: number;
  rationale: string;
  status: SignalStatus;
}

export interface RiskDecision {
  signalId: number;
  approved: boolean;
  positionSizeUsd: number;
  ruleHits: string[];
  blockingReasons: string[];
}

export interface ExecutionIntent {
  signalId: number;
  orderType: OrderType;
  priceBands: {
    minBps: number;
    maxBps: number;
  };
  timeInForce: "gtc" | "ioc";
  maxSlippageBps: number;
}

export interface LearningRecord {
  marketId: number;
  resolvedOutcome: string;
  brier: number;
  pnl: number;
  attribution: Record<string, number>;
  driftMetrics: Record<string, number>;
}

export interface RiskPolicy {
  perMarketMaxExposurePct: number;
  perCategoryMaxExposurePct: number;
  dailyDrawdownThrottlePct: number;
  weeklyHardKillSwitchPct: number;
  fractionalKelly: number;
  minimumEdgeBps: number;
  minimumConfidence: number;
  liquidityDepthMultiple: number;
  maxDepthWindowBps: number;
  maxSpreadPct: number;
  requoteIntervalSeconds: number;
}

export interface TradingControlState {
  tradingActive: boolean;
  killSwitchActive: boolean;
  lastCycleAt: string | null;
  nextCycleAt: string | null;
  cycleIntervalMs: number;
  recentErrors: string[];
}

export interface MarketLiquiditySnapshot {
  spreadBps: number;
  depthWithin150BpsUsd: number;
  volatilityBps1h: number;
}

export interface TradingMarketView {
  id: number;
  externalId: string;
  slug: string | null;
  question: string;
  category: string | null;
  active: boolean;
  yesPriceBps: number | null;
  noPriceBps: number | null;
  spreadBps: number | null;
  volume24hUsd: number;
  liquidityUsd: number;
  lastTradeAt: string | null;
  liquiditySnapshot: MarketLiquiditySnapshot;
}

export interface ForecastResult {
  probability: number;
  uncertainty: number;
  confidence: number;
  modelVersion: string;
  factors: Record<string, number>;
}

export interface CalibrationResult {
  calibratedProbability: number;
  calibrationError: number;
  modelVersion: string;
}

export interface DriftCheckResult {
  driftDetected: boolean;
  severity: "low" | "medium" | "high";
  metric: string;
  value: number;
  threshold: number;
}

export interface AttributionResult {
  factors: Array<{
    factor: string;
    contribution: number;
  }>;
  confidence: number;
  modelVersion: string;
}

export const defaultRiskPolicy: RiskPolicy = {
  perMarketMaxExposurePct: 4,
  perCategoryMaxExposurePct: 15,
  dailyDrawdownThrottlePct: 6,
  weeklyHardKillSwitchPct: 12,
  fractionalKelly: 0.75,
  minimumEdgeBps: 180,
  minimumConfidence: 0.6,
  liquidityDepthMultiple: 2,
  maxDepthWindowBps: 150,
  maxSpreadPct: 2,
  requoteIntervalSeconds: 90,
};
