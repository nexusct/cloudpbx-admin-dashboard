import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { apiRequest } from "@/lib/queryClient";
import { Fingerprint, Shield, Mic, CheckCircle } from "lucide-react";

interface VoiceBiometric {
  id: number;
  displayName: string;
  phoneNumber: string;
  enrollmentStatus: "pending" | "enrolled" | "failed";
  confidenceThreshold: number;
  verificationCount: number;
  accuracy: number;
  createdAt: string;
}

const biometricSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  confidenceThreshold: z.number().min(0).max(100),
});

type BiometricForm = z.infer<typeof biometricSchema>;

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  enrolled: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function VoiceBiometrics() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: biometrics = [] } = useQuery<VoiceBiometric[]>({
    queryKey: ["/api/voice-biometrics"],
  });

  const form = useForm<BiometricForm>({
    resolver: zodResolver(biometricSchema),
    defaultValues: { displayName: "", phoneNumber: "", confidenceThreshold: 85 },
  });

  const createMutation = useMutation({
    mutationFn: (data: BiometricForm) => apiRequest("POST", "/api/voice-biometrics", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voice-biometrics"] });
      setShowDialog(false);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/voice-biometrics/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/voice-biometrics"] }),
  });

  const filtered = biometrics.filter(
    (b) =>
      b.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.phoneNumber.includes(searchTerm)
  );

  const enrolled = biometrics.filter((b) => b.enrollmentStatus === "enrolled").length;
  const pending = biometrics.filter((b) => b.enrollmentStatus === "pending").length;
  const totalVerifications = biometrics.reduce((sum, b) => sum + (b.verificationCount ?? 0), 0);
  const avgAccuracy =
    biometrics.length > 0
      ? Math.round(biometrics.reduce((sum, b) => sum + (b.accuracy ?? 0), 0) / biometrics.length)
      : 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="Voice Biometric Authentication" description="Manage voice print enrollments and authentication profiles">
        <Button onClick={() => setShowDialog(true)} data-testid="button-add-biometric">
          <Fingerprint className="h-4 w-4 mr-2" /> Enroll Voice Print
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{enrolled}</p>
                <p className="text-sm text-muted-foreground">Enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Mic className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Fingerprint className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{totalVerifications}</p>
                <p className="text-sm text-muted-foreground">Verifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{avgAccuracy}%</p>
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voice Prints</CardTitle>
          <Input
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display Name</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Enrollment Status</TableHead>
                <TableHead>Confidence Threshold</TableHead>
                <TableHead>Verifications</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Enrolled At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    No voice prints found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.displayName}</TableCell>
                    <TableCell className="font-mono">{b.phoneNumber}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[b.enrollmentStatus]}`}>
                        {b.enrollmentStatus}
                      </span>
                    </TableCell>
                    <TableCell>{b.confidenceThreshold}%</TableCell>
                    <TableCell>{b.verificationCount ?? 0}</TableCell>
                    <TableCell>{b.accuracy ?? 0}%</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(b.id)}
                        data-testid={`button-delete-biometric-${b.id}`}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enroll Voice Print</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-1">
              <Label>Display Name</Label>
              <Input {...form.register("displayName")} placeholder="John Doe" />
              {form.formState.errors.displayName && (
                <p className="text-xs text-red-500">{form.formState.errors.displayName.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <Label>Phone Number</Label>
              <Input {...form.register("phoneNumber")} placeholder="+1-555-0100" />
            </div>
            <div className="flex flex-col gap-1">
              <Label>Confidence Threshold (%)</Label>
              <Input
                type="number"
                {...form.register("confidenceThreshold", { valueAsNumber: true })}
                placeholder="85"
                min={0}
                max={100}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-save-biometric">
                {createMutation.isPending ? "Enrolling..." : "Enroll"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
