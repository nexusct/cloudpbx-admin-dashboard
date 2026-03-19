import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  PhoneCall,
  MoreHorizontal,
  Edit,
  Trash2,
  Settings,
  Users,
  Clock,
  BarChart2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CallQueue, InsertCallQueue } from "@shared/schema";

const strategyLabels: Record<string, string> = {
  round_robin: "Round Robin",
  least_calls: "Least Calls",
  longest_idle: "Longest Idle",
  priority: "Priority Based",
  random: "Random",
};

export default function Queues() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [formStrategy, setFormStrategy] = useState("round_robin");
  const [formMaxWait, setFormMaxWait] = useState("300");
  const [formMaxCallers, setFormMaxCallers] = useState("50");
  const { toast } = useToast();

  const { data: callQueues = [], isLoading } = useQuery<CallQueue[]>({
    queryKey: ["/api/call-queues"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertCallQueue) => {
      return apiRequest("POST", "/api/call-queues", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-queues"] });
      toast({ title: "Queue Created", description: "The call queue has been successfully created." });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create call queue.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/call-queues/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-queues"] });
      toast({ title: "Queue Deleted", description: "The call queue has been deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete call queue.", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      return apiRequest("PATCH", `/api/call-queues/${id}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-queues"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update call queue.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormNumber("");
    setFormStrategy("round_robin");
    setFormMaxWait("300");
    setFormMaxCallers("50");
  };

  const handleCreate = () => {
    createMutation.mutate({
      tenantId: "default", // TODO: Get from authentication context
      name: formName,
      number: formNumber,
      strategy: formStrategy,
      maxWaitTime: parseInt(formMaxWait) || 300,
      maxCallers: parseInt(formMaxCallers) || 50,
      agents: [],
    });
  };

  const filteredQueues = callQueues.filter((queue) =>
    queue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    queue.number.includes(searchQuery)
  );

  const agents = callQueues.flatMap((q) => (Array.isArray(q.agents) ? q.agents : []) as string[]);
  const totalAgents = Array.from(new Set(agents)).length;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader title="Call Queues" description="Manage ACD queues and agent assignments" />
        <div className="text-center py-12 text-muted-foreground">Loading call queues...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Call Queues"
        description="Manage ACD queues and agent assignments"
      >
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-queue">
              <Plus className="h-4 w-4 mr-2" />
              Create Queue
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Call Queue</DialogTitle>
              <DialogDescription>
                Set up an ACD queue for call distribution
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="queue-name">Queue Name</Label>
                <Input
                  id="queue-name"
                  placeholder="e.g., Support Queue"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  data-testid="input-queue-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="queue-number">Queue Extension</Label>
                <Input
                  id="queue-number"
                  placeholder="e.g., 300"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  data-testid="input-queue-number"
                />
              </div>
              <div className="grid gap-2">
                <Label>Distribution Strategy</Label>
                <Select value={formStrategy} onValueChange={setFormStrategy}>
                  <SelectTrigger data-testid="select-queue-strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round_robin">Round Robin</SelectItem>
                    <SelectItem value="least_calls">Least Calls</SelectItem>
                    <SelectItem value="longest_idle">Longest Idle</SelectItem>
                    <SelectItem value="priority">Priority Based</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Max Wait (seconds)</Label>
                  <Input
                    type="number"
                    value={formMaxWait}
                    onChange={(e) => setFormMaxWait(e.target.value)}
                    data-testid="input-max-wait"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Max Callers</Label>
                  <Input
                    type="number"
                    value={formMaxCallers}
                    onChange={(e) => setFormMaxCallers(e.target.value)}
                    data-testid="input-max-callers"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                data-testid="button-save-queue"
              >
                {createMutation.isPending ? "Creating..." : "Create Queue"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{callQueues.length}</div>
            <div className="text-xs text-muted-foreground">Total Queues</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{totalAgents}</div>
            <div className="text-xs text-muted-foreground">Active Agents</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{callQueues.filter(q => q.enabled).length}</div>
            <div className="text-xs text-muted-foreground">Active Queues</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{callQueues.filter(q => !q.enabled).length}</div>
            <div className="text-xs text-muted-foreground">Disabled Queues</div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 p-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search queues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-queues"
            />
          </div>
        </div>

        <div className="divide-y">
          {filteredQueues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No call queues found
            </div>
          ) : (
            filteredQueues.map((queue) => {
              const queueAgents = Array.isArray(queue.agents) ? queue.agents as string[] : [];
              return (
                <div key={queue.id} className="p-4" data-testid={`queue-row-${queue.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                        <PhoneCall className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">{queue.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Ext. {queue.number} - {strategyLabels[queue.strategy] || queue.strategy}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={queue.enabled ?? true}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: queue.id, enabled: checked })}
                        data-testid={`switch-queue-${queue.id}`}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`menu-queue-${queue.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Queue
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Agents
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(queue.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Max Wait</div>
                      <div className="font-medium">{queue.maxWaitTime}s</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Max Callers</div>
                      <div className="font-medium">{queue.maxCallers}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Agents</div>
                      <div className="flex items-center gap-1">
                        {queueAgents.slice(0, 3).map((ext) => (
                          <Badge key={String(ext)} variant="outline" className="font-mono text-xs">
                            {String(ext)}
                          </Badge>
                        ))}
                        {queueAgents.length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{queueAgents.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Status</div>
                      <div className="font-medium">{queue.enabled ? "Active" : "Disabled"}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
}
