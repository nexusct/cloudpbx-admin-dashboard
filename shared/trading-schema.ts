import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tradingMarkets = pgTable("trading_markets", {
  id: serial("id").primaryKey(),
  externalId: varchar("external_id", { length: 128 }).notNull().unique(),
  slug: text("slug"),
  question: text("question").notNull(),
  category: text("category"),
  active: boolean("active").notNull().default(true),
  closeTime: timestamp("close_time"),
  yesPriceBps: integer("yes_price_bps"),
  noPriceBps: integer("no_price_bps"),
  spreadBps: integer("spread_bps"),
  liquidityUsd: integer("liquidity_usd").default(0),
  volume24hUsd: integer("volume_24h_usd").default(0),
  lastTradeAt: timestamp("last_trade_at"),
  metadata: jsonb("metadata").notNull().default({}),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const marketSnapshots = pgTable("market_snapshots", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").notNull().references(() => tradingMarkets.id),
  snapshotTime: timestamp("snapshot_time").notNull().default(sql`CURRENT_TIMESTAMP`),
  yesBidBps: integer("yes_bid_bps"),
  yesAskBps: integer("yes_ask_bps"),
  noBidBps: integer("no_bid_bps"),
  noAskBps: integer("no_ask_bps"),
  spreadBps: integer("spread_bps"),
  depth: jsonb("depth").notNull().default({}),
  recentTrades: jsonb("recent_trades").notNull().default([]),
  features: jsonb("features").notNull().default({}),
  sourceLatencyMs: integer("source_latency_ms").default(0),
});

export const researchPackets = pgTable("research_packets", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").notNull().references(() => tradingMarkets.id),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  features: jsonb("features").notNull().default({}),
  entityGraphRefs: jsonb("entity_graph_refs").notNull().default([]),
  sourceReliability: integer("source_reliability").notNull().default(50),
  narrativeSummary: text("narrative_summary"),
  agentVersion: text("agent_version").notNull().default("research-v1"),
  raw: jsonb("raw").notNull().default({}),
});

export const tradeSignals = pgTable("trade_signals", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").notNull().references(() => tradingMarkets.id),
  researchPacketId: integer("research_packet_id").references(() => researchPackets.id),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  side: text("side").notNull(),
  edgeBps: integer("edge_bps").notNull(),
  confidenceBps: integer("confidence_bps").notNull(),
  fairProbBps: integer("fair_prob_bps"),
  marketProbBps: integer("market_prob_bps"),
  rationale: text("rationale").notNull(),
  status: text("status").notNull().default("generated"),
  validatorNotes: text("validator_notes"),
  cycleId: text("cycle_id"),
});

export const riskDecisions = pgTable("risk_decisions", {
  id: serial("id").primaryKey(),
  signalId: integer("signal_id").notNull().references(() => tradeSignals.id),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  approved: boolean("approved").notNull().default(false),
  positionSizeUsd: integer("position_size_usd").notNull().default(0),
  ruleHits: jsonb("rule_hits").notNull().default([]),
  blockingReasons: jsonb("blocking_reasons").notNull().default([]),
  policySnapshot: jsonb("policy_snapshot").notNull().default({}),
  riskScoreBps: integer("risk_score_bps").notNull().default(0),
});

export const tradingOrders = pgTable("trading_orders", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").notNull().references(() => tradingMarkets.id),
  signalId: integer("signal_id").references(() => tradeSignals.id),
  riskDecisionId: integer("risk_decision_id").references(() => riskDecisions.id),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  side: text("side").notNull(),
  orderType: text("order_type").notNull().default("limit"),
  status: text("status").notNull().default("pending"),
  priceBps: integer("price_bps"),
  sizeUsd: integer("size_usd").notNull().default(0),
  timeInForce: text("time_in_force").notNull().default("gtc"),
  maxSlippageBps: integer("max_slippage_bps").notNull().default(150),
  providerOrderId: text("provider_order_id"),
  cancelReason: text("cancel_reason"),
  metadata: jsonb("metadata").notNull().default({}),
  lastUpdate: timestamp("last_update").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const fills = pgTable("fills", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => tradingOrders.id),
  filledAt: timestamp("filled_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  priceBps: integer("price_bps").notNull(),
  sizeUsd: integer("size_usd").notNull(),
  feeUsd: integer("fee_usd").notNull().default(0),
  liquidityFlag: text("liquidity_flag").default("taker"),
  providerFillId: text("provider_fill_id"),
  metadata: jsonb("metadata").notNull().default({}),
});

export const positions = pgTable(
  "positions",
  {
    id: serial("id").primaryKey(),
    marketId: integer("market_id").notNull().references(() => tradingMarkets.id),
    side: text("side").notNull(),
    sizeUsd: integer("size_usd").notNull().default(0),
    avgEntryBps: integer("avg_entry_bps"),
    markBps: integer("mark_bps"),
    unrealizedPnlUsd: integer("unrealized_pnl_usd").notNull().default(0),
    realizedPnlUsd: integer("realized_pnl_usd").notNull().default(0),
    updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    marketSideUnique: uniqueIndex("positions_market_side_unique").on(table.marketId, table.side),
  }),
);

export const portfolioState = pgTable("portfolio_state", {
  id: serial("id").primaryKey(),
  asOf: timestamp("as_of").notNull().default(sql`CURRENT_TIMESTAMP`),
  bankrollUsd: integer("bankroll_usd").notNull().default(100000),
  equityUsd: integer("equity_usd").notNull().default(100000),
  availableCapitalUsd: integer("available_capital_usd").notNull().default(100000),
  openExposureUsd: integer("open_exposure_usd").notNull().default(0),
  realizedPnlUsd: integer("realized_pnl_usd").notNull().default(0),
  unrealizedPnlUsd: integer("unrealized_pnl_usd").notNull().default(0),
  dailyDrawdownBps: integer("daily_drawdown_bps").notNull().default(0),
  weeklyDrawdownBps: integer("weekly_drawdown_bps").notNull().default(0),
  riskPolicy: jsonb("risk_policy").notNull().default({}),
  tradingActive: boolean("trading_active").notNull().default(false),
  killSwitchActive: boolean("kill_switch_active").notNull().default(false),
});

export const modelVersions = pgTable("model_versions", {
  id: serial("id").primaryKey(),
  modelName: text("model_name").notNull(),
  version: text("version").notNull(),
  deployedAt: timestamp("deployed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  metadata: jsonb("metadata").notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
});

export const resolutionEvents = pgTable("resolution_events", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").notNull().references(() => tradingMarkets.id),
  resolvedAt: timestamp("resolved_at").notNull(),
  outcome: text("outcome").notNull(),
  probAtDecisionBps: integer("prob_at_decision_bps"),
  pnlUsd: integer("pnl_usd"),
  metadata: jsonb("metadata").notNull().default({}),
});

export const attributionReports = pgTable("attribution_reports", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").references(() => tradingMarkets.id),
  generatedAt: timestamp("generated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  window: text("window").notNull().default("rolling_30d"),
  summary: text("summary"),
  report: jsonb("report").notNull().default({}),
});

export const driftEvents = pgTable("drift_events", {
  id: serial("id").primaryKey(),
  marketId: integer("market_id").references(() => tradingMarkets.id),
  detectedAt: timestamp("detected_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  severity: text("severity").notNull().default("low"),
  metric: text("metric").notNull(),
  value: text("value").notNull(),
  threshold: text("threshold"),
  action: text("action"),
  metadata: jsonb("metadata").notNull().default({}),
});

export const governanceActions = pgTable("governance_actions", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  actor: text("actor").notNull().default("system"),
  actionType: text("action_type").notNull(),
  reason: text("reason"),
  details: jsonb("details").notNull().default({}),
  approved: boolean("approved").notNull().default(true),
});

export const agentRuns = pgTable("agent_runs", {
  id: serial("id").primaryKey(),
  layer: text("layer").notNull(),
  agentName: text("agent_name").notNull(),
  cycleId: text("cycle_id"),
  startedAt: timestamp("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: timestamp("completed_at"),
  status: text("status").notNull().default("running"),
  inputRef: text("input_ref"),
  outputRef: text("output_ref"),
  metrics: jsonb("metrics").notNull().default({}),
  error: text("error"),
});

export const longTermMemory = pgTable("long_term_memory", {
  id: serial("id").primaryKey(),
  memoryType: text("memory_type").notNull(),
  marketId: integer("market_id").references(() => tradingMarkets.id),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  content: text("content").notNull(),
  embedding: jsonb("embedding").notNull().default([]),
  metadata: jsonb("metadata").notNull().default({}),
});

export const insertTradingMarketSchema = createInsertSchema(tradingMarkets).omit({ id: true, updatedAt: true });
export const insertMarketSnapshotSchema = createInsertSchema(marketSnapshots).omit({ id: true, snapshotTime: true });
export const insertResearchPacketSchema = createInsertSchema(researchPackets).omit({ id: true, createdAt: true });
export const insertTradeSignalSchema = createInsertSchema(tradeSignals).omit({ id: true, createdAt: true });
export const insertRiskDecisionSchema = createInsertSchema(riskDecisions).omit({ id: true, createdAt: true });
export const insertTradingOrderSchema = createInsertSchema(tradingOrders).omit({ id: true, createdAt: true, lastUpdate: true });
export const insertFillSchema = createInsertSchema(fills).omit({ id: true, filledAt: true });
export const insertPositionSchema = createInsertSchema(positions).omit({ id: true, updatedAt: true });
export const insertPortfolioStateSchema = createInsertSchema(portfolioState).omit({ id: true, asOf: true });
export const insertModelVersionSchema = createInsertSchema(modelVersions).omit({ id: true, deployedAt: true });
export const insertResolutionEventSchema = createInsertSchema(resolutionEvents).omit({ id: true });
export const insertAttributionReportSchema = createInsertSchema(attributionReports).omit({ id: true, generatedAt: true });
export const insertDriftEventSchema = createInsertSchema(driftEvents).omit({ id: true, detectedAt: true });
export const insertGovernanceActionSchema = createInsertSchema(governanceActions).omit({ id: true, createdAt: true });
export const insertAgentRunSchema = createInsertSchema(agentRuns).omit({ id: true, startedAt: true, completedAt: true });
export const insertLongTermMemorySchema = createInsertSchema(longTermMemory).omit({ id: true, createdAt: true });

export const patchRiskPolicySchema = z.object({
  perMarketMaxExposurePct: z.number().min(0).max(100).optional(),
  perCategoryMaxExposurePct: z.number().min(0).max(100).optional(),
  dailyDrawdownThrottlePct: z.number().min(0).max(100).optional(),
  weeklyHardKillSwitchPct: z.number().min(0).max(100).optional(),
  fractionalKelly: z.number().min(0).max(1).optional(),
  minimumEdgeBps: z.number().min(0).max(10000).optional(),
  minimumConfidence: z.number().min(0).max(1).optional(),
  liquidityDepthMultiple: z.number().min(0).max(100).optional(),
  maxDepthWindowBps: z.number().min(1).max(10000).optional(),
  maxSpreadPct: z.number().min(0).max(100).optional(),
  requoteIntervalSeconds: z.number().min(1).max(3600).optional(),
});

export type InsertTradingMarket = z.infer<typeof insertTradingMarketSchema>;
export type TradingMarket = typeof tradingMarkets.$inferSelect;
export type InsertMarketSnapshot = z.infer<typeof insertMarketSnapshotSchema>;
export type MarketSnapshot = typeof marketSnapshots.$inferSelect;
export type InsertResearchPacket = z.infer<typeof insertResearchPacketSchema>;
export type ResearchPacketRow = typeof researchPackets.$inferSelect;
export type InsertTradeSignal = z.infer<typeof insertTradeSignalSchema>;
export type TradeSignalRow = typeof tradeSignals.$inferSelect;
export type InsertRiskDecision = z.infer<typeof insertRiskDecisionSchema>;
export type RiskDecisionRow = typeof riskDecisions.$inferSelect;
export type InsertTradingOrder = z.infer<typeof insertTradingOrderSchema>;
export type TradingOrder = typeof tradingOrders.$inferSelect;
export type Fill = typeof fills.$inferSelect;
export type Position = typeof positions.$inferSelect;
export type PortfolioState = typeof portfolioState.$inferSelect;
export type ModelVersion = typeof modelVersions.$inferSelect;
export type ResolutionEvent = typeof resolutionEvents.$inferSelect;
export type AttributionReport = typeof attributionReports.$inferSelect;
export type DriftEvent = typeof driftEvents.$inferSelect;
export type GovernanceAction = typeof governanceActions.$inferSelect;
export type AgentRun = typeof agentRuns.$inferSelect;
export type LongTermMemory = typeof longTermMemory.$inferSelect;
