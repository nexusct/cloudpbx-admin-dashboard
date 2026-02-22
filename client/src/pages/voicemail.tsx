import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Voicemail as VoicemailIcon,
  Play,
  Pause,
  Phone,
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Voicemail } from "@shared/schema";

export default function VoicemailPage() {
  const [selectedVoicemail, setSelectedVoicemail] = useState<Voicemail | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const { data: voicemails = [], isLoading } = useQuery<Voicemail[]>({
    queryKey: ["/api/voicemails"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/voicemails/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voicemails"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/voicemails/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voicemails"] });
      toast({ title: "Voicemail deleted" });
    },
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const unreadCount = voicemails.filter((v) => !v.isRead).length;
  const urgentCount = voicemails.filter((v) => v.isUrgent).length;

  const openVoicemail = (vm: Voicemail) => {
    setSelectedVoicemail(vm);
    if (!vm.isRead) {
      markReadMutation.mutate(vm.id);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Visual Voicemail"
        description="Listen to messages with AI transcription"
      >
        {unreadCount > 0 && (
          <Badge variant="destructive">{unreadCount} Unread</Badge>
        )}
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <VoicemailIcon className="h-8 w-8 text-primary" />
            <div>
              <div className="text-2xl font-bold">{voicemails.length}</div>
              <div className="text-sm text-muted-foreground">Total Messages</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-blue-500" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
              <div className="text-sm text-muted-foreground">Unread</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <div className="text-2xl font-bold text-red-600">{urgentCount}</div>
              <div className="text-sm text-muted-foreground">Urgent</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-green-600">
                {voicemails.filter((v) => v.transcription).length}
              </div>
              <div className="text-sm text-muted-foreground">Transcribed</div>
            </div>
          </div>
        </Card>
      </div>

      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="space-y-3">
          {isLoading ? (
            <Card className="p-8 text-center text-muted-foreground">Loading voicemails...</Card>
          ) : voicemails.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              <VoicemailIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No voicemails</p>
              <p className="text-sm">Your voicemail inbox is empty</p>
            </Card>
          ) : (
            voicemails.map((vm) => (
              <Card
                key={vm.id}
                className={`p-4 hover-elevate cursor-pointer ${!vm.isRead ? "border-l-4 border-l-primary" : ""}`}
                onClick={() => openVoicemail(vm)}
                data-testid={`card-voicemail-${vm.id}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${vm.isUrgent ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"}`}>
                      {vm.isUrgent ? <AlertTriangle className="h-5 w-5" /> : <VoicemailIcon className="h-5 w-5" />}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${!vm.isRead ? "text-primary" : ""}`}>
                        {vm.callerName || vm.callerNumber}
                      </span>
                      {vm.isUrgent && <Badge variant="destructive">Urgent</Badge>}
                      {!vm.isRead && <Badge variant="secondary">New</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {vm.callerNumber}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(vm.duration || 0)}
                      </span>
                    </div>
                    {vm.transcription && (
                      <p className="text-sm text-muted-foreground mt-2 truncate">
                        {vm.transcription.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(vm.createdAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(vm.id);
                      }}
                      data-testid={`button-delete-voicemail-${vm.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={!!selectedVoicemail} onOpenChange={() => setSelectedVoicemail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Voicemail Message</DialogTitle>
          </DialogHeader>
          {selectedVoicemail && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">
                    {selectedVoicemail.callerName || selectedVoicemail.callerNumber}
                  </h3>
                  <p className="text-muted-foreground">{selectedVoicemail.callerNumber}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  {formatDate(selectedVoicemail.createdAt)}
                </div>
              </div>

              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-4">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setIsPlaying(!isPlaying)}
                    data-testid="button-play-voicemail"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-0" style={{ transition: "width 0.1s" }} />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    0:00 / {formatDuration(selectedVoicemail.duration || 0)}
                  </span>
                </div>
              </Card>

              {selectedVoicemail.transcription ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">AI Transcription</span>
                    {selectedVoicemail.transcriptionConfidence && (
                      <Badge variant="secondary">
                        {selectedVoicemail.transcriptionConfidence}% confidence
                      </Badge>
                    )}
                  </div>
                  <Card className="p-4">
                    <p className="text-sm leading-relaxed">{selectedVoicemail.transcription}</p>
                  </Card>
                </div>
              ) : (
                <Card className="p-4 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Transcription not available</p>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" data-testid="button-callback">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deleteMutation.mutate(selectedVoicemail.id);
                    setSelectedVoicemail(null);
                  }}
                  data-testid="button-delete-voicemail-dialog"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
