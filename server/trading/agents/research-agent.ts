import type { MarketContext, ResearchResult } from "./types";

function computeSentiment(question: string): number {
  const lower = question.toLowerCase();
  const positive = ["win", "approve", "pass", "increase", "yes", "up"];
  const negative = ["lose", "deny", "fail", "decrease", "no", "down"];

  let score = 0;
  for (const token of positive) {
    if (lower.includes(token)) score += 1;
  }
  for (const token of negative) {
    if (lower.includes(token)) score -= 1;
  }

  return Math.max(-1, Math.min(1, score / 4));
}

export class ResearchAgent {
  async run(context: MarketContext): Promise<ResearchResult> {
    const marketProb = (context.market.yesPriceBps || 5000) / 10_000;
    const spreadPct = (context.market.spreadBps || 0) / 10_000;
    const liquidity = context.market.liquidityUsd || 0;
    const volume = context.market.volume24hUsd || 0;

    const sentiment = computeSentiment(context.market.question);
    const momentum = Math.max(-1, Math.min(1, (volume / Math.max(liquidity, 1) - 0.3) / 2));
    const liquidityScore = Math.max(0, Math.min(1, liquidity / 250_000));

    const features = {
      sentiment,
      momentum,
      spreadPct,
      liquidityScore,
      marketProb,
      volatilityProxy: Math.min(1, spreadPct * 8 + Math.abs(momentum) * 0.4),
      categoryBias: context.market.category?.toLowerCase().includes("crypto") ? 0.05 : 0,
    };

    const sourceReliability = Math.round(
      40 + liquidityScore * 35 + (spreadPct < 0.02 ? 15 : 5) + (volume > 50_000 ? 10 : 0),
    );

    const narrativeSummary = [
      `Market probability is ${(marketProb * 100).toFixed(1)}% with spread ${(spreadPct * 100).toFixed(2)}%.`,
      `Sentiment signal is ${sentiment.toFixed(2)} and momentum signal is ${momentum.toFixed(2)}.`,
      `Liquidity score is ${liquidityScore.toFixed(2)} from ${liquidity.toLocaleString()} USD depth.`,
    ].join(" ");

    return {
      features,
      sourceReliability,
      narrativeSummary,
      entityGraphRefs: [
        `market:${context.market.externalId}`,
        `category:${context.market.category || "unknown"}`,
      ],
      raw: {
        cycleId: context.cycleId,
        marketQuestion: context.market.question,
        marketMetadata: context.market.metadata,
      },
    };
  }
}
