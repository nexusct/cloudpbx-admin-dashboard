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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  MoreHorizontal,
  Hash,
  Edit,
  Trash2,
  Globe,
  MessageSquare,
  FileText,
  ShoppingCart,
  ArrowRightLeft,
  Settings,
  MapPin,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Did, InsertDid } from "@shared/schema";

export default function DIDs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isPortDialogOpen, setIsPortDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [portNumber, setPortNumber] = useState("");
  const [portCarrier, setPortCarrier] = useState("");
  const [portAccount, setPortAccount] = useState("");
  const [portPin, setPortPin] = useState("");
  const [purchaseCountry, setPurchaseCountry] = useState("US");
  const [purchaseType, setPurchaseType] = useState("local");
  const [purchaseAreaCode, setPurchaseAreaCode] = useState("");
  const [selectedPurchaseNumber, setSelectedPurchaseNumber] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: dids = [], isLoading } = useQuery<Did[]>({
    queryKey: ["/api/dids"],
  });

  const createDidMutation = useMutation({
    mutationFn: async (data: Partial<InsertDid>) => {
      return apiRequest("POST", "/api/dids", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dids"] });
      toast({ title: "Number Added", description: "The phone number has been successfully added." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add phone number.", variant: "destructive" });
    },
  });

  const deleteDidMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/dids/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dids"] });
      toast({ title: "Number Released", description: "The phone number has been released." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to release phone number.", variant: "destructive" });
    },
  });

  const handlePortSubmit = () => {
    if (!portNumber) return;
    createDidMutation.mutate({
      number: portNumber,
      country: "US",
      status: "pending",
      type: "local",
    }, {
      onSuccess: () => {
        setIsPortDialogOpen(false);
        setPortNumber("");
        setPortCarrier("");
        setPortAccount("");
        setPortPin("");
      },
    });
  };

  const handlePurchaseSubmit = () => {
    if (!selectedPurchaseNumber) return;
    createDidMutation.mutate({
      number: selectedPurchaseNumber,
      country: purchaseCountry,
      type: purchaseType,
      status: "active",
      monthlyRate: purchaseType === "toll_free" ? 300 : 100,
    }, {
      onSuccess: () => {
        setIsPurchaseDialogOpen(false);
        setSelectedPurchaseNumber(null);
        setPurchaseAreaCode("");
      },
    });
  };

  const availableNumbers = [
    { number: "+1 (555) 200-0001", city: "New York", state: "NY", type: "local", monthlyRate: 100 },
    { number: "+1 (555) 200-0002", city: "New York", state: "NY", type: "local", monthlyRate: 100 },
    { number: "+1 (555) 300-0001", city: "Los Angeles", state: "CA", type: "local", monthlyRate: 100 },
    { number: "+1 (800) 999-0001", city: null, state: null, type: "toll_free", monthlyRate: 300 },
    { number: "+1 (888) 999-0002", city: null, state: null, type: "toll_free", monthlyRate: 300 },
  ];

  const filteredDids = dids.filter((did) => {
    const matchesSearch =
      did.number.includes(searchQuery) ||
      did.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      did.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || did.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalMonthly = dids
    .filter((d) => d.status === "active")
    .reduce((sum, d) => sum + (d.monthlyRate || 0), 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Phone Numbers (DIDs)"
        description="Manage your direct inward dial numbers, SMS, and fax lines"
      >
        <Dialog open={isPortDialogOpen} onOpenChange={setIsPortDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" data-testid="button-port-number">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Port Number
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Port Existing Number</DialogTitle>
              <DialogDescription>
                Transfer your existing phone number to CloudPBX
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="port-number">Phone Number to Port</Label>
                <Input id="port-number" placeholder="+1 (555) 123-4567" value={portNumber} onChange={(e) => setPortNumber(e.target.value)} data-testid="input-port-number" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="current-carrier">Current Carrier</Label>
                <Input id="current-carrier" placeholder="e.g., AT&T, Verizon" value={portCarrier} onChange={(e) => setPortCarrier(e.target.value)} data-testid="input-carrier" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="account-number">Account Number</Label>
                <Input id="account-number" placeholder="Your account number" value={portAccount} onChange={(e) => setPortAccount(e.target.value)} data-testid="input-account" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pin">PIN/Password</Label>
                <Input id="pin" type="password" placeholder="Account PIN" value={portPin} onChange={(e) => setPortPin(e.target.value)} data-testid="input-pin" />
              </div>
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                Porting typically takes 7-14 business days. You&apos;ll receive email updates on the progress.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPortDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePortSubmit} disabled={createDidMutation.isPending} data-testid="button-submit-port">
                {createDidMutation.isPending ? "Submitting..." : "Submit Port Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-purchase-number">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Purchase Number
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Purchase Phone Number</DialogTitle>
              <DialogDescription>
                Search and purchase new phone numbers for your system
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Country</Label>
                  <Select value={purchaseCountry} onValueChange={setPurchaseCountry}>
                    <SelectTrigger data-testid="select-country">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Type</Label>
                  <Select value={purchaseType} onValueChange={setPurchaseType}>
                    <SelectTrigger data-testid="select-number-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="toll_free">Toll Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Area Code / City</Label>
                  <Input placeholder="e.g., 555 or New York" value={purchaseAreaCode} onChange={(e) => setPurchaseAreaCode(e.target.value)} data-testid="input-area-code" />
                </div>
              </div>
              <div className="border rounded-md">
                <div className="p-3 border-b bg-muted/50 text-sm font-medium">
                  Available Numbers
                </div>
                <div className="divide-y max-h-64 overflow-y-auto">
                  {availableNumbers.map((num) => (
                    <div key={num.number} className={`flex items-center justify-between p-3 hover-elevate ${selectedPurchaseNumber === num.number ? "bg-primary/10" : ""}`}>
                      <div>
                        <div className="font-mono font-medium">{num.number}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {num.city ? `${num.city}, ${num.state}` : "Toll Free"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          ${(num.monthlyRate / 100).toFixed(2)}/mo
                        </span>
                        <Button
                          size="sm"
                          variant={selectedPurchaseNumber === num.number ? "default" : "outline"}
                          onClick={() => setSelectedPurchaseNumber(num.number)}
                          data-testid={`button-select-${num.number.replace(/\D/g, "")}`}
                        >
                          {selectedPurchaseNumber === num.number ? "Selected" : "Select"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPurchaseDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handlePurchaseSubmit} disabled={!selectedPurchaseNumber || createDidMutation.isPending} data-testid="button-confirm-purchase">
                {createDidMutation.isPending ? "Purchasing..." : "Purchase Selected"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Numbers</div>
          <div className="text-2xl font-bold">{dids.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Active</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {dids.filter((d) => d.status === "active").length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">SMS Enabled</div>
          <div className="text-2xl font-bold">
            {dids.filter((d) => d.smsEnabled).length}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Monthly Cost</div>
          <div className="text-2xl font-bold">${(totalMonthly / 100).toFixed(2)}</div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 p-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search numbers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-dids"
            />
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={selectedType} onValueChange={setSelectedType}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="local">Local</TabsTrigger>
                <TabsTrigger value="toll_free">Toll Free</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading phone numbers...
                </TableCell>
              </TableRow>
            ) : filteredDids.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No phone numbers found
                </TableCell>
              </TableRow>
            ) : (
              filteredDids.map((did) => (
                <TableRow key={did.id} data-testid={`did-row-${did.id}`}>
                  <TableCell className="font-mono font-medium">{did.number}</TableCell>
                  <TableCell>
                    {did.city ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {did.city}, {did.state}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {did.type.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {did.assignedTo ? (
                      <span className="text-sm">{did.assignedTo}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {did.smsEnabled && (
                        <span title="SMS enabled"><MessageSquare className="h-4 w-4 text-muted-foreground" /></span>
                      )}
                      {did.faxEnabled && (
                        <span title="Fax enabled"><FileText className="h-4 w-4 text-muted-foreground" /></span>
                      )}
                      {did.e911Enabled && (
                        <span title="E911 enabled"><Globe className="h-4 w-4 text-muted-foreground" /></span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={did.status as any} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`menu-did-${did.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Assign
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteDidMutation.mutate(did.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Release
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
