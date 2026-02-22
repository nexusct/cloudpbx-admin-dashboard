import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { RingGroup, InsertRingGroup } from "@shared/schema";

const strategyLabels: Record<string, string> = {
  simultaneous: "Ring All",
  round_robin: "Round Robin",
  sequential: "Sequential",
  random: "Random",
};

export default function RingGroups() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [formStrategy, setFormStrategy] = useState("simultaneous");
  const [formRingTimeout, setFormRingTimeout] = useState("20");
  const { toast } = useToast();

  const { data: ringGroups = [], isLoading } = useQuery<RingGroup[]>({
    queryKey: ["/api/ring-groups"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertRingGroup) => {
      return apiRequest("POST", "/api/ring-groups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ring-groups"] });
      toast({ title: "Ring Group Created", description: "The ring group has been successfully created." });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create ring group.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/ring-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ring-groups"] });
      toast({ title: "Ring Group Deleted", description: "The ring group has been deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete ring group.", variant: "destructive" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      return apiRequest("PATCH", `/api/ring-groups/${id}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ring-groups"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update ring group.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormNumber("");
    setFormStrategy("simultaneous");
    setFormRingTimeout("20");
  };

  const handleCreate = () => {
    createMutation.mutate({
      name: formName,
      number: formNumber,
      strategy: formStrategy,
      ringTimeout: parseInt(formRingTimeout) || 20,
      members: [],
    });
  };

  const filteredGroups = ringGroups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.number.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader title="Ring Groups" description="Configure team call distribution and routing" />
        <div className="text-center py-12 text-muted-foreground">Loading ring groups...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Ring Groups"
        description="Configure team call distribution and routing"
      >
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-ring-group">
              <Plus className="h-4 w-4 mr-2" />
              Create Ring Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Ring Group</DialogTitle>
              <DialogDescription>
                Set up a group to ring multiple extensions
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  placeholder="e.g., Sales Team"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  data-testid="input-group-name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="group-number">Group Extension</Label>
                <Input
                  id="group-number"
                  placeholder="e.g., 200"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  data-testid="input-group-number"
                />
              </div>
              <div className="grid gap-2">
                <Label>Ring Strategy</Label>
                <Select value={formStrategy} onValueChange={setFormStrategy}>
                  <SelectTrigger data-testid="select-strategy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simultaneous">Ring All (Simultaneous)</SelectItem>
                    <SelectItem value="round_robin">Round Robin</SelectItem>
                    <SelectItem value="sequential">Sequential</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Ring Timeout (seconds)</Label>
                <Input
                  type="number"
                  value={formRingTimeout}
                  onChange={(e) => setFormRingTimeout(e.target.value)}
                  data-testid="input-ring-timeout"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                data-testid="button-save-ring-group"
              >
                {createMutation.isPending ? "Creating..." : "Create Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <div className="flex flex-col gap-4 p-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search ring groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-ring-groups"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group Name</TableHead>
              <TableHead>Extension</TableHead>
              <TableHead>Strategy</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Timeout</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No ring groups found
                </TableCell>
              </TableRow>
            ) : (
              filteredGroups.map((group) => {
                const members = Array.isArray(group.members) ? group.members as string[] : [];
                return (
                  <TableRow key={group.id} data-testid={`ring-group-row-${group.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Users className="h-5 w-5" />
                        </div>
                        <span className="font-medium">{group.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{group.number}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{strategyLabels[group.strategy] || group.strategy}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {members.slice(0, 3).map((ext) => (
                          <Badge key={String(ext)} variant="outline" className="font-mono">
                            {String(ext)}
                          </Badge>
                        ))}
                        {members.length > 3 && (
                          <Badge variant="secondary">+{members.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{group.ringTimeout}s</TableCell>
                    <TableCell>
                      <Switch
                        checked={group.enabled ?? true}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: group.id, enabled: checked })}
                        data-testid={`switch-group-${group.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`menu-group-${group.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Group
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Members
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(group.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
