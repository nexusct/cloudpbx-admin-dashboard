import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  Users,
  Calendar,
  Activity,
  Target,
  AlertTriangle,
} from "lucide-react";
import type { CallLog, Extension, CallQueue } from "@shared/schema";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("today");

  const { data: callLogs = [] } = useQuery<CallLog[]>({
    queryKey: ["/api/call-logs"],
  });

  const { data: extensions = [] } = useQuery<Extension[]>({
    queryKey: ["/api/extensions"],
  });

  const { data: queues = [] } = useQuery<CallQueue[]>({
    queryKey: ["/api/call-queues"],
  });

  const totalCalls = callLogs.length;
  const inboundCalls = callLogs.filter((c) => c.direction === "inbound").length;
  const outboundCalls = callLogs.filter((c) => c.direction === "outbound").length;
  const missedCalls = callLogs.filter((c) => c.status === "missed" || c.status === "no_answer").length;
  const answeredCalls = callLogs.filter((c) => c.status === "answered" || c.status === "completed").length;
  const avgDuration = callLogs.length > 0
    ? Math.round(callLogs.reduce((acc, c) => acc + (c.duration || 0), 0) / callLogs.length)
    : 0;
  const answerRate = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const calls = callLogs.filter((c) => {
      const callHour = new Date(c.startTime).getHours();
      return callHour === hour;
    }).length;
    return { hour, calls };
  });

  const peakHour = hourlyData.reduce((max, curr) => curr.calls > max.calls ? curr : max, { hour: 0, calls: 0 });

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Call Analytics"
        description="Insights and trends from your phone system"
      >
        <div className="flex items-center gap-2">
          {["today", "week", "month"].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
              data-testid={`button-range-${range}`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Calls</p>
              <p className="text-3xl font-bold">{totalCalls}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <PhoneIncoming className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Inbound</p>
              <p className="text-3xl font-bold">{inboundCalls}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <PhoneOutgoing className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Outbound</p>
              <p className="text-3xl font-bold">{outboundCalls}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <PhoneMissed className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Missed</p>
              <p className="text-3xl font-bold">{missedCalls}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5" />
            Key Performance Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Answer Rate</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{answerRate}%</span>
                {answerRate >= 80 ? (
                  <TrendingUp className="h-5 w-5 text-green-500" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Avg Call Duration</span>
              <span className="text-2xl font-bold">{formatDuration(avgDuration)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Peak Hour</span>
              <span className="text-2xl font-bold">{peakHour.hour}:00</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-muted-foreground">Active Extensions</span>
              <span className="text-2xl font-bold">
                {extensions.filter((e) => e.status === "online" || e.status === "busy").length}
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Hourly Call Volume
          </h3>
          <div className="flex items-end gap-1 h-40">
            {hourlyData.map((data, idx) => (
              <div
                key={idx}
                className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t cursor-pointer relative group"
                style={{
                  height: `${Math.max(5, (data.calls / Math.max(...hourlyData.map((d) => d.calls), 1)) * 100)}%`,
                }}
                data-testid={`bar-hour-${data.hour}`}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  {data.hour}:00 - {data.calls} calls
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>12am</span>
            <span>6am</span>
            <span>12pm</span>
            <span>6pm</span>
            <span>12am</span>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Agents by Calls
          </h3>
          <div className="space-y-3">
            {extensions.slice(0, 5).map((ext, idx) => {
              const agentCalls = callLogs.filter((c) => c.extensionId === ext.id).length;
              const percentage = totalCalls > 0 ? (agentCalls / totalCalls) * 100 : 0;
              return (
                <div key={ext.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{ext.name}</span>
                    <span className="text-muted-foreground">{agentCalls} calls</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Queue Performance
          </h3>
          <div className="space-y-3">
            {queues.map((queue) => (
              <div key={queue.id} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{queue.name}</span>
                  <Badge variant="secondary">Ext {queue.number}</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Agents</span>
                    <p className="font-medium">{(queue.agents as string[])?.length || 0}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Wait</span>
                    <p className="font-medium">{Math.round((queue.maxWaitTime || 0) / 60)}m</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Strategy</span>
                    <p className="font-medium capitalize">{queue.strategy?.replace("_", " ")}</p>
                  </div>
                </div>
              </div>
            ))}
            {queues.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No queues configured
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
