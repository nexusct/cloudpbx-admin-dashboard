import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  Book,
  MessageCircle,
  Video,
  Mail,
  Phone,
  ExternalLink,
  FileText,
  Search,
} from "lucide-react";

const faqs = [
  { q: "How do I set up a new extension?", a: "Go to Extensions in the sidebar, click 'Add Extension', enter the extension number and name, select the department, and save. You can then assign devices and configure additional settings." },
  { q: "Why isn't my phone registering?", a: "Check that the phone is powered on and connected to your network. Verify the MAC address is correct in the Devices section. If using SIP, ensure the credentials are configured correctly on the phone." },
  { q: "How do I forward calls to my mobile?", a: "Navigate to User Portal > Call Settings, enable Call Forwarding, enter your mobile number, and select when to forward (always, busy, no answer, or offline)." },
  { q: "How do I set up an IVR menu?", a: "Go to Call Flows, click 'Create Flow', select 'IVR Menu' as the type, and use the visual designer to add menu options, announcements, and routing destinations." },
  { q: "Can I record calls?", a: "Yes, call recording can be enabled in Settings > Telephony > Call Settings. You can record all calls or specific extensions/queues." },
  { q: "How do I port my existing phone numbers?", a: "Go to Phone Numbers, click 'Port Number', enter your current number and carrier details. Porting typically takes 7-14 business days." },
];

const resources = [
  { title: "Getting Started Guide", description: "Learn the basics of your PBX system", icon: Book, link: "#" },
  { title: "Video Tutorials", description: "Watch step-by-step video guides", icon: Video, link: "#" },
  { title: "API Documentation", description: "Technical documentation for developers", icon: FileText, link: "#" },
  { title: "Community Forum", description: "Connect with other users", icon: MessageCircle, link: "#" },
];

export default function Support() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Help & Support"
        description="Get help with your phone system"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <HelpCircle className="h-5 w-5" />
              Frequently Asked Questions
            </h3>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Mail className="h-5 w-5" />
              Submit a Support Ticket
            </h3>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Subject</Label>
                <Input placeholder="Brief description of your issue" data-testid="input-ticket-subject" />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select>
                  <SelectTrigger data-testid="select-ticket-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="general">General Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select defaultValue="medium">
                  <SelectTrigger data-testid="select-ticket-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe your issue in detail..."
                  className="min-h-32"
                  data-testid="input-ticket-description"
                />
              </div>
              <Button data-testid="button-submit-ticket">
                Submit Ticket
              </Button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Contact Support</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Phone Support</div>
                  <div className="text-sm text-muted-foreground">+1 (800) 555-HELP</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Live Chat</div>
                  <div className="text-sm text-muted-foreground">Available 24/7</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">Email</div>
                  <div className="text-sm text-muted-foreground">support@cloudpbx.com</div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4">Resources</h3>
            <div className="space-y-3">
              {resources.map((resource) => (
                <a
                  key={resource.title}
                  href={resource.link}
                  className="flex items-center gap-3 p-3 rounded-md hover-elevate"
                  data-testid={`resource-${resource.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted">
                    <resource.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{resource.title}</div>
                    <div className="text-xs text-muted-foreground">{resource.description}</div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-2">System Status</h3>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="font-medium text-green-600 dark:text-green-400">All Systems Operational</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Last updated: Just now
            </p>
            <Button variant="outline" className="w-full mt-4" size="sm" data-testid="button-status-page">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Status Page
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
