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
import { BarChart3, FileText, Calendar, Share2 } from "lucide-react";

interface CustomReport {
  id: number;
  name: string;
  type: "table" | "bar" | "line" | "pie" | "kpi";
  dataSources: string[];
  dateRange: "last_7_days" | "last_30_days" | "last_90_days";
  isScheduled: boolean;
  scheduleFrequency: string | null;
  isPublic: boolean;
  lastRunAt: string | null;
  createdAt: string;
}

const reportSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["table", "bar", "line", "pie", "kpi"]),
  dataSources: z.string().min(1, "Data sources required"),
  dateRange: z.enum(["last_7_days", "last_30_days", "last_90_days"]),
  isScheduled: z.boolean(),
  scheduleFrequency: z.string().optional(),
});

type ReportForm = z.infer<typeof reportSchema>;

const typeIcons: Record<string, React.ReactNode> = {
  table: <FileText className="h-4 w-4" />,
  bar: <BarChart3 className="h-4 w-4" />,
  line: <BarChart3 className="h-4 w-4" />,
  pie: <BarChart3 className="h-4 w-4" />,
  kpi: <BarChart3 className="h-4 w-4" />,
};

export default function ReportBuilder() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CustomReport | null>(null);
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery<CustomReport[]>({
    queryKey: ["/api/custom-reports"],
  });

  const form = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      name: "",
      type: "table",
      dataSources: "",
      dateRange: "last_30_days",
      isScheduled: false,
      scheduleFrequency: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ReportForm) =>
      apiRequest("POST", "/api/custom-reports", {
        ...data,
        dataSources: data.dataSources.split(",").map((s) => s.trim()),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/custom-reports"] });
      setShowDialog(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/custom-reports/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/custom-reports"] }),
  });

  const filtered = reports.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const scheduled = reports.filter((r) => r.isScheduled).length;
  const publicReports = reports.filter((r) => r.isPublic).length;
  const lastRun = reports
    .filter((r) => r.lastRunAt)
    .sort((a, b) => new Date(b.lastRunAt!).getTime() - new Date(a.lastRunAt!).getTime())[0];

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Custom Report Builder" description="Build, schedule, and share custom analytics reports">
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-report">
          <BarChart3 className="h-4 w-4 mr-2" /> New Report
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{reports.length}</p>
                <p className="text-sm text-muted-foreground">Total Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{scheduled}</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Share2 className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{publicReports}</p>
                <p className="text-sm text-muted-foreground">Public</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm font-bold truncate">{lastRun ? new Date(lastRun.lastRunAt!).toLocaleDateString() : "—"}</p>
                <p className="text-sm text-muted-foreground">Last Run</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Saved Reports</CardTitle>
              <Input
                placeholder="Search reports..."
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
                    <TableHead>Type</TableHead>
                    <TableHead>Date Range</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No reports found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((report) => (
                      <TableRow
                        key={report.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedReport(report)}
                      >
                        <TableCell className="font-medium">{report.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {typeIcons[report.type]}
                            <Badge variant="outline" className="capitalize">{report.type}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {report.dateRange.replace(/_/g, " ")}
                        </TableCell>
                        <TableCell>
                          {report.isScheduled ? (
                            <Badge className="bg-green-100 text-green-800">
                              {report.scheduleFrequency ?? "scheduled"}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {report.lastRunAt ? new Date(report.lastRunAt).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(report.id); }}
                            data-testid={`button-delete-report-${report.id}`}
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedReport ? (
              <div className="flex flex-col gap-3">
                <h3 className="font-bold">{selectedReport.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  Type: {selectedReport.type}
                </p>
                <p className="text-sm text-muted-foreground">
                  Date Range: {selectedReport.dateRange.replace(/_/g, " ")}
                </p>
                <p className="text-sm text-muted-foreground">
                  Sources: {selectedReport.dataSources?.join(", ")}
                </p>
                <div className="border rounded-lg p-4 bg-muted/30 min-h-32 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Report preview will appear here</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" data-testid="button-run-report">
                  Run Report
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                Select a report to preview
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Report</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Monthly Call Summary" />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Type</Label>
              <Select
                onValueChange={(v) => form.setValue("type", v as ReportForm["type"])}
                defaultValue="table"
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="table">Table</SelectItem>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="kpi">KPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Data Sources (comma separated)</Label>
              <Input {...form.register("dataSources")} placeholder="calls, agents, queues" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Date Range</Label>
              <Select
                onValueChange={(v) => form.setValue("dateRange", v as ReportForm["dateRange"])}
                defaultValue="last_30_days"
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isScheduled" {...form.register("isScheduled")} />
              <Label htmlFor="isScheduled">Schedule Report</Label>
            </div>
            {form.watch("isScheduled") && (
              <div className="flex flex-col gap-1">
                <Label>Schedule Frequency</Label>
                <Input {...form.register("scheduleFrequency")} placeholder="daily, weekly, monthly" />
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-report">
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
