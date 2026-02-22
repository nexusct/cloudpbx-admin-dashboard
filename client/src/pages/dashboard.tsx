import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Users,
  MessageSquare,
  Activity,
  Server,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Headphones,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Extension, CallLog, SmsMessage } from "@shared/schema";

interface DashboardStats {
  totalCalls: number;
  activeCalls: number;
  extensionsOnline: number;
  totalExtensions: number;
  missedCalls: number;
  avgCallDuration: string;
  smsToday: number;
  systemUptime: string;
  totalDids: number;
  totalRingGroups: number;
  totalQueues: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: callLogs = [], isLoading: callLogsLoading, isSuccess: callLogsSuccess } = useQuery<CallLog[]>({
    queryKey: ["/api/call-logs"],
  });

  const { data: extensions = [], isLoading: extensionsLoading, isSuccess: extensionsSuccess } = useQuery<Extension[]>({
    queryKey: ["/api/extensions"],
  });

  const { data: smsMessages = [], isLoading: smsLoading, isSuccess: smsSuccess } = useQuery<SmsMessage[]>({
    queryKey: ["/api/sms"],
  });

  const totalCalls = callLogs.length;
  const activeExtensions = extensions.filter(
    (e) => e.status === "online" || e.status === "busy"
  );
  const missedCalls = callLogs.filter((c) => c.status === "missed").length;
  const recentCalls = [...callLogs]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5);

  const systemHealth = [
    { name: "Call Logs", status: callLogsSuccess ? "online" : "offline", latency: callLogsLoading ? "..." : "OK" },
    { name: "Extensions", status: extensionsSuccess ? "online" : "offline", latency: extensionsLoading ? "..." : "OK" },
    { name: "SMS Service", status: smsSuccess ? "online" : "offline", latency: smsLoading ? "..." : "OK" },
    { name: "Dashboard API", status: stats ? "online" : "offline", latency: statsLoading ? "..." : "OK" },
  ];

  const allOnline = systemHealth.every((s) => s.status === "online");
  const isLoading = statsLoading || callLogsLoading || extensionsLoading || smsLoading;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const formatTimeAgo = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader 
        title="Dashboard" 
        description="Overview of your phone system performance"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Total Calls Today"
              value={totalCalls.toLocaleString()}
              description="Across all extensions"
              icon={Phone}
              trend={{ value: 12, isPositive: true }}
            />
            <StatCard
              title="Active Calls"
              value={stats?.activeCalls ?? 0}
              description="Currently in progress"
              icon={Headphones}
              iconColor="text-green-600 dark:text-green-400"
            />
            <StatCard
              title="Extensions Online"
              value={`${activeExtensions.length}/${extensions.length}`}
              description={`${extensions.length > 0 ? Math.round((activeExtensions.length / extensions.length) * 100) : 0}% availability`}
              icon={Users}
            />
            <StatCard
              title="Missed Calls"
              value={missedCalls}
              description="Needs attention"
              icon={PhoneMissed}
              iconColor="text-red-600 dark:text-red-400"
              trend={{ value: 8, isPositive: false }}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Recent Calls</h3>
              <p className="text-sm text-muted-foreground">Latest call activity across the system</p>
            </div>
            <Button variant="outline" size="sm" data-testid="button-view-all-calls">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {callLogsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-md bg-muted/50">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))
            ) : recentCalls.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No call logs yet
              </div>
            ) : (
              recentCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center gap-4 p-3 rounded-md bg-muted/50"
                  data-testid={`call-log-item-${call.id}`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    call.direction === "inbound" 
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  }`}>
                    {call.direction === "inbound" ? (
                      <PhoneIncoming className="h-4 w-4" />
                    ) : (
                      <PhoneOutgoing className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{call.fromNumber}</span>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground truncate">{call.toNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{call.fromName || "Unknown"}</span>
                      <span className="text-muted-foreground/50">-</span>
                      <span>{formatTimeAgo(call.startTime)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {call.duration !== null && call.duration > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(call.duration)}
                      </div>
                    )}
                    <StatusBadge status={call.status as any} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Active Extensions</h3>
                <p className="text-sm text-muted-foreground">Currently online staff</p>
              </div>
            </div>
            <div className="space-y-2">
              {extensionsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-md">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-2 w-2 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-14" />
                  </div>
                ))
              ) : activeExtensions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No active extensions
                </div>
              ) : (
                activeExtensions.map((ext) => (
                  <div
                    key={ext.number}
                    className="flex items-center justify-between p-2 rounded-md hover-elevate"
                    data-testid={`extension-${ext.number}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${
                        ext.status === "online" ? "bg-green-500" :
                        ext.status === "busy" ? "bg-red-500" :
                        ext.status === "away" ? "bg-amber-500" : "bg-gray-400"
                      }`} />
                      <div>
                        <div className="text-sm font-medium">{ext.name}</div>
                        <div className="text-xs text-muted-foreground">Ext. {ext.number}</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {ext.department || ext.type}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">System Health</h3>
                <p className="text-sm text-muted-foreground">Service status</p>
              </div>
              <Badge variant="secondary" className={`border-0 ${
                allOnline
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              }`}>
                {allOnline ? "All Online" : "Degraded"}
              </Badge>
            </div>
            <div className="space-y-2">
              {systemHealth.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-2"
                  data-testid={`service-${service.name.toLowerCase().replace(" ", "-")}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${
                      service.status === "online" ? "bg-green-500" : "bg-red-500"
                    }`} />
                    <span className="text-sm">{service.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{service.latency}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </Card>
            ))}
          </>
        ) : (
          <>
            <StatCard
              title="Avg. Call Duration"
              value={stats?.avgCallDuration ?? "-"}
              description="Last 24 hours"
              icon={Clock}
            />
            <StatCard
              title="SMS Messages"
              value={smsMessages.length}
              description="Total messages"
              icon={MessageSquare}
            />
            <StatCard
              title="System Uptime"
              value={stats?.systemUptime ?? "-"}
              description="Last 30 days"
              icon={Activity}
            />
            <StatCard
              title="Active Servers"
              value={`${systemHealth.filter((s) => s.status === "online").length}/${systemHealth.length}`}
              description={allOnline ? "All systems operational" : "Some services degraded"}
              icon={Server}
            />
          </>
        )}
      </div>
    </div>
  );
}
