import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Route,
  Plus,
  Clock,
  MapPin,
  Phone,
  Calendar,
  Shield,
  Trash2,
  Edit,
  ArrowRight,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { RoutingRule, Did } from "@shared/schema";

export default function RoutingRules() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "time",
    action: "forward",
    destination: "",
    priority: 100,
    enabled: true,
    startTime: "09:00",
    endTime: "17:00",
    days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  });

  const { data: rules = [], isLoading } = useQuery<RoutingRule[]>({
    queryKey: ["/api/routing-rules"],
  });

  const { data: dids = [] } = useQuery<Did[]>({
    queryKey: ["/api/dids"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/routing-rules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routing-rules"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Routing rule created successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/routing-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routing-rules"] });
      toast({ title: "Routing rule deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      return apiRequest("PATCH", `/api/routing-rules/${id}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/routing-rules"] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "time",
      action: "forward",
      destination: "",
      priority: 100,
      enabled: true,
      startTime: "09:00",
      endTime: "17:00",
      days: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    });
  };

  const handleCreate = () => {
    createMutation.mutate({
      name: formData.name,
      description: formData.description || null,
      type: formData.type,
      action: formData.action,
      destination: formData.destination,
      priority: formData.priority,
      enabled: formData.enabled,
      conditions: {
        startTime: formData.startTime,
        endTime: formData.endTime,
        days: formData.days,
      },
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "time": return <Clock className="h-4 w-4" />;
      case "geographic": return <MapPin className="h-4 w-4" />;
      case "caller_id": return <Phone className="h-4 w-4" />;
      case "holiday": return <Calendar className="h-4 w-4" />;
      default: return <Route className="h-4 w-4" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "forward": return "Forward to";
      case "voicemail": return "Send to Voicemail";
      case "queue": return "Route to Queue";
      case "ring_group": return "Route to Ring Group";
      case "hangup": return "Hangup";
      default: return action;
    }
  };

  const enabledCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Smart Routing Rules"
        description="Configure time-based, geographic, and caller-based routing"
      >
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-rule">
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Route className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{rules.length}</div>
              <div className="text-sm text-muted-foreground">Total Rules</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-green-600">{enabledCount}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {rules.filter((r) => r.type === "time").length}
              </div>
              <div className="text-sm text-muted-foreground">Time-Based</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-purple-500" />
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {rules.filter((r) => r.type === "geographic").length}
              </div>
              <div className="text-sm text-muted-foreground">Geographic</div>
            </div>
          </div>
        </Card>
      </div>

      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="space-y-3">
          {isLoading ? (
            <Card className="p-8 text-center text-muted-foreground">Loading rules...</Card>
          ) : rules.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No routing rules configured</p>
              <p className="text-sm">Create rules to route calls based on time, location, or caller</p>
            </Card>
          ) : (
            rules.map((rule) => (
              <Card
                key={rule.id}
                className={`p-4 ${!rule.enabled ? "opacity-60" : ""}`}
                data-testid={`card-rule-${rule.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${rule.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {getTypeIcon(rule.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.name}</span>
                      <Badge variant="secondary" className="capitalize">{rule.type}</Badge>
                      <Badge variant={rule.enabled ? "default" : "outline"}>
                        {rule.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <span className="text-muted-foreground">Priority: {rule.priority}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{getActionLabel(rule.action)}</span>
                      {rule.destination && (
                        <Badge variant="outline">{rule.destination}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, enabled: checked })}
                      data-testid={`switch-rule-${rule.id}`}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(rule.id)}
                      data-testid={`button-delete-rule-${rule.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Routing Rule</DialogTitle>
            <DialogDescription>Configure automatic call routing based on conditions</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Business Hours Routing"
                data-testid="input-rule-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Route calls to reception during business hours"
                data-testid="input-rule-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rule Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger data-testid="select-rule-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Time-Based</SelectItem>
                    <SelectItem value="geographic">Geographic</SelectItem>
                    <SelectItem value="caller_id">Caller ID</SelectItem>
                    <SelectItem value="holiday">Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={formData.action} onValueChange={(v) => setFormData({ ...formData, action: v })}>
                  <SelectTrigger data-testid="select-rule-action">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="forward">Forward</SelectItem>
                    <SelectItem value="voicemail">Voicemail</SelectItem>
                    <SelectItem value="queue">Queue</SelectItem>
                    <SelectItem value="ring_group">Ring Group</SelectItem>
                    <SelectItem value="hangup">Hangup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.type === "time" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    data-testid="input-start-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    data-testid="input-end-time"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="Extension or phone number"
                data-testid="input-destination"
              />
            </div>
            <div className="space-y-2">
              <Label>Priority (lower = higher priority)</Label>
              <Input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                data-testid="input-priority"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || createMutation.isPending}
              data-testid="button-save-rule"
            >
              {createMutation.isPending ? "Creating..." : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
