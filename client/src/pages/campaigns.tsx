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
import { Radio, Target, Users, Phone } from "lucide-react";

interface Campaign {
  id: number;
  name: string;
  type: "predictive" | "preview" | "progressive";
  status: "draft" | "active" | "paused" | "completed";
  callerIdNumber: string;
  maxConcurrentCalls: number;
  scheduleStart: string;
  scheduleEnd: string;
  totalContacts: number;
  answered: number;
  createdAt: string;
}

const campaignSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["predictive", "preview", "progressive"]),
  callerIdNumber: z.string().min(1, "Caller ID is required"),
  maxConcurrentCalls: z.number().int().positive(),
  scheduleStart: z.string().min(1),
  scheduleEnd: z.string().min(1),
});

type CampaignForm = z.infer<typeof campaignSchema>;

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
};

export default function Campaigns() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: campaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  const form = useForm<CampaignForm>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      type: "predictive",
      callerIdNumber: "",
      maxConcurrentCalls: 10,
      scheduleStart: "",
      scheduleEnd: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CampaignForm) => apiRequest("POST", "/api/campaigns", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setShowDialog(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/campaigns/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] }),
  });

  const filtered = campaigns.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const totalContacts = campaigns.reduce((sum, c) => sum + (c.totalContacts ?? 0), 0);
  const totalAnswered = campaigns.reduce((sum, c) => sum + (c.answered ?? 0), 0);
  const completionRate =
    totalContacts > 0 ? Math.round((totalAnswered / totalContacts) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Predictive Dialer Campaigns" description="Manage outbound dialing campaigns with predictive, preview, and progressive modes">
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-campaign">
          <Radio className="h-4 w-4 mr-2" /> New Campaign
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Radio className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{activeCampaigns}</p>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalContacts.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Phone className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{totalAnswered.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Answered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <Input
            placeholder="Search campaigns..."
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
                <TableHead>Status</TableHead>
                <TableHead>Caller ID</TableHead>
                <TableHead>Max Concurrent</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No campaigns found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{campaign.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[campaign.status]}`}>
                        {campaign.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono">{campaign.callerIdNumber}</TableCell>
                    <TableCell>{campaign.maxConcurrentCalls}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {campaign.scheduleStart} – {campaign.scheduleEnd}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(campaign.id)}
                        data-testid={`button-delete-campaign-${campaign.id}`}
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
            <DialogTitle>Create Campaign</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Campaign name" />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Type</Label>
              <Select
                onValueChange={(v) => form.setValue("type", v as CampaignForm["type"])}
                defaultValue="predictive"
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="predictive">Predictive</SelectItem>
                  <SelectItem value="preview">Preview</SelectItem>
                  <SelectItem value="progressive">Progressive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>Caller ID Number</Label>
              <Input {...form.register("callerIdNumber")} placeholder="+1-555-0100" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Max Concurrent Calls</Label>
              <Input
                type="number"
                {...form.register("maxConcurrentCalls", { valueAsNumber: true })}
                placeholder="10"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <Label>Schedule Start</Label>
                <Input {...form.register("scheduleStart")} placeholder="09:00" />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Schedule End</Label>
                <Input {...form.register("scheduleEnd")} placeholder="17:00" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-campaign">
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
