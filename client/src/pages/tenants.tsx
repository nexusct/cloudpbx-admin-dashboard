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
import { Building2, Users, Crown, Globe } from "lucide-react";

interface Tenant {
  id: number;
  name: string;
  slug: string;
  plan: "basic" | "professional" | "enterprise";
  status: "active" | "suspended" | "trial" | "cancelled";
  maxExtensions: number;
  maxConcurrentCalls: number;
  adminEmail: string;
  billingEmail: string;
  createdAt: string;
}

const tenantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
  plan: z.enum(["basic", "professional", "enterprise"]),
  maxExtensions: z.number().int().positive(),
  maxConcurrentCalls: z.number().int().positive(),
  adminEmail: z.string().email("Valid email required"),
  billingEmail: z.string().email("Valid email required"),
});

type TenantForm = z.infer<typeof tenantSchema>;

const planColors: Record<string, string> = {
  basic: "bg-gray-100 text-gray-800",
  professional: "bg-blue-100 text-blue-800",
  enterprise: "bg-purple-100 text-purple-800",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  trial: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-gray-100 text-gray-600",
};

export default function Tenants() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: tenants = [] } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const form = useForm<TenantForm>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: "",
      slug: "",
      plan: "professional",
      maxExtensions: 50,
      maxConcurrentCalls: 10,
      adminEmail: "",
      billingEmail: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: TenantForm) => apiRequest("POST", "/api/tenants", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      setShowDialog(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/tenants/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tenants"] }),
  });

  const filtered = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const active = tenants.filter((t) => t.status === "active").length;
  const enterprise = tenants.filter((t) => t.plan === "enterprise").length;
  const trial = tenants.filter((t) => t.status === "trial").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Multi-Tenant Manager" description="Manage tenant organizations, plans, and access controls">
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-tenant">
          <Building2 className="h-4 w-4 mr-2" /> New Tenant
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{tenants.length}</p>
                <p className="text-sm text-muted-foreground">Total Tenants</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{enterprise}</p>
                <p className="text-sm text-muted-foreground">Enterprise</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{trial}</p>
                <p className="text-sm text-muted-foreground">Trial</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
          <Input
            placeholder="Search by name, slug, or email..."
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
                <TableHead>Slug</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Max Extensions</TableHead>
                <TableHead>Admin Email</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No tenants found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell className="font-medium">{tenant.name}</TableCell>
                    <TableCell className="font-mono text-sm">{tenant.slug}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${planColors[tenant.plan]}`}>
                        {tenant.plan}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[tenant.status]}`}>
                        {tenant.status}
                      </span>
                    </TableCell>
                    <TableCell>{tenant.maxExtensions}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tenant.adminEmail}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(tenant.id)}
                        data-testid={`button-delete-tenant-${tenant.id}`}
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
            <DialogTitle>Create Tenant</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Acme Corp" />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Label>Slug</Label>
                <Input {...form.register("slug")} placeholder="acme-corp" />
                {form.formState.errors.slug && (
                  <p className="text-xs text-red-500">{form.formState.errors.slug.message}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Plan</Label>
              <Select
                onValueChange={(v) => form.setValue("plan", v as TenantForm["plan"])}
                defaultValue="professional"
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label>Max Extensions</Label>
                <Input
                  type="number"
                  {...form.register("maxExtensions", { valueAsNumber: true })}
                  placeholder="50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Max Concurrent Calls</Label>
                <Input
                  type="number"
                  {...form.register("maxConcurrentCalls", { valueAsNumber: true })}
                  placeholder="10"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Admin Email</Label>
              <Input {...form.register("adminEmail")} placeholder="admin@acme.com" type="email" />
              {form.formState.errors.adminEmail && (
                <p className="text-xs text-red-500">{form.formState.errors.adminEmail.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Billing Email</Label>
              <Input {...form.register("billingEmail")} placeholder="billing@acme.com" type="email" />
              {form.formState.errors.billingEmail && (
                <p className="text-xs text-red-500">{form.formState.errors.billingEmail.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-tenant">
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
