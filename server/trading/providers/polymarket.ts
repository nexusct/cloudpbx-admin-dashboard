import type { OrderType, TradeSide } from "@shared/trading-types";

export interface ProviderMarket {
  externalId: string;
  slug: string | null;
  question: string;
  category: string | null;
  active: boolean;
  yesPriceBps: number | null;
  noPriceBps: number | null;
  spreadBps: number | null;
  liquidityUsd: number;
  volume24hUsd: number;
  lastTradeAt: Date | null;
  metadata: Record<string, unknown>;
}

export interface ProviderOrderBook {
  yesBidBps: number | null;
  yesAskBps: number | null;
  noBidBps: number | null;
  noAskBps: number | null;
  spreadBps: number | null;
  depthWithin150BpsUsd: number;
  recentTrades: Array<Record<string, unknown>>;
  sourceLatencyMs: number;
}

export interface PlaceOrderRequest {
  marketExternalId: string;
  side: TradeSide;
  orderType: OrderType;
  priceBps: number;
  sizeUsd: number;
  timeInForce: "gtc" | "ioc";
  maxSlippageBps: number;
  clientOrderId: string;
}

export interface PlaceOrderResponse {
  providerOrderId: string;
  status: "open" | "filled" | "rejected";
  filledSizeUsd: number;
  fillPriceBps?: number;
  metadata: Record<string, unknown>;
}

interface ExecutionProxyResponse {
  orderId: string;
  status: "open" | "filled" | "rejected";
  filledSizeUsd?: number;
  fillPriceBps?: number;
  metadata?: Record<string, unknown>;
}

function parseNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function toBps(probability: number): number {
  return Math.round(Math.min(1, Math.max(0, probability)) * 10_000);
}

function fromBps(bps: number | null): number {
  if (bps === null) return 0;
  return bps / 10_000;
}

function normalizeCategory(raw: unknown): string | null {
  if (!raw || typeof raw !== "string") {
    return null;
  }
  return raw.trim() || null;
}

export class PolymarketProvider {
  private readonly marketApiBase = process.env.POLYMARKET_GAMMA_BASE_URL || "https://gamma-api.polymarket.com";
  private readonly executionProxy = process.env.POLYMARKET_EXECUTION_BASE_URL;
  private readonly executionProxyApiKey = process.env.POLYMARKET_EXECUTION_API_KEY;

  async fetchTopMarkets(categories: string[], limit: number): Promise<ProviderMarket[]> {
    const response = await fetch(
      `${this.marketApiBase}/markets?active=true&closed=false&limit=${Math.max(5, limit)}`,
    );

    if (!response.ok) {
      throw new Error(`Polymarket market API failed (${response.status})`);
    }

    const records = (await response.json()) as Array<Record<string, unknown>>;

    const markets = records
      .map((record) => this.normalizeMarket(record))
      .filter((market): market is ProviderMarket => !!market)
      .filter((market) => {
        if (categories.length === 0) {
          return true;
        }
        if (!market.category) {
          return true;
        }
        return categories.some((category) => market.category?.toLowerCase().includes(category.toLowerCase()));
      })
      .sort((a, b) => b.volume24hUsd - a.volume24hUsd)
      .slice(0, limit);

    if (markets.length > 0) {
      return markets;
    }

    return records
      .map((record) => this.normalizeMarket(record))
      .filter((market): market is ProviderMarket => !!market)
      .slice(0, limit);
  }

  async getOrderBook(marketExternalId: string): Promise<ProviderOrderBook> {
    const start = Date.now();
    const response = await fetch(`${this.marketApiBase}/markets/${marketExternalId}`);

    if (!response.ok) {
      throw new Error(`Polymarket market detail API failed (${response.status})`);
    }

    const record = (await response.json()) as Record<string, unknown>;
    const yesBid = toBps(parseNumber(record.bestBid, 0));
    const yesAsk = toBps(parseNumber(record.bestAsk, 0));

    const spread = yesBid > 0 && yesAsk > 0 ? Math.max(0, yesAsk - yesBid) : null;
    const yesBidProb = fromBps(yesBid);
    const yesAskProb = fromBps(yesAsk);

    return {
      yesBidBps: yesBid,
      yesAskBps: yesAsk,
      noBidBps: yesAsk > 0 ? toBps(1 - yesAskProb) : null,
      noAskBps: yesBid > 0 ? toBps(1 - yesBidProb) : null,
      spreadBps: spread,
      depthWithin150BpsUsd: Math.round(parseNumber(record.liquidityNum, parseNumber(record.liquidity, 0))),
      recentTrades: [],
      sourceLatencyMs: Date.now() - start,
    };
  }

  async placeOrder(request: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    if (this.executionProxy) {
      return this.placeViaExecutionProxy(request);
    }

    const isAutoFill = request.orderType === "market";
    return {
      providerOrderId: `paper-${request.clientOrderId}`,
      status: isAutoFill ? "filled" : "open",
      filledSizeUsd: isAutoFill ? request.sizeUsd : 0,
      fillPriceBps: isAutoFill ? request.priceBps : undefined,
      metadata: {
        mode: "paper_fallback",
        reason: "POLYMARKET_EXECUTION_BASE_URL not configured",
      },
    };
  }

  async cancelOrder(providerOrderId: string): Promise<boolean> {
    if (!this.executionProxy) {
      return true;
    }

    const response = await fetch(`${this.executionProxy}/orders/${providerOrderId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.executionProxyApiKey ? { Authorization: `Bearer ${this.executionProxyApiKey}` } : {}),
      },
      body: JSON.stringify({ reason: "strategy_update" }),
    });

    return response.ok;
  }

  private normalizeMarket(record: Record<string, unknown>): ProviderMarket | null {
    const externalId = String(record.id || "").trim();
    const question = String(record.question || "").trim();

    if (!externalId || !question) {
      return null;
    }

    const rawOutcomePrices = record.outcomePrices;
    let yesPriceBps: number | null = null;
    let noPriceBps: number | null = null;

    if (Array.isArray(rawOutcomePrices) && rawOutcomePrices.length >= 2) {
      yesPriceBps = toBps(parseNumber(rawOutcomePrices[0], 0));
      noPriceBps = toBps(parseNumber(rawOutcomePrices[1], 0));
    } else {
      const bestBid = parseNumber(record.bestBid, 0);
      const bestAsk = parseNumber(record.bestAsk, 0);
      if (bestBid > 0 || bestAsk > 0) {
        const mid = bestBid > 0 && bestAsk > 0 ? (bestBid + bestAsk) / 2 : Math.max(bestBid, bestAsk);
        yesPriceBps = toBps(mid);
        noPriceBps = toBps(1 - mid);
      }
    }

    const spread = parseNumber(record.spread, 0);

    const firstEvent = Array.isArray(record.events) ? (record.events[0] as Record<string, unknown> | undefined) : undefined;
    const category = normalizeCategory(firstEvent?.category || firstEvent?.title || record.groupItemTitle || record.topic);

    const market: ProviderMarket = {
      externalId,
      slug: record.slug ? String(record.slug) : null,
      question,
      category,
      active: !!record.active,
      yesPriceBps,
      noPriceBps,
      spreadBps: spread > 0 ? toBps(spread) : yesPriceBps !== null && noPriceBps !== null ? Math.abs(10_000 - yesPriceBps - noPriceBps) : null,
      liquidityUsd: Math.round(parseNumber(record.liquidityNum, parseNumber(record.liquidity, 0))),
      volume24hUsd: Math.round(parseNumber(record.volume24hr, parseNumber(record.volume24hrClob, 0))),
      lastTradeAt: record.updatedAt ? new Date(String(record.updatedAt)) : null,
      metadata: {
        endDate: record.endDate,
        volume: record.volume,
        liquidity: record.liquidity,
      },
    };

    return market;
  }

  private async placeViaExecutionProxy(request: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    const response = await fetch(`${this.executionProxy}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.executionProxyApiKey ? { Authorization: `Bearer ${this.executionProxyApiKey}` } : {}),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Execution proxy order failed (${response.status})`);
    }

    const body = (await response.json()) as ExecutionProxyResponse;
    return {
      providerOrderId: body.orderId,
      status: body.status,
      filledSizeUsd: body.filledSizeUsd || 0,
      fillPriceBps: body.fillPriceBps,
      metadata: body.metadata || {},
    };
  }
}
