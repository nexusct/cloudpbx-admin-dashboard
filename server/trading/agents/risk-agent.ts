import type { RiskPolicy } from "@shared/trading-types";
import type { RiskAssessment, SignalResult } from "./types";

interface RiskContext {
  bankrollUsd: number;
  marketExposureUsd: number;
  categoryExposureUsd: number;
  dailyDrawdownPct: number;
  weeklyDrawdownPct: number;
  spreadPct: number;
  depthWithin150BpsUsd: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class RiskAgent {
  run(signal: SignalResult, policy: RiskPolicy, context: RiskContext): RiskAssessment {
    const blockingReasons: string[] = [];
    const ruleHits: string[] = [];

    const targetEdge = Math.max(policy.minimumEdgeBps, 1);
    const edgeFactor = clamp(signal.edgeBps / targetEdge, 0, 3);
    const confidenceFactor = clamp(signal.confidence / Math.max(policy.minimumConfidence, 0.01), 0, 2);
    const kellyBase = (edgeFactor - 1) * 0.02;

    const basePositionPct = clamp(kellyBase * policy.fractionalKelly * confidenceFactor, 0, policy.perMarketMaxExposurePct / 100);
    const initialPositionUsd = Math.round(context.bankrollUsd * basePositionPct);

    let positionSizeUsd = initialPositionUsd;

    if (signal.edgeBps < policy.minimumEdgeBps) {
      blockingReasons.push(`edge_below_threshold:${signal.edgeBps}<${policy.minimumEdgeBps}`);
    } else {
      ruleHits.push("edge_gate_pass");
    }

    if (signal.confidence < policy.minimumConfidence) {
      blockingReasons.push(`confidence_below_threshold:${signal.confidence.toFixed(3)}<${policy.minimumConfidence}`);
    } else {
      ruleHits.push("confidence_gate_pass");
    }

    if (context.spreadPct > policy.maxSpreadPct / 100) {
      blockingReasons.push(`spread_above_threshold:${context.spreadPct.toFixed(4)}>${(policy.maxSpreadPct / 100).toFixed(4)}`);
    } else {
      ruleHits.push("spread_gate_pass");
    }

    const requiredDepth = Math.round(Math.max(1, positionSizeUsd) * policy.liquidityDepthMultiple);
    if (context.depthWithin150BpsUsd < requiredDepth) {
      blockingReasons.push(`insufficient_depth:${context.depthWithin150BpsUsd}<${requiredDepth}`);
      positionSizeUsd = Math.floor(context.depthWithin150BpsUsd / Math.max(policy.liquidityDepthMultiple, 1));
    } else {
      ruleHits.push("liquidity_gate_pass");
    }

    const marketMaxExposureUsd = Math.round(context.bankrollUsd * (policy.perMarketMaxExposurePct / 100));
    if (context.marketExposureUsd + positionSizeUsd > marketMaxExposureUsd) {
      const allowed = Math.max(0, marketMaxExposureUsd - context.marketExposureUsd);
      positionSizeUsd = Math.min(positionSizeUsd, allowed);
      if (positionSizeUsd <= 0) {
        blockingReasons.push("per_market_exposure_limit");
      } else {
        ruleHits.push("per_market_exposure_capped");
      }
    }

    const categoryMaxExposureUsd = Math.round(context.bankrollUsd * (policy.perCategoryMaxExposurePct / 100));
    if (context.categoryExposureUsd + positionSizeUsd > categoryMaxExposureUsd) {
      const allowed = Math.max(0, categoryMaxExposureUsd - context.categoryExposureUsd);
      positionSizeUsd = Math.min(positionSizeUsd, allowed);
      if (positionSizeUsd <= 0) {
        blockingReasons.push("per_category_exposure_limit");
      } else {
        ruleHits.push("per_category_exposure_capped");
      }
    }

    if (context.dailyDrawdownPct >= policy.dailyDrawdownThrottlePct) {
      positionSizeUsd = Math.floor(positionSizeUsd * 0.5);
      ruleHits.push("daily_drawdown_throttle_applied");
    }

    if (context.weeklyDrawdownPct >= policy.weeklyHardKillSwitchPct) {
      blockingReasons.push("weekly_hard_kill_switch_threshold_reached");
      positionSizeUsd = 0;
    }

    if (positionSizeUsd <= 0) {
      blockingReasons.push("position_size_non_positive");
    }

    const approved = blockingReasons.length === 0;
    const riskScoreBps = Math.round(
      (signal.confidence * 3000)
        + (edgeFactor * 1200)
        + (approved ? 400 : -1200)
        - (context.spreadPct * 10_000 * 200)
        - (context.dailyDrawdownPct * 100),
    );

    return {
      approved,
      positionSizeUsd,
      ruleHits,
      blockingReasons,
      riskScoreBps,
      policySnapshot: policy,
    };
  }
}
