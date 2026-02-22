import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Search,
  Monitor,
  Smartphone,
  Headphones,
  MoreHorizontal,
  Settings,
  RefreshCw,
  Download,
  Trash2,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Device, InsertDevice } from "@shared/schema";

const typeIcons: Record<string, any> = {
  desk_phone: Monitor,
  softphone: Smartphone,
  headset: Headphones,
  conference: Monitor,
};

export default function Devices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [newDeviceMac, setNewDeviceMac] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newDeviceType, setNewDeviceType] = useState("desk_phone");
  const [newDeviceExtension, setNewDeviceExtension] = useState("");
  const { toast } = useToast();

  const { data: devices = [], isLoading } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
  });

  const createDeviceMutation = useMutation({
    mutationFn: async (data: Partial<InsertDevice>) => {
      return apiRequest("POST", "/api/devices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      toast({ title: "Device Added", description: "The device has been successfully registered." });
      setIsAddDialogOpen(false);
      setNewDeviceMac("");
      setNewDeviceName("");
      setNewDeviceType("desk_phone");
      setNewDeviceExtension("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add device.", variant: "destructive" });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/devices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      toast({ title: "Device Removed", description: "The device has been removed from the system." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove device.", variant: "destructive" });
    },
  });

  const handleAddDevice = () => {
    createDeviceMutation.mutate({
      name: newDeviceName,
      mac: newDeviceMac,
      type: newDeviceType,
      status: "offline",
      provisioningStatus: "pending",
    });
  };

  const filteredDevices = devices.filter((device) => {
    const matchesSearch =
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.mac?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.model?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || device.type === selectedType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: devices.length,
    online: devices.filter((d) => d.status === "online" || d.status === "in_call" || d.status === "ringing").length,
    needsUpdate: devices.filter((d) => d.firmwareVersion && d.latestFirmware && d.firmwareVersion !== d.latestFirmware).length,
    pending: devices.filter((d) => d.provisioningStatus === "pending").length,
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Devices"
        description="Manage phones, softphones, and headsets"
      >
        <Button variant="outline" size="sm" data-testid="button-update-firmware">
          <Download className="h-4 w-4 mr-2" />
          Update All Firmware
        </Button>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-device">
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Device</DialogTitle>
              <DialogDescription>
                Register a new phone or device to your system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="device-mac">MAC Address</Label>
                <Input
                  id="device-mac"
                  placeholder="00:11:22:33:44:55"
                  value={newDeviceMac}
                  onChange={(e) => setNewDeviceMac(e.target.value)}
                  data-testid="input-device-mac"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="device-name">Device Name</Label>
                <Input
                  id="device-name"
                  placeholder="e.g., Reception Phone"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  data-testid="input-device-name"
                />
              </div>
              <div className="grid gap-2">
                <Label>Device Type</Label>
                <Select value={newDeviceType} onValueChange={setNewDeviceType}>
                  <SelectTrigger data-testid="select-device-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desk_phone">Desk Phone</SelectItem>
                    <SelectItem value="conference">Conference Phone</SelectItem>
                    <SelectItem value="softphone">Softphone</SelectItem>
                    <SelectItem value="headset">Headset</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Assign to Extension (Optional)</Label>
                <Select value={newDeviceExtension} onValueChange={setNewDeviceExtension}>
                  <SelectTrigger data-testid="select-device-extension">
                    <SelectValue placeholder="Select an extension" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="101">101 - John Smith</SelectItem>
                    <SelectItem value="102">102 - Sarah Johnson</SelectItem>
                    <SelectItem value="103">103 - Mike Brown</SelectItem>
                    <SelectItem value="unassigned">Leave Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddDevice}
                disabled={createDeviceMutation.isPending}
                data-testid="button-save-device"
              >
                {createDeviceMutation.isPending ? "Adding..." : "Add Device"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Monitor className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Devices</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
            <Wifi className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.online}</div>
            <div className="text-xs text-muted-foreground">Online</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.needsUpdate}</div>
            <div className="text-xs text-muted-foreground">Needs Update</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending Setup</div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 p-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-devices"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-40" data-testid="filter-device-type">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="desk_phone">Desk Phones</SelectItem>
              <SelectItem value="softphone">Softphones</SelectItem>
              <SelectItem value="conference">Conference</SelectItem>
              <SelectItem value="headset">Headsets</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>MAC Address</TableHead>
              <TableHead>Extension</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Firmware</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading devices...
                </TableCell>
              </TableRow>
            ) : filteredDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No devices found
                </TableCell>
              </TableRow>
            ) : (
              filteredDevices.map((device) => {
                const Icon = typeIcons[device.type] || Monitor;
                const needsUpdate = device.firmwareVersion && device.latestFirmware && device.firmwareVersion !== device.latestFirmware;
                return (
                  <TableRow key={device.id} data-testid={`device-row-${device.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${
                          device.status === "online" || device.status === "in_call"
                            ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium">{device.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {device.manufacturer} {device.model}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{device.mac}</TableCell>
                    <TableCell>
                      {device.extensionId ? (
                        <div>
                          <div className="font-medium">Ext. {device.extensionId}</div>
                        </div>
                      ) : (
                        <Badge variant="secondary">Unassigned</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {device.status === "online" && <Wifi className="h-4 w-4 text-green-500" />}
                        {device.status === "offline" && <WifiOff className="h-4 w-4 text-gray-400" />}
                        {device.status === "in_call" && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">In Call</Badge>}
                        {device.status === "ringing" && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">Ringing</Badge>}
                        {(device.status === "online" || device.status === "offline") && (
                          <span className="text-sm capitalize">{device.status}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {needsUpdate ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        <div>
                          <div className="text-sm">{device.firmwareVersion || "N/A"}</div>
                          {needsUpdate && (
                            <div className="text-xs text-amber-600 dark:text-amber-400">
                              Update available: {device.latestFirmware}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" data-testid={`menu-device-${device.id}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reboot
                          </DropdownMenuItem>
                          {needsUpdate && (
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Update Firmware
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteDeviceMutation.mutate(device.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
