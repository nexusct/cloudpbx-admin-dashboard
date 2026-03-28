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
import { Clock, Calendar, Sun, Moon } from "lucide-react";

interface BusinessHoursProfile {
  id: number;
  name: string;
  timezone: string;
  afterHoursAction: "voicemail" | "forward" | "ivr" | "reject";
  isDefault: boolean;
  isActive: boolean;
  schedule: Record<string, { enabled: boolean; open: string; close: string }>;
  createdAt: string;
}

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  timezone: z.string().min(1, "Timezone is required"),
  afterHoursAction: z.enum(["voicemail", "forward", "ivr", "reject"]),
  isDefault: z.boolean(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function BusinessHours() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<BusinessHoursProfile | null>(null);
  const queryClient = useQueryClient();

  const { data: profiles = [] } = useQuery<BusinessHoursProfile[]>({
    queryKey: ["/api/business-hours"],
  });

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", timezone: "America/New_York", afterHoursAction: "voicemail", isDefault: false },
  });

  const createMutation = useMutation({
    mutationFn: (data: ProfileForm) => apiRequest("POST", "/api/business-hours", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business-hours"] });
      setShowDialog(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/business-hours/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/business-hours"] }),
  });

  const filtered = profiles.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeProfiles = profiles.filter((p) => p.isActive).length;
  const defaultProfile = profiles.find((p) => p.isDefault);

  const getDaySchedule = (profile: BusinessHoursProfile, day: string) => {
    const schedule = profile.schedule ?? {};
    return schedule[day] ?? { enabled: false, open: "09:00", close: "17:00" };
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Business Hours Manager" description="Configure business hour profiles and after-hours call handling">
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-profile">
          <Clock className="h-4 w-4 mr-2" /> New Profile
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{activeProfiles}</p>
                <p className="text-sm text-muted-foreground">Active Profiles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Sun className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm font-bold truncate">{defaultProfile?.name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">Default Profile</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Moon className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">—</p>
                <p className="text-sm text-muted-foreground">After-Hours Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">—%</p>
                <p className="text-sm text-muted-foreground">Coverage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Business Hour Profiles</CardTitle>
              <Input
                placeholder="Search profiles..."
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
                    <TableHead>Timezone</TableHead>
                    <TableHead>After Hours</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No profiles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((profile) => {
                      const schedule = profile.schedule ?? {};
                      const enabledDays = days.filter((d) => schedule[d]?.enabled).length;
                      return (
                        <TableRow
                          key={profile.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedProfile(profile)}
                        >
                          <TableCell className="font-medium">{profile.name}</TableCell>
                          <TableCell className="text-sm">{profile.timezone}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs capitalize">
                              {profile.afterHoursAction}
                            </span>
                          </TableCell>
                          <TableCell>
                            {profile.isDefault && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                Default
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-0.5">
                              {days.map((day) => (
                                <div
                                  key={day}
                                  className={`w-3 h-3 rounded-sm ${schedule[day]?.enabled ? "bg-green-500" : "bg-gray-200"}`}
                                  title={day}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{enabledDays}/7 days</p>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(profile.id); }}
                              data-testid={`button-delete-profile-${profile.id}`}
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Schedule Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProfile ? (
              <div className="flex flex-col gap-2">
                <h3 className="font-bold">{selectedProfile.name}</h3>
                <p className="text-xs text-muted-foreground">{selectedProfile.timezone}</p>
                <div className="flex flex-col gap-1 mt-2">
                  {days.map((day) => {
                    const daySchedule = getDaySchedule(selectedProfile, day);
                    return (
                      <div key={day} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${daySchedule.enabled ? "bg-green-500" : "bg-gray-300"}`} />
                        <span className="w-24 font-medium">{day.slice(0, 3)}</span>
                        {daySchedule.enabled ? (
                          <span className="text-muted-foreground">{daySchedule.open} – {daySchedule.close}</span>
                        ) : (
                          <span className="text-muted-foreground italic">Closed</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                Select a profile to preview
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Business Hours Profile</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <Label>Name</Label>
              <Input {...form.register("name")} placeholder="Main Office Hours" />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Timezone</Label>
              <Select
                onValueChange={(v) => form.setValue("timezone", v)}
                defaultValue="America/New_York"
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label>After Hours Action</Label>
              <Select
                onValueChange={(v) => form.setValue("afterHoursAction", v as ProfileForm["afterHoursAction"])}
                defaultValue="voicemail"
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="voicemail">Voicemail</SelectItem>
                  <SelectItem value="forward">Forward</SelectItem>
                  <SelectItem value="ivr">IVR</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isDefault" {...form.register("isDefault")} />
              <Label htmlFor="isDefault">Set as Default Profile</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-profile">
                {createMutation.isPending ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
