import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { Map, Route, Phone, ArrowRight } from "lucide-react";

interface CallJourney {
  id: number;
  callId: string;
  callerNumber: string;
  entryPoint: string;
  exitReason: string;
  totalDuration: number;
  wasTransferred: boolean;
  transferCount: number;
  holdCount: number;
  steps: Array<{ type: string; label: string; duration: number }>;
  startedAt: string;
}

export default function CallJourney() {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: journeys = [] } = useQuery<CallJourney[]>({
    queryKey: ["/api/call-journeys"],
  });

  const filtered = journeys.filter(
    (j) =>
      j.callId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.callerNumber.includes(searchTerm)
  );

  const avgLength =
    journeys.length > 0
      ? Math.round(journeys.reduce((sum, j) => sum + j.totalDuration, 0) / journeys.length)
      : 0;

  const maxTransfers = journeys.length > 0 ? Math.max(...journeys.map((j) => j.transferCount)) : 0;
  const avgHold =
    journeys.length > 0
      ? Math.round(journeys.reduce((sum, j) => sum + j.holdCount, 0) / journeys.length)
      : 0;
  const abandoned = journeys.filter((j) => j.exitReason === "abandoned").length;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const stepTypeColor: Record<string, string> = {
    ivr: "bg-blue-100 text-blue-700",
    queue: "bg-yellow-100 text-yellow-700",
    agent: "bg-green-100 text-green-700",
    hold: "bg-orange-100 text-orange-700",
    transfer: "bg-purple-100 text-purple-700",
    voicemail: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Call Journey Mapper" description="Visualize the complete path of each call through the system" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Map className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{formatDuration(avgLength)}</p>
                <p className="text-sm text-muted-foreground">Avg Journey</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Route className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{maxTransfers}</p>
                <p className="text-sm text-muted-foreground">Most Transfers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Phone className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{avgHold}</p>
                <p className="text-sm text-muted-foreground">Avg Hold Count</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ArrowRight className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{abandoned}</p>
                <p className="text-sm text-muted-foreground">Abandoned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Call Journeys</CardTitle>
          <Input
            placeholder="Search by call ID or number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Call ID</TableHead>
                <TableHead>Caller</TableHead>
                <TableHead>Entry Point</TableHead>
                <TableHead>Exit Reason</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Transfers</TableHead>
                <TableHead>Holds</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No call journeys found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((journey) => (
                  <>
                    <TableRow
                      key={journey.id}
                      className="cursor-pointer"
                      onClick={() => setExpandedId(expandedId === journey.id ? null : journey.id)}
                    >
                      <TableCell className="font-mono text-sm">{journey.callId}</TableCell>
                      <TableCell className="font-mono">{journey.callerNumber}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{journey.entryPoint}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${journey.exitReason === "abandoned" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {journey.exitReason}
                        </span>
                      </TableCell>
                      <TableCell>{formatDuration(journey.totalDuration)}</TableCell>
                      <TableCell>
                        {journey.wasTransferred ? (
                          <Badge variant="outline">{journey.transferCount}x</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{journey.holdCount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(journey.startedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <button className="text-blue-500 text-sm hover:underline">
                          {expandedId === journey.id ? "▲ Hide" : "▼ Show"}
                        </button>
                      </TableCell>
                    </TableRow>
                    {expandedId === journey.id && (
                      <TableRow key={`${journey.id}-detail`}>
                        <TableCell colSpan={9} className="bg-muted/30 p-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            {(journey.steps ?? []).map((step, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <div className={`px-2 py-1 rounded text-xs font-medium ${stepTypeColor[step.type] ?? "bg-gray-100 text-gray-700"}`}>
                                  {step.label}
                                  <span className="ml-1 opacity-70">({step.duration}s)</span>
                                </div>
                                {i < (journey.steps ?? []).length - 1 && (
                                  <ArrowRight className="h-3 w-3 text-gray-400" />
                                )}
                              </div>
                            ))}
                            {(!journey.steps || journey.steps.length === 0) && (
                              <span className="text-muted-foreground text-sm">No step details available</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
