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
import { Cpu, Settings, Wifi, CheckCircle } from "lucide-react";

interface ProvisioningProfile {
  id: number;
  name: string;
  vendor: string;
  deviceModel: string;
  sipServer: string;
  sipPort: number;
  codec: string;
  tlsEnabled: boolean;
  dhcpOption66: string;
  firmwareVersion: string;
  protocol: "http" | "https" | "tftp";
  isActive: boolean;
  createdAt: string;
}

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  vendor: z.string().min(1, "Vendor is required"),
  deviceModel: z.string().min(1, "Device model is required"),
  sipServer: z.string().min(1, "SIP server is required"),
  sipPort: z.number().int().positive(),
  codec: z.string().min(1, "Codec is required"),
  tlsEnabled: z.boolean(),
  dhcpOption66: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const protocolColors: Record<string, string> = {
  http: "bg-blue-100 text-blue-800",
  https: "bg-green-100 text-green-800",
  tftp: "bg-gray-100 text-gray-800",
};

export default function AutoProvisioning() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery<ProvisioningProfile[]>({
    queryKey: ["/api/provisioning-profiles"],
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      vendor: "",
      deviceModel: "",
      sipServer: "",
      sipPort: 5060,
      codec: "G.711",
      tlsEnabled: false,
      dhcpOption66: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProfileForm) => apiRequest("POST", "/api/provisioning-profiles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/provisioning-profiles"] });
      setShowDialog(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/provisioning-profiles/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/provisioning-profiles"] }),
  });

  const filtered = profiles.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.deviceModel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeProfiles = profiles.filter((p) => p.isActive).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Zero-Touch Auto-Provisioning" description="Manage provisioning profiles for automatic phone configuration">
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-provisioning">
          <Cpu className="h-4 w-4 mr-2" /> New Profile
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Cpu className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{activeProfiles}</p>
                <p className="text-sm text-muted-foreground">Profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-sm text-muted-foreground">Provisioned Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wifi className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Provisioning Profiles</CardTitle>
          <Input
            placeholder="Search by name, vendor, or model..."
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
                <TableHead>Vendor</TableHead>
                <TableHead>Device Model</TableHead>
                <TableHead>SIP Server</TableHead>
                <TableHead>Codec</TableHead>
                <TableHead>Protocol</TableHead>
                <TableHead>TLS</TableHead>
                <TableHead>Firmware</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No provisioning profiles found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell>{profile.vendor}</TableCell>
                    <TableCell className="text-sm">{profile.deviceModel}</TableCell>
                    <TableCell className="font-mono text-sm">{profile.sipServer}:{profile.sipPort}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                        {profile.codec}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${protocolColors[profile.protocol]}`}>
                        {profile.protocol}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${profile.tlsEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {profile.tlsEnabled ? "Enabled" : "Disabled"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{profile.firmwareVersion ?? "—"}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(profile.id)}
                        data-testid={`button-delete-provisioning-${profile.id}`}
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
            <DialogTitle>Create Provisioning Profile</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label>Name</Label>
                <Input {...form.register("name")} placeholder="Polycom VVX450" />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Label>Vendor</Label>
                <Input {...form.register("vendor")} placeholder="Polycom" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Device Model</Label>
              <Input {...form.register("deviceModel")} placeholder="VVX 450" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label>SIP Server</Label>
                <Input {...form.register("sipServer")} placeholder="sip.example.com" />
              </div>
              <div className="flex flex-col gap-1">
                <Label>SIP Port</Label>
                <Input
                  type="number"
                  {...form.register("sipPort", { valueAsNumber: true })}
                  placeholder="5060"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Codec</Label>
              <Select onValueChange={(v) => form.setValue("codec", v)} defaultValue="G.711">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="G.711">G.711</SelectItem>
                  <SelectItem value="G.722">G.722</SelectItem>
                  <SelectItem value="G.729">G.729</SelectItem>
                  <SelectItem value="Opus">Opus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>DHCP Option 66 URL</Label>
              <Input {...form.register("dhcpOption66")} placeholder="http://provision.example.com/" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="tlsEnabled" {...form.register("tlsEnabled")} />
              <Label htmlFor="tlsEnabled">Enable TLS</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-provisioning">
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
