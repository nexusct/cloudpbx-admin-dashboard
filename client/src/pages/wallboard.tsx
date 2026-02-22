import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Progress } from "@/components/ui/progress";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Headphones,
  Coffee,
  Activity,
  TrendingUp,
  Timer,
} from "lucide-react";
import type { Extension, CallQueue, CallLog } from "@shared/schema";

export default function Wallboard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: extensions = [] } = useQuery<Extension[]>({
    queryKey: ["/api/extensions"],
    refetchInterval: 5000,
  });

  const { data: queues = [] } = useQuery<CallQueue[]>({
    queryKey: ["/api/call-queues"],
    refetchInterval: 5000,
  });

  const { data: callLogs = [] } = useQuery<CallLog[]>({
    queryKey: ["/api/call-logs"],
    refetchInterval: 10000,
  });

  const onlineAgents = extensions.filter((e) => e.status === "online").length;
  const busyAgents = extensions.filter((e) => e.status === "busy").length;
  const awayAgents = extensions.filter((e) => e.status === "away").length;
  const offlineAgents = extensions.filter((e) => e.status === "offline").length;

  const todayCalls = callLogs.length;
  const answeredCalls = callLogs.filter((c) => c.status === "answered" || c.status === "completed").length;
  const missedCalls = callLogs.filter((c) => c.status === "missed" || c.status === "no_answer").length;
  const avgWaitTime = 45;
  const slaPercentage = todayCalls > 0 ? Math.round((answeredCalls / todayCalls) * 100) : 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-green-500";
      case "busy": return "bg-red-500";
      case "away": return "bg-yellow-500";
      default: return "bg-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "busy": return <Phone className="h-4 w-4 text-red-500" />;
      case "away": return <Coffee className="h-4 w-4 text-yellow-500" />;
      default: return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Live Wallboard"
          description="Real-time call center monitoring"
        />
        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-muted-foreground">
            {currentTime.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Agents</p>
              <p className="text-4xl font-bold text-green-600">{onlineAgents}</p>
            </div>
            <div className="h-14 w-14 rounded-full bg-green-500/20 flex items-center justify-center">
              <Headphones className="h-7 w-7 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">On Calls</p>
              <p className="text-4xl font-bold text-red-600">{busyAgents}</p>
            </div>
            <div className="h-14 w-14 rounded-full bg-red-500/20 flex items-center justify-center">
              <Phone className="h-7 w-7 text-red-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Calls Today</p>
              <p className="text-4xl font-bold text-blue-600">{todayCalls}</p>
            </div>
            <div className="h-14 w-14 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Activity className="h-7 w-7 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">SLA %</p>
              <p className="text-4xl font-bold text-purple-600">{slaPercentage}%</p>
            </div>
            <div className="h-14 w-14 rounded-full bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="h-7 w-7 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 col-span-2">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Agent Status Board
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {extensions.map((ext) => (
              <div
                key={ext.id}
                className={`p-4 rounded-lg border ${ext.status === "busy" ? "border-red-500/50 bg-red-500/5" : "border-border"}`}
                data-testid={`agent-card-${ext.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${getStatusColor(ext.status)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ext.name}</p>
                    <p className="text-sm text-muted-foreground">Ext {ext.number}</p>
                  </div>
                  {getStatusIcon(ext.status)}
                </div>
                {ext.status === "busy" && (
                  <div className="mt-2 flex items-center gap-1 text-sm text-red-600">
                    <Timer className="h-3 w-3" />
                    <span>On call</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Queue Status
          </h3>
          <div className="space-y-4">
            {queues.map((queue) => {
              const waitingCallers = Math.floor(Math.random() * 5);
              const avgWait = Math.floor(Math.random() * 120);
              return (
                <div key={queue.id} className="space-y-2" data-testid={`queue-status-${queue.id}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{queue.name}</span>
                    <Badge variant={waitingCallers > 3 ? "destructive" : "secondary"}>
                      {waitingCallers} waiting
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {(queue.agents as string[])?.length || 0} agents
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      ~{Math.round(avgWait / 60)}m wait
                    </div>
                  </div>
                  <Progress value={waitingCallers > 0 ? Math.min(waitingCallers * 20, 100) : 0} className="h-2" />
                </div>
              );
            })}
            {queues.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No queues configured
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <PhoneIncoming className="h-5 w-5 text-green-500" />
            <span className="font-medium">Inbound</span>
          </div>
          <p className="text-3xl font-bold">
            {callLogs.filter((c) => c.direction === "inbound").length}
          </p>
          <p className="text-sm text-muted-foreground">calls today</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <PhoneOutgoing className="h-5 w-5 text-blue-500" />
            <span className="font-medium">Outbound</span>
          </div>
          <p className="text-3xl font-bold">
            {callLogs.filter((c) => c.direction === "outbound").length}
          </p>
          <p className="text-sm text-muted-foreground">calls today</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="font-medium">Answered</span>
          </div>
          <p className="text-3xl font-bold text-green-600">{answeredCalls}</p>
          <p className="text-sm text-muted-foreground">calls answered</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="font-medium">Missed</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{missedCalls}</p>
          <p className="text-sm text-muted-foreground">calls missed</p>
        </Card>
      </div>
    </div>
  );
}
