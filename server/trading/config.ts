import type { RiskPolicy } from "@shared/trading-types";
import { defaultRiskPolicy } from "@shared/trading-types";

export const TRADING_DEFAULT_CYCLE_MS = Math.max(
  60_000,
  Number(process.env.TRADING_CYCLE_MS || 5 * 60_000),
);

export const TRADING_MARKET_LIMIT = Math.max(
  5,
  Number(process.env.TRADING_MARKET_LIMIT || 40),
);

export const TRADING_DEFAULT_BANKROLL_USD = Math.max(
  10_000,
  Number(process.env.TRADING_DEFAULT_BANKROLL_USD || 100_000),
);

export const TOP_CATEGORIES = (process.env.TRADING_TOP_CATEGORIES || "Politics,Macro,Crypto")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export function mergeRiskPolicy(overrides?: Partial<RiskPolicy> | null): RiskPolicy {
  return {
    ...defaultRiskPolicy,
    ...(overrides || {}),
  };
}
