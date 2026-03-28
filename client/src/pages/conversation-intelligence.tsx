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
import { Brain, Zap, MessageSquare, AlertTriangle } from "lucide-react";

interface CoachingTrigger {
  id: number;
  name: string;
  type: "keyword" | "sentiment" | "silence" | "pace" | "competitor";
  triggerValue: string;
  response: string;
  severity: "low" | "medium" | "high";
  isActive: boolean;
  createdAt: string;
}

interface CoachingAlert {
  id: number;
  extensionId: string;
  type: string;
  severity: "low" | "medium" | "high";
  triggerText: string;
  suggestion: string;
  isRead: boolean;
  detectedAt: string;
}

const triggerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["keyword", "sentiment", "silence", "pace", "competitor"]),
  triggerValue: z.string().min(1, "Trigger value is required"),
  response: z.string().min(1, "Response is required"),
  severity: z.enum(["low", "medium", "high"]),
});

type TriggerForm = z.infer<typeof triggerSchema>;

const severityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export default function ConversationIntelligence() {
  const [activeTab, setActiveTab] = useState<"triggers" | "alerts">("triggers");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: triggers = [] } = useQuery<CoachingTrigger[]>({
    queryKey: ["/api/coaching-triggers"],
  });

  const { data: alerts = [] } = useQuery<CoachingAlert[]>({
    queryKey: ["/api/coaching-alerts"],
  });

  const form = useForm<TriggerForm>({
    resolver: zodResolver(triggerSchema),
    defaultValues: { name: "", type: "keyword", triggerValue: "", response: "", severity: "medium" },
  });

  const createMutation = useMutation({
    mutationFn: (data: TriggerForm) => apiRequest("POST", "/api/coaching-triggers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaching-triggers"] });
      setShowDialog(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/coaching-triggers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/coaching-triggers"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/coaching-triggers/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/coaching-triggers"] }),
  });

  const activeTriggers = triggers.filter((t) => t.isActive).length;
  const today = new Date().toDateString();
  const alertsToday = alerts.filter((a) => new Date(a.detectedAt).toDateString() === today).length;
  const resolvedAlerts = alerts.filter((a) => a.isRead).length;
  const unreadAlerts = alerts.filter((a) => !a.isRead).length;

  const filteredTriggers = triggers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.triggerValue.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAlerts = alerts.filter(
    (a) =>
      a.extensionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.triggerText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Conversation Intelligence" description="AI-powered real-time coaching triggers and agent performance alerts">
        {activeTab === "triggers" && (
          <Button onClick={() => setShowDialog(true)} data-testid="button-add-trigger">
            <Brain className="h-4 w-4 mr-2" /> New Trigger
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{activeTriggers}</p>
                <p className="text-sm text-muted-foreground">Active Triggers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{alertsToday}</p>
                <p className="text-sm text-muted-foreground">Alerts Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{resolvedAlerts}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{unreadAlerts}</p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === "triggers" ? "default" : "outline"}
          onClick={() => setActiveTab("triggers")}
          data-testid="tab-coaching-triggers"
        >
          Coaching Triggers
        </Button>
        <Button
          variant={activeTab === "alerts" ? "default" : "outline"}
          onClick={() => setActiveTab("alerts")}
          data-testid="tab-live-alerts"
        >
          Live Alerts
          {unreadAlerts > 0 && (
            <Badge className="ml-2 bg-red-500 text-white text-xs">{unreadAlerts}</Badge>
          )}
        </Button>
      </div>

      <Input
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      {activeTab === "triggers" && (
        <Card>
          <CardHeader><CardTitle>Coaching Triggers</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Trigger Value</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTriggers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No coaching triggers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTriggers.map((trigger) => (
                    <TableRow key={trigger.id}>
                      <TableCell className="font-medium">{trigger.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{trigger.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm max-w-xs truncate">{trigger.triggerValue}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{trigger.response}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[trigger.severity]}`}>
                          {trigger.severity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleMutation.mutate({ id: trigger.id, isActive: !trigger.isActive })}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${trigger.isActive ? "bg-green-500" : "bg-gray-300"}`}
                          data-testid={`toggle-trigger-${trigger.id}`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${trigger.isActive ? "translate-x-5" : "translate-x-1"}`} />
                        </button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(trigger.id)}
                          data-testid={`button-delete-trigger-${trigger.id}`}
                        >
                          Delete
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

      {activeTab === "alerts" && (
        <Card>
          <CardHeader><CardTitle>Live Coaching Alerts</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Extension</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Trigger Text</TableHead>
                  <TableHead>Suggestion</TableHead>
                  <TableHead>Read</TableHead>
                  <TableHead>Detected At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No alerts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((alert) => (
                    <TableRow key={alert.id} className={!alert.isRead ? "bg-blue-50/30" : ""}>
                      <TableCell className="font-mono font-medium">{alert.extensionId}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{alert.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[alert.severity]}`}>
                          {alert.severity}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate italic">"{alert.triggerText}"</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{alert.suggestion}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert.isRead ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-800"}`}>
                          {alert.isRead ? "Read" : "Unread"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(alert.detectedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Coaching Trigger</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Competitor Mention" />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Type</Label>
              <Select
                onValueChange={(v) => form.setValue("type", v as TriggerForm["type"])}
                defaultValue="keyword"
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="keyword">Keyword</SelectItem>
                  <SelectItem value="sentiment">Sentiment</SelectItem>
                  <SelectItem value="silence">Silence</SelectItem>
                  <SelectItem value="pace">Pace</SelectItem>
                  <SelectItem value="competitor">Competitor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Trigger Value</Label>
              <Input {...form.register("triggerValue")} placeholder="cancel, competitor name, etc." />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Suggested Response</Label>
              <Input {...form.register("response")} placeholder="Suggested coaching action..." />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Severity</Label>
              <Select
                onValueChange={(v) => form.setValue("severity", v as TriggerForm["severity"])}
                defaultValue="medium"
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-trigger">
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
