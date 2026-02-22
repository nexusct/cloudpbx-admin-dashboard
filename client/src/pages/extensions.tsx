import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Plus,
  Search,
  MoreHorizontal,
  Phone,
  Edit,
  Trash2,
  Voicemail,
  Forward,
  Settings,
  Download,
  Upload,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Extension } from "@shared/schema";
import { insertExtensionSchema, type InsertExtension } from "@shared/schema";

const createExtensionFormSchema = insertExtensionSchema.extend({
  number: insertExtensionSchema.shape.number.min(1, "Extension number is required"),
  name: insertExtensionSchema.shape.name.min(1, "Display name is required"),
});

type CreateExtensionFormValues = InsertExtension;

export default function Extensions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const { toast } = useToast();

  const form = useForm<CreateExtensionFormValues>({
    resolver: zodResolver(createExtensionFormSchema),
    defaultValues: {
      number: "",
      name: "",
      department: "",
      type: "sip",
      voicemailEnabled: true,
      status: "offline",
    },
  });

  const { data: extensions = [], isLoading } = useQuery<Extension[]>({
    queryKey: ["/api/extensions"],
  });

  const createExtensionMutation = useMutation({
    mutationFn: async (data: CreateExtensionFormValues) => {
      return apiRequest("POST", "/api/extensions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/extensions"] });
      toast({ title: "Extension Created", description: "The extension has been successfully created." });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create extension.", variant: "destructive" });
    },
  });

  const onSubmit = (data: CreateExtensionFormValues) => {
    createExtensionMutation.mutate(data);
  };

  const filteredExtensions = extensions.filter((ext) => {
    const matchesSearch =
      ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.number.includes(searchQuery) ||
      ext.department?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "all" || ext.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = Array.from(new Set(extensions.map((e) => e.department).filter(Boolean)));

  const statusCounts = {
    online: extensions.filter((e) => e.status === "online").length,
    busy: extensions.filter((e) => e.status === "busy").length,
    away: extensions.filter((e) => e.status === "away").length,
    offline: extensions.filter((e) => e.status === "offline").length,
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Extensions"
        description="Manage phone extensions and user assignments"
      >
        <Button variant="outline" size="sm" data-testid="button-import-extensions">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <Button variant="outline" size="sm" data-testid="button-export-extensions">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) form.reset();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-extension">
              <Plus className="h-4 w-4 mr-2" />
              Add Extension
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Extension</DialogTitle>
              <DialogDescription>
                Create a new phone extension for your system
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Extension Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 109" {...field} data-testid="input-ext-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John Doe" {...field} data-testid="input-ext-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-department">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Support">Support</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="IT">IT</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Extension Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sip">SIP Phone</SelectItem>
                          <SelectItem value="webrtc">WebRTC (Softphone)</SelectItem>
                          <SelectItem value="virtual">Virtual</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="voicemailEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <FormLabel>Voicemail</FormLabel>
                        <span className="text-xs text-muted-foreground">Enable voicemail for this extension</span>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-voicemail"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createExtensionMutation.isPending} data-testid="button-save-extension">
                    {createExtensionMutation.isPending ? "Creating..." : "Create Extension"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <div>
            <div className="text-2xl font-bold">{statusCounts.online}</div>
            <div className="text-xs text-muted-foreground">Online</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div>
            <div className="text-2xl font-bold">{statusCounts.busy}</div>
            <div className="text-xs text-muted-foreground">Busy</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <div>
            <div className="text-2xl font-bold">{statusCounts.away}</div>
            <div className="text-xs text-muted-foreground">Away</div>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-gray-400" />
          <div>
            <div className="text-2xl font-bold">{statusCounts.offline}</div>
            <div className="text-xs text-muted-foreground">Offline</div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 p-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search extensions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-extensions"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-40" data-testid="filter-department">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept!}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Ext.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Features</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading extensions...
                </TableCell>
              </TableRow>
            ) : filteredExtensions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No extensions found
                </TableCell>
              </TableRow>
            ) : (
              filteredExtensions.map((ext) => (
                <TableRow key={ext.id} data-testid={`row-extension-${ext.id}`}>
                  <TableCell className="font-mono font-medium">{ext.number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{ext.name}</div>
                      {ext.callerIdNumber && (
                        <div className="text-xs text-muted-foreground">{ext.callerIdNumber}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {ext.department && <Badge variant="outline">{ext.department}</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {ext.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={ext.status as any} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {ext.voicemailEnabled && (
                        <Voicemail className="h-4 w-4 text-muted-foreground" />
                      )}
                      {ext.callForwardingEnabled && (
                        <Forward className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-ext-menu-${ext.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
