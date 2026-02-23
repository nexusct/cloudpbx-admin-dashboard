import { and, desc, eq } from "drizzle-orm";
import type {
  DriftEvent,
  PortfolioState,
  RiskDecisionRow,
  TradeSignalRow,
  TradingMarket,
  TradingOrder,
} from "@shared/trading-schema";
import {
  agentRuns,
  attributionReports,
  driftEvents,
  fills,
  governanceActions,
  marketSnapshots,
  portfolioState,
  positions,
  researchPackets,
  riskDecisions,
  tradeSignals,
  tradingMarkets,
  tradingOrders,
} from "@shared/trading-schema";
import type { RiskPolicy } from "@shared/trading-types";
import { mergeRiskPolicy, TRADING_DEFAULT_BANKROLL_USD } from "./config";
import { db } from "../db";
import type { ProviderMarket, ProviderOrderBook } from "./providers/polymarket";

interface AgentRunInput {
  layer: string;
  agentName: string;
  cycleId: string;
  inputRef?: string;
}

interface AgentRunCompletion {
  status: "completed" | "failed";
  outputRef?: string;
  metrics?: Record<string, unknown>;
  error?: string;
}

export class TradingRepository {
  async bootstrap(): Promise<void> {
    await this.ensurePortfolioState();
  }

  async ensurePortfolioState(): Promise<PortfolioState> {
    const existing = await this.getLatestPortfolioState();
    if (existing) {
      return existing;
    }

    const [created] = await db
      .insert(portfolioState)
      .values({
        bankrollUsd: TRADING_DEFAULT_BANKROLL_USD,
        equityUsd: TRADING_DEFAULT_BANKROLL_USD,
        availableCapitalUsd: TRADING_DEFAULT_BANKROLL_USD,
        riskPolicy: mergeRiskPolicy(),
        tradingActive: false,
        killSwitchActive: false,
      })
      .returning();

    return created;
  }

  async upsertMarkets(markets: ProviderMarket[]): Promise<TradingMarket[]> {
    const upserted: TradingMarket[] = [];

    for (const market of markets) {
      const [record] = await db
        .insert(tradingMarkets)
        .values({
          externalId: market.externalId,
          slug: market.slug,
          question: market.question,
          category: market.category,
          active: market.active,
          closeTime: market.metadata.endDate ? new Date(String(market.metadata.endDate)) : null,
          yesPriceBps: market.yesPriceBps,
          noPriceBps: market.noPriceBps,
          spreadBps: market.spreadBps,
          liquidityUsd: market.liquidityUsd,
          volume24hUsd: market.volume24hUsd,
          lastTradeAt: market.lastTradeAt,
          metadata: market.metadata,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: tradingMarkets.externalId,
          set: {
            slug: market.slug,
            question: market.question,
            category: market.category,
            active: market.active,
            closeTime: market.metadata.endDate ? new Date(String(market.metadata.endDate)) : null,
            yesPriceBps: market.yesPriceBps,
            noPriceBps: market.noPriceBps,
            spreadBps: market.spreadBps,
            liquidityUsd: market.liquidityUsd,
            volume24hUsd: market.volume24hUsd,
            lastTradeAt: market.lastTradeAt,
            metadata: market.metadata,
            updatedAt: new Date(),
          },
        })
        .returning();

      upserted.push(record);
    }

    return upserted;
  }

  async getMarkets(limit = 50): Promise<TradingMarket[]> {
    return db.select().from(tradingMarkets).orderBy(desc(tradingMarkets.volume24hUsd)).limit(limit);
  }

  async getMarketByExternalId(externalId: string): Promise<TradingMarket | undefined> {
    const [market] = await db
      .select()
      .from(tradingMarkets)
      .where(eq(tradingMarkets.externalId, externalId))
      .limit(1);

    return market;
  }

  async createMarketSnapshot(marketId: number, orderBook: ProviderOrderBook, features: Record<string, number>) {
    const [snapshot] = await db
      .insert(marketSnapshots)
      .values({
        marketId,
        yesBidBps: orderBook.yesBidBps,
        yesAskBps: orderBook.yesAskBps,
        noBidBps: orderBook.noBidBps,
        noAskBps: orderBook.noAskBps,
        spreadBps: orderBook.spreadBps,
        depth: {
          within150BpsUsd: orderBook.depthWithin150BpsUsd,
        },
        recentTrades: orderBook.recentTrades,
        sourceLatencyMs: orderBook.sourceLatencyMs,
        features,
      })
      .returning();

    return snapshot;
  }

  async createResearchPacket(input: {
    marketId: number;
    features: Record<string, number>;
    entityGraphRefs: string[];
    sourceReliability: number;
    narrativeSummary: string;
    raw: Record<string, unknown>;
  }) {
    const [packet] = await db
      .insert(researchPackets)
      .values({
        marketId: input.marketId,
        features: input.features,
        entityGraphRefs: input.entityGraphRefs,
        sourceReliability: input.sourceReliability,
        narrativeSummary: input.narrativeSummary,
        raw: input.raw,
      })
      .returning();

    return packet;
  }

  async createSignal(input: {
    marketId: number;
    researchPacketId: number;
    side: "YES" | "NO";
    edgeBps: number;
    confidenceBps: number;
    fairProbBps: number;
    marketProbBps: number;
    rationale: string;
    status: string;
    validatorNotes: string;
    cycleId: string;
  }): Promise<TradeSignalRow> {
    const [signal] = await db
      .insert(tradeSignals)
      .values(input)
      .returning();

    return signal;
  }

  async updateSignalStatus(signalId: number, status: string, validatorNotes?: string): Promise<void> {
    await db
      .update(tradeSignals)
      .set({
        status,
        validatorNotes,
      })
      .where(eq(tradeSignals.id, signalId));
  }

  async createRiskDecision(input: {
    signalId: number;
    approved: boolean;
    positionSizeUsd: number;
    ruleHits: string[];
    blockingReasons: string[];
    policySnapshot: RiskPolicy;
    riskScoreBps: number;
  }): Promise<RiskDecisionRow> {
    const [decision] = await db
      .insert(riskDecisions)
      .values(input)
      .returning();

    return decision;
  }

  async createOrder(input: {
    marketId: number;
    signalId: number;
    riskDecisionId: number;
    side: "YES" | "NO";
    orderType: "limit" | "market";
    status: string;
    priceBps: number;
    sizeUsd: number;
    timeInForce: "gtc" | "ioc";
    maxSlippageBps: number;
    providerOrderId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<TradingOrder> {
    const [order] = await db
      .insert(tradingOrders)
      .values({
        ...input,
        providerOrderId: input.providerOrderId || null,
        metadata: input.metadata || {},
      })
      .returning();

    return order;
  }

  async updateOrderStatus(orderId: number, status: string, patch?: {
    providerOrderId?: string;
    cancelReason?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await db
      .update(tradingOrders)
      .set({
        status,
        providerOrderId: patch?.providerOrderId,
        cancelReason: patch?.cancelReason,
        metadata: patch?.metadata,
        lastUpdate: new Date(),
      })
      .where(eq(tradingOrders.id, orderId));
  }

  async createFill(input: {
    orderId: number;
    priceBps: number;
    sizeUsd: number;
    feeUsd: number;
    liquidityFlag: "maker" | "taker";
    providerFillId: string;
    metadata?: Record<string, unknown>;
  }) {
    const [fill] = await db
      .insert(fills)
      .values({
        ...input,
        metadata: input.metadata || {},
      })
      .returning();

    return fill;
  }

  async upsertPosition(input: {
    marketId: number;
    side: "YES" | "NO";
    sizeUsd: number;
    entryBps: number;
    markBps: number;
  }): Promise<void> {
    const [existing] = await db
      .select()
      .from(positions)
      .where(and(eq(positions.marketId, input.marketId), eq(positions.side, input.side)))
      .limit(1);

    if (!existing) {
      await db.insert(positions).values({
        marketId: input.marketId,
        side: input.side,
        sizeUsd: input.sizeUsd,
        avgEntryBps: input.entryBps,
        markBps: input.markBps,
        unrealizedPnlUsd: 0,
        realizedPnlUsd: 0,
      }).onConflictDoUpdate({
        target: [positions.marketId, positions.side],
        set: {
          sizeUsd: input.sizeUsd,
          avgEntryBps: input.entryBps,
          markBps: input.markBps,
          updatedAt: new Date(),
        },
      });
      return;
    }

    const totalSize = existing.sizeUsd + input.sizeUsd;
    const weightedEntry = totalSize > 0
      ? Math.round(((existing.avgEntryBps || input.entryBps) * existing.sizeUsd + input.entryBps * input.sizeUsd) / totalSize)
      : input.entryBps;

    await db
      .update(positions)
      .set({
        sizeUsd: totalSize,
        avgEntryBps: weightedEntry,
        markBps: input.markBps,
        updatedAt: new Date(),
      })
      .where(eq(positions.id, existing.id));
  }

  async listSignals(limit = 100): Promise<TradeSignalRow[]> {
    return db
      .select()
      .from(tradeSignals)
      .orderBy(desc(tradeSignals.createdAt))
      .limit(limit);
  }

  async listOrders(limit = 200): Promise<TradingOrder[]> {
    return db
      .select()
      .from(tradingOrders)
      .orderBy(desc(tradingOrders.createdAt))
      .limit(limit);
  }

  async listPositions() {
    return db
      .select()
      .from(positions)
      .orderBy(desc(positions.updatedAt));
  }

  async listAttributionReports(limit = 40) {
    return db
      .select()
      .from(attributionReports)
      .orderBy(desc(attributionReports.generatedAt))
      .limit(limit);
  }

  async listDriftEvents(limit = 40): Promise<DriftEvent[]> {
    return db
      .select()
      .from(driftEvents)
      .orderBy(desc(driftEvents.detectedAt))
      .limit(limit);
  }

  async createAttributionReport(input: {
    marketId?: number;
    window: string;
    summary: string;
    report: Record<string, unknown>;
  }): Promise<void> {
    await db.insert(attributionReports).values({
      marketId: input.marketId || null,
      window: input.window,
      summary: input.summary,
      report: input.report,
    });
  }

  async createDriftEvent(input: {
    marketId?: number;
    severity: "low" | "medium" | "high";
    metric: string;
    value: string;
    threshold?: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await db.insert(driftEvents).values({
      marketId: input.marketId || null,
      severity: input.severity,
      metric: input.metric,
      value: input.value,
      threshold: input.threshold,
      action: input.action,
      metadata: input.metadata || {},
    });
  }

  async getLatestPortfolioState(): Promise<PortfolioState | undefined> {
    const [state] = await db
      .select()
      .from(portfolioState)
      .orderBy(desc(portfolioState.asOf))
      .limit(1);

    return state;
  }

  async getRiskPolicy(): Promise<RiskPolicy> {
    const state = await this.ensurePortfolioState();
    return mergeRiskPolicy((state.riskPolicy || {}) as Partial<RiskPolicy>);
  }

  async patchRiskPolicy(patch: Partial<RiskPolicy>): Promise<RiskPolicy> {
    const state = await this.ensurePortfolioState();
    const nextPolicy = mergeRiskPolicy({
      ...(state.riskPolicy as Partial<RiskPolicy>),
      ...patch,
    });

    await db
      .update(portfolioState)
      .set({
        riskPolicy: nextPolicy,
        asOf: new Date(),
      })
      .where(eq(portfolioState.id, state.id));

    return nextPolicy;
  }

  async setTradingControlFlags(input: { tradingActive?: boolean; killSwitchActive?: boolean }): Promise<PortfolioState> {
    const state = await this.ensurePortfolioState();

    const [updated] = await db
      .update(portfolioState)
      .set({
        tradingActive: input.tradingActive ?? state.tradingActive,
        killSwitchActive: input.killSwitchActive ?? state.killSwitchActive,
        asOf: new Date(),
      })
      .where(eq(portfolioState.id, state.id))
      .returning();

    return updated;
  }

  async createGovernanceAction(input: {
    actor: string;
    actionType: string;
    reason: string;
    details?: Record<string, unknown>;
    approved?: boolean;
  }): Promise<void> {
    await db.insert(governanceActions).values({
      actor: input.actor,
      actionType: input.actionType,
      reason: input.reason,
      details: input.details || {},
      approved: input.approved ?? true,
    });
  }

  async createAgentRun(input: AgentRunInput): Promise<number> {
    const [run] = await db
      .insert(agentRuns)
      .values({
        layer: input.layer,
        agentName: input.agentName,
        cycleId: input.cycleId,
        inputRef: input.inputRef,
      })
      .returning();

    return run.id;
  }

  async completeAgentRun(runId: number, input: AgentRunCompletion): Promise<void> {
    await db
      .update(agentRuns)
      .set({
        status: input.status,
        outputRef: input.outputRef,
        metrics: input.metrics || {},
        error: input.error,
        completedAt: new Date(),
      })
      .where(eq(agentRuns.id, runId));
  }
}
