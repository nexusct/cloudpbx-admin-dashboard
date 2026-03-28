import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { Inbox, MessageSquare, Phone, Mail } from "lucide-react";

interface OmnichannelThread {
  id: number;
  contactName: string;
  contactNumber: string;
  lastChannel: "call" | "sms" | "fax" | "voicemail";
  lastMessagePreview: string;
  unreadCount: number;
  status: "open" | "resolved" | "pending";
  priority: "low" | "normal" | "high" | "urgent";
  updatedAt: string;
}

const channelIcon = (channel: string) => {
  switch (channel) {
    case "call": return <Phone className="h-4 w-4 text-blue-500" />;
    case "sms": return <MessageSquare className="h-4 w-4 text-green-500" />;
    case "fax": return <Mail className="h-4 w-4 text-gray-500" />;
    case "voicemail": return <Inbox className="h-4 w-4 text-purple-500" />;
    default: return <MessageSquare className="h-4 w-4" />;
  }
};

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  resolved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  normal: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export default function Omnichannel() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");

  const { data: threads = [] } = useQuery<OmnichannelThread[]>({
    queryKey: ["/api/omnichannel-threads"],
  });

  const filtered = threads.filter((t) => {
    const matchesSearch =
      t.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.contactNumber.includes(searchTerm) ||
      t.lastMessagePreview.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesChannel = channelFilter === "all" || t.lastChannel === channelFilter;
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const open = threads.filter((t) => t.status === "open").length;
  const unread = threads.reduce((sum, t) => sum + t.unreadCount, 0);
  const resolvedToday = threads.filter((t) => {
    const today = new Date().toDateString();
    return t.status === "resolved" && new Date(t.updatedAt).toDateString() === today;
  }).length;
  const urgent = threads.filter((t) => t.priority === "urgent").length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Omnichannel Inbox" description="Unified inbox for calls, SMS, fax, and voicemail communications" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Inbox className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{open}</p>
                <p className="text-sm text-muted-foreground">Open Threads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{unread}</p>
                <p className="text-sm text-muted-foreground">Unread Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Phone className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{resolvedToday}</p>
                <p className="text-sm text-muted-foreground">Resolved Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{urgent}</p>
                <p className="text-sm text-muted-foreground">Urgent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search threads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="call">Call</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="fax">Fax</SelectItem>
            <SelectItem value="voicemail">Voicemail</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle>Communication Threads</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Last Message</TableHead>
                <TableHead>Unread</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No threads found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((thread) => (
                  <TableRow key={thread.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <p className="font-medium">{thread.contactName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{thread.contactNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {channelIcon(thread.lastChannel)}
                        <span className="text-sm capitalize">{thread.lastChannel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {thread.lastMessagePreview}
                    </TableCell>
                    <TableCell>
                      {thread.unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white">{thread.unreadCount}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[thread.status]}`}>
                        {thread.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[thread.priority]}`}>
                        {thread.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(thread.updatedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
