import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Play, Square, ShieldAlert } from "lucide-react";

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

interface ControlPanelProps {
  runtime: RuntimeState | undefined;
  startPending: boolean;
  stopPending: boolean;
  killPending: boolean;
  onStart: () => void;
  onStop: () => void;
  onKillSwitch: () => void;
}

function formatTime(value: string | null): string {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function TradingControlPanel({
  runtime,
  startPending,
  stopPending,
  killPending,
  onStart,
  onStop,
  onKillSwitch,
}: ControlPanelProps) {
  const controlsDisabled = !runtime;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant={runtime?.tradingActive ? "default" : "secondary"}>
            {runtime?.tradingActive ? "Trading Active" : "Trading Stopped"}
          </Badge>
          <Badge variant={runtime?.killSwitchActive ? "destructive" : "outline"}>
            {runtime?.killSwitchActive ? "Kill Switch Active" : "Kill Switch Clear"}
          </Badge>
          <Badge variant={runtime?.modelServiceHealthy ? "default" : "secondary"}>
            {runtime?.modelServiceHealthy ? "Model Service Healthy" : "Model Service Fallback"}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={onStart}
            disabled={controlsDisabled || startPending || runtime?.tradingActive}
            data-testid="button-trading-start"
          >
            {startPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
            Start
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onStop}
            disabled={controlsDisabled || stopPending || !runtime?.tradingActive}
            data-testid="button-trading-stop"
          >
            {stopPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Square className="h-4 w-4 mr-2" />}
            Stop
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onKillSwitch}
            disabled={controlsDisabled || killPending}
            data-testid="button-trading-kill-switch"
          >
            {killPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldAlert className="h-4 w-4 mr-2" />}
            Kill Switch
          </Button>
        </div>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-md border p-2">
          <div className="text-muted-foreground">Last cycle</div>
          <div className="font-medium">{formatTime(runtime?.lastCycleAt || null)}</div>
        </div>
        <div className="rounded-md border p-2">
          <div className="text-muted-foreground">Next cycle</div>
          <div className="font-medium">{formatTime(runtime?.nextCycleAt || null)}</div>
        </div>
        <div className="rounded-md border p-2">
          <div className="text-muted-foreground">Cadence</div>
          <div className="font-medium">{Math.round((runtime?.cycleIntervalMs || 0) / 60_000)} min</div>
        </div>
      </div>

      {runtime?.recentErrors?.length ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm font-medium mb-1">Recent errors</p>
          <ul className="text-xs space-y-1 text-muted-foreground">
            {runtime.recentErrors.slice(0, 4).map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
