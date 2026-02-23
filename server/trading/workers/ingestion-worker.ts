import type { TradingMarket } from "@shared/trading-schema";
import { TOP_CATEGORIES, TRADING_MARKET_LIMIT } from "../config";
import type { ProviderOrderBook } from "../providers/polymarket";
import { PolymarketProvider } from "../providers/polymarket";
import { TradingRepository } from "../repository";

export interface IngestedMarketContext {
  market: TradingMarket;
  orderBook: ProviderOrderBook;
  features: Record<string, number>;
}

export class IngestionWorker {
  constructor(
    private readonly repository: TradingRepository,
    private readonly provider: PolymarketProvider,
  ) {}

  async run(cycleId: string): Promise<IngestedMarketContext[]> {
    const runId = await this.repository.createAgentRun({
      layer: "L0",
      agentName: "Polymarket Ingestor",
      cycleId,
      inputRef: JSON.stringify({ categories: TOP_CATEGORIES, limit: TRADING_MARKET_LIMIT }),
    });

    try {
      const providerMarkets = await this.provider.fetchTopMarkets(TOP_CATEGORIES, TRADING_MARKET_LIMIT);
      const syncedMarkets = await this.repository.upsertMarkets(providerMarkets);

      const selected = syncedMarkets.slice(0, Math.min(12, syncedMarkets.length));
      const contexts: IngestedMarketContext[] = [];

      for (const market of selected) {
        const orderBook = await this.provider.getOrderBook(market.externalId);
        const features = {
          spreadPct: (orderBook.spreadBps || 0) / 10_000,
          depthUsd: orderBook.depthWithin150BpsUsd,
          latencyMs: orderBook.sourceLatencyMs,
          yesBid: (orderBook.yesBidBps || 0) / 10_000,
          yesAsk: (orderBook.yesAskBps || 0) / 10_000,
          momentum: Math.max(-1, Math.min(1, ((market.volume24hUsd || 0) / Math.max(market.liquidityUsd || 0, 1) - 0.5))),
        };

        await this.repository.createMarketSnapshot(market.id, orderBook, features);
        contexts.push({ market, orderBook, features });
      }

      await this.repository.completeAgentRun(runId, {
        status: "completed",
        outputRef: JSON.stringify({ ingested: contexts.length }),
        metrics: {
          ingested: contexts.length,
          totalSynced: syncedMarkets.length,
        },
      });

      return contexts;
    } catch (error) {
      await this.repository.completeAgentRun(runId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Ingestion worker failed",
      });
      throw error;
    }
  }
}
