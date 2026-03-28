import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/queryClient";
import { Leaf, TreePine, Globe, TrendingDown } from "lucide-react";

interface CarbonRecord {
  id: number;
  month: string;
  co2Grams: number;
  totalMinutes: number;
  greenCallsPercent: number;
  renewableEnergyPercent: number;
  treesEquivalent: number;
}

interface GreenGoal {
  id: number;
  name: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string;
}

const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetValue: z.number().positive(),
  currentValue: z.number().min(0),
  unit: z.string().min(1, "Unit is required"),
  deadline: z.string().min(1, "Deadline is required"),
});

type GoalForm = z.infer<typeof goalSchema>;

export default function GreenCalling() {
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: footprint = [] } = useQuery<CarbonRecord[]>({
    queryKey: ["/api/carbon-footprint"],
  });

  const { data: goals = [] } = useQuery<GreenGoal[]>({
    queryKey: ["/api/green-goals"],
  });

  const form = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: { name: "", targetValue: 0, currentValue: 0, unit: "grams CO₂", deadline: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: GoalForm) => apiRequest("POST", "/api/green-goals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/green-goals"] });
      setShowDialog(false);
      form.reset();
    },
  });

  const sorted = [...footprint].sort(
    (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
  );

  const latest = sorted[sorted.length - 1];
  const maxCo2 = Math.max(...sorted.map((r) => r.co2Grams), 1);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Green Calling Initiative" description="Track carbon footprint, sustainability goals, and environmental impact">
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-goal">
          <Leaf className="h-4 w-4 mr-2" /> New Green Goal
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Leaf className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{latest?.co2Grams?.toLocaleString() ?? 0}g</p>
                <p className="text-sm text-muted-foreground">CO₂ This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TreePine className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">{latest?.treesEquivalent ?? 0}</p>
                <p className="text-sm text-muted-foreground">Trees Equivalent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{latest?.greenCallsPercent ?? 0}%</p>
                <p className="text-sm text-muted-foreground">Green Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-teal-500" />
              <div>
                <p className="text-2xl font-bold">{latest?.renewableEnergyPercent ?? 0}%</p>
                <p className="text-sm text-muted-foreground">Renewable Energy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" /> Monthly CO₂ Footprint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-40">
            {sorted.map((record) => (
              <div key={record.id} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-xs font-medium">{record.co2Grams}g</span>
                <div
                  className="w-full bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                  style={{ height: `${(record.co2Grams / maxCo2) * 120}px` }}
                  title={`${record.month}: ${record.co2Grams}g CO₂`}
                />
                <span className="text-xs text-muted-foreground truncate max-w-[40px] text-center">
                  {new Date(record.month).toLocaleDateString("en-US", { month: "short" })}
                </span>
              </div>
            ))}
            {sorted.length === 0 && (
              <div className="w-full flex items-center justify-center text-muted-foreground text-sm h-32">
                No carbon data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-green-500" /> Sustainability Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No sustainability goals set. Create your first goal.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {goals.map((goal) => {
                const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                return (
                  <div key={goal.id} className="flex flex-col gap-2 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{goal.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {goal.currentValue} / {goal.targetValue} {goal.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-700">{pct}%</p>
                        <p className="text-xs text-muted-foreground">
                          Due {new Date(goal.deadline).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-blue-500" : "bg-yellow-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Green Goal</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <Label>Goal Name</Label>
              <Input {...form.register("name")} placeholder="Reduce CO₂ by 20%" />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label>Target Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("targetValue", { valueAsNumber: true })}
                  placeholder="1000"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Current Value</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("currentValue", { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Unit</Label>
              <Input {...form.register("unit")} placeholder="grams CO₂" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Deadline</Label>
              <Input type="date" {...form.register("deadline")} />
              {form.formState.errors.deadline && (
                <p className="text-xs text-red-500">{form.formState.errors.deadline.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-goal">
                {createMutation.isPending ? "Creating..." : "Create Goal"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
