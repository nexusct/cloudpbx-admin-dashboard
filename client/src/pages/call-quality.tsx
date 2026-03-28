import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { Star, TrendingUp, Award, Target } from "lucide-react";

interface CallQuality {
  id: number;
  callId: string;
  overallScore: number;
  clarityScore: number;
  pacingScore: number;
  empathyScore: number;
  aiSummary: string;
  agentId: string;
  evaluatedAt: string;
}

export default function CallQuality() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: records = [] } = useQuery<CallQuality[]>({
    queryKey: ["/api/call-quality"],
  });

  const filtered = records.filter(
    (r) =>
      r.callId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.agentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avgScore =
    records.length > 0
      ? Math.round(records.reduce((sum, r) => sum + r.overallScore, 0) / records.length)
      : 0;

  const topPerformer = records.reduce(
    (best, r) => (r.overallScore > (best?.overallScore ?? 0) ? r : best),
    records[0]
  );

  const lowestScore =
    records.length > 0 ? Math.min(...records.map((r) => r.overallScore)) : 0;

  const scoresToday = records.filter((r) => {
    const today = new Date().toDateString();
    return new Date(r.evaluatedAt).toDateString() === today;
  }).length;

  const scoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const ScoreGauge = ({ score, label }: { score: number; label: string }) => (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-4"
        style={{ borderColor: score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444" }}>
        <span className="text-sm font-bold">{score}</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="AI Call Quality Scorer" description="AI-powered call quality evaluation and agent performance analysis" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{avgScore}</p>
                <p className="text-sm text-muted-foreground">Avg Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold truncate">{topPerformer?.agentId ?? "—"}</p>
                <p className="text-sm text-muted-foreground">Top Performer</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{lowestScore}</p>
                <p className="text-sm text-muted-foreground">Lowest Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{scoresToday}</p>
                <p className="text-sm text-muted-foreground">Scores Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quality Scores</CardTitle>
          <Input
            placeholder="Search by call ID or agent..."
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
                <TableHead>Agent</TableHead>
                <TableHead>Overall Score</TableHead>
                <TableHead>Scores</TableHead>
                <TableHead>AI Summary</TableHead>
                <TableHead>Evaluated At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No quality records found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-sm">{record.callId}</TableCell>
                    <TableCell>{record.agentId}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${scoreColor(record.overallScore)}`}>
                        {record.overallScore}/100
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-3">
                        <ScoreGauge score={record.clarityScore} label="Clarity" />
                        <ScoreGauge score={record.pacingScore} label="Pacing" />
                        <ScoreGauge score={record.empathyScore} label="Empathy" />
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {record.aiSummary}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(record.evaluatedAt).toLocaleString()}
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
