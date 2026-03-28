import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/queryClient";
import { Shield, AlertTriangle, Ban, DollarSign } from "lucide-react";

interface FraudEvent {
  id: number;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  sourceNumber: string;
  description: string;
  status: "open" | "investigating" | "resolved";
  detectedAt: string;
  estimatedLoss: number;
}

interface BlockedNumber {
  id: number;
  number: string;
  reason: string;
  source: string;
  isActive: boolean;
  createdAt: string;
}

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

const statusColors: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  investigating: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
};

export default function FraudDetection() {
  const [activeTab, setActiveTab] = useState<"events" | "blocked">("events");
  const [searchTerm, setSearchTerm] = useState("");
  const [blockNumber, setBlockNumber] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery<FraudEvent[]>({
    queryKey: ["/api/fraud-events"],
  });

  const { data: blockedNumbers = [] } = useQuery<BlockedNumber[]>({
    queryKey: ["/api/blocked-numbers"],
  });

  const blockMutation = useMutation({
    mutationFn: (data: { number: string; reason: string }) =>
      apiRequest("POST", "/api/blocked-numbers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blocked-numbers"] });
      setBlockNumber("");
      setBlockReason("");
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/blocked-numbers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/blocked-numbers"] }),
  });

  const openEvents = events.filter((e) => e.status === "open").length;
  const criticalEvents = events.filter((e) => e.severity === "critical").length;
  const activeBlocked = blockedNumbers.filter((b) => b.isActive).length;
  const estimatedLoss = events.reduce((sum, e) => sum + (e.estimatedLoss ?? 0), 0);

  const filteredEvents = events.filter(
    (e) =>
      e.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.sourceNumber.includes(searchTerm)
  );

  const filteredBlocked = blockedNumbers.filter((b) =>
    b.number.includes(searchTerm) || b.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Fraud Detection Engine" description="Monitor and prevent fraudulent call activity in real-time" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{openEvents}</p>
                <p className="text-sm text-muted-foreground">Open Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{criticalEvents}</p>
                <p className="text-sm text-muted-foreground">Critical Severity</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Ban className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{activeBlocked}</p>
                <p className="text-sm text-muted-foreground">Blocked Numbers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">${estimatedLoss.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Est. Loss</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === "events" ? "default" : "outline"}
          onClick={() => setActiveTab("events")}
          data-testid="tab-fraud-events"
        >
          Fraud Events
        </Button>
        <Button
          variant={activeTab === "blocked" ? "default" : "outline"}
          onClick={() => setActiveTab("blocked")}
          data-testid="tab-blocked-numbers"
        >
          Blocked Numbers
        </Button>
      </div>

      <Input
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      {activeTab === "events" && (
        <Card>
          <CardHeader><CardTitle>Fraud Events</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Source Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Detected At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No fraud events found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.type}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[event.severity]}`}>
                          {event.severity}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono">{event.sourceNumber}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm">{event.description}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[event.status]}`}>
                          {event.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(event.detectedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "blocked" && (
        <Card>
          <CardHeader>
            <CardTitle>Blocked Numbers</CardTitle>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Number to block"
                value={blockNumber}
                onChange={(e) => setBlockNumber(e.target.value)}
                className="max-w-xs"
              />
              <Input
                placeholder="Reason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="max-w-xs"
              />
              <Button
                onClick={() => blockMutation.mutate({ number: blockNumber, reason: blockReason })}
                disabled={!blockNumber || blockMutation.isPending}
                data-testid="button-block-number"
              >
                <Ban className="h-4 w-4 mr-2" /> Block
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBlocked.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No blocked numbers
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBlocked.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono">{b.number}</TableCell>
                      <TableCell>{b.reason}</TableCell>
                      <TableCell>{b.source}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {b.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => unblockMutation.mutate(b.id)}
                          data-testid={`button-unblock-${b.id}`}
                        >
                          Unblock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
