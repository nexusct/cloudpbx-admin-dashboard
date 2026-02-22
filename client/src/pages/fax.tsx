import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  FileText,
  Upload,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  File,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { FaxMessage, InsertFaxMessage } from "@shared/schema";

function formatTime(dateValue: string | Date | null): string {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDate(dateValue: string | Date | null): string {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Fax() {
  const [searchQuery, setSearchQuery] = useState("");
  const [direction, setDirection] = useState<string>("all");
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [sendFrom, setSendFrom] = useState("did1");
  const [sendTo, setSendTo] = useState("");
  const { toast } = useToast();

  const { data: faxMessages = [], isLoading } = useQuery<FaxMessage[]>({
    queryKey: ["/api/fax"],
  });

  const sendFaxMutation = useMutation({
    mutationFn: async (data: Partial<InsertFaxMessage>) => {
      return apiRequest("POST", "/api/fax", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fax"] });
      toast({ title: "Fax Sent", description: "Your fax has been queued for sending." });
      setIsSendDialogOpen(false);
      setSendTo("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send fax.", variant: "destructive" });
    },
  });

  const handleSendFax = () => {
    sendFaxMutation.mutate({
      direction: "outbound",
      fromNumber: sendFrom === "did1" ? "+1 (555) 123-4567" : "+1 (555) 456-7890",
      toNumber: sendTo,
      status: "pending",
      pages: 0,
    });
  };

  const filteredFaxes = faxMessages.filter((fax) => {
    const matchesSearch =
      fax.fromNumber.includes(searchQuery) ||
      fax.toNumber.includes(searchQuery) ||
      fax.documentUrl?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDirection = direction === "all" || fax.direction === direction;
    return matchesSearch && matchesDirection;
  });

  const stats = {
    total: faxMessages.length,
    sent: faxMessages.filter((f) => f.direction === "outbound" && f.status === "delivered").length,
    received: faxMessages.filter((f) => f.direction === "inbound").length,
    pending: faxMessages.filter((f) => f.status === "pending").length,
    failed: faxMessages.filter((f) => f.status === "failed").length,
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Fax"
        description="Send and receive fax documents"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/fax"] })}
          data-testid="button-refresh-fax"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-send-fax">
              <Plus className="h-4 w-4 mr-2" />
              Send Fax
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Send Fax</DialogTitle>
              <DialogDescription>
                Upload a document to send via fax
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>From Number</Label>
                <Select value={sendFrom} onValueChange={setSendFrom}>
                  <SelectTrigger data-testid="select-from-fax">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="did1">+1 (555) 123-4567</SelectItem>
                    <SelectItem value="did2">+1 (555) 456-7890</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="to-fax">To Fax Number</Label>
                <Input
                  id="to-fax"
                  placeholder="+1 (555) 000-0000"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  data-testid="input-to-fax"
                />
              </div>
              <div className="grid gap-2">
                <Label>Document</Label>
                <div className="border-2 border-dashed rounded-md p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop your document here, or click to browse
                  </p>
                  <Button variant="outline" size="sm" data-testid="button-browse-file">
                    Browse Files
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported formats: PDF, DOC, DOCX, TIF, PNG, JPG
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSendDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSendFax}
                disabled={sendFaxMutation.isPending}
                data-testid="button-submit-fax"
              >
                {sendFaxMutation.isPending ? "Sending..." : "Send Fax"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-5">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Faxes</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Sent</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.sent}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Received</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.received}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Pending</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Failed</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 p-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search faxes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-fax"
            />
          </div>
          <Tabs value={direction} onValueChange={setDirection}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="inbound">Received</TabsTrigger>
              <TabsTrigger value="outbound">Sent</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Document</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Pages</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading faxes...
                </TableCell>
              </TableRow>
            ) : filteredFaxes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No faxes found
                </TableCell>
              </TableRow>
            ) : (
              filteredFaxes.map((fax) => {
                const timestamp = fax.sentAt || fax.receivedAt;
                return (
                  <TableRow key={fax.id} data-testid={`fax-row-${fax.id}`}>
                    <TableCell>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        fax.direction === "inbound"
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                      }`}>
                        {fax.direction === "inbound" ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <File className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{fax.documentUrl || "Untitled"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{fax.fromNumber}</TableCell>
                    <TableCell className="font-mono text-sm">{fax.toNumber}</TableCell>
                    <TableCell>{fax.pages}</TableCell>
                    <TableCell>
                      <StatusBadge status={fax.status as any} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{formatTime(timestamp)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(timestamp)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" data-testid={`view-fax-${fax.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" data-testid={`download-fax-${fax.id}`}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
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
