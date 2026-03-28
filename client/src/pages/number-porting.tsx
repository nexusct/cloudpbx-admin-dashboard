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
import { ArrowLeftRight, Hash, Phone, CheckCircle } from "lucide-react";

interface PortingRequest {
  id: number;
  portingType: "port_in" | "port_out";
  phoneNumber: string;
  losingCarrier: string;
  gainingCarrier: string;
  accountNumber: string;
  billingName: string;
  status: "draft" | "submitted" | "pending" | "foc_received" | "completed" | "rejected";
  focDate: string | null;
  createdAt: string;
}

const portingSchema = z.object({
  portingType: z.enum(["port_in", "port_out"]),
  phoneNumber: z.string().min(1, "Phone number is required"),
  losingCarrier: z.string().min(1, "Losing carrier is required"),
  gainingCarrier: z.string().min(1, "Gaining carrier is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  billingName: z.string().min(1, "Billing name is required"),
});

type PortingForm = z.infer<typeof portingSchema>;

const statusSteps = ["draft", "submitted", "pending", "foc_received", "completed"];

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  foc_received: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function NumberPorting() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery<PortingRequest[]>({
    queryKey: ["/api/porting-requests"],
  });

  const form = useForm<PortingForm>({
    resolver: zodResolver(portingSchema),
    defaultValues: {
      portingType: "port_in",
      phoneNumber: "",
      losingCarrier: "",
      gainingCarrier: "",
      accountNumber: "",
      billingName: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PortingForm) => apiRequest("POST", "/api/porting-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/porting-requests"] });
      setShowDialog(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/porting-requests/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/porting-requests"] }),
  });

  const filtered = requests.filter(
    (r) =>
      r.phoneNumber.includes(searchTerm) ||
      r.billingName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const active = requests.filter((r) => !["completed", "rejected"].includes(r.status)).length;
  const submitted = requests.filter((r) => r.status === "submitted").length;
  const pendingFoc = requests.filter((r) => r.status === "pending").length;
  const thisMonth = requests.filter((r) => {
    const d = new Date(r.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && r.status === "completed";
  }).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Number Porting Tracker" description="Track and manage phone number porting requests">
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-porting">
          <ArrowLeftRight className="h-4 w-4 mr-2" /> New Port Request
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ArrowLeftRight className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{active}</p>
                <p className="text-sm text-muted-foreground">Active Ports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Hash className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{submitted}</p>
                <p className="text-sm text-muted-foreground">Submitted</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Phone className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{pendingFoc}</p>
                <p className="text-sm text-muted-foreground">Pending FOC</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{thisMonth}</p>
                <p className="text-sm text-muted-foreground">Completed This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Porting Requests</CardTitle>
          <Input
            placeholder="Search by number or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Billing Name</TableHead>
                <TableHead>Losing Carrier</TableHead>
                <TableHead>Gaining Carrier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No porting requests found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((req) => {
                  const stepIndex = statusSteps.indexOf(req.status);
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono">{req.phoneNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{req.portingType.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>{req.billingName}</TableCell>
                      <TableCell className="text-sm">{req.losingCarrier}</TableCell>
                      <TableCell className="text-sm">{req.gainingCarrier}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[req.status]}`}>
                          {req.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {statusSteps.map((step, i) => (
                            <div
                              key={step}
                              className={`h-2 flex-1 rounded-full ${i <= stepIndex ? "bg-blue-500" : "bg-gray-200"}`}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(req.id)}
                          data-testid={`button-delete-porting-${req.id}`}
                        >
                          Cancel
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Port Request</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <Label>Porting Type</Label>
              <Select
                onValueChange={(v) => form.setValue("portingType", v as PortingForm["portingType"])}
                defaultValue="port_in"
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="port_in">Port In</SelectItem>
                  <SelectItem value="port_out">Port Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Phone Number</Label>
              <Input {...form.register("phoneNumber")} placeholder="+1-555-0100" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Losing Carrier</Label>
              <Input {...form.register("losingCarrier")} placeholder="AT&T" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Gaining Carrier</Label>
              <Input {...form.register("gainingCarrier")} placeholder="Verizon" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Account Number</Label>
              <Input {...form.register("accountNumber")} placeholder="ACC-123456" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Billing Name</Label>
              <Input {...form.register("billingName")} placeholder="Acme Corp" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-porting">
                {createMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
