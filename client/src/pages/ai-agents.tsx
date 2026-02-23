import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Search, Headset, Edit, Trash2, FileText, Play, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AiAgent, AiAgentCall, Extension } from "@shared/schema";
import { insertAiAgentSchema, type InsertAiAgent } from "@shared/schema";

import { z } from "zod";

const createAgentFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    systemPrompt: z.string().min(1, "System prompt is required"),
    voice: z.string().min(1, "Voice is required"),
    extensionId: z.number().optional().nullable(),
    mcpServers: z.array(z.any()).optional(),
    isActive: z.boolean().optional(),
});

type CreateAgentFormValues = InsertAiAgent;

export default function AIAgents() {
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedCall, setSelectedCall] = useState<AiAgentCall | null>(null);
    const { toast } = useToast();

    const form = useForm<CreateAgentFormValues>({
        resolver: zodResolver(createAgentFormSchema),
        defaultValues: {
            name: "",
            description: "",
            systemPrompt: "You are a helpful AI assistant for the company. Answer questions politely and assist the caller.",
            voice: "alloy",
            extensionId: undefined,
            mcpServers: [],
            isActive: true,
        },
    });

    const { data: agents = [], isLoading: isLoadingAgents } = useQuery<AiAgent[]>({
        queryKey: ["/api/ai-agents"],
    });

    const { data: calls = [], isLoading: isLoadingCalls } = useQuery<AiAgentCall[]>({
        queryKey: ["/api/ai-agent-calls"],
    });

    const { data: extensions = [] } = useQuery<Extension[]>({
        queryKey: ["/api/extensions"],
    });

    const createAgentMutation = useMutation({
        mutationFn: async (data: CreateAgentFormValues) => {
            return apiRequest("POST", "/api/ai-agents", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/ai-agents"] });
            toast({ title: "Agent Created", description: "The AI Agent has been successfully created." });
            setIsAddDialogOpen(false);
            form.reset();
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to create agent.", variant: "destructive" });
        },
    });

    const deleteAgentMutation = useMutation({
        mutationFn: async (id: number) => {
            return apiRequest("DELETE", `/api/ai-agents/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/ai-agents"] });
            toast({ title: "Agent Deleted", description: "The AI Agent has been successfully deleted." });
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to delete agent.", variant: "destructive" });
        },
    });

    const onSubmit = (data: CreateAgentFormValues) => {
        createAgentMutation.mutate(data);
    };

    const filteredAgents = agents.filter((agent) =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (agent.description && agent.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="flex flex-col gap-6 p-6">
            <PageHeader
                title="AI Agents"
                description="Manage AI Virtual Extensions and review their call logs"
            >
                <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                    setIsAddDialogOpen(open);
                    if (!open) form.reset();
                }}>
                    <DialogTrigger asChild>
                        <Button data-testid="button-add-agent">
                            <Plus className="h-4 w-4 mr-2" />
                            Add AI Agent
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New AI Agent</DialogTitle>
                            <DialogDescription>
                                Create a conversational AI agent to handle live phone calls
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Agent Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., Support Agent" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="voice"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>AI Voice</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a voice" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                                                        <SelectItem value="echo">Echo (Male)</SelectItem>
                                                        <SelectItem value="fable">Fable (British Male)</SelectItem>
                                                        <SelectItem value="onyx">Onyx (Deep Male)</SelectItem>
                                                        <SelectItem value="nova">Nova (Female)</SelectItem>
                                                        <SelectItem value="shimmer">Shimmer (Female)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Brief description of the agent's role" {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="extensionId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Linked Extension</FormLabel>
                                            <Select
                                                onValueChange={(v) => field.onChange(parseInt(v))}
                                                value={field.value?.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select an extension" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {extensions.map(ext => (
                                                        <SelectItem key={ext.id} value={ext.id.toString()}>
                                                            {ext.number} - {ext.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="systemPrompt"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>System Prompt (Instructions)</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="You are a helpful AI assistant..."
                                                    className="h-32"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between mt-2">
                                            <div className="flex flex-col gap-1">
                                                <FormLabel>Active Status</FormLabel>
                                                <span className="text-xs text-muted-foreground">Is this agent ready to receive calls?</span>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value ?? false}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <DialogFooter className="mt-4">
                                    <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={createAgentMutation.isPending}>
                                        {createAgentMutation.isPending ? "Creating..." : "Create Agent"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </PageHeader>

            <Tabs defaultValue="agents" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="agents" className="flex gap-2">
                        <Headset className="h-4 w-4" />
                        Configured Agents
                    </TabsTrigger>
                    <TabsTrigger value="calls" className="flex gap-2">
                        <Activity className="h-4 w-4" />
                        AI Call Logs
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="agents">
                    <Card>
                        <div className="p-4 border-b flex justify-between items-center">
                            <div className="relative max-w-sm w-full">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search AI agents..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-full"
                                />
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Agent Name</TableHead>
                                    <TableHead>Voice</TableHead>
                                    <TableHead>Extension</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-24">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingAgents ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Loading AI agents...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredAgents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No AI agents configured yet
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredAgents.map((agent) => (
                                        <TableRow key={agent.id}>
                                            <TableCell>
                                                <div className="font-medium">{agent.name}</div>
                                                {agent.description && (
                                                    <div className="text-xs text-muted-foreground">{agent.description}</div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">{agent.voice}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {agent.extensionId ? (
                                                    <Badge variant="secondary">
                                                        {extensions.find(e => e.id === agent.extensionId)?.number || `ID: ${agent.extensionId}`}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">Unlinked</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {agent.isActive ? (
                                                    <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 shadow-none border-none">Active</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Inactive</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => {
                                                            if (confirm("Are you sure you want to delete this AI agent?")) {
                                                                deleteAgentMutation.mutate(agent.id);
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>

                <TabsContent value="calls">
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Agent</TableHead>
                                    <TableHead>Caller</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead className="w-24">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingCalls ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            Loading call logs...
                                        </TableCell>
                                    </TableRow>
                                ) : calls.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No AI call logs found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    calls.map((call) => {
                                        const agent = agents.find(a => a.id === call.agentId);
                                        return (
                                            <TableRow key={call.id}>
                                                <TableCell>
                                                    {call.createdAt ? new Date(call.createdAt).toLocaleString() : 'N/A'}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {agent ? agent.name : `Agent ${call.agentId}`}
                                                </TableCell>
                                                <TableCell className="font-mono">{call.callerNumber}</TableCell>
                                                <TableCell>
                                                    {Math.floor((call.duration || 0) / 60)}:{(call.duration || 0) % 60 < 10 ? '0' : ''}{(call.duration || 0) % 60}
                                                </TableCell>
                                                <TableCell>
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm" onClick={() => setSelectedCall(call)}>
                                                                <FileText className="h-4 w-4 mr-2" />
                                                                View
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle>AI Call Details</DialogTitle>
                                                                <DialogDescription>
                                                                    Call Reference: {call.callId}
                                                                </DialogDescription>
                                                            </DialogHeader>

                                                            <div className="grid gap-6 py-4">
                                                                {call.recordingUrl && (
                                                                    <div className="space-y-2">
                                                                        <h4 className="text-sm font-medium flex items-center gap-2">
                                                                            <Play className="h-4 w-4" /> Recording
                                                                        </h4>
                                                                        <audio controls className="w-full" src={call.recordingUrl}>
                                                                            Your browser does not support the audio element.
                                                                        </audio>
                                                                    </div>
                                                                )}

                                                                {call.managerFeedback && (
                                                                    <div className="space-y-2">
                                                                        <h4 className="text-sm font-medium text-amber-600 flex items-center gap-2">
                                                                            <Activity className="h-4 w-4" /> Manager Feedback
                                                                        </h4>
                                                                        <div className="p-4 bg-amber-500/10 rounded-md text-sm border border-amber-500/20 whitespace-pre-wrap">
                                                                            {call.managerFeedback}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                <div className="space-y-2">
                                                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                                                        <FileText className="h-4 w-4" /> Call Transcript
                                                                    </h4>
                                                                    <div className="p-4 bg-muted rounded-md text-sm font-mono whitespace-pre-wrap h-[300px] overflow-y-auto border">
                                                                        {call.transcript || "No transcript available for this call."}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
