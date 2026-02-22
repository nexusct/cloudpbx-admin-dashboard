import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Plus,
  Phone,
  Mail,
  Building2,
  Star,
  Ban,
  Edit,
  Trash2,
  UserPlus,
  Tag,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Contact } from "@shared/schema";

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
    isVip: false,
    doNotCall: false,
    notes: "",
  });

  const { data: contacts = [], isLoading } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/contacts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "Contact created successfully" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({ title: "Contact deleted" });
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      company: "",
      email: "",
      phone: "",
      isVip: false,
      doNotCall: false,
      notes: "",
    });
  };

  const handleCreate = () => {
    createMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName || null,
      company: formData.company || null,
      email: formData.email || null,
      phoneNumbers: formData.phone ? [{ type: "mobile", number: formData.phone }] : [],
      isVip: formData.isVip,
      doNotCall: formData.doNotCall,
      notes: formData.notes || null,
      tags: [],
    });
  };

  const filteredContacts = contacts.filter((contact) =>
    `${contact.firstName} ${contact.lastName || ""} ${contact.company || ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const vipCount = contacts.filter((c) => c.isVip).length;
  const dncCount = contacts.filter((c) => c.doNotCall).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Contacts"
        description="Manage your company phonebook and caller information"
      >
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-contact">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{contacts.length}</div>
          <div className="text-sm text-muted-foreground">Total Contacts</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{vipCount}</div>
          <div className="text-sm text-muted-foreground">VIP Contacts</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{dncCount}</div>
          <div className="text-sm text-muted-foreground">Do Not Call</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{contacts.length - dncCount}</div>
          <div className="text-sm text-muted-foreground">Callable</div>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-contacts"
          />
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="grid gap-3">
          {isLoading ? (
            <Card className="p-8 text-center text-muted-foreground">Loading contacts...</Card>
          ) : filteredContacts.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No contacts found. Add your first contact to get started.
            </Card>
          ) : (
            filteredContacts.map((contact) => (
              <Card
                key={contact.id}
                className="p-4 hover-elevate cursor-pointer"
                onClick={() => {
                  setSelectedContact(contact);
                  setIsDetailDialogOpen(true);
                }}
                data-testid={`card-contact-${contact.id}`}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {contact.firstName[0]}{contact.lastName?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {contact.firstName} {contact.lastName}
                      </span>
                      {contact.isVip && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                          <Star className="h-3 w-3 mr-1" />
                          VIP
                        </Badge>
                      )}
                      {contact.doNotCall && (
                        <Badge variant="destructive">
                          <Ban className="h-3 w-3 mr-1" />
                          DNC
                        </Badge>
                      )}
                    </div>
                    {contact.company && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        {contact.company}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {contact.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                      </div>
                    )}
                    {(contact.phoneNumbers as any[])?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {(contact.phoneNumbers as any[])[0]?.number}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(contact.id);
                      }}
                      data-testid={`button-delete-contact-${contact.id}`}
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>Create a new contact in your phonebook</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                  data-testid="input-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Smith"
                  data-testid="input-last-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Acme Corp"
                data-testid="input-company"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555 123 4567"
                data-testid="input-phone"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>VIP Contact</Label>
              <Switch
                checked={formData.isVip}
                onCheckedChange={(checked) => setFormData({ ...formData, isVip: checked })}
                data-testid="switch-vip"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Do Not Call</Label>
              <Switch
                checked={formData.doNotCall}
                onCheckedChange={(checked) => setFormData({ ...formData, doNotCall: checked })}
                data-testid="switch-dnc"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.firstName || createMutation.isPending}
              data-testid="button-save-contact"
            >
              {createMutation.isPending ? "Creating..." : "Create Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {selectedContact.firstName[0]}{selectedContact.lastName?.[0] || ""}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </h3>
                  {selectedContact.company && (
                    <p className="text-muted-foreground">{selectedContact.company}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {selectedContact.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedContact.email}</span>
                  </div>
                )}
                {(selectedContact.phoneNumbers as any[])?.map((phone, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{phone.number}</span>
                    <Badge variant="secondary">{phone.type}</Badge>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {selectedContact.isVip && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <Star className="h-3 w-3 mr-1" />
                    VIP
                  </Badge>
                )}
                {selectedContact.doNotCall && (
                  <Badge variant="destructive">
                    <Ban className="h-3 w-3 mr-1" />
                    Do Not Call
                  </Badge>
                )}
              </div>
              {selectedContact.notes && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">{selectedContact.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
