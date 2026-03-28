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
import { DollarSign, TrendingUp, Target, PieChart } from "lucide-react";

interface CostRecord {
  id: number;
  callId: string;
  direction: "inbound" | "outbound";
  destination: string;
  destinationType: string;
  duration: number;
  totalCost: number;
  billedAt: string;
}

interface CostBudget {
  id: number;
  name: string;
  period: "daily" | "weekly" | "monthly";
  budgetAmount: number;
  currentSpend: number;
  alertThreshold: number;
  createdAt: string;
}

const budgetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  period: z.enum(["daily", "weekly", "monthly"]),
  budgetAmount: z.number().positive(),
  alertThreshold: z.number().min(0).max(100),
});

type BudgetForm = z.infer<typeof budgetSchema>;

export default function CostAnalytics() {
  const [activeTab, setActiveTab] = useState<"costs" | "budgets">("costs");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: costs = [] } = useQuery<CostRecord[]>({
    queryKey: ["/api/cost-records"],
  });

  const { data: budgets = [] } = useQuery<CostBudget[]>({
    queryKey: ["/api/cost-budgets"],
  });

  const form = useForm<BudgetForm>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { name: "", period: "monthly", budgetAmount: 1000, alertThreshold: 80 },
  });

  const createMutation = useMutation({
    mutationFn: (data: BudgetForm) => apiRequest("POST", "/api/cost-budgets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-budgets"] });
      setShowDialog(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/cost-budgets/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/cost-budgets"] }),
  });

  const now = new Date();
  const thisMonth = costs.filter((c) => {
    const d = new Date(c.billedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalSpend = thisMonth.reduce((sum, c) => sum + c.totalCost, 0);
  const avgCostPerCall = thisMonth.length > 0 ? totalSpend / thisMonth.length : 0;
  const overBudget = budgets.filter((b) => b.currentSpend > b.budgetAmount).length;

  const filteredCosts = costs.filter(
    (c) =>
      c.callId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.destination.includes(searchTerm) ||
      c.destinationType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBudgets = budgets.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Cost Analytics Center" description="Monitor call costs, spending trends, and manage budgets">
        {activeTab === "budgets" && (
          <Button onClick={() => setShowDialog(true)} data-testid="button-add-budget">
            <Target className="h-4 w-4 mr-2" /> New Budget
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalSpend)}</p>
                <p className="text-sm text-muted-foreground">Total This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(avgCostPerCall)}</p>
                <p className="text-sm text-muted-foreground">Avg Cost/Call</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{overBudget}</p>
                <p className="text-sm text-muted-foreground">Over Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <PieChart className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-sm text-muted-foreground">Savings vs Last Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === "costs" ? "default" : "outline"}
          onClick={() => setActiveTab("costs")}
          data-testid="tab-call-costs"
        >
          Call Costs
        </Button>
        <Button
          variant={activeTab === "budgets" ? "default" : "outline"}
          onClick={() => setActiveTab("budgets")}
          data-testid="tab-budgets"
        >
          Budgets
        </Button>
      </div>

      <Input
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      {activeTab === "costs" && (
        <Card>
          <CardHeader><CardTitle>Call Cost Records</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Call ID</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Billed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No cost records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCosts.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-mono text-sm">{record.callId}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${record.direction === "inbound" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
                          {record.direction}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono">{record.destination}</TableCell>
                      <TableCell className="text-sm">{record.destinationType}</TableCell>
                      <TableCell>
                        {Math.floor(record.duration / 60)}m {record.duration % 60}s
                      </TableCell>
                      <TableCell className="font-bold text-green-700">
                        {formatCurrency(record.totalCost)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(record.billedAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "budgets" && (
        <Card>
          <CardHeader><CardTitle>Cost Budgets</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Current Spend</TableHead>
                  <TableHead>Alert Threshold</TableHead>
                  <TableHead>Used</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBudgets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No budgets found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBudgets.map((budget) => {
                    const usedPct = Math.min(100, Math.round((budget.currentSpend / budget.budgetAmount) * 100));
                    const isOver = budget.currentSpend > budget.budgetAmount;
                    return (
                      <TableRow key={budget.id}>
                        <TableCell className="font-medium">{budget.name}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                            {budget.period}
                          </span>
                        </TableCell>
                        <TableCell className="font-bold">{formatCurrency(budget.budgetAmount)}</TableCell>
                        <TableCell className={isOver ? "text-red-600 font-bold" : ""}>
                          {formatCurrency(budget.currentSpend)}
                        </TableCell>
                        <TableCell>{budget.alertThreshold}%</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${isOver ? "bg-red-500" : usedPct >= budget.alertThreshold ? "bg-yellow-500" : "bg-green-500"}`}
                                style={{ width: `${usedPct}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium">{usedPct}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(budget.id)}
                            data-testid={`button-delete-budget-${budget.id}`}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Budget</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Monthly Outbound Budget" />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Period</Label>
              <Select
                onValueChange={(v) => form.setValue("period", v as BudgetForm["period"])}
                defaultValue="monthly"
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Budget Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                {...form.register("budgetAmount", { valueAsNumber: true })}
                placeholder="1000.00"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Alert Threshold (%)</Label>
              <Input
                type="number"
                {...form.register("alertThreshold", { valueAsNumber: true })}
                placeholder="80"
                min={0}
                max={100}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-budget">
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
