import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Switch } from "@/components/ui/switch";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  GitBranch,
  Phone,
  Voicemail,
  Clock,
  Users,
  MessageSquare,
  PlayCircle,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  PhoneCall,
  PhoneForwarded,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CallFlow, InsertCallFlow } from "@shared/schema";

const flowTypeIcons: Record<string, any> = {
  ivr: GitBranch,
  auto_attendant: Phone,
  time_based: Clock,
  announcement: MessageSquare,
  failover: PhoneForwarded,
};

const flowTypeLabels: Record<string, string> = {
  ivr: "IVR Menu",
  auto_attendant: "Auto Attendant",
  time_based: "Time Based",
  announcement: "Announcement",
  failover: "Failover",
};

export default function CallFlows() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [flowName, setFlowName] = useState("");
  const [flowDescription, setFlowDescription] = useState("");
  const [flowType, setFlowType] = useState("ivr");
  const [flowDid, setFlowDid] = useState("");
  const { toast } = useToast();

  const { data: callFlows = [], isLoading } = useQuery<CallFlow[]>({
    queryKey: ["/api/call-flows"],
  });

  const createFlowMutation = useMutation({
    mutationFn: async (data: Partial<InsertCallFlow>) => {
      return apiRequest("POST", "/api/call-flows", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-flows"] });
      toast({ title: "Flow Created", description: "The call flow has been successfully created." });
      setIsCreateDialogOpen(false);
      setFlowName("");
      setFlowDescription("");
      setFlowType("ivr");
      setFlowDid("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create call flow.", variant: "destructive" });
    },
  });

  const deleteFlowMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/call-flows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-flows"] });
      toast({ title: "Flow Deleted", description: "The call flow has been deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete call flow.", variant: "destructive" });
    },
  });

  const updateFlowMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertCallFlow> }) => {
      return apiRequest("PATCH", `/api/call-flows/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/call-flows"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update call flow.", variant: "destructive" });
    },
  });

  const handleCreateSubmit = () => {
    if (!flowName) return;
    createFlowMutation.mutate({
      name: flowName,
      description: flowDescription,
      type: flowType,
      enabled: true,
      didId: flowDid ? parseInt(flowDid) : null,
    });
  };

  const handleToggleEnabled = (flow: CallFlow) => {
    updateFlowMutation.mutate({
      id: flow.id,
      data: { enabled: !flow.enabled },
    });
  };

  const filteredFlows = callFlows.filter((flow) =>
    flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    flow.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Call Flows"
        description="Design and manage IVR menus, auto attendants, and call routing"
      >
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-flow">
              <Plus className="h-4 w-4 mr-2" />
              Create Flow
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Call Flow</DialogTitle>
              <DialogDescription>
                Design a new call routing or IVR flow
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="flow-name">Flow Name</Label>
                <Input id="flow-name" placeholder="e.g., Main IVR Menu" value={flowName} onChange={(e) => setFlowName(e.target.value)} data-testid="input-flow-name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="flow-description">Description</Label>
                <Textarea id="flow-description" placeholder="Describe the purpose of this flow" value={flowDescription} onChange={(e) => setFlowDescription(e.target.value)} data-testid="input-flow-description" />
              </div>
              <div className="grid gap-2">
                <Label>Flow Type</Label>
                <Select value={flowType} onValueChange={setFlowType}>
                  <SelectTrigger data-testid="select-flow-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ivr">IVR Menu</SelectItem>
                    <SelectItem value="auto_attendant">Auto Attendant</SelectItem>
                    <SelectItem value="time_based">Time Based Routing</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="failover">Failover</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Assign to DID (Optional)</Label>
                <Select value={flowDid} onValueChange={setFlowDid}>
                  <SelectTrigger data-testid="select-flow-did">
                    <SelectValue placeholder="Select a phone number" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="1">+1 (555) 123-4567</SelectItem>
                    <SelectItem value="2">+1 (555) 987-6543</SelectItem>
                    <SelectItem value="3">+1 (800) 555-1234</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSubmit} disabled={createFlowMutation.isPending} data-testid="button-save-flow">
                {createFlowMutation.isPending ? "Creating..." : "Create & Open Designer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search flows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-flows"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading call flows...</div>
      ) : filteredFlows.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No call flows found</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredFlows.map((flow) => {
            const Icon = flowTypeIcons[flow.type] || GitBranch;
            const nodes = Array.isArray(flow.nodes) ? flow.nodes : [];
            return (
              <Card key={flow.id} className="p-5 flex flex-col gap-4" data-testid={`flow-card-${flow.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-md ${
                      flow.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{flow.name}</h3>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {flowTypeLabels[flow.type] || flow.type}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`menu-flow-${flow.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Flow
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Test Flow
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteFlowMutation.mutate(flow.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <p className="text-sm text-muted-foreground">{flow.description}</p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    {nodes.length} steps
                  </div>
                  {flow.didId && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      DID #{flow.didId}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Switch checked={flow.enabled ?? false} onCheckedChange={() => handleToggleEnabled(flow)} data-testid={`switch-flow-${flow.id}`} />
                    <span className="text-sm text-muted-foreground">
                      {flow.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-1" data-testid={`button-open-flow-${flow.id}`}>
                    Open Designer
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
