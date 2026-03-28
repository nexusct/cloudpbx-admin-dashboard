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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/queryClient";
import { Key, Lock, Activity, Shield } from "lucide-react";

interface ApiKey {
  id: number;
  name: string;
  description: string;
  keyPrefix: string;
  scopes: string[];
  rateLimit: number;
  usageCount: number;
  lastUsedAt: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

const allScopes = ["read", "write", "admin", "webhooks"];

const apiKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  scopes: z.array(z.string()).min(1, "At least one scope required"),
  rateLimit: z.number().int().positive(),
  expiresAt: z.string().optional(),
});

type ApiKeyForm = z.infer<typeof apiKeySchema>;

export default function ApiKeys() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["read"]);
  const queryClient = useQueryClient();

  const { data: keys = [] } = useQuery<ApiKey[]>({
    queryKey: ["/api/api-keys"],
  });

  const form = useForm<ApiKeyForm>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: { name: "", description: "", scopes: ["read"], rateLimit: 1000, expiresAt: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: ApiKeyForm) => apiRequest("POST", "/api/api-keys", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      setShowDialog(false);
      form.reset();
      setSelectedScopes(["read"]);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/api-keys/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/api-keys/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] }),
  });

  const filtered = keys.filter(
    (k) =>
      k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.keyPrefix.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeKeys = keys.filter((k) => k.isActive).length;
  const totalRequests = keys.reduce((sum, k) => sum + k.usageCount, 0);
  const now = new Date();
  const expiringSoon = keys.filter((k) => {
    if (!k.expiresAt) return false;
    const diff = new Date(k.expiresAt).getTime() - now.getTime();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const toggleScope = (scope: string) => {
    const updated = selectedScopes.includes(scope)
      ? selectedScopes.filter((s) => s !== scope)
      : [...selectedScopes, scope];
    setSelectedScopes(updated);
    form.setValue("scopes", updated);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="API Key Manager" description="Manage API keys, scopes, and access controls">
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-api-key">
          <Key className="h-4 w-4 mr-2" /> New API Key
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Key className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeKeys}</p>
                <p className="text-sm text-muted-foreground">Active Keys</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalRequests.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-sm text-muted-foreground">Rate Limit Exceeded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Lock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{expiringSoon}</p>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <Input
            placeholder="Search by name or prefix..."
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
                <TableHead>Key Prefix</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Rate Limit</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No API keys found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell className="font-mono text-sm">{key.keyPrefix}...</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {key.scopes.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{key.rateLimit}/hr</TableCell>
                    <TableCell>{key.usageCount.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleMutation.mutate({ id: key.id, isActive: !key.isActive })}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${key.isActive ? "bg-green-500" : "bg-gray-300"}`}
                        data-testid={`toggle-key-${key.id}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${key.isActive ? "translate-x-5" : "translate-x-1"}`} />
                      </button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(key.id)}
                        data-testid={`button-delete-key-${key.id}`}
                      >
                        Revoke
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
            <DialogTitle>Create API Key</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate({ ...data, scopes: selectedScopes }))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="My Integration" />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Description</Label>
              <Input {...form.register("description")} placeholder="Optional description" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Scopes</Label>
              <div className="flex flex-wrap gap-2">
                {allScopes.map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => toggleScope(scope)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                      selectedScopes.includes(scope)
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                    }`}
                    data-testid={`scope-${scope}`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Rate Limit (requests/hour)</Label>
              <Input
                type="number"
                {...form.register("rateLimit", { valueAsNumber: true })}
                placeholder="1000"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Expires At (optional)</Label>
              <Input type="date" {...form.register("expiresAt")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-api-key">
                {createMutation.isPending ? "Creating..." : "Create Key"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
