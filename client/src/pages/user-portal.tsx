import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  User,
  Phone,
  Voicemail,
  Forward,
  Clock,
  Bell,
  Headphones,
  Settings,
  Shield,
  Key,
  Smartphone,
  Monitor,
  Volume2,
  Mic,
  Loader2,
} from "lucide-react";
import type { Extension, Voicemail as VoicemailType, Device } from "@shared/schema";

export default function UserPortal() {
  const [dndEnabled, setDndEnabled] = useState(false);
  const [callForwardingEnabled, setCallForwardingEnabled] = useState(false);
  const [voicemailToEmail, setVoicemailToEmail] = useState(true);

  const { data: extensions = [], isLoading: loadingExtensions } = useQuery<Extension[]>({
    queryKey: ["/api/extensions"],
  });

  const { data: voicemails = [], isLoading: loadingVoicemails } = useQuery<VoicemailType[]>({
    queryKey: ["/api/voicemails"],
  });

  const { data: devices = [], isLoading: loadingDevices } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  const currentExtension = extensions.length > 0 ? extensions[0] : null;

  const userProfile = currentExtension ? {
    name: currentExtension.name,
    extension: currentExtension.number,
    email: currentExtension.callerIdNumber || "",
    department: currentExtension.department || "General",
    title: currentExtension.type === "sip" ? "SIP Extension" : currentExtension.type === "webrtc" ? "WebRTC Extension" : "Extension",
    directLine: currentExtension.callerIdNumber || "",
    status: currentExtension.status,
  } : null;

  const initials = userProfile?.name
    ? userProfile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const statusColor = userProfile?.status === "online" ? "bg-green-500" :
    userProfile?.status === "busy" ? "bg-red-500" :
    userProfile?.status === "away" ? "bg-yellow-500" : "bg-gray-400";

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeAgo = (date: Date | string | null) => {
    if (!date) return "Unknown";
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const extensionVoicemails = currentExtension
    ? voicemails.filter(vm => vm.extensionId === currentExtension.id)
    : voicemails.slice(0, 5);

  const extensionDevices = currentExtension
    ? devices.filter(d => d.extensionId === currentExtension.id)
    : devices.slice(0, 3);

  if (loadingExtensions) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader title="User Portal" description="Manage your personal phone settings and preferences" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="User Portal"
        description="Manage your personal phone settings and preferences"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 mb-4">
              <AvatarFallback className="text-xl" data-testid="text-user-initials">{initials}</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-semibold" data-testid="text-user-name">{userProfile?.name || "No Extension"}</h2>
            <p className="text-muted-foreground" data-testid="text-user-title">{userProfile?.title || "Not assigned"}</p>
            <Badge variant="secondary" className="mt-2" data-testid="text-user-department">{userProfile?.department || "N/A"}</Badge>
            
            <Separator className="my-4" />
            
            <div className="w-full space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Extension</span>
                <span className="font-mono font-medium" data-testid="text-extension-number">{userProfile?.extension || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Direct Line</span>
                <span className="font-mono text-sm" data-testid="text-direct-line">{userProfile?.directLine || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${statusColor}`} />
                  <span className="text-sm capitalize" data-testid="text-user-status">{userProfile?.status || "offline"}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <Tabs defaultValue="call-settings">
            <TabsList className="mb-4">
              <TabsTrigger value="call-settings">Call Settings</TabsTrigger>
              <TabsTrigger value="voicemail">Voicemail</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="call-settings" className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-md bg-muted">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Do Not Disturb</div>
                    <div className="text-sm text-muted-foreground">Send all calls to voicemail</div>
                  </div>
                </div>
                <Switch
                  checked={dndEnabled}
                  onCheckedChange={setDndEnabled}
                  data-testid="switch-dnd"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Forward className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Call Forwarding</div>
                      <div className="text-sm text-muted-foreground">
                        {currentExtension?.callForwardingEnabled
                          ? `Forwarding to ${currentExtension.callForwardingNumber || "not set"}`
                          : "Forward calls to another number"}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={callForwardingEnabled || (currentExtension?.callForwardingEnabled ?? false)}
                    onCheckedChange={setCallForwardingEnabled}
                    data-testid="switch-call-forwarding"
                  />
                </div>
                {(callForwardingEnabled || currentExtension?.callForwardingEnabled) && (
                  <div className="ml-8 space-y-3">
                    <div className="grid gap-2">
                      <Label>Forward to Number</Label>
                      <Input
                        placeholder="+1 (555) 000-0000"
                        defaultValue={currentExtension?.callForwardingNumber || ""}
                        data-testid="input-forward-number"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Forward When</Label>
                      <Select defaultValue="always">
                        <SelectTrigger data-testid="select-forward-when">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="always">Always</SelectItem>
                          <SelectItem value="busy">When Busy</SelectItem>
                          <SelectItem value="no-answer">No Answer</SelectItem>
                          <SelectItem value="offline">When Offline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Ring Timeout</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      defaultValue={[currentExtension?.ringTimeout || 30]}
                      max={60}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-16">{currentExtension?.ringTimeout || 30} sec</span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="voicemail" className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-md bg-muted">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Voicemail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium">Voicemail to Email</div>
                    <div className="text-sm text-muted-foreground">Receive voicemails as email attachments</div>
                  </div>
                </div>
                <Switch
                  checked={voicemailToEmail}
                  onCheckedChange={setVoicemailToEmail}
                  data-testid="switch-voicemail-email"
                />
              </div>

              <div className="space-y-3">
                <div className="grid gap-2">
                  <Label>Voicemail PIN</Label>
                  <Input type="password" placeholder="Enter 4-6 digit PIN" data-testid="input-voicemail-pin" />
                </div>
                <div className="grid gap-2">
                  <Label>Greeting</Label>
                  <Select defaultValue="default">
                    <SelectTrigger data-testid="select-greeting">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Greeting</SelectItem>
                      <SelectItem value="custom">Custom Recording</SelectItem>
                      <SelectItem value="busy">Busy Greeting</SelectItem>
                      <SelectItem value="ooo">Out of Office</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" data-testid="button-record-greeting">
                  <Mic className="h-4 w-4 mr-2" />
                  Record New Greeting
                </Button>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Recent Voicemails ({extensionVoicemails.length})</h4>
                {loadingVoicemails ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : extensionVoicemails.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No voicemails</div>
                ) : (
                  <div className="space-y-2">
                    {extensionVoicemails.map((vm) => (
                      <div key={vm.id} className="flex items-center justify-between p-3 rounded-md bg-muted" data-testid={`card-voicemail-${vm.id}`}>
                        <div className="flex items-center gap-3">
                          {!vm.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                          <div>
                            <div className="font-medium">{vm.callerName || "Unknown Caller"}</div>
                            <div className="text-xs text-muted-foreground font-mono">{vm.callerNumber}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{formatDuration(vm.duration || 0)}</div>
                          <div className="text-xs text-muted-foreground">{formatTimeAgo(vm.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="devices" className="space-y-6">
              <div className="space-y-4">
                {loadingDevices ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : extensionDevices.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No devices assigned to this extension
                  </div>
                ) : (
                  extensionDevices.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-4 rounded-md border" data-testid={`card-device-${device.id}`}>
                      <div className="flex items-center gap-3">
                        {device.type === "desk_phone" ? (
                          <Monitor className="h-5 w-5 text-muted-foreground" />
                        ) : device.type === "softphone" ? (
                          <Headphones className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Smartphone className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <div className="font-medium">{device.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {device.manufacturer} {device.model} - {device.status}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={device.status === "online"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0"
                          : ""}
                      >
                        {device.status === "online" ? "Online" : device.status}
                      </Badge>
                    </div>
                  ))
                )}

                <div className="flex items-center justify-between p-4 rounded-md border border-dashed">
                  <div className="flex items-center gap-3">
                    <Headphones className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Desktop Softphone</div>
                      <div className="text-sm text-muted-foreground">Download and configure</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-download-softphone">
                    Download
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Audio Settings</h4>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Ringtone</Label>
                    <Select defaultValue="classic">
                      <SelectTrigger data-testid="select-ringtone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="classic">Classic Ring</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="soft">Soft Tone</SelectItem>
                        <SelectItem value="vibrate">Vibrate Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Ring Volume</Label>
                    <div className="flex items-center gap-4">
                      <Volume2 className="h-4 w-4 text-muted-foreground" />
                      <Slider defaultValue={[70]} max={100} className="flex-1" />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Current Password</Label>
                  <Input type="password" data-testid="input-current-password" />
                </div>
                <div className="grid gap-2">
                  <Label>New Password</Label>
                  <Input type="password" data-testid="input-new-password" />
                </div>
                <div className="grid gap-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" data-testid="input-confirm-password" />
                </div>
                <Button data-testid="button-change-password">
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Two-Factor Authentication
                </h4>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account by enabling two-factor authentication.
                </p>
                <Button variant="outline" data-testid="button-enable-2fa">
                  Enable 2FA
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
