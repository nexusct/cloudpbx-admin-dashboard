import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { Trophy, Award, Star, Zap } from "lucide-react";

interface AgentAchievement {
  id: number;
  extensionId: string;
  agentName: string;
  levelName: string;
  totalPoints: number;
  callsHandled: number;
  customerSatisfaction: number;
  streak: number;
  badgesCount: number;
  rank: number;
}

const levelColors: Record<string, string> = {
  Bronze: "bg-orange-100 text-orange-800",
  Silver: "bg-gray-100 text-gray-800",
  Gold: "bg-yellow-100 text-yellow-800",
  Platinum: "bg-blue-100 text-blue-800",
  Diamond: "bg-purple-100 text-purple-800",
};

const rankMedal = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
};

export default function Gamification() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: agents = [] } = useQuery<AgentAchievement[]>({
    queryKey: ["/api/agent-achievements"],
  });

  const sorted = [...agents].sort((a, b) => b.totalPoints - a.totalPoints);
  const filtered = sorted.filter(
    (a) =>
      a.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.extensionId.includes(searchTerm)
  );

  const topScorer = sorted[0];
  const avgSatisfaction =
    agents.length > 0
      ? (agents.reduce((sum, a) => sum + a.customerSatisfaction, 0) / agents.length).toFixed(1)
      : "0.0";
  const longestStreak = agents.length > 0 ? Math.max(...agents.map((a) => a.streak)) : 0;

  const podium = sorted.slice(0, 3);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Agent Gamification Center" description="Leaderboards, achievements, and rewards for agent performance" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{topScorer?.totalPoints ?? 0}</p>
                <p className="text-sm text-muted-foreground">Top Scorer Points</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{agents.length}</p>
                <p className="text-sm text-muted-foreground">Active Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{avgSatisfaction}</p>
                <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{longestStreak} days</p>
                <p className="text-sm text-muted-foreground">Longest Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {podium.length > 0 && (
        <Card>
          <CardHeader><CardTitle>🏆 Top 3 Podium</CardTitle></CardHeader>
          <CardContent>
            <div className="flex justify-center items-end gap-8">
              {podium[1] && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">🥈</span>
                  <div className="bg-gray-200 w-24 h-24 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <p className="font-bold text-sm">{podium[1].agentName}</p>
                      <p className="text-xs text-muted-foreground">{podium[1].totalPoints} pts</p>
                    </div>
                  </div>
                </div>
              )}
              {podium[0] && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">🥇</span>
                  <div className="bg-yellow-100 w-28 h-32 flex items-center justify-center rounded-lg border-2 border-yellow-400">
                    <div className="text-center">
                      <p className="font-bold">{podium[0].agentName}</p>
                      <p className="text-sm text-yellow-700 font-bold">{podium[0].totalPoints} pts</p>
                    </div>
                  </div>
                </div>
              )}
              {podium[2] && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl">🥉</span>
                  <div className="bg-orange-100 w-24 h-20 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <p className="font-bold text-sm">{podium[2].agentName}</p>
                      <p className="text-xs text-muted-foreground">{podium[2].totalPoints} pts</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Full Leaderboard</CardTitle>
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Extension</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Calls Handled</TableHead>
                <TableHead>CSAT</TableHead>
                <TableHead>Streak</TableHead>
                <TableHead>Badges</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No agents found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((agent, index) => (
                  <TableRow key={agent.id} className={index < 3 ? "bg-yellow-50/30" : ""}>
                    <TableCell className="text-lg font-bold">{rankMedal(index + 1)}</TableCell>
                    <TableCell className="font-medium">{agent.agentName}</TableCell>
                    <TableCell className="font-mono text-sm">{agent.extensionId}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors[agent.levelName] ?? "bg-gray-100 text-gray-800"}`}>
                        {agent.levelName}
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-yellow-600">{agent.totalPoints.toLocaleString()}</TableCell>
                    <TableCell>{agent.callsHandled}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        <span>{agent.customerSatisfaction.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3 text-purple-500" />
                        <span>{agent.streak}d</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{agent.badgesCount} badges</Badge>
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
