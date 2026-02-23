import { LearningAgent } from "./agents/learning-agent";
import { SignalAgent } from "./agents/signal-agent";
import { TRADING_DEFAULT_CYCLE_MS } from "./config";
import { ModelServiceClient } from "./model-client";
import { PolymarketProvider } from "./providers/polymarket";
import { TradingRepository } from "./repository";
import { DecisionWorker } from "./workers/decision-worker";
import { ExecutionWorker } from "./workers/execution-worker";
import { IngestionWorker } from "./workers/ingestion-worker";
import { LearningWorker } from "./workers/learning-worker";

function cycleId(): string {
  return `cycle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface TradingRuntimeState {
  tradingActive: boolean;
  killSwitchActive: boolean;
  cycleInFlight: boolean;
  cycleIntervalMs: number;
  lastCycleAt: string | null;
  nextCycleAt: string | null;
  modelServiceHealthy: boolean;
  recentErrors: string[];
}

export class TradingOrchestrator {
  private readonly repository = new TradingRepository();
  private readonly provider = new PolymarketProvider();
  private readonly modelClient = new ModelServiceClient();

  private readonly ingestionWorker = new IngestionWorker(this.repository, this.provider);
  private readonly decisionWorker = new DecisionWorker(this.repository, new SignalAgent(this.modelClient));
  private readonly executionWorker = new ExecutionWorker(this.repository, this.provider);
  private readonly learningWorker = new LearningWorker(this.repository, new LearningAgent(this.modelClient));

  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private cycleInFlight = false;
  private killSwitchActive = false;
  private lastCycleAt: Date | null = null;
  private nextCycleAt: Date | null = null;
  private recentErrors: string[] = [];

  readonly cycleIntervalMs = TRADING_DEFAULT_CYCLE_MS;

  async initialize(): Promise<void> {
    await this.repository.bootstrap();

    const state = await this.repository.ensurePortfolioState();
    this.running = state.tradingActive;
    this.killSwitchActive = state.killSwitchActive;

    if (this.running && !this.killSwitchActive) {
      this.startScheduler();
      void this.runCycle();
    }
  }

  async start(options?: { resetKillSwitch?: boolean }): Promise<TradingRuntimeState> {
    await this.repository.bootstrap();

    if (this.killSwitchActive && !options?.resetKillSwitch) {
      throw new Error("Kill switch is active. Reset kill switch before starting trading.");
    }

    if (options?.resetKillSwitch) {
      this.killSwitchActive = false;
      await this.repository.createGovernanceAction({
        actor: "operator",
        actionType: "kill_switch_reset",
        reason: "Operator reset kill switch",
      });
    }

    this.running = true;
    await this.repository.setTradingControlFlags({
      tradingActive: true,
      killSwitchActive: false,
    });

    this.startScheduler();
    void this.runCycle();

    return this.getRuntimeState();
  }

  async stop(reason = "manual_stop"): Promise<TradingRuntimeState> {
    this.running = false;
    this.stopScheduler();

    await this.repository.setTradingControlFlags({ tradingActive: false });
    await this.repository.createGovernanceAction({
      actor: "operator",
      actionType: "trading_stop",
      reason,
    });

    return this.getRuntimeState();
  }

  async killSwitch(reason = "manual_kill_switch"): Promise<TradingRuntimeState> {
    this.running = false;
    this.killSwitchActive = true;
    this.stopScheduler();

    await this.repository.setTradingControlFlags({
      tradingActive: false,
      killSwitchActive: true,
    });

    await this.repository.createGovernanceAction({
      actor: "operator",
      actionType: "kill_switch_triggered",
      reason,
      details: {
        lastCycleAt: this.lastCycleAt?.toISOString() || null,
      },
    });

    return this.getRuntimeState();
  }

  async runCycle(): Promise<void> {
    if (!this.running || this.killSwitchActive || this.cycleInFlight) {
      return;
    }

    this.cycleInFlight = true;
    const id = cycleId();

    try {
      const state = await this.repository.ensurePortfolioState();
      if (state.killSwitchActive) {
        this.killSwitchActive = true;
        this.running = false;
        this.stopScheduler();
        return;
      }

      const contexts = await this.ingestionWorker.run(id);
      const candidates = await this.decisionWorker.run(id, contexts);
      await this.executionWorker.run(id, candidates);
      await this.learningWorker.run(id, candidates);

      this.lastCycleAt = new Date();
      this.nextCycleAt = new Date(this.lastCycleAt.getTime() + this.cycleIntervalMs);

      if (state.weeklyDrawdownBps / 100 >= (state.riskPolicy as any)?.weeklyHardKillSwitchPct) {
        await this.killSwitch("automatic_weekly_drawdown_kill_switch");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown cycle failure";
      this.recentErrors = [
        `${new Date().toISOString()} ${message}`,
        ...this.recentErrors,
      ].slice(0, 20);

      if (this.recentErrors.length >= 5) {
        await this.stop("automatic_safety_pause_after_repeated_errors");
      }
    } finally {
      this.cycleInFlight = false;
    }
  }

  async getRuntimeState(): Promise<TradingRuntimeState> {
    const modelHealthy = await this.modelClient.health();

    return {
      tradingActive: this.running,
      killSwitchActive: this.killSwitchActive,
      cycleInFlight: this.cycleInFlight,
      cycleIntervalMs: this.cycleIntervalMs,
      lastCycleAt: this.lastCycleAt?.toISOString() || null,
      nextCycleAt: this.nextCycleAt?.toISOString() || null,
      modelServiceHealthy: modelHealthy,
      recentErrors: this.recentErrors,
    };
  }

  private startScheduler(): void {
    if (this.timer) {
      return;
    }

    this.nextCycleAt = new Date(Date.now() + this.cycleIntervalMs);
    this.timer = setInterval(() => {
      this.nextCycleAt = new Date(Date.now() + this.cycleIntervalMs);
      void this.runCycle();
    }, this.cycleIntervalMs);
  }

  private stopScheduler(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.nextCycleAt = null;
  }
}

export const tradingOrchestrator = new TradingOrchestrator();
