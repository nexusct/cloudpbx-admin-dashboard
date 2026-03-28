import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { Heart, Brain, TrendingUp, AlertTriangle } from "lucide-react";

interface EmotionRecord {
  id: number;
  callId: string;
  overallSentiment: "positive" | "neutral" | "negative";
  escalationRisk: number;
  satisfactionScore: number;
  agentEmotions: string;
  customerEmotions: string;
  analyzedAt: string;
}

const sentimentColors: Record<string, string> = {
  positive: "bg-green-100 text-green-800",
  neutral: "bg-gray-100 text-gray-800",
  negative: "bg-red-100 text-red-800",
};

const riskColor = (risk: number) => {
  if (risk >= 70) return "bg-red-500";
  if (risk >= 40) return "bg-yellow-500";
  return "bg-green-500";
};

export default function EmotionAnalytics() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: records = [] } = useQuery<EmotionRecord[]>({
    queryKey: ["/api/emotion-analytics"],
  });

  const filtered = records.filter((r) =>
    r.callId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avgSatisfaction =
    records.length > 0
      ? Math.round(records.reduce((sum, r) => sum + r.satisfactionScore, 0) / records.length)
      : 0;

  const highEscalation = records.filter((r) => r.escalationRisk >= 70).length;

  const positiveCount = records.filter((r) => r.overallSentiment === "positive").length;
  const positivePct = records.length > 0 ? Math.round((positiveCount / records.length) * 100) : 0;

  const emotionDistribution = [
    { label: "Positive", count: records.filter((r) => r.overallSentiment === "positive").length, color: "bg-green-500" },
    { label: "Neutral", count: records.filter((r) => r.overallSentiment === "neutral").length, color: "bg-gray-400" },
    { label: "Negative", count: records.filter((r) => r.overallSentiment === "negative").length, color: "bg-red-500" },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Real-Time Emotion Analytics" description="Analyze customer and agent emotions across all calls" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-pink-500" />
              <div>
                <p className="text-2xl font-bold">{avgSatisfaction}/100</p>
                <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{highEscalation}</p>
                <p className="text-sm text-muted-foreground">High Escalation Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{positivePct}%</p>
                <p className="text-sm text-muted-foreground">Positive Sentiment</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" /> Sentiment Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end h-32">
            {emotionDistribution.map((emotion) => (
              <div key={emotion.label} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-sm font-bold">{emotion.count}</span>
                <div
                  className={`w-full rounded-t ${emotion.color}`}
                  style={{
                    height: `${records.length > 0 ? Math.max(8, (emotion.count / records.length) * 100) : 8}px`,
                  }}
                />
                <span className="text-xs text-muted-foreground">{emotion.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emotion Records</CardTitle>
          <Input
            placeholder="Search by call ID..."
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
                <TableHead>Overall Sentiment</TableHead>
                <TableHead>Escalation Risk</TableHead>
                <TableHead>Satisfaction</TableHead>
                <TableHead>Agent Emotions</TableHead>
                <TableHead>Analyzed At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No emotion records found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-sm">{record.callId}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${sentimentColors[record.overallSentiment]}`}>
                        {record.overallSentiment}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${riskColor(record.escalationRisk)}`}
                            style={{ width: `${record.escalationRisk}%` }}
                          />
                        </div>
                        <span className="text-xs">{record.escalationRisk}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{record.satisfactionScore}/100</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {record.agentEmotions}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(record.analyzedAt).toLocaleString()}
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
