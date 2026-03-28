import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { Wifi, Activity, AlertTriangle, Signal } from "lucide-react";

interface NetworkQualityRecord {
  id: number;
  trunkId: string;
  mosScore: number;
  jitter: number;
  latency: number;
  packetLoss: number;
  qualityRating: "excellent" | "good" | "fair" | "poor";
  codecUsed: string;
  measuredAt: string;
}

const qualityColors: Record<string, string> = {
  excellent: "bg-green-100 text-green-800",
  good: "bg-blue-100 text-blue-800",
  fair: "bg-yellow-100 text-yellow-800",
  poor: "bg-red-100 text-red-800",
};

export default function NetworkQuality() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: records = [] } = useQuery<NetworkQualityRecord[]>({
    queryKey: ["/api/network-quality"],
  });

  const filtered = records.filter((r) =>
    r.trunkId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.codecUsed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avgMos =
    records.length > 0
      ? (records.reduce((sum, r) => sum + r.mosScore, 0) / records.length).toFixed(2)
      : "0.00";

  const poorQuality = records.filter((r) => r.qualityRating === "poor").length;
  const alerts = records.filter((r) => r.mosScore < 3.0 || r.packetLoss > 5).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Network Quality Monitor" description="Real-time MOS scores, jitter, latency, and packet loss monitoring" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Signal className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{avgMos}</p>
                <p className="text-sm text-muted-foreground">Avg MOS Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wifi className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{poorQuality}</p>
                <p className="text-sm text-muted-foreground">Poor Quality Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{alerts}</p>
                <p className="text-sm text-muted-foreground">Alerts Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> Network Quality Records
          </CardTitle>
          <Input
            placeholder="Search by trunk or codec..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trunk ID</TableHead>
                <TableHead>MOS Score</TableHead>
                <TableHead>Jitter (ms)</TableHead>
                <TableHead>Latency (ms)</TableHead>
                <TableHead>Packet Loss (%)</TableHead>
                <TableHead>Quality Rating</TableHead>
                <TableHead>Codec</TableHead>
                <TableHead>Measured At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No network quality records found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono font-medium">{record.trunkId}</TableCell>
                    <TableCell>
                      <span className={`font-bold ${record.mosScore >= 4.0 ? "text-green-600" : record.mosScore >= 3.0 ? "text-yellow-600" : "text-red-600"}`}>
                        {record.mosScore.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>{record.jitter} ms</TableCell>
                    <TableCell>{record.latency} ms</TableCell>
                    <TableCell>
                      <span className={record.packetLoss > 5 ? "text-red-600 font-bold" : ""}>
                        {record.packetLoss}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${qualityColors[record.qualityRating]}`}>
                        {record.qualityRating}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                        {record.codecUsed}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(record.measuredAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
