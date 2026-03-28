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
import { Shield, Archive, Lock, FileText } from "lucide-react";

interface RecordingPolicy {
  id: number;
  name: string;
  recordingMode: "always" | "on_demand" | "never";
  retentionDays: number;
  complianceFramework: "GDPR" | "HIPAA" | "PCI" | "SOX" | "none";
  consentRequired: boolean;
  isActive: boolean;
  autoDeleteEnabled: boolean;
  createdAt: string;
}

const policySchema = z.object({
  name: z.string().min(1, "Name is required"),
  recordingMode: z.enum(["always", "on_demand", "never"]),
  retentionDays: z.number().int().positive(),
  complianceFramework: z.enum(["GDPR", "HIPAA", "PCI", "SOX", "none"]),
  consentRequired: z.boolean(),
});

type PolicyForm = z.infer<typeof policySchema>;

const frameworkColors: Record<string, string> = {
  GDPR: "bg-blue-100 text-blue-800",
  HIPAA: "bg-green-100 text-green-800",
  PCI: "bg-purple-100 text-purple-800",
  SOX: "bg-orange-100 text-orange-800",
  none: "bg-gray-100 text-gray-800",
};

export default function ComplianceRecording() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: policies = [] } = useQuery<RecordingPolicy[]>({
    queryKey: ["/api/recording-policies"],
  });

  const form = useForm<PolicyForm>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      name: "",
      recordingMode: "always",
      retentionDays: 90,
      complianceFramework: "none",
      consentRequired: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: PolicyForm) => apiRequest("POST", "/api/recording-policies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recording-policies"] });
      setShowDialog(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/recording-policies/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/recording-policies"] }),
  });

  const filtered = policies.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activePolicies = policies.filter((p) => p.isActive).length;
  const gdprCompliant = policies.filter((p) => p.complianceFramework === "GDPR").length;
  const autoDeleteEnabled = policies.filter((p) => p.autoDeleteEnabled).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Compliance Recording Manager" description="Manage call recording policies with compliance framework support">
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-policy">
          <Shield className="h-4 w-4 mr-2" /> New Policy
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activePolicies}</p>
                <p className="text-sm text-muted-foreground">Active Policies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Lock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{gdprCompliant}</p>
                <p className="text-sm text-muted-foreground">GDPR Compliant</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Archive className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{autoDeleteEnabled}</p>
                <p className="text-sm text-muted-foreground">Auto-Delete Enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-sm text-muted-foreground">Recordings Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recording Policies</CardTitle>
          <Input
            placeholder="Search policies..."
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
                <TableHead>Recording Mode</TableHead>
                <TableHead>Retention</TableHead>
                <TableHead>Framework</TableHead>
                <TableHead>Consent Required</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No recording policies found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{policy.recordingMode.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>{policy.retentionDays} days</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${frameworkColors[policy.complianceFramework]}`}>
                        {policy.complianceFramework}
                      </span>
                    </TableCell>
                    <TableCell>{policy.consentRequired ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${policy.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {policy.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(policy.id)}
                        data-testid={`button-delete-policy-${policy.id}`}
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Recording Policy</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Policy name" />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Recording Mode</Label>
              <Select
                onValueChange={(v) => form.setValue("recordingMode", v as PolicyForm["recordingMode"])}
                defaultValue="always"
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Always</SelectItem>
                  <SelectItem value="on_demand">On Demand</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Retention Days</Label>
              <Input
                type="number"
                {...form.register("retentionDays", { valueAsNumber: true })}
                placeholder="90"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Compliance Framework</Label>
              <Select
                onValueChange={(v) => form.setValue("complianceFramework", v as PolicyForm["complianceFramework"])}
                defaultValue="none"
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="GDPR">GDPR</SelectItem>
                  <SelectItem value="HIPAA">HIPAA</SelectItem>
                  <SelectItem value="PCI">PCI</SelectItem>
                  <SelectItem value="SOX">SOX</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="consentRequired"
                {...form.register("consentRequired")}
              />
              <Label htmlFor="consentRequired">Consent Required</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-policy">
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
