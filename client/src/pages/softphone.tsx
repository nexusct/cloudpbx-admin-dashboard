import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/queryClient";
import { Phone, PhoneCall, PhoneOff, Mic } from "lucide-react";

interface SoftphoneSession {
  id: number;
  sessionId: string;
  direction: "inbound" | "outbound";
  status: "active" | "idle" | "missed" | "ended";
  duration: number;
  remoteNumber: string;
  startedAt: string;
}

const dialSchema = z.object({
  remoteNumber: z.string().min(1),
  direction: z.enum(["inbound", "outbound"]),
});

type DialForm = z.infer<typeof dialSchema>;

export default function Softphone() {
  const [dialInput, setDialInput] = useState("");
  const [isCallActive, setIsCallActive] = useState(false);
  const queryClient = useQueryClient();

  const { data: sessions = [] } = useQuery<SoftphoneSession[]>({
    queryKey: ["/api/softphone/sessions"],
  });

  const form = useForm<DialForm>({
    resolver: zodResolver(dialSchema),
    defaultValues: { remoteNumber: "", direction: "outbound" },
  });

  const callMutation = useMutation({
    mutationFn: (data: DialForm) => apiRequest("POST", "/api/softphone/sessions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/softphone/sessions"] });
      setIsCallActive(true);
    },
  });

  const hangupMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiRequest("PATCH", `/api/softphone/sessions/${sessionId}`, { status: "ended" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/softphone/sessions"] });
      setIsCallActive(false);
      setDialInput("");
    },
  });

  const activeCalls = sessions.filter((s) => s.status === "active").length;
  const idleSessions = sessions.filter((s) => s.status === "idle").length;
  const missedCalls = sessions.filter((s) => s.status === "missed").length;

  const handleDialKey = (key: string) => setDialInput((prev) => prev + key);
  const handleBackspace = () => setDialInput((prev) => prev.slice(0, -1));

  const handleCall = () => {
    if (dialInput) {
      callMutation.mutate({ remoteNumber: dialInput, direction: "outbound" });
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const statusColor: Record<string, string> = {
    active: "bg-green-100 text-green-800",
    idle: "bg-gray-100 text-gray-800",
    missed: "bg-red-100 text-red-800",
    ended: "bg-blue-100 text-blue-800",
  };

  const dialKeys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"],
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="WebRTC Softphone" description="In-browser SIP softphone with WebRTC calling" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <PhoneCall className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeCalls}</p>
                <p className="text-sm text-muted-foreground">Active Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mic className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{idleSessions}</p>
                <p className="text-sm text-muted-foreground">Idle</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <PhoneOff className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{missedCalls}</p>
                <p className="text-sm text-muted-foreground">Missed Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" /> Dial Pad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <Input
                value={dialInput}
                onChange={(e) => setDialInput(e.target.value)}
                placeholder="Enter number..."
                className="text-center text-xl font-mono"
              />
              <div className="grid grid-cols-3 gap-2 w-48">
                {dialKeys.flat().map((key) => (
                  <Button
                    key={key}
                    variant="outline"
                    className="h-12 text-lg font-semibold"
                    onClick={() => handleDialKey(key)}
                    data-testid={`dial-key-${key}`}
                  >
                    {key}
                  </Button>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <Button
                  variant="outline"
                  onClick={handleBackspace}
                  data-testid="button-backspace"
                >
                  ⌫
                </Button>
                {!isCallActive ? (
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white px-6"
                    onClick={handleCall}
                    disabled={!dialInput || callMutation.isPending}
                    data-testid="button-call"
                  >
                    <PhoneCall className="h-5 w-5 mr-2" /> Call
                  </Button>
                ) : (
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white px-6"
                    onClick={() => hangupMutation.mutate(dialInput)}
                    disabled={hangupMutation.isPending}
                    data-testid="button-hangup"
                  >
                    <PhoneOff className="h-5 w-5 mr-2" /> Hangup
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Number</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No sessions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono text-sm">{session.sessionId}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{session.direction}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[session.status]}`}>
                          {session.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDuration(session.duration)}</TableCell>
                      <TableCell className="font-mono">{session.remoteNumber}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
