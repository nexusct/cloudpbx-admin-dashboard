import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Download,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Play,
  Clock,
  Calendar,
  Filter,
  RefreshCw,
} from "lucide-react";
import type { CallLog } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

function formatDuration(seconds: number): string {
  if (seconds === 0) return "-";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function CallLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [direction, setDirection] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const { data: callLogs = [], isLoading } = useQuery<CallLog[]>({
    queryKey: ["/api/call-logs"],
  });

  const filteredLogs = callLogs.filter((log) => {
    const matchesSearch =
      log.fromNumber.includes(searchQuery) ||
      log.toNumber.includes(searchQuery) ||
      log.fromName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.toName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDirection = direction === "all" || log.direction === direction;
    const matchesStatus = status === "all" || log.status === status;
    return matchesSearch && matchesDirection && matchesStatus;
  });

  const logsWithDuration = callLogs.filter((l) => (l.duration ?? 0) > 0);
  const stats = {
    total: callLogs.length,
    inbound: callLogs.filter((l) => l.direction === "inbound").length,
    outbound: callLogs.filter((l) => l.direction === "outbound").length,
    missed: callLogs.filter((l) => l.status === "missed").length,
    avgDuration: logsWithDuration.length > 0
      ? Math.round(logsWithDuration.reduce((sum, l) => sum + (l.duration ?? 0), 0) / logsWithDuration.length)
      : 0,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader title="Call History" description="View and analyze call records" />
        <div className="text-center py-12 text-muted-foreground">Loading call logs...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Call History"
        description="View and analyze call records"
      >
        <Button
          variant="outline"
          size="sm"
          data-testid="button-refresh-logs"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/call-logs"] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button variant="outline" size="sm" data-testid="button-export-logs">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-5">
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <PhoneIncoming className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.inbound}</div>
            <div className="text-xs text-muted-foreground">Inbound</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <PhoneOutgoing className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.outbound}</div>
            <div className="text-xs text-muted-foreground">Outbound</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <PhoneMissed className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.missed}</div>
            <div className="text-xs text-muted-foreground">Missed</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
            <div className="text-xs text-muted-foreground">Avg Duration</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Today</div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 p-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search calls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-calls"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={direction} onValueChange={setDirection}>
              <SelectTrigger className="w-32" data-testid="filter-direction">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Calls</SelectItem>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-32" data-testid="filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="answered">Answered</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
                <SelectItem value="voicemail">Voicemail</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id} data-testid={`call-row-${log.id}`}>
                <TableCell>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    log.direction === "inbound"
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  }`}>
                    {log.direction === "inbound" ? (
                      <PhoneIncoming className="h-4 w-4" />
                    ) : (
                      <PhoneOutgoing className="h-4 w-4" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{log.fromName || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground font-mono">{log.fromNumber}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{log.toName || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground font-mono">{log.toNumber}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={log.status as any} />
                </TableCell>
                <TableCell className="font-mono">{formatDuration(log.duration ?? 0)}</TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span>{formatTime(String(log.startTime))}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(String(log.startTime))}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {log.recordingUrl && (
                    <Button variant="ghost" size="icon" data-testid={`play-recording-${log.id}`}>
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
