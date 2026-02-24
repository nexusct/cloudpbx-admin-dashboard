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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Webhook,
  Plus,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  RefreshCw,
  Code,
  Zap,
  Link as LinkIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Webhook as WebhookType } from "@shared/schema";

const WEBHOOK_EVENTS = [
  { id: "call.started", label: "Call Started", description: "Triggered when a call begins" },
  { id: "call.answered", label: "Call Answered", description: "Triggered when a call is answered" },
  { id: "call.ended", label: "Call Ended", description: "Triggered when a call ends" },
  { id: "call.missed", label: "Call Missed", description: "Triggered when a call is missed" },
  { id: "voicemail.received", label: "Voicemail Received", description: "New voicemail message" },
  { id: "sms.received", label: "SMS Received", description: "Incoming SMS message" },
  { id: "sms.sent", label: "SMS Sent", description: "Outgoing SMS delivered" },
  { id: "fax.received", label: "Fax Received", description: "Incoming fax received" },
  { id: "extension.status", label: "Extension Status Change", description: "Agent goes online/offline" },
  { id: "queue.update", label: "Queue Update", description: "Queue statistics changed" },
];

export default function Webhooks() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    secret: "",
    events: [] as string[],
    enabled: true,
  });

  const { data: webhooks = [], isLoading } = useQuery<WebhookType[]>({
    queryKey: ["/api/webhooks"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/webhooks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Webhook created successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
      toast({ title: "Webhook deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      return apiRequest("PATCH", `/api/webhooks/${id}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/webhooks"] });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      url: "",
      secret: "",
      events: [],
      enabled: true,
    });
  };

  const handleCreate = () => {
    createMutation.mutate({
      name: formData.name,
      url: formData.url,
      secret: formData.secret || null,
      events: formData.events,
      enabled: formData.enabled,
    });
  };

  const toggleEvent = (eventId: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter((e) => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const copySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    toast({ title: "Secret copied to clipboard" });
  };

  const generateSecret = () => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setFormData({ ...formData, secret });
  };

  const enabledCount = webhooks.filter((w) => w.enabled).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Webhooks & API"
        description="Connect your PBX to external services with event-driven webhooks"
      >
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-webhook">
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Webhook className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{webhooks.length}</div>
              <div className="text-sm text-muted-foreground">Total Webhooks</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-green-600">{enabledCount}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold text-yellow-600">{WEBHOOK_EVENTS.length}</div>
              <div className="text-sm text-muted-foreground">Available Events</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Code className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold text-blue-600">REST</div>
              <div className="text-sm text-muted-foreground">API Type</div>
            </div>
          </div>
        </Card>
      </div>

      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="space-y-3">
          {isLoading ? (
            <Card className="p-8 text-center text-muted-foreground">Loading webhooks...</Card>
          ) : webhooks.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No webhooks configured</p>
              <p className="text-sm">Create webhooks to receive real-time event notifications</p>
            </Card>
          ) : (
            webhooks.map((webhook) => (
              <Card
                key={webhook.id}
                className={`p-4 ${!webhook.enabled ? "opacity-60" : ""}`}
                data-testid={`card-webhook-${webhook.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${webhook.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    <Webhook className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{webhook.name}</span>
                      <Badge variant={webhook.enabled ? "default" : "outline"}>
                        {webhook.enabled ? "Active" : "Disabled"}
                      </Badge>
                      {webhook.failureCount && webhook.failureCount > 0 && (
                        <Badge variant="destructive">{webhook.failureCount} failures</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1 truncate">
                      <LinkIcon className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{webhook.url}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(webhook.events as string[])?.slice(0, 3).map((event) => (
                        <Badge key={event} variant="secondary" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                      {(webhook.events as string[])?.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(webhook.events as string[]).length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={webhook.enabled ?? false}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: webhook.id, enabled: checked })}
                      data-testid={`switch-webhook-${webhook.id}`}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(webhook.id)}
                      data-testid={`button-delete-webhook-${webhook.id}`}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Webhook</DialogTitle>
            <DialogDescription>Configure a webhook to receive event notifications</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Webhook Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My CRM Integration"
                data-testid="input-webhook-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Endpoint URL</Label>
              <Input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://api.example.com/webhooks/pbx"
                data-testid="input-webhook-url"
              />
            </div>
            <div className="space-y-2">
              <Label>Signing Secret (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  placeholder="whsec_..."
                  data-testid="input-webhook-secret"
                />
                <Button variant="outline" onClick={generateSecret} data-testid="button-generate-secret">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Used to verify webhook signatures</p>
            </div>
            <div className="space-y-2">
              <Label>Events to Subscribe</Label>
              <div className="grid gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                {WEBHOOK_EVENTS.map((event) => (
                  <div key={event.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={event.id}
                      checked={formData.events.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                      data-testid={`checkbox-event-${event.id}`}
                    />
                    <div className="flex-1">
                      <label htmlFor={event.id} className="text-sm font-medium cursor-pointer">
                        {event.label}
                      </label>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || !formData.url || formData.events.length === 0 || createMutation.isPending}
              data-testid="button-save-webhook"
            >
              {createMutation.isPending ? "Creating..." : "Create Webhook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
