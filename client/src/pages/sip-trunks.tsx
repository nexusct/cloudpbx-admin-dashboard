import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SipProvider, SipTrunk, DeviceTemplate } from "@shared/schema";
import { insertSipTrunkSchema, type InsertSipTrunk } from "@shared/schema";
import { 
  Phone, 
  Server, 
  Plus, 
  Globe, 
  Shield, 
  Settings2, 
  Wifi, 
  MonitorSpeaker,
  Smartphone,
  Radio,
  Video,
  Users,
  Check,
  X,
  Bluetooth,
  Tv
} from "lucide-react";

const createTrunkFormSchema = insertSipTrunkSchema.extend({
  name: insertSipTrunkSchema.shape.name.min(1, "Trunk name is required"),
});

type CreateTrunkFormValues = InsertSipTrunk;

export default function SipTrunks() {
  const [isCreateTrunkOpen, setIsCreateTrunkOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<SipProvider | null>(null);

  const { toast } = useToast();

  const form = useForm<CreateTrunkFormValues>({
    resolver: zodResolver(createTrunkFormSchema),
    defaultValues: {
      name: "",
      username: "",
      authUsername: "",
      callerIdName: "",
      callerIdNumber: "",
      enabled: true,
      status: "inactive",
    },
  });

  const { data: providers = [], isLoading: loadingProviders } = useQuery<SipProvider[]>({
    queryKey: ["/api/sip-providers"],
  });

  const { data: trunks = [], isLoading: loadingTrunks } = useQuery<SipTrunk[]>({
    queryKey: ["/api/sip-trunks"],
  });

  const { data: deviceTemplates = [], isLoading: loadingDevices } = useQuery<DeviceTemplate[]>({
    queryKey: ["/api/device-templates"],
  });

  const createTrunkMutation = useMutation({
    mutationFn: async (data: CreateTrunkFormValues) => {
      return apiRequest("POST", "/api/sip-trunks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sip-trunks"] });
      toast({ title: "SIP Trunk Created", description: "The trunk has been successfully created." });
      setIsCreateTrunkOpen(false);
      form.reset();
      setSelectedProvider(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create SIP trunk.", variant: "destructive" });
    },
  });

  const handleProviderSelect = (providerId: string) => {
    const provider = providers.find(p => p.id.toString() === providerId);
    if (provider) {
      setSelectedProvider(provider);
      form.setValue("providerId", provider.id);
      form.setValue("host", provider.registrationServer || "");
      form.setValue("port", provider.port || 5060);
      form.setValue("transport", provider.transport || "udp");
      form.setValue("codecs", provider.codecs as string[] || []);
    }
  };

  const onSubmit = (data: CreateTrunkFormValues) => {
    createTrunkMutation.mutate(data);
  };

  const getDeviceTypeIcon = (type: string) => {
    switch (type) {
      case "phone": return <Phone className="h-4 w-4" />;
      case "video_phone": return <Video className="h-4 w-4" />;
      case "conference": return <Users className="h-4 w-4" />;
      case "dect_base": return <Radio className="h-4 w-4" />;
      case "teams_phone": return <Tv className="h-4 w-4" />;
      case "ata": return <MonitorSpeaker className="h-4 w-4" />;
      default: return <Smartphone className="h-4 w-4" />;
    }
  };

  const groupedDevices = deviceTemplates.reduce((acc, device) => {
    if (!acc[device.manufacturer]) {
      acc[device.manufacturer] = [];
    }
    acc[device.manufacturer].push(device);
    return acc;
  }, {} as Record<string, DeviceTemplate[]>);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">SIP Trunk Management</h1>
            <p className="text-muted-foreground">Configure SIP trunks, providers, and device templates</p>
          </div>
          <Dialog open={isCreateTrunkOpen} onOpenChange={(open) => {
            setIsCreateTrunkOpen(open);
            if (!open) {
              form.reset();
              setSelectedProvider(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-trunk">
                <Plus className="h-4 w-4 mr-2" />
                Add SIP Trunk
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New SIP Trunk</DialogTitle>
                <DialogDescription>Select a provider and configure your credentials</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <FormLabel>Select Provider</FormLabel>
                    <Select onValueChange={handleProviderSelect}>
                      <SelectTrigger data-testid="select-provider">
                        <SelectValue placeholder="Choose a SIP provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id.toString()}>
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              {provider.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedProvider && (
                    <>
                      <div className="bg-muted p-4 rounded-lg space-y-2">
                        <h4 className="font-medium">Provider Settings (Pre-configured)</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-muted-foreground">Server:</span> {selectedProvider.registrationServer}</div>
                          <div><span className="text-muted-foreground">Port:</span> {selectedProvider.port}</div>
                          <div><span className="text-muted-foreground">Transport:</span> {selectedProvider.transport?.toUpperCase()}</div>
                          <div><span className="text-muted-foreground">Codecs:</span> {(selectedProvider.codecs as string[])?.slice(0, 3).join(", ")}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">SRTP:</span>
                            {selectedProvider.srtpEnabled ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">TLS:</span>
                            {selectedProvider.tlsEnabled ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Trunk Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Primary Trunk"
                                  {...field}
                                  data-testid="input-trunk-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="SIP username"
                                    {...field}
                                    value={field.value ?? ""}
                                    data-testid="input-username"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="authUsername"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Auth Username (optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Auth username if different"
                                    {...field}
                                    value={field.value ?? ""}
                                    data-testid="input-auth-username"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="callerIdName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Caller ID Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Company Name"
                                    {...field}
                                    value={field.value ?? ""}
                                    data-testid="input-caller-id-name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="callerIdNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Caller ID Number</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="+15551234567"
                                    {...field}
                                    value={field.value ?? ""}
                                    data-testid="input-caller-id-number"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="enabled"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormControl>
                                <Switch
                                  checked={field.value ?? false}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-enabled"
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">Enable trunk immediately</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </>
                  )}
                  <DialogFooter>
                    <Button variant="outline" type="button" onClick={() => setIsCreateTrunkOpen(false)}>Cancel</Button>
                    <Button 
                      type="submit"
                      disabled={!selectedProvider || createTrunkMutation.isPending}
                      data-testid="button-create-trunk"
                    >
                      {createTrunkMutation.isPending ? "Creating..." : "Create Trunk"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">SIP Providers</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-provider-count">{providers.length}</div>
              <p className="text-xs text-muted-foreground">Pre-configured templates</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Active Trunks</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-trunk-count">{trunks.length}</div>
              <p className="text-xs text-muted-foreground">Configured SIP trunks</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Device Templates</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-device-count">{deviceTemplates.length}</div>
              <p className="text-xs text-muted-foreground">Supported handsets</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">Manufacturers</CardTitle>
              <Settings2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-manufacturer-count">{Object.keys(groupedDevices).length}</div>
              <p className="text-xs text-muted-foreground">Device brands</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="providers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="providers" data-testid="tab-providers">
              <Globe className="h-4 w-4 mr-2" />
              SIP Providers ({providers.length})
            </TabsTrigger>
            <TabsTrigger value="trunks" data-testid="tab-trunks">
              <Server className="h-4 w-4 mr-2" />
              Configured Trunks ({trunks.length})
            </TabsTrigger>
            <TabsTrigger value="devices" data-testid="tab-devices">
              <Phone className="h-4 w-4 mr-2" />
              Device Templates ({deviceTemplates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadingProviders ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">Loading providers...</div>
              ) : (
                providers.map((provider) => (
                  <Card key={provider.id} className="hover-elevate" data-testid={`card-provider-${provider.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                        <div className="flex gap-1">
                          {provider.tlsEnabled && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              TLS
                            </Badge>
                          )}
                          {provider.srtpEnabled && (
                            <Badge variant="secondary" className="text-xs">SRTP</Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription>{provider.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Server:</span>
                          <p className="font-mono text-xs truncate">{provider.registrationServer}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Port:</span>
                          <p>{provider.port} ({provider.transport?.toUpperCase()})</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Regions:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(provider.regions as string[])?.map((region) => (
                            <Badge key={region} variant="outline" className="text-xs">{region}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Codecs:</span>
                        <p className="text-xs text-muted-foreground">{(provider.codecs as string[])?.join(", ")}</p>
                      </div>
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => {
                          handleProviderSelect(provider.id.toString());
                          setIsCreateTrunkOpen(true);
                        }}
                        data-testid={`button-use-provider-${provider.id}`}
                      >
                        Use This Provider
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="trunks" className="space-y-4">
            {loadingTrunks ? (
              <div className="text-center py-8 text-muted-foreground">Loading trunks...</div>
            ) : trunks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No SIP Trunks Configured</h3>
                  <p className="text-muted-foreground mb-4">Create your first trunk by selecting a provider from the list above.</p>
                  <Button onClick={() => setIsCreateTrunkOpen(true)} data-testid="button-create-first-trunk">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Trunk
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {trunks.map((trunk) => {
                  const provider = providers.find(p => p.id === trunk.providerId);
                  return (
                    <Card key={trunk.id} data-testid={`card-trunk-${trunk.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`h-3 w-3 rounded-full ${trunk.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <CardTitle>{trunk.name}</CardTitle>
                            <Badge variant={trunk.enabled ? "default" : "secondary"}>
                              {trunk.enabled ? "Active" : "Disabled"}
                            </Badge>
                          </div>
                          <Badge variant="outline">{provider?.name || "Unknown Provider"}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Host:</span>
                            <p className="font-mono">{trunk.host}:{trunk.port}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Username:</span>
                            <p>{trunk.username || "Not set"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Caller ID:</span>
                            <p>{trunk.callerIdName || "Not set"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Registration:</span>
                            <p>{trunk.registrationStatus}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="devices" className="space-y-6">
            {loadingDevices ? (
              <div className="text-center py-8 text-muted-foreground">Loading device templates...</div>
            ) : (
              Object.entries(groupedDevices).map(([manufacturer, devices]) => (
                <div key={manufacturer}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <MonitorSpeaker className="h-5 w-5" />
                    {manufacturer} ({devices.length} models)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {devices.map((device) => (
                      <Card key={device.id} className="hover-elevate" data-testid={`card-device-${device.id}`}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {getDeviceTypeIcon(device.deviceType)}
                              <CardTitle className="text-sm">{device.model}</CardTitle>
                            </div>
                            <Badge variant="outline" className="text-xs capitalize">{device.deviceType.replace("_", " ")}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Lines:</span>
                            <span>{device.lineCount}</span>
                          </div>
                          {device.blfKeys && device.blfKeys > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">BLF Keys:</span>
                              <span>{device.blfKeys}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Firmware:</span>
                            <span className="font-mono">{device.firmwareVersion}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {device.hasPoe && <Badge variant="secondary" className="text-xs">PoE</Badge>}
                            {device.hasGigabit && <Badge variant="secondary" className="text-xs">Gigabit</Badge>}
                            {device.hasWifi && <Badge variant="secondary" className="text-xs"><Wifi className="h-3 w-3" /></Badge>}
                            {device.hasBluetooth && <Badge variant="secondary" className="text-xs"><Bluetooth className="h-3 w-3" /></Badge>}
                            {device.hasCamera && <Badge variant="secondary" className="text-xs"><Video className="h-3 w-3" /></Badge>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
