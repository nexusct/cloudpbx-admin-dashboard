import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { GitBranch, TrendingDown, Users, Target } from "lucide-react";

interface IvrAnalyticsNode {
  id: number;
  nodeId: string;
  nodeLabel: string;
  nodeType: "menu" | "input" | "transfer" | "announcement" | "hangup";
  totalEntries: number;
  totalAbandoned: number;
  avgTimeSpent: number;
  parentNodeId: string | null;
  measuredAt: string;
}

export default function IvrAnalytics() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: nodes = [] } = useQuery<IvrAnalyticsNode[]>({
    queryKey: ["/api/ivr-analytics"],
  });

  const filtered = nodes.filter(
    (n) =>
      n.nodeLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.nodeType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCalls = nodes.reduce((sum, n) => (n.parentNodeId === null ? sum + n.totalEntries : sum), 0);
  const totalAbandoned = nodes.reduce((sum, n) => sum + n.totalAbandoned, 0);
  const avgAbandonment =
    nodes.length > 0
      ? (nodes.reduce((sum, n) => sum + (n.totalEntries > 0 ? (n.totalAbandoned / n.totalEntries) * 100 : 0), 0) / nodes.length).toFixed(1)
      : "0.0";
  const mostPopular = nodes.reduce(
    (best, n) => (n.totalEntries > (best?.totalEntries ?? 0) ? n : best),
    nodes[0]
  );
  const completionRate =
    totalCalls > 0 ? Math.round(((totalCalls - totalAbandoned) / totalCalls) * 100) : 0;

  const maxEntries = Math.max(...nodes.map((n) => n.totalEntries), 1);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="IVR Node Analytics" description="Performance analytics for IVR menu nodes and call flows" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalCalls.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total IVR Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{avgAbandonment}%</p>
                <p className="text-sm text-muted-foreground">Avg Abandonment</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <GitBranch className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-bold truncate">{mostPopular?.nodeLabel ?? "—"}</p>
                <p className="text-sm text-muted-foreground">Most Popular</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" /> IVR Flow Funnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {nodes
              .sort((a, b) => b.totalEntries - a.totalEntries)
              .slice(0, 8)
              .map((node) => (
                <div key={node.id} className="flex items-center gap-3">
                  <span className="text-sm w-40 truncate text-right text-muted-foreground">{node.nodeLabel}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full flex items-center px-2"
                      style={{ width: `${(node.totalEntries / maxEntries) * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium whitespace-nowrap">
                        {node.totalEntries.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-red-500 w-16 text-right">
                    -{node.totalAbandoned} dropped
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Node Performance</CardTitle>
          <Input
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Node Label</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Total Entries</TableHead>
                <TableHead>Abandoned</TableHead>
                <TableHead>Abandonment Rate</TableHead>
                <TableHead>Avg Time (s)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No IVR nodes found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((node) => {
                  const abandonmentRate =
                    node.totalEntries > 0
                      ? ((node.totalAbandoned / node.totalEntries) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <TableRow key={node.id}>
                      <TableCell className="font-medium">{node.nodeLabel}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                          {node.nodeType}
                        </span>
                      </TableCell>
                      <TableCell>{node.totalEntries.toLocaleString()}</TableCell>
                      <TableCell className="text-red-600">{node.totalAbandoned}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${parseFloat(abandonmentRate) > 20 ? "text-red-600" : "text-green-600"}`}>
                          {abandonmentRate}%
                        </span>
                      </TableCell>
                      <TableCell>{node.avgTimeSpent}s</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
