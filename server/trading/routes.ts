import type { Express, Request, Response } from "express";
import { patchRiskPolicySchema } from "@shared/trading-schema";
import { tradingOrchestrator } from "./orchestrator";
import { TradingRepository } from "./repository";

const repository = new TradingRepository();

let tradingReady = true;
let tradingInitError = "";

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value === "1";
  }
  return false;
}

export async function registerTradingRoutes(app: Express): Promise<void> {
  try {
    await tradingOrchestrator.initialize();
  } catch (error) {
    tradingReady = false;
    tradingInitError = error instanceof Error ? error.message : "Trading initialization failed";
    console.error("[trading] initialization failed:", tradingInitError);
  }

  app.use("/api/trading", (_req, res, next) => {
    if (!tradingReady) {
      return res.status(503).json({
        error: "Trading subsystem unavailable",
        details: tradingInitError,
      });
    }
    next();
  });

  app.post("/api/trading/control/start", async (req: Request, res: Response) => {
    try {
      const resetKillSwitch = toBoolean(req.body?.resetKillSwitch);
      const state = await tradingOrchestrator.start({ resetKillSwitch });
      res.json({
        ok: true,
        state,
      });
    } catch (error) {
      res.status(400).json({
        ok: false,
        error: error instanceof Error ? error.message : "Unable to start trading",
      });
    }
  });

  app.post("/api/trading/control/stop", async (req: Request, res: Response) => {
    try {
      const reason = typeof req.body?.reason === "string" ? req.body.reason : "manual_stop";
      const state = await tradingOrchestrator.stop(reason);
      res.json({ ok: true, state });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Unable to stop trading",
      });
    }
  });

  app.post("/api/trading/control/kill-switch", async (req: Request, res: Response) => {
    try {
      const reason = typeof req.body?.reason === "string" ? req.body.reason : "manual_kill_switch";
      const state = await tradingOrchestrator.killSwitch(reason);
      res.json({ ok: true, state });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Unable to trigger kill switch",
      });
    }
  });

  app.get("/api/trading/control/status", async (_req: Request, res: Response) => {
    const [runtime, portfolio] = await Promise.all([
      tradingOrchestrator.getRuntimeState(),
      repository.ensurePortfolioState(),
    ]);

    res.json({ runtime, portfolio });
  });

  app.get("/api/trading/markets", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const markets = await repository.getMarkets(Number.isFinite(limit) ? limit : 50);
      res.json(markets);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unable to fetch markets",
      });
    }
  });

  app.get("/api/trading/signals", async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const signals = await repository.listSignals(Number.isFinite(limit) ? limit : 100);
    res.json(signals);
  });

  app.get("/api/trading/risk/limits", async (_req: Request, res: Response) => {
    const policy = await repository.getRiskPolicy();
    res.json(policy);
  });

  app.patch("/api/trading/risk/limits", async (req: Request, res: Response) => {
    try {
      const patch = patchRiskPolicySchema.parse(req.body || {});
      const policy = await repository.patchRiskPolicy(patch);
      await repository.createGovernanceAction({
        actor: "operator",
        actionType: "risk_policy_update",
        reason: "Risk policy updated through API",
        details: patch,
      });
      res.json(policy);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Invalid risk policy patch",
      });
    }
  });

  app.get("/api/trading/positions", async (_req: Request, res: Response) => {
    const positions = await repository.listPositions();
    res.json(positions);
  });

  app.get("/api/trading/orders", async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 200;
    const orders = await repository.listOrders(Number.isFinite(limit) ? limit : 200);
    res.json(orders);
  });

  app.get("/api/trading/attribution", async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 40;
    const reports = await repository.listAttributionReports(Number.isFinite(limit) ? limit : 40);
    res.json(reports);
  });

  app.get("/api/trading/drift", async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 40;
    const events = await repository.listDriftEvents(Number.isFinite(limit) ? limit : 40);
    res.json(events);
  });
}
