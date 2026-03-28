import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/queryClient";
import { Shield, AlertTriangle, Globe, Lock } from "lucide-react";

interface SipSecurityEvent {
  id: number;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  sourceIp: string;
  geoCountry: string;
  attemptCount: number;
  isBlocked: boolean;
  detectedAt: string;
}

interface IpBlocklistEntry {
  id: number;
  ipAddress: string;
  reason: string;
  source: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export default function SipSecurity() {
  const [activeTab, setActiveTab] = useState<"events" | "blocklist">("events");
  const [searchTerm, setSearchTerm] = useState("");
  const [blockIp, setBlockIp] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const queryClient = useQueryClient();

  const { data: events = [] } = useQuery<SipSecurityEvent[]>({
    queryKey: ["/api/sip-security/events"],
  });

  const { data: blocklist = [] } = useQuery<IpBlocklistEntry[]>({
    queryKey: ["/api/sip-security/blocklist"],
  });

  const blockMutation = useMutation({
    mutationFn: (data: { ipAddress: string; reason: string }) =>
      apiRequest("POST", "/api/sip-security/blocklist", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sip-security/blocklist"] });
      setBlockIp("");
      setBlockReason("");
    },
  });

  const unblockMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/sip-security/blocklist/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/sip-security/blocklist"] }),
  });

  const openEvents = events.filter((e) => !e.isBlocked).length;
  const blockedIps = blocklist.filter((b) => b.isActive).length;
  const today = new Date().toDateString();
  const attacksToday = events.filter(
    (e) => new Date(e.detectedAt).toDateString() === today
  ).length;
  const countriesBlocked = new Set(blocklist.map((b) => b.ipAddress.split(".").slice(0, 2).join("."))).size;

  const filteredEvents = events.filter(
    (e) =>
      e.sourceIp.includes(searchTerm) ||
      e.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.geoCountry.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBlocklist = blocklist.filter(
    (b) =>
      b.ipAddress.includes(searchTerm) ||
      b.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="SIP Security Monitor" description="Monitor SIP attacks, brute force attempts, and manage IP blocklist" />

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
              <Lock className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{blockedIps}</p>
                <p className="text-sm text-muted-foreground">Blocked IPs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{attacksToday}</p>
                <p className="text-sm text-muted-foreground">Attacks Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{countriesBlocked}</p>
                <p className="text-sm text-muted-foreground">IP Ranges Blocked</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === "events" ? "default" : "outline"}
          onClick={() => setActiveTab("events")}
          data-testid="tab-security-events"
        >
          Security Events
        </Button>
        <Button
          variant={activeTab === "blocklist" ? "default" : "outline"}
          onClick={() => setActiveTab("blocklist")}
          data-testid="tab-ip-blocklist"
        >
          IP Blocklist
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
          <CardHeader><CardTitle>Security Events</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Source IP</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Blocked</TableHead>
                  <TableHead>Detected At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No security events found
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
                      <TableCell className="font-mono">{event.sourceIp}</TableCell>
                      <TableCell>{event.geoCountry}</TableCell>
                      <TableCell className="font-bold text-red-600">{event.attemptCount}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${event.isBlocked ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                          {event.isBlocked ? "Blocked" : "Open"}
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

      {activeTab === "blocklist" && (
        <Card>
          <CardHeader>
            <CardTitle>IP Blocklist</CardTitle>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="IP Address"
                value={blockIp}
                onChange={(e) => setBlockIp(e.target.value)}
                className="max-w-xs font-mono"
              />
              <Input
                placeholder="Reason"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="max-w-xs"
              />
              <Button
                onClick={() => blockMutation.mutate({ ipAddress: blockIp, reason: blockReason })}
                disabled={!blockIp || blockMutation.isPending}
                data-testid="button-block-ip"
              >
                <Lock className="h-4 w-4 mr-2" /> Block IP
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBlocklist.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No blocked IPs
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBlocklist.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono">{entry.ipAddress}</TableCell>
                      <TableCell>{entry.reason}</TableCell>
                      <TableCell>{entry.source}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.isActive ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                          {entry.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {entry.expiresAt ? new Date(entry.expiresAt).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unblockMutation.mutate(entry.id)}
                          data-testid={`button-unblock-ip-${entry.id}`}
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
