import { useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Shield, Activity, TrendingUp, Layers } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { StatCard } from "@/components/stat-card";
import { TradingControlPanel } from "@/components/trading/control-panel";
import { RiskLimitsForm } from "@/components/trading/risk-limits-form";
import type { RiskPolicy } from "@shared/trading-types";

interface RuntimeState {
  tradingActive: boolean;
  killSwitchActive: boolean;
  cycleInFlight: boolean;
  cycleIntervalMs: number;
  lastCycleAt: string | null;
  nextCycleAt: string | null;
  modelServiceHealthy: boolean;
  recentErrors: string[];
}

interface PortfolioState {
  bankrollUsd: number;
  equityUsd: number;
  availableCapitalUsd: number;
  openExposureUsd: number;
  dailyDrawdownBps: number;
  weeklyDrawdownBps: number;
}

interface TradingStatusResponse {
  runtime: RuntimeState;
  portfolio: PortfolioState;
}

interface TradingMarket {
  id: number;
  question: string;
  category: string | null;
  yesPriceBps: number | null;
  spreadBps: number | null;
  volume24hUsd: number;
}

interface TradeSignal {
  id: number;
  marketId: number;
  side: "YES" | "NO";
  edgeBps: number;
  confidenceBps: number;
  status: string;
  rationale: string;
  createdAt: string;
}

interface TradingOrder {
  id: number;
  marketId: number;
  side: "YES" | "NO";
  status: string;
  sizeUsd: number;
  priceBps: number | null;
  createdAt: string;
}

interface Position {
  id: number;
  marketId: number;
  side: "YES" | "NO";
  sizeUsd: number;
  avgEntryBps: number | null;
  markBps: number | null;
  unrealizedPnlUsd: number;
}

interface AttributionReport {
  id: number;
  summary: string | null;
  generatedAt: string;
}

interface DriftEvent {
  id: number;
  severity: "low" | "medium" | "high";
  metric: string;
  value: string;
  detectedAt: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPctFromBps(value: number): string {
  return `${(value / 100).toFixed(2)}%`;
}

function formatTime(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Trading() {
  const { toast } = useToast();

  const statusQuery = useQuery<TradingStatusResponse>({
    queryKey: ["/api/trading/control/status"],
    refetchInterval: 15_000,
  });

  const marketsQuery = useQuery<TradingMarket[]>({
    queryKey: ["/api/trading/markets"],
    refetchInterval: 30_000,
  });

  const signalsQuery = useQuery<TradeSignal[]>({
    queryKey: ["/api/trading/signals"],
    refetchInterval: 15_000,
  });

  const ordersQuery = useQuery<TradingOrder[]>({
    queryKey: ["/api/trading/orders"],
    refetchInterval: 15_000,
  });

  const positionsQuery = useQuery<Position[]>({
    queryKey: ["/api/trading/positions"],
    refetchInterval: 15_000,
  });

  const riskPolicyQuery = useQuery<RiskPolicy>({
    queryKey: ["/api/trading/risk/limits"],
    refetchInterval: 30_000,
  });

  const attributionQuery = useQuery<AttributionReport[]>({
    queryKey: ["/api/trading/attribution"],
    refetchInterval: 30_000,
  });

  const driftQuery = useQuery<DriftEvent[]>({
    queryKey: ["/api/trading/drift"],
    refetchInterval: 30_000,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/trading/control/status"] });
    queryClient.invalidateQueries({ queryKey: ["/api/trading/markets"] });
    queryClient.invalidateQueries({ queryKey: ["/api/trading/signals"] });
    queryClient.invalidateQueries({ queryKey: ["/api/trading/orders"] });
    queryClient.invalidateQueries({ queryKey: ["/api/trading/positions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/trading/risk/limits"] });
    queryClient.invalidateQueries({ queryKey: ["/api/trading/attribution"] });
    queryClient.invalidateQueries({ queryKey: ["/api/trading/drift"] });
  };

  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/trading/control/start", { resetKillSwitch: true });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Trading started", description: "Autonomous loops are active." });
      refreshAll();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to start", description: error.message, variant: "destructive" });
    },
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/trading/control/stop", { reason: "manual_stop_from_ui" });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Trading stopped", description: "No new orders will be placed." });
      refreshAll();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to stop", description: error.message, variant: "destructive" });
    },
  });

  const killMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/trading/control/kill-switch", { reason: "manual_kill_switch_from_ui" });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Kill switch triggered", description: "Trading has been halted immediately." });
      refreshAll();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to trigger kill switch", description: error.message, variant: "destructive" });
    },
  });

  const patchRiskMutation = useMutation({
    mutationFn: async (patch: Partial<RiskPolicy>) => {
      const res = await apiRequest("PATCH", "/api/trading/risk/limits", patch);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Risk policy updated", description: "New limits are now active." });
      refreshAll();
    },
    onError: (error: Error) => {
      toast({ title: "Risk update failed", description: error.message, variant: "destructive" });
    },
  });

  const marketMap = useMemo(() => {
    return new Map((marketsQuery.data || []).map((market) => [market.id, market]));
  }, [marketsQuery.data]);

  const portfolio = statusQuery.data?.portfolio;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Prediction Trading"
        description="Agentic Polymarket control plane with automated risk and execution loops"
      />

      <TradingControlPanel
        runtime={statusQuery.data?.runtime}
        startPending={startMutation.isPending}
        stopPending={stopMutation.isPending}
        killPending={killMutation.isPending}
        onStart={() => startMutation.mutate()}
        onStop={() => stopMutation.mutate()}
        onKillSwitch={() => killMutation.mutate()}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Equity"
          value={portfolio ? formatCurrency(portfolio.equityUsd) : "-"}
          description="Current total equity"
          icon={TrendingUp}
        />
        <StatCard
          title="Available Capital"
          value={portfolio ? formatCurrency(portfolio.availableCapitalUsd) : "-"}
          description="Deployable funds"
          icon={Layers}
        />
        <StatCard
          title="Daily Drawdown"
          value={portfolio ? formatPctFromBps(portfolio.dailyDrawdownBps) : "-"}
          description="Throttle engages at configured limit"
          icon={Shield}
        />
        <StatCard
          title="Weekly Drawdown"
          value={portfolio ? formatPctFromBps(portfolio.weeklyDrawdownBps) : "-"}
          description="Hard kill-switch threshold"
          icon={Activity}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Latest Signals</h3>
              <Badge variant="secondary">{signalsQuery.data?.length || 0}</Badge>
            </div>
            <Separator className="my-3" />

            <div className="space-y-2 max-h-[320px] overflow-auto pr-2">
              {(signalsQuery.data || []).slice(0, 20).map((signal) => {
                const market = marketMap.get(signal.marketId);
                return (
                  <div key={signal.id} className="border rounded-md p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm line-clamp-1">{market?.question || `Market #${signal.marketId}`}</p>
                      <Badge variant={signal.status === "executed" ? "default" : "secondary"}>{signal.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                      <span>Side: {signal.side}</span>
                      <span>Edge: {signal.edgeBps} bps</span>
                      <span>Confidence: {(signal.confidenceBps / 100).toFixed(1)}%</span>
                      <span>{formatTime(signal.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Open Positions</h3>
                <Badge variant="secondary">{positionsQuery.data?.length || 0}</Badge>
              </div>
              <Separator className="my-3" />
              <div className="space-y-2 max-h-[260px] overflow-auto pr-2">
                {(positionsQuery.data || []).slice(0, 15).map((position) => {
                  const market = marketMap.get(position.marketId);
                  return (
                    <div key={position.id} className="border rounded-md p-3">
                      <p className="font-medium text-sm line-clamp-1">{market?.question || `Market #${position.marketId}`}</p>
                      <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                        <span>{position.side}</span>
                        <span>Size: {formatCurrency(position.sizeUsd)}</span>
                        <span>Entry: {position.avgEntryBps ? `${(position.avgEntryBps / 100).toFixed(1)}%` : "-"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Order Ledger</h3>
                <Badge variant="secondary">{ordersQuery.data?.length || 0}</Badge>
              </div>
              <Separator className="my-3" />
              <div className="space-y-2 max-h-[260px] overflow-auto pr-2">
                {(ordersQuery.data || []).slice(0, 15).map((order) => {
                  const market = marketMap.get(order.marketId);
                  return (
                    <div key={order.id} className="border rounded-md p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm line-clamp-1">{market?.question || `Market #${order.marketId}`}</p>
                        <Badge variant="outline">{order.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                        <span>{order.side}</span>
                        <span>{formatCurrency(order.sizeUsd)}</span>
                        <span>{order.priceBps ? `${(order.priceBps / 100).toFixed(1)}%` : "-"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Market Coverage</h3>
              <Badge variant="secondary">{marketsQuery.data?.length || 0}</Badge>
            </div>
            <Separator className="my-3" />
            <div className="space-y-2 max-h-[260px] overflow-auto pr-2">
              {(marketsQuery.data || []).slice(0, 20).map((market) => (
                <div key={market.id} className="border rounded-md p-3">
                  <p className="font-medium text-sm line-clamp-1">{market.question}</p>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-3">
                    <span>{market.category || "Uncategorized"}</span>
                    <span>YES {(market.yesPriceBps || 0) / 100}%</span>
                    <span>Spread {(market.spreadBps || 0) / 100}%</span>
                    <span>Vol24h {formatCurrency(market.volume24hUsd || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <RiskLimitsForm
            policy={riskPolicyQuery.data}
            pending={patchRiskMutation.isPending}
            onSave={(patch) => patchRiskMutation.mutate(patch)}
          />

          <Card className="p-4">
            <h3 className="font-medium">Attribution</h3>
            <Separator className="my-3" />
            <div className="space-y-2 max-h-[220px] overflow-auto pr-2">
              {(attributionQuery.data || []).slice(0, 8).map((report) => (
                <div key={report.id} className="border rounded-md p-3">
                  <p className="text-sm">{report.summary || "No summary available"}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatTime(report.generatedAt)}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-medium">Drift Events</h3>
            <Separator className="my-3" />
            <div className="space-y-2 max-h-[220px] overflow-auto pr-2">
              {(driftQuery.data || []).slice(0, 8).map((event) => (
                <div key={event.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{event.metric}</p>
                    <Badge variant={event.severity === "high" ? "destructive" : "secondary"}>{event.severity}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{event.value} at {formatTime(event.detectedAt)}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
