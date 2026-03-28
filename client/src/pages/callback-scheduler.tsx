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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/queryClient";
import { Clock, Phone, Calendar, CheckCircle } from "lucide-react";

interface CallbackRequest {
  id: number;
  callerNumber: string;
  callerName: string;
  scheduledFor: string;
  maxAttempts: number;
  attempts: number;
  notes: string;
  status: "pending" | "scheduled" | "attempted" | "completed" | "expired";
  createdAt: string;
}

const callbackSchema = z.object({
  callerNumber: z.string().min(1, "Caller number is required"),
  callerName: z.string().min(1, "Caller name is required"),
  scheduledFor: z.string().min(1, "Schedule time is required"),
  maxAttempts: z.number().int().positive(),
  notes: z.string().optional(),
});

type CallbackForm = z.infer<typeof callbackSchema>;

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  scheduled: "bg-blue-100 text-blue-800",
  attempted: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-800",
};

export default function CallbackScheduler() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: callbacks = [] } = useQuery<CallbackRequest[]>({
    queryKey: ["/api/callback-requests"],
  });

  const form = useForm<CallbackForm>({
    resolver: zodResolver(callbackSchema),
    defaultValues: { callerNumber: "", callerName: "", scheduledFor: "", maxAttempts: 3, notes: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: CallbackForm) => apiRequest("POST", "/api/callback-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/callback-requests"] });
      setShowDialog(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/callback-requests/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/callback-requests"] }),
  });

  const filtered = callbacks.filter(
    (c) =>
      c.callerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.callerNumber.includes(searchTerm)
  );

  const today = new Date().toDateString();
  const pending = callbacks.filter((c) => c.status === "pending").length;
  const scheduledToday = callbacks.filter(
    (c) => c.status === "scheduled" && new Date(c.scheduledFor).toDateString() === today
  ).length;
  const completed = callbacks.filter((c) => c.status === "completed").length;
  const expired = callbacks.filter((c) => c.status === "expired").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Smart Callback Scheduler" description="Manage and schedule customer callback requests intelligently">
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-callback">
          <Calendar className="h-4 w-4 mr-2" /> Schedule Callback
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{scheduledToday}</p>
                <p className="text-sm text-muted-foreground">Scheduled Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Phone className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{expired}</p>
                <p className="text-sm text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Callback Queue</CardTitle>
          <Input
            placeholder="Search by name or number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Caller</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Scheduled For</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No callbacks scheduled
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((cb) => (
                  <TableRow key={cb.id}>
                    <TableCell className="font-medium">{cb.callerName}</TableCell>
                    <TableCell className="font-mono">{cb.callerNumber}</TableCell>
                    <TableCell>{new Date(cb.scheduledFor).toLocaleString()}</TableCell>
                    <TableCell>
                      {cb.attempts}/{cb.maxAttempts}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[cb.status]}`}>
                        {cb.status}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {cb.notes}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(cb.id)}
                        data-testid={`button-delete-callback-${cb.id}`}
                      >
                        Cancel
                      </Button>
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
            <DialogTitle>Schedule Callback</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <Label>Caller Name</Label>
              <Input {...form.register("callerName")} placeholder="John Doe" />
              {form.formState.errors.callerName && (
                <p className="text-xs text-red-500">{form.formState.errors.callerName.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Caller Number</Label>
              <Input {...form.register("callerNumber")} placeholder="+1-555-0100" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Scheduled For</Label>
              <Input type="datetime-local" {...form.register("scheduledFor")} />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Max Attempts</Label>
              <Input
                type="number"
                {...form.register("maxAttempts", { valueAsNumber: true })}
                placeholder="3"
                min={1}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Notes</Label>
              <Input {...form.register("notes")} placeholder="Additional notes..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-callback">
                {createMutation.isPending ? "Scheduling..." : "Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
