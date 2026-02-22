import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import {
  HeartPulse,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  Users,
  ArrowLeft,
  RefreshCw,
  Loader2,
  BellRing,
  Shield,
  Activity,
  Radio,
  MapPin,
  Plus,
  Trash2,
  Save,
  Eye,
  Phone,
  Settings,
  XCircle,
} from "lucide-react";

interface Alarm {
  id: string | number;
  deviceId: string | number;
  deviceName: string;
  alarmType: string;
  priority: string;
  status: string;
  zone: string;
  room: string;
  resident: string;
  timestamp: string;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
}

interface Incident {
  id: string | number;
  title: string;
  type: string;
  status: string;
  priority: string;
  zone: string;
  room: string;
  resident: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string | null;
  resolvedAt: string | null;
  notes: string;
}

interface RCareDevice {
  id: string | number;
  name: string;
  type: string;
  zone: string;
  room: string;
  resident: string;
  status: string;
  battery: number | null;
  lastSeen: string | null;
  signalStrength: number | null;
}

interface DeviceMapping {
  rcareDeviceId: string;
  rcareDeviceName: string;
  extensionNumber: string;
  ringGroupId: string;
  alarmTypes: string[];
}

interface NotificationRoute {
  id: string;
  name: string;
  alarmType: string;
  priority: string;
  zone: string;
  targetType: string;
  targetValue: string;
  escalationDelay: number;
  enabled: boolean;
}

function priorityColor(priority: string) {
  switch (priority.toLowerCase()) {
    case "critical":
    case "emergency": return "destructive";
    case "high": return "destructive";
    case "medium": return "secondary";
    default: return "outline";
  }
}

function statusColor(status: string) {
  switch (status.toLowerCase()) {
    case "active": return "destructive";
    case "acknowledged": return "secondary";
    case "resolved":
    case "closed": return "outline";
    case "online": return "secondary";
    case "offline": return "destructive";
    default: return "outline";
  }
}

function formatTime(ts: string | null) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

export default function RCarePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("alarms");
  const [resolveDialog, setResolveDialog] = useState<Incident | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [mappingDialog, setMappingDialog] = useState(false);
  const [routeDialog, setRouteDialog] = useState(false);
  const [newMapping, setNewMapping] = useState<Partial<DeviceMapping>>({});
  const [newRoute, setNewRoute] = useState<Partial<NotificationRoute>>({ enabled: true, escalationDelay: 30 });

  const settingsQuery = useQuery<any>({ queryKey: ["/api/rcare/settings"] });
  const alarmsQuery = useQuery<{ alarms: Alarm[] }>({ queryKey: ["/api/rcare/alarms"], refetchInterval: 30000 });
  const incidentsQuery = useQuery<{ incidents: Incident[] }>({ queryKey: ["/api/rcare/incidents"] });
  const devicesQuery = useQuery<{ devices: RCareDevice[] }>({ queryKey: ["/api/rcare/devices"] });
  const viewsQuery = useQuery<{ views: any[] }>({ queryKey: ["/api/rcare/views"] });
  const extensionsQuery = useQuery<any[]>({ queryKey: ["/api/extensions"] });

  const isConfigured = settingsQuery.data?.configured;
  const alarms = alarmsQuery.data?.alarms || [];
  const incidents = incidentsQuery.data?.incidents || [];
  const devices = devicesQuery.data?.devices || [];
  const extensions = extensionsQuery.data || [];
  const deviceMappings: DeviceMapping[] = settingsQuery.data?.deviceMappings || [];
  const notificationRoutes: NotificationRoute[] = settingsQuery.data?.notificationRoutes || [];

  const activeAlarms = alarms.filter(a => a.status === "active");
  const acknowledgedAlarms = alarms.filter(a => a.status === "acknowledged");
  const openIncidents = incidents.filter(i => i.status === "open" || i.status === "active");
  const onlineDevices = devices.filter(d => d.status === "online");

  const acknowledgeMutation = useMutation({
    mutationFn: async (alarmId: string | number) => {
      const res = await apiRequest("POST", `/api/rcare/alarms/${alarmId}/acknowledge`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Alarm acknowledged" });
      queryClient.invalidateQueries({ queryKey: ["/api/rcare/alarms"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string | number; notes: string }) => {
      const res = await apiRequest("POST", `/api/rcare/incidents/${id}/resolve`, { notes });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Incident resolved" });
      setResolveDialog(null);
      setResolveNotes("");
      queryClient.invalidateQueries({ queryKey: ["/api/rcare/incidents"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const saveMappingsMutation = useMutation({
    mutationFn: async (mappings: DeviceMapping[]) => {
      const res = await apiRequest("POST", "/api/rcare/settings/device-mappings", { mappings });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Device mappings saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/rcare/settings"] });
      setMappingDialog(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const saveRoutesMutation = useMutation({
    mutationFn: async (routes: NotificationRoute[]) => {
      const res = await apiRequest("POST", "/api/rcare/settings/notification-routes", { routes });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Notification routes saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/rcare/settings"] });
      setRouteDialog(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function handleAddMapping() {
    if (!newMapping.rcareDeviceId || !newMapping.extensionNumber) {
      toast({ title: "Device and extension are required", variant: "destructive" });
      return;
    }
    const updated = [
      ...deviceMappings,
      {
        rcareDeviceId: newMapping.rcareDeviceId,
        rcareDeviceName: newMapping.rcareDeviceName || "",
        extensionNumber: newMapping.extensionNumber,
        ringGroupId: newMapping.ringGroupId || "",
        alarmTypes: newMapping.alarmTypes || ["all"],
      },
    ];
    saveMappingsMutation.mutate(updated);
    setNewMapping({});
  }

  function handleRemoveMapping(index: number) {
    const updated = deviceMappings.filter((_, i) => i !== index);
    saveMappingsMutation.mutate(updated);
  }

  function handleAddRoute() {
    if (!newRoute.name || !newRoute.targetValue) {
      toast({ title: "Name and target are required", variant: "destructive" });
      return;
    }
    const updated = [
      ...notificationRoutes,
      {
        id: Date.now().toString(),
        name: newRoute.name || "",
        alarmType: newRoute.alarmType || "all",
        priority: newRoute.priority || "all",
        zone: newRoute.zone || "all",
        targetType: newRoute.targetType || "extension",
        targetValue: newRoute.targetValue || "",
        escalationDelay: newRoute.escalationDelay || 30,
        enabled: newRoute.enabled !== false,
      },
    ];
    saveRoutesMutation.mutate(updated);
    setNewRoute({ enabled: true, escalationDelay: 30 });
  }

  function handleRemoveRoute(index: number) {
    const updated = notificationRoutes.filter((_, i) => i !== index);
    saveRoutesMutation.mutate(updated);
  }

  function handleToggleRoute(index: number) {
    const updated = notificationRoutes.map((r, i) =>
      i === index ? { ...r, enabled: !r.enabled } : r
    );
    saveRoutesMutation.mutate(updated);
  }

  if (settingsQuery.isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-auto h-full">
      <PageHeader
        title="RCare Nurse Call"
        description="Manage nurse call alarms, incidents, devices, and notification routing"
        data-testid="text-rcare-title"
      >
        <div className="flex items-center gap-2 flex-wrap">
          {isConfigured ? (
            <Badge variant="secondary" data-testid="badge-rcare-status">Connected</Badge>
          ) : (
            <Badge variant="destructive" data-testid="badge-rcare-status">Not Configured</Badge>
          )}
          <Link href="/integrations">
            <Button variant="outline" size="sm" data-testid="button-back-integrations">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Integrations
            </Button>
          </Link>
        </div>
      </PageHeader>

      {!isConfigured ? (
        <Card className="p-8 text-center space-y-4">
          <HeartPulse className="w-16 h-16 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold" data-testid="text-not-configured">RCare Not Configured</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Connect your RCare Cube to start receiving nurse call alerts, manage incidents, and route notifications to your PBX extensions.
          </p>
          <Link href="/integrations">
            <Button data-testid="button-configure-rcare">
              <Settings className="w-4 h-4 mr-2" />
              Configure in Integrations
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 space-y-2" data-testid="card-active-alarms">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Active Alarms</span>
                <BellRing className="w-4 h-4 text-destructive" />
              </div>
              <div className="text-2xl font-bold" data-testid="text-active-alarm-count">{activeAlarms.length}</div>
              <div className="text-xs text-muted-foreground">{acknowledgedAlarms.length} acknowledged</div>
            </Card>
            <Card className="p-4 space-y-2" data-testid="card-open-incidents">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Open Incidents</span>
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold" data-testid="text-open-incident-count">{openIncidents.length}</div>
              <div className="text-xs text-muted-foreground">{incidents.length} total</div>
            </Card>
            <Card className="p-4 space-y-2" data-testid="card-devices">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Devices</span>
                <Radio className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold" data-testid="text-device-count">{devices.length}</div>
              <div className="text-xs text-muted-foreground">{onlineDevices.length} online</div>
            </Card>
            <Card className="p-4 space-y-2" data-testid="card-mappings">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">Notification Routes</span>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="text-2xl font-bold" data-testid="text-route-count">{notificationRoutes.length}</div>
              <div className="text-xs text-muted-foreground">{deviceMappings.length} device mappings</div>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList data-testid="tabs-rcare">
              <TabsTrigger value="alarms" data-testid="tab-alarms">
                <BellRing className="w-4 h-4 mr-1" />
                Alarms
              </TabsTrigger>
              <TabsTrigger value="incidents" data-testid="tab-incidents">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Incidents
              </TabsTrigger>
              <TabsTrigger value="devices" data-testid="tab-devices">
                <Radio className="w-4 h-4 mr-1" />
                Devices
              </TabsTrigger>
              <TabsTrigger value="mappings" data-testid="tab-mappings">
                <Phone className="w-4 h-4 mr-1" />
                Device Mapping
              </TabsTrigger>
              <TabsTrigger value="routing" data-testid="tab-routing">
                <Bell className="w-4 h-4 mr-1" />
                Notification Routing
              </TabsTrigger>
            </TabsList>

            <TabsContent value="alarms" className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-lg font-semibold">Active Alarms</h3>
                <Button
                  variant="outline" size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/rcare/alarms"] })}
                  disabled={alarmsQuery.isRefetching}
                  data-testid="button-refresh-alarms"
                >
                  {alarmsQuery.isRefetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span className="ml-1">Refresh</span>
                </Button>
              </div>

              {alarmsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>
              ) : alarms.length === 0 ? (
                <Card className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-2" />
                  <p className="text-muted-foreground" data-testid="text-no-alarms">No active alarms</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {alarms.map(alarm => (
                    <Card key={alarm.id} className="p-4" data-testid={`card-alarm-${alarm.id}`}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{alarm.deviceName}</span>
                            <Badge variant={priorityColor(alarm.priority)}>{alarm.priority}</Badge>
                            <Badge variant={statusColor(alarm.status)}>{alarm.status}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                            {alarm.zone && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{alarm.zone}</span>}
                            {alarm.room && <span>Room: {alarm.room}</span>}
                            {alarm.resident && <span>Resident: {alarm.resident}</span>}
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(alarm.timestamp)}</span>
                          </div>
                          {alarm.acknowledgedBy && (
                            <div className="text-xs text-muted-foreground">
                              Acknowledged by {alarm.acknowledgedBy} at {formatTime(alarm.acknowledgedAt)}
                            </div>
                          )}
                        </div>
                        {alarm.status === "active" && (
                          <Button
                            size="sm"
                            onClick={() => acknowledgeMutation.mutate(alarm.id)}
                            disabled={acknowledgeMutation.isPending}
                            data-testid={`button-acknowledge-${alarm.id}`}
                          >
                            {acknowledgeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                            Acknowledge
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="incidents" className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-lg font-semibold">Incidents</h3>
                <Button
                  variant="outline" size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/rcare/incidents"] })}
                  disabled={incidentsQuery.isRefetching}
                  data-testid="button-refresh-incidents"
                >
                  {incidentsQuery.isRefetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span className="ml-1">Refresh</span>
                </Button>
              </div>

              {incidentsQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>
              ) : incidents.length === 0 ? (
                <Card className="p-8 text-center">
                  <Shield className="w-12 h-12 mx-auto text-green-500 mb-2" />
                  <p className="text-muted-foreground" data-testid="text-no-incidents">No incidents reported</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {incidents.map(incident => (
                    <Card key={incident.id} className="p-4" data-testid={`card-incident-${incident.id}`}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{incident.title}</span>
                            <Badge variant={priorityColor(incident.priority)}>{incident.priority}</Badge>
                            <Badge variant={statusColor(incident.status)}>{incident.status}</Badge>
                            <Badge variant="outline">{incident.type}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                            {incident.zone && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{incident.zone}</span>}
                            {incident.room && <span>Room: {incident.room}</span>}
                            {incident.resident && <span>Resident: {incident.resident}</span>}
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(incident.createdAt)}</span>
                          </div>
                          {incident.assignedTo && <div className="text-xs text-muted-foreground">Assigned to: {incident.assignedTo}</div>}
                          {incident.notes && <div className="text-xs text-muted-foreground mt-1">{incident.notes}</div>}
                        </div>
                        {(incident.status === "open" || incident.status === "active") && (
                          <Button
                            size="sm"
                            onClick={() => { setResolveDialog(incident); setResolveNotes(""); }}
                            data-testid={`button-resolve-${incident.id}`}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="devices" className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-lg font-semibold">RCare Devices</h3>
                <Button
                  variant="outline" size="sm"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/rcare/devices"] })}
                  disabled={devicesQuery.isRefetching}
                  data-testid="button-refresh-devices"
                >
                  {devicesQuery.isRefetching ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span className="ml-1">Refresh</span>
                </Button>
              </div>

              {devicesQuery.isLoading ? (
                <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>
              ) : devices.length === 0 ? (
                <Card className="p-8 text-center">
                  <Cpu className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground" data-testid="text-no-devices">No devices found</p>
                  <p className="text-xs text-muted-foreground mt-1">Connect your RCare Cube to discover devices</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {devices.map(device => (
                    <Card key={device.id} className="p-4 space-y-2" data-testid={`card-device-${device.id}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{device.name}</span>
                        <Badge variant={statusColor(device.status)}>{device.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{device.type}</Badge>
                          {device.zone && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{device.zone}</span>}
                        </div>
                        {device.room && <div>Room: {device.room}</div>}
                        {device.resident && <div>Resident: {device.resident}</div>}
                        <div className="flex items-center gap-3 flex-wrap text-xs">
                          {device.battery !== null && <span>Battery: {device.battery}%</span>}
                          {device.lastSeen && <span>Last seen: {formatTime(device.lastSeen)}</span>}
                          {device.signalStrength !== null && <span>Signal: {device.signalStrength}dBm</span>}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="mappings" className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-lg font-semibold">Device-to-Extension Mapping</h3>
                  <p className="text-sm text-muted-foreground">Map RCare devices to PBX extensions for automatic call routing on alarms</p>
                </div>
                <Button size="sm" onClick={() => setMappingDialog(true)} data-testid="button-add-mapping">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Mapping
                </Button>
              </div>

              {deviceMappings.length === 0 ? (
                <Card className="p-8 text-center">
                  <Phone className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground" data-testid="text-no-mappings">No device mappings configured</p>
                  <p className="text-xs text-muted-foreground mt-1">Map RCare devices to extensions to route alarm calls automatically</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {deviceMappings.map((mapping, i) => (
                    <Card key={i} className="p-4" data-testid={`card-mapping-${i}`}>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4 flex-wrap">
                          <div>
                            <div className="text-sm font-medium">{mapping.rcareDeviceName || mapping.rcareDeviceId}</div>
                            <div className="text-xs text-muted-foreground">RCare Device ID: {mapping.rcareDeviceId}</div>
                          </div>
                          <div className="text-muted-foreground">→</div>
                          <div>
                            <div className="text-sm font-medium">Ext. {mapping.extensionNumber}</div>
                            {mapping.ringGroupId && <div className="text-xs text-muted-foreground">Ring Group: {mapping.ringGroupId}</div>}
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {(mapping.alarmTypes || []).map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                          </div>
                        </div>
                        <Button
                          variant="outline" size="icon"
                          onClick={() => handleRemoveMapping(i)}
                          data-testid={`button-remove-mapping-${i}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="routing" className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-lg font-semibold">Notification Routing Rules</h3>
                  <p className="text-sm text-muted-foreground">Configure how nurse call alarms are routed to extensions, ring groups, and queues</p>
                </div>
                <Button size="sm" onClick={() => setRouteDialog(true)} data-testid="button-add-route">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Route
                </Button>
              </div>

              {notificationRoutes.length === 0 ? (
                <Card className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground" data-testid="text-no-routes">No notification routes configured</p>
                  <p className="text-xs text-muted-foreground mt-1">Set up rules for how alarm notifications are delivered</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {notificationRoutes.map((route, i) => (
                    <Card key={route.id || i} className={`p-4 ${!route.enabled ? "opacity-60" : ""}`} data-testid={`card-route-${i}`}>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{route.name}</span>
                            {!route.enabled && <Badge variant="outline">Disabled</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                            <span>Type: {route.alarmType}</span>
                            <span>Priority: {route.priority}</span>
                            <span>Zone: {route.zone}</span>
                            <span>→ {route.targetType}: {route.targetValue}</span>
                            <span>Escalation: {route.escalationDelay}s</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline" size="icon"
                            onClick={() => handleToggleRoute(i)}
                            data-testid={`button-toggle-route-${i}`}
                          >
                            {route.enabled ? <Eye className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="outline" size="icon"
                            onClick={() => handleRemoveRoute(i)}
                            data-testid={`button-remove-route-${i}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      <Dialog open={resolveDialog !== null} onOpenChange={(o) => { if (!o) setResolveDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Incident</DialogTitle>
          </DialogHeader>
          {resolveDialog && (
            <div className="space-y-4">
              <div>
                <div className="font-medium">{resolveDialog.title}</div>
                <div className="text-sm text-muted-foreground">
                  {resolveDialog.zone && `Zone: ${resolveDialog.zone} | `}
                  {resolveDialog.room && `Room: ${resolveDialog.room} | `}
                  {resolveDialog.resident && `Resident: ${resolveDialog.resident}`}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Resolution Notes</Label>
                <Textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Add resolution notes..."
                  data-testid="input-resolve-notes"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setResolveDialog(null)}>Cancel</Button>
                <Button
                  onClick={() => resolveMutation.mutate({ id: resolveDialog.id, notes: resolveNotes })}
                  disabled={resolveMutation.isPending}
                  data-testid="button-confirm-resolve"
                >
                  {resolveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                  Resolve Incident
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={mappingDialog} onOpenChange={setMappingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Device Mapping</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>RCare Device</Label>
              {devices.length > 0 ? (
                <Select
                  value={newMapping.rcareDeviceId || ""}
                  onValueChange={(v) => {
                    const dev = devices.find(d => String(d.id) === v);
                    setNewMapping({ ...newMapping, rcareDeviceId: v, rcareDeviceName: dev?.name || v });
                  }}
                >
                  <SelectTrigger data-testid="select-mapping-device">
                    <SelectValue placeholder="Select a device" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name} ({d.type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Device ID"
                  value={newMapping.rcareDeviceId || ""}
                  onChange={(e) => setNewMapping({ ...newMapping, rcareDeviceId: e.target.value })}
                  data-testid="input-mapping-device-id"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Target Extension</Label>
              {extensions.length > 0 ? (
                <Select
                  value={newMapping.extensionNumber || ""}
                  onValueChange={(v) => setNewMapping({ ...newMapping, extensionNumber: v })}
                >
                  <SelectTrigger data-testid="select-mapping-extension">
                    <SelectValue placeholder="Select an extension" />
                  </SelectTrigger>
                  <SelectContent>
                    {extensions.map((ext: any) => (
                      <SelectItem key={ext.id} value={ext.number || String(ext.id)}>
                        {ext.number} - {ext.displayName || ext.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Extension number"
                  value={newMapping.extensionNumber || ""}
                  onChange={(e) => setNewMapping({ ...newMapping, extensionNumber: e.target.value })}
                  data-testid="input-mapping-extension"
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Ring Group ID (optional)</Label>
              <Input
                placeholder="Ring group ID for escalation"
                value={newMapping.ringGroupId || ""}
                onChange={(e) => setNewMapping({ ...newMapping, ringGroupId: e.target.value })}
                data-testid="input-mapping-ring-group"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMappingDialog(false)}>Cancel</Button>
              <Button
                onClick={handleAddMapping}
                disabled={saveMappingsMutation.isPending}
                data-testid="button-save-mapping"
              >
                {saveMappingsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Save Mapping
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={routeDialog} onOpenChange={setRouteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Notification Route</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Route Name</Label>
              <Input
                placeholder="e.g., Emergency calls to nurses station"
                value={newRoute.name || ""}
                onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                data-testid="input-route-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alarm Type</Label>
                <Select
                  value={newRoute.alarmType || "all"}
                  onValueChange={(v) => setNewRoute({ ...newRoute, alarmType: v })}
                >
                  <SelectTrigger data-testid="select-route-alarm-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="nurse_call">Nurse Call</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="fall">Fall Detection</SelectItem>
                    <SelectItem value="wander">Wander Alert</SelectItem>
                    <SelectItem value="door">Door Alert</SelectItem>
                    <SelectItem value="bed_exit">Bed Exit</SelectItem>
                    <SelectItem value="bathroom">Bathroom</SelectItem>
                    <SelectItem value="pendant">Pendant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={newRoute.priority || "all"}
                  onValueChange={(v) => setNewRoute({ ...newRoute, priority: v })}
                >
                  <SelectTrigger data-testid="select-route-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Zone Filter</Label>
              <Input
                placeholder="All zones (or specify zone name)"
                value={newRoute.zone === "all" ? "" : newRoute.zone || ""}
                onChange={(e) => setNewRoute({ ...newRoute, zone: e.target.value || "all" })}
                data-testid="input-route-zone"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Type</Label>
                <Select
                  value={newRoute.targetType || "extension"}
                  onValueChange={(v) => setNewRoute({ ...newRoute, targetType: v })}
                >
                  <SelectTrigger data-testid="select-route-target-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="extension">Extension</SelectItem>
                    <SelectItem value="ring_group">Ring Group</SelectItem>
                    <SelectItem value="queue">Call Queue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target</Label>
                <Input
                  placeholder="Extension number or group ID"
                  value={newRoute.targetValue || ""}
                  onChange={(e) => setNewRoute({ ...newRoute, targetValue: e.target.value })}
                  data-testid="input-route-target"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Escalation Delay (seconds)</Label>
              <Input
                type="number"
                value={newRoute.escalationDelay || 30}
                onChange={(e) => setNewRoute({ ...newRoute, escalationDelay: parseInt(e.target.value) || 30 })}
                data-testid="input-route-escalation"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRouteDialog(false)}>Cancel</Button>
              <Button
                onClick={handleAddRoute}
                disabled={saveRoutesMutation.isPending}
                data-testid="button-save-route"
              >
                {saveRoutesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Save Route
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
