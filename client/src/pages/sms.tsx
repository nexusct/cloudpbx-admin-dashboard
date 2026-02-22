import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Plus,
  Search,
  MessageSquare,
  Send,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Image,
  Paperclip,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { SmsMessage, InsertSmsMessage } from "@shared/schema";

export default function SMS() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversationNumber, setSelectedConversationNumber] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false);
  const [composeFrom, setComposeFrom] = useState("did1");
  const [composeTo, setComposeTo] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const { toast } = useToast();

  const { data: smsMessages = [], isLoading } = useQuery<SmsMessage[]>({
    queryKey: ["/api/sms"],
  });

  const sendSmsMutation = useMutation({
    mutationFn: async (data: Partial<InsertSmsMessage>) => {
      return apiRequest("POST", "/api/sms", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms"] });
      toast({ title: "SMS Sent", description: "Your message has been sent successfully." });
      setIsComposeDialogOpen(false);
      setComposeTo("");
      setComposeMessage("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send SMS.", variant: "destructive" });
    },
  });

  const sendReplyMutation = useMutation({
    mutationFn: async (data: Partial<InsertSmsMessage>) => {
      return apiRequest("POST", "/api/sms", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms"] });
      toast({ title: "Reply Sent", description: "Your reply has been sent." });
      setNewMessage("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send reply.", variant: "destructive" });
    },
  });

  const handleComposeSend = () => {
    sendSmsMutation.mutate({
      direction: "outbound",
      fromNumber: composeFrom === "did1" ? "+1 (555) 123-4567" : "+1 (555) 987-6543",
      toNumber: composeTo,
      message: composeMessage,
      status: "sent",
    });
  };

  const handleSendReply = () => {
    if (!newMessage.trim() || !selectedConversationNumber) return;
    sendReplyMutation.mutate({
      direction: "outbound",
      fromNumber: "+1 (555) 123-4567",
      toNumber: selectedConversationNumber,
      message: newMessage,
      status: "sent",
    });
  };

  const conversations = smsMessages.reduce((acc, msg) => {
    const otherNumber = msg.direction === "inbound" ? msg.fromNumber : msg.toNumber;
    if (!acc[otherNumber]) {
      acc[otherNumber] = {
        phoneNumber: otherNumber,
        messages: [],
        lastMessage: msg,
        unreadCount: 0,
      };
    }
    acc[otherNumber].messages.push(msg);
    if (!acc[otherNumber].lastMessage.sentAt || (msg.sentAt && new Date(msg.sentAt) > new Date(acc[otherNumber].lastMessage.sentAt!))) {
      acc[otherNumber].lastMessage = msg;
    }
    return acc;
  }, {} as Record<string, { phoneNumber: string; messages: SmsMessage[]; lastMessage: SmsMessage; unreadCount: number }>);

  const conversationList = Object.values(conversations);

  const filteredConversations = conversationList.filter((conv) =>
    conv.phoneNumber.includes(searchQuery) ||
    conv.lastMessage.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversation = selectedConversationNumber ? conversations[selectedConversationNumber] : null;

  const stats = {
    totalToday: smsMessages.length,
    sent: smsMessages.filter((m) => m.direction === "outbound").length,
    received: smsMessages.filter((m) => m.direction === "inbound").length,
    unread: 0,
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-[calc(100vh-4rem)]">
      <PageHeader
        title="SMS Messages"
        description="Send and receive text messages"
      >
        <Dialog open={isComposeDialogOpen} onOpenChange={setIsComposeDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-compose-sms">
              <Plus className="h-4 w-4 mr-2" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New SMS Message</DialogTitle>
              <DialogDescription>
                Send a text message to a phone number
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>From Number</Label>
                <Select value={composeFrom} onValueChange={setComposeFrom}>
                  <SelectTrigger data-testid="select-from-number">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="did1">+1 (555) 123-4567</SelectItem>
                    <SelectItem value="did2">+1 (555) 987-6543</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="to-number">To Number</Label>
                <Input
                  id="to-number"
                  placeholder="+1 (555) 000-0000"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  data-testid="input-to-number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message..."
                  className="min-h-24"
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  data-testid="input-message"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{composeMessage.length}/160 characters ({Math.ceil(Math.max(composeMessage.length, 1) / 160)} segment{Math.ceil(Math.max(composeMessage.length, 1) / 160) !== 1 ? "s" : ""})</span>
                  <Button variant="ghost" size="sm" className="h-6 gap-1">
                    <Paperclip className="h-3 w-3" />
                    Attach
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsComposeDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleComposeSend}
                disabled={sendSmsMutation.isPending}
                data-testid="button-send-sms"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendSmsMutation.isPending ? "Sending..." : "Send"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Messages Today</div>
          <div className="text-2xl font-bold">{stats.totalToday}</div>
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
          <div className="text-sm text-muted-foreground">Unread</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.unread}</div>
        </Card>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-4 min-h-0">
        <Card className="col-span-1 flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-sms"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="divide-y">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">Loading conversations...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No conversations found</div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.phoneNumber}
                    className={`p-4 cursor-pointer hover-elevate ${
                      selectedConversationNumber === conv.phoneNumber ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedConversationNumber(conv.phoneNumber)}
                    data-testid={`conversation-${conv.phoneNumber}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs">
                          {conv.phoneNumber.slice(-2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{conv.phoneNumber}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {conv.lastMessage.sentAt ? new Date(conv.lastMessage.sentAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {conv.lastMessage.direction === "inbound" ? (
                            <ArrowDownLeft className="h-3 w-3 text-blue-500 flex-shrink-0" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3 text-green-500 flex-shrink-0" />
                          )}
                          <p className="text-sm text-muted-foreground truncate">{conv.lastMessage.message}</p>
                        </div>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge className="h-5 min-w-5 flex items-center justify-center rounded-full p-0">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className="col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedConversation.phoneNumber}</h3>
                </div>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.direction === "outbound"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          msg.direction === "outbound" ? "text-primary-foreground/70" : "text-muted-foreground"
                        }`}>
                          <Clock className="h-3 w-3" />
                          {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-10 max-h-32 resize-none"
                      data-testid="input-reply-message"
                    />
                  </div>
                  <Button
                    size="icon"
                    onClick={handleSendReply}
                    disabled={sendReplyMutation.isPending}
                    data-testid="button-send-reply"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a conversation to view messages</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
