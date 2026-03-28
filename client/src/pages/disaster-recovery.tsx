import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/queryClient";
import { Shield, AlertTriangle, RefreshCw, Zap } from "lucide-react";

interface FailoverRule {
  id: number;
  name: string;
  triggerCondition: "unreachable" | "high_loss" | "latency";
  triggerThreshold: number;
  checkInterval: number;
  notifyEmail: string;
  currentStatus: "normal" | "failover" | "recovering";
  isActive: boolean;
  lastTestedAt: string | null;
  createdAt: string;
}

const ruleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  triggerCondition: z.enum(["unreachable", "high_loss", "latency"]),
  triggerThreshold: z.number().positive(),
  checkInterval: z.number().int().positive(),
  notifyEmail: z.string().email("Valid email required"),
});

type RuleForm = z.infer<typeof ruleSchema>;

const statusConfig: Record<string, { color: string; dot: string; label: string }> = {
  normal: { color: "bg-green-100 text-green-800", dot: "bg-green-500", label: "Normal" },
  failover: { color: "bg-red-100 text-red-800", dot: "bg-red-500", label: "Failover Active" },
  recovering: { color: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500", label: "Recovering" },
};

export default function DisasterRecovery() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery<FailoverRule[]>({
    queryKey: ["/api/failover-rules"],
  });

  const form = useForm<RuleForm>({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      name: "",
      triggerCondition: "unreachable",
      triggerThreshold: 3,
      checkInterval: 30,
      notifyEmail: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: RuleForm) => apiRequest("POST", "/api/failover-rules", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/failover-rules"] });
      setShowDialog(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/failover-rules/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/failover-rules"] }),
  });

  const testMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/failover-rules/${id}/test`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/failover-rules"] }),
  });

  const filtered = rules.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeRules = rules.filter((r) => r.isActive).length;
  const inFailover = rules.filter((r) => r.currentStatus === "failover").length;
  const lastTest = rules
    .filter((r) => r.lastTestedAt)
    .sort((a, b) => new Date(b.lastTestedAt!).getTime() - new Date(a.lastTestedAt!).getTime())[0];

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Disaster Recovery Center" description="Configure failover rules and manage business continuity">
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-failover-rule">
          <Shield className="h-4 w-4 mr-2" /> New Failover Rule
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{activeRules}</p>
                <p className="text-sm text-muted-foreground">Active Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-8 w-8 ${inFailover > 0 ? "text-red-500" : "text-gray-400"}`} />
              <div>
                <p className="text-2xl font-bold">{inFailover}</p>
                <p className="text-sm text-muted-foreground">In Failover</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm font-bold">
                  {lastTest?.lastTestedAt ? new Date(lastTest.lastTestedAt).toLocaleDateString() : "Never"}
                </p>
                <p className="text-sm text-muted-foreground">Last Test</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">99.9%</p>
                <p className="text-sm text-muted-foreground">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Failover Rules</CardTitle>
          <Input
            placeholder="Search rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Check Interval</TableHead>
                <TableHead>Notify</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Tested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No failover rules found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((rule) => {
                  const status = statusConfig[rule.currentStatus];
                  return (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                          {rule.triggerCondition.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>{rule.triggerThreshold}</TableCell>
                      <TableCell>{rule.checkInterval}s</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {rule.notifyEmail}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${status.dot}`} />
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rule.lastTestedAt ? new Date(rule.lastTestedAt).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testMutation.mutate(rule.id)}
                            disabled={testMutation.isPending}
                            data-testid={`button-test-rule-${rule.id}`}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" /> Test
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(rule.id)}
                            data-testid={`button-delete-rule-${rule.id}`}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Failover Rule</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Primary Trunk Failover" />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Trigger Condition</Label>
              <Select
                onValueChange={(v) => form.setValue("triggerCondition", v as RuleForm["triggerCondition"])}
                defaultValue="unreachable"
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unreachable">Unreachable</SelectItem>
                  <SelectItem value="high_loss">High Packet Loss</SelectItem>
                  <SelectItem value="latency">High Latency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label>Trigger Threshold</Label>
                <Input
                  type="number"
                  {...form.register("triggerThreshold", { valueAsNumber: true })}
                  placeholder="3"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Check Interval (s)</Label>
                <Input
                  type="number"
                  {...form.register("checkInterval", { valueAsNumber: true })}
                  placeholder="30"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Notify Email</Label>
              <Input {...form.register("notifyEmail")} placeholder="ops@example.com" type="email" />
              {form.formState.errors.notifyEmail && (
                <p className="text-xs text-red-500">{form.formState.errors.notifyEmail.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-failover-rule">
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
