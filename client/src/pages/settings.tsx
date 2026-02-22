import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building,
  Globe,
  Clock,
  Phone,
  Shield,
  Database,
  Bell,
  Mail,
  Palette,
  Server,
  Download,
  Upload,
  Save,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SystemSetting } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const { data: settings = [], isLoading } = useQuery<SystemSetting[]>({
    queryKey: ["/api/settings"],
  });

  useEffect(() => {
    if (settings.length > 0) {
      const values: Record<string, any> = {};
      settings.forEach((s) => {
        values[s.key] = s.value;
      });
      setFormValues((prev) => {
        if (Object.keys(prev).length === 0) return values;
        return prev;
      });
    }
  }, [settings]);

  const getSetting = (key: string, fallback: any = "") => {
    if (key in formValues) return formValues[key];
    const found = settings.find((s) => s.key === key);
    return found ? found.value : fallback;
  };

  const updateLocal = (key: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      return apiRequest("PUT", `/api/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
  });

  const handleSaveAll = async () => {
    try {
      const promises = Object.entries(formValues).map(([key, value]) =>
        saveSettingMutation.mutateAsync({ key, value })
      );
      await Promise.all(promises);
      toast({ title: "Settings Saved", description: "All settings have been updated successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to save some settings.", variant: "destructive" });
    }
  };

  const handleBackupNow = async () => {
    try {
      await saveSettingMutation.mutateAsync({ key: "last_backup", value: new Date().toISOString() });
      toast({ title: "Backup Started", description: "System backup has been initiated." });
    } catch {
      toast({ title: "Error", description: "Failed to initiate backup.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader
          title="System Settings"
          description="Configure your phone system settings and preferences"
        />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="System Settings"
        description="Configure your phone system settings and preferences"
      >
        <Button
          data-testid="button-save-settings"
          onClick={handleSaveAll}
          disabled={saveSettingMutation.isPending}
        >
          {saveSettingMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </PageHeader>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="telephony">Telephony</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Building className="h-5 w-5" />
              Company Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Company Name</Label>
                <Input
                  value={getSetting("company_name", "Acme Corporation")}
                  onChange={(e) => updateLocal("company_name", e.target.value)}
                  data-testid="input-company-name"
                />
              </div>
              <div className="grid gap-2">
                <Label>Domain</Label>
                <Input
                  value={getSetting("domain", "acme.cloudpbx.com")}
                  onChange={(e) => updateLocal("domain", e.target.value)}
                  data-testid="input-domain"
                />
              </div>
              <div className="grid gap-2">
                <Label>Main Phone Number</Label>
                <Input
                  value={getSetting("main_phone", "+1 (555) 123-4567")}
                  onChange={(e) => updateLocal("main_phone", e.target.value)}
                  data-testid="input-main-phone"
                />
              </div>
              <div className="grid gap-2">
                <Label>Support Email</Label>
                <Input
                  value={getSetting("support_email", "support@acme.com")}
                  onChange={(e) => updateLocal("support_email", e.target.value)}
                  data-testid="input-support-email"
                />
              </div>
              <div className="col-span-2 grid gap-2">
                <Label>Address</Label>
                <Textarea
                  value={getSetting("address", "123 Business Ave, Suite 100, New York, NY 10001")}
                  onChange={(e) => updateLocal("address", e.target.value)}
                  data-testid="input-address"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5" />
              Regional Settings
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Timezone</Label>
                <Select
                  value={getSetting("timezone", "america-new-york")}
                  onValueChange={(v) => updateLocal("timezone", v)}
                >
                  <SelectTrigger data-testid="select-timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="america-new-york">America/New_York (EST)</SelectItem>
                    <SelectItem value="america-chicago">America/Chicago (CST)</SelectItem>
                    <SelectItem value="america-denver">America/Denver (MST)</SelectItem>
                    <SelectItem value="america-los-angeles">America/Los_Angeles (PST)</SelectItem>
                    <SelectItem value="europe-london">Europe/London (GMT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Country</Label>
                <Select
                  value={getSetting("country", "us")}
                  onValueChange={(v) => updateLocal("country", v)}
                >
                  <SelectTrigger data-testid="select-country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="au">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Date Format</Label>
                <Select
                  value={getSetting("date_format", "mdy")}
                  onValueChange={(v) => updateLocal("date_format", v)}
                >
                  <SelectTrigger data-testid="select-date-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Time Format</Label>
                <Select
                  value={getSetting("time_format", "12h")}
                  onValueChange={(v) => updateLocal("time_format", v)}
                >
                  <SelectTrigger data-testid="select-time-format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                    <SelectItem value="24h">24-hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5" />
              Business Hours
            </h3>
            <div className="space-y-4">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
                const bhKey = `business_hours_${day.toLowerCase()}`;
                const hours = getSetting(bhKey, { start: "9:00am", end: "5:00pm" });
                return (
                  <div key={day} className="flex items-center gap-4">
                    <span className="w-24 text-sm">{day}</span>
                    <Select
                      value={typeof hours === "object" && hours?.start ? hours.start : "9:00am"}
                      onValueChange={(v) => updateLocal(bhKey, { ...hours, start: v })}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM"].map((time) => (
                          <SelectItem key={time} value={time.toLowerCase().replace(/[:\s]/g, "")}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground">to</span>
                    <Select
                      value={typeof hours === "object" && hours?.end ? hours.end : "5:00pm"}
                      onValueChange={(v) => updateLocal(bhKey, { ...hours, end: v })}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM"].map((time) => (
                          <SelectItem key={time} value={time.toLowerCase().replace(/[:\s]/g, "")}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
              <div className="flex items-center gap-4">
                <span className="w-24 text-sm text-muted-foreground">Saturday</span>
                <Badge variant="secondary">Closed</Badge>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-24 text-sm text-muted-foreground">Sunday</span>
                <Badge variant="secondary">Closed</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="telephony" className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Phone className="h-5 w-5" />
              Call Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Call Recording</div>
                  <div className="text-sm text-muted-foreground">Record all inbound and outbound calls</div>
                </div>
                <Switch
                  checked={getSetting("call_recording", true)}
                  onCheckedChange={(v) => updateLocal("call_recording", v)}
                  data-testid="switch-call-recording"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Call Analytics</div>
                  <div className="text-sm text-muted-foreground">Enable detailed call statistics and reporting</div>
                </div>
                <Switch
                  checked={getSetting("call_analytics", true)}
                  onCheckedChange={(v) => updateLocal("call_analytics", v)}
                  data-testid="switch-call-analytics"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Music on Hold</div>
                  <div className="text-sm text-muted-foreground">Play music while callers are on hold</div>
                </div>
                <Switch
                  checked={getSetting("music_on_hold", true)}
                  onCheckedChange={(v) => updateLocal("music_on_hold", v)}
                  data-testid="switch-music-on-hold"
                />
              </div>
              <Separator />
              <div className="grid gap-2">
                <Label>Default Ring Timeout (seconds)</Label>
                <Input
                  type="number"
                  value={getSetting("ring_timeout", "30")}
                  onChange={(e) => updateLocal("ring_timeout", e.target.value)}
                  className="w-24"
                  data-testid="input-ring-timeout"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Server className="h-5 w-5" />
              SIP Trunk Settings
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Primary Trunk</Label>
                <Select
                  value={getSetting("primary_trunk", "twilio")}
                  onValueChange={(v) => updateLocal("primary_trunk", v)}
                >
                  <SelectTrigger data-testid="select-primary-trunk">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="bandwidth">Bandwidth</SelectItem>
                    <SelectItem value="vonage">Vonage</SelectItem>
                    <SelectItem value="signalwire">SignalWire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Failover Trunk</Label>
                <Select
                  value={getSetting("failover_trunk", "bandwidth")}
                  onValueChange={(v) => updateLocal("failover_trunk", v)}
                >
                  <SelectTrigger data-testid="select-failover-trunk">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="bandwidth">Bandwidth</SelectItem>
                    <SelectItem value="vonage">Vonage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5" />
              Security Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Two-Factor Authentication</div>
                  <div className="text-sm text-muted-foreground">Require 2FA for all admin users</div>
                </div>
                <Switch
                  checked={getSetting("require_2fa", false)}
                  onCheckedChange={(v) => updateLocal("require_2fa", v)}
                  data-testid="switch-require-2fa"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">IP Whitelisting</div>
                  <div className="text-sm text-muted-foreground">Restrict access to specific IP addresses</div>
                </div>
                <Switch
                  checked={getSetting("ip_whitelist", false)}
                  onCheckedChange={(v) => updateLocal("ip_whitelist", v)}
                  data-testid="switch-ip-whitelist"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Session Timeout</div>
                  <div className="text-sm text-muted-foreground">Automatically log out inactive users</div>
                </div>
                <Select
                  value={String(getSetting("session_timeout", "30"))}
                  onValueChange={(v) => updateLocal("session_timeout", v)}
                >
                  <SelectTrigger className="w-32" data-testid="select-session-timeout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-sm text-muted-foreground">Receive system alerts via email</div>
                </div>
                <Switch
                  checked={getSetting("email_notifications", true)}
                  onCheckedChange={(v) => updateLocal("email_notifications", v)}
                  data-testid="switch-email-notifications"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Missed Call Alerts</div>
                  <div className="text-sm text-muted-foreground">Get notified when calls are missed</div>
                </div>
                <Switch
                  checked={getSetting("missed_call_alerts", true)}
                  onCheckedChange={(v) => updateLocal("missed_call_alerts", v)}
                  data-testid="switch-missed-call-alerts"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Voicemail Notifications</div>
                  <div className="text-sm text-muted-foreground">Get notified when new voicemails arrive</div>
                </div>
                <Switch
                  checked={getSetting("voicemail_notifications", true)}
                  onCheckedChange={(v) => updateLocal("voicemail_notifications", v)}
                  data-testid="switch-voicemail-notifications"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">System Health Alerts</div>
                  <div className="text-sm text-muted-foreground">Receive alerts for system issues</div>
                </div>
                <Switch
                  checked={getSetting("system_alerts", true)}
                  onCheckedChange={(v) => updateLocal("system_alerts", v)}
                  data-testid="switch-system-alerts"
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Database className="h-5 w-5" />
              Backup & Restore
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Automatic Backups</div>
                  <div className="text-sm text-muted-foreground">Schedule automatic system backups</div>
                </div>
                <Switch
                  checked={getSetting("auto_backup", true)}
                  onCheckedChange={(v) => updateLocal("auto_backup", v)}
                  data-testid="switch-auto-backup"
                />
              </div>
              <div className="grid gap-2">
                <Label>Backup Frequency</Label>
                <Select
                  value={getSetting("backup_frequency", "daily")}
                  onValueChange={(v) => updateLocal("backup_frequency", v)}
                >
                  <SelectTrigger className="w-48" data-testid="select-backup-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  data-testid="button-backup-now"
                  onClick={handleBackupNow}
                  disabled={saveSettingMutation.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Backup Now
                </Button>
                <Button variant="outline" data-testid="button-restore">
                  <Upload className="h-4 w-4 mr-2" />
                  Restore from Backup
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
