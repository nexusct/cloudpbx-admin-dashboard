import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Send,
  Plus,
  Trash2,
  Settings,
  Phone,
  GitBranch,
  Users,
  MessageSquare,
  Sparkles,
  Lightbulb,
  Wrench,
  HelpCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AiSession, AiMessage } from "@shared/schema";

const quickActions = [
  { icon: Phone, label: "Add Extension", description: "Create a new phone extension" },
  { icon: GitBranch, label: "Create Call Flow", description: "Design an IVR or routing" },
  { icon: Users, label: "Setup Ring Group", description: "Configure team call routing" },
  { icon: MessageSquare, label: "Configure SMS", description: "Enable text messaging" },
];

const troubleshootingTopics = [
  "Phone not registering",
  "Call quality issues",
  "Voicemail not working",
  "Call forwarding problems",
  "Extension not receiving calls",
  "IVR menu issues",
];

export default function AIAssistant() {
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<AiSession[]>({
    queryKey: ["/api/ai/sessions"],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<AiMessage[]>({
    queryKey: ["/api/ai/sessions", selectedSession, "messages"],
    enabled: selectedSession !== null,
  });

  useEffect(() => {
    if (sessions.length > 0 && selectedSession === null) {
      setSelectedSession(sessions[0].id);
    }
  }, [sessions, selectedSession]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/sessions", { title: "New Chat" });
      return await res.json();
    },
    onSuccess: (newSession: AiSession) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/sessions"] });
      setSelectedSession(newSession.id);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create new chat session.", variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ sessionId, content }: { sessionId: number; content: string }) => {
      const res = await apiRequest("POST", `/api/ai/sessions/${sessionId}/messages`, { content });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/sessions", selectedSession, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/sessions"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send message. Please try again.", variant: "destructive" });
    },
  });

  const handleSend = (text?: string) => {
    const content = text || inputValue.trim();
    if (!content || !selectedSession) return;

    setInputValue("");
    sendMessageMutation.mutate({ sessionId: selectedSession, content });
  };

  const handleNewChat = () => {
    createSessionMutation.mutate();
  };

  const formatTimestamp = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const formatSessionTime = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-[calc(100vh-4rem)]">
      <PageHeader
        title="AI Assistant"
        description="Chat with AI to set up, configure, and troubleshoot your phone system"
      />

      <div className="flex-1 grid grid-cols-4 gap-4 min-h-0">
        <Card className="col-span-1 flex flex-col">
          <div className="p-4 border-b">
            <Button
              className="w-full"
              data-testid="button-new-chat"
              onClick={handleNewChat}
              disabled={createSessionMutation.isPending}
            >
              {createSessionMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              <p className="text-xs font-medium text-muted-foreground px-2 mb-2">Recent Chats</p>
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-4 text-center">No chats yet. Start a new one!</p>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-md cursor-pointer mb-1 ${
                      selectedSession === session.id ? "bg-muted" : "hover-elevate"
                    }`}
                    onClick={() => setSelectedSession(session.id)}
                    data-testid={`session-${session.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-sm truncate">{session.title}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatSessionTime(session.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        <Card className="col-span-2 flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {selectedSession === null ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Create a new chat to get started</p>
                </div>
              ) : messagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <Bot className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-1">CloudPBX AI Assistant</p>
                  <p className="text-sm text-muted-foreground">Ask me anything about your phone system</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-2 ${
                        message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>
                        {formatTimestamp(message.createdAt)}
                      </div>
                    </div>
                    {message.role === "user" && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
              {sendMessageMutation.isPending && (
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="flex items-end gap-2">
              <Input
                placeholder="Ask me anything about your phone system..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                className="flex-1"
                disabled={!selectedSession || sendMessageMutation.isPending}
                data-testid="input-ai-message"
              />
              <Button
                onClick={() => handleSend()}
                disabled={!selectedSession || sendMessageMutation.isPending || !inputValue.trim()}
                data-testid="button-send-ai-message"
              >
                {sendMessageMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>

        <div className="col-span-1 flex flex-col gap-4">
          <Card className="p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <div
                  key={action.label}
                  className="flex items-center gap-3 p-2 rounded-md hover-elevate cursor-pointer"
                  data-testid={`action-${action.label.toLowerCase().replace(" ", "-")}`}
                  onClick={() => {
                    if (selectedSession) {
                      handleSend(`Help me ${action.label.toLowerCase()}: ${action.description}`);
                    }
                  }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <action.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.description}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4 text-amber-500" />
              Troubleshooting
            </h3>
            <div className="space-y-1">
              {troubleshootingTopics.map((topic) => (
                <div
                  key={topic}
                  className="text-sm p-2 rounded-md hover-elevate cursor-pointer text-muted-foreground hover:text-foreground"
                  data-testid={`topic-${topic.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => {
                    if (selectedSession) {
                      handleSend(`Help me troubleshoot: ${topic}`);
                    }
                  }}
                >
                  {topic}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Tips
            </h3>
            <p className="text-sm text-muted-foreground">
              You can ask me to help with complex tasks like setting up call flows, 
              configuring integrations, or troubleshooting issues. Just describe what 
              you need in plain English!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
