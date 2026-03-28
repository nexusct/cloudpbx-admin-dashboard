import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/queryClient";
import { Headphones, Mic, Users, Star } from "lucide-react";

interface CoachingSession {
  id: number;
  agentExtensionId: string;
  supervisorExtensionId: string;
  mode: "listen" | "whisper" | "barge";
  callId: string;
  duration: number;
  rating: number;
  notes: string;
  isActive: boolean;
  startedAt: string;
  endedAt: string | null;
}

const sessionSchema = z.object({
  agentExtensionId: z.string().min(1, "Agent extension is required"),
  mode: z.enum(["listen", "whisper", "barge"]),
  callId: z.string().optional(),
});

type SessionForm = z.infer<typeof sessionSchema>;

const modeColors: Record<string, string> = {
  listen: "bg-blue-100 text-blue-800",
  whisper: "bg-yellow-100 text-yellow-800",
  barge: "bg-red-100 text-red-800",
};

const modeIcons: Record<string, React.ReactNode> = {
  listen: <Headphones className="h-3 w-3" />,
  whisper: <Mic className="h-3 w-3" />,
  barge: <Users className="h-3 w-3" />,
};

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-3 w-3 ${star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
      />
    ))}
  </div>
);

export default function LiveCoaching() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: sessions = [] } = useQuery<CoachingSession[]>({
    queryKey: ["/api/live-coaching"],
  });

  const form = useForm<SessionForm>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { agentExtensionId: "", mode: "listen", callId: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: SessionForm) => apiRequest("POST", "/api/live-coaching", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/live-coaching"] });
      setShowDialog(false);
      form.reset();
    },
  });

  const endMutation = useMutation({
    mutationFn: (id: number) => apiRequest("PATCH", `/api/live-coaching/${id}`, { isActive: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/live-coaching"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/live-coaching/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/live-coaching"] }),
  });

  const filtered = sessions.filter(
    (s) =>
      s.agentExtensionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.supervisorExtensionId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeSessions = sessions.filter((s) => s.isActive).length;
  const whisperSessions = sessions.filter((s) => s.mode === "whisper" && s.isActive).length;
  const bargeSessions = sessions.filter((s) => s.mode === "barge" && s.isActive).length;
  const avgRating =
    sessions.filter((s) => s.rating > 0).length > 0
      ? (sessions.filter((s) => s.rating > 0).reduce((sum, s) => sum + s.rating, 0) / sessions.filter((s) => s.rating > 0).length).toFixed(1)
      : "—";

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Live Agent Coaching" description="Monitor and coach agents in real-time with listen, whisper, and barge modes">
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-coaching-session">
          <Headphones className="h-4 w-4 mr-2" /> Start Session
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Headphones className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{activeSessions}</p>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mic className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{whisperSessions}</p>
                <p className="text-sm text-muted-foreground">Whisper</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{bargeSessions}</p>
                <p className="text-sm text-muted-foreground">Barge</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{avgRating}</p>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {activeSessions > 0 && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live Sessions ({activeSessions})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sessions.filter((s) => s.isActive).map((session) => (
                <div key={session.id} className="flex flex-col gap-2 p-3 bg-white border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold">{session.agentExtensionId}</span>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${modeColors[session.mode]}`}>
                      {modeIcons[session.mode]}
                      <span className="ml-1 capitalize">{session.mode}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supervisor: {session.supervisorExtensionId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Started: {new Date(session.startedAt).toLocaleTimeString()}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => endMutation.mutate(session.id)}
                    disabled={endMutation.isPending}
                    className="mt-1"
                    data-testid={`button-end-session-${session.id}`}
                  >
                    End Session
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Coaching History</CardTitle>
          <Input
            placeholder="Search by agent or supervisor extension..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Supervisor</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No coaching sessions found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono font-medium">{session.agentExtensionId}</TableCell>
                    <TableCell className="font-mono">{session.supervisorExtensionId}</TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium w-fit ${modeColors[session.mode]}`}>
                        {modeIcons[session.mode]}
                        <span className="ml-1 capitalize">{session.mode}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDuration(session.duration)}</TableCell>
                    <TableCell>
                      {session.rating > 0 ? (
                        <StarRating rating={session.rating} />
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(session.startedAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${session.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {session.isActive ? "Active" : "Ended"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {!session.isActive && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(session.id)}
                          data-testid={`button-delete-session-${session.id}`}
                        >
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Coaching Session</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <Label>Agent Extension ID</Label>
              <Input {...form.register("agentExtensionId")} placeholder="EXT-101" />
              {form.formState.errors.agentExtensionId && (
                <p className="text-xs text-red-500">{form.formState.errors.agentExtensionId.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Coaching Mode</Label>
              <Select
                onValueChange={(v) => form.setValue("mode", v as SessionForm["mode"])}
                defaultValue="listen"
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="listen">
                    <div className="flex items-center gap-2">
                      <Headphones className="h-4 w-4 text-blue-500" />
                      Listen (silent monitoring)
                    </div>
                  </SelectItem>
                  <SelectItem value="whisper">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-yellow-500" />
                      Whisper (coach only agent hears)
                    </div>
                  </SelectItem>
                  <SelectItem value="barge">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-red-500" />
                      Barge (join the call)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Call ID (optional)</Label>
              <Input {...form.register("callId")} placeholder="call-uuid-here" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-start-session">
                {createMutation.isPending ? "Starting..." : "Start Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
