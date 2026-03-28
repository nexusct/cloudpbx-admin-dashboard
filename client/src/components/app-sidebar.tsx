import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Phone,
  Hash,
  GitBranch,
  History,
  MessageSquare,
  FileText,
  Monitor,
  Puzzle,
  Bot,
  User,
  Settings,
  PhoneCall,
  Users,
  HelpCircle,
  Contact2,
  Voicemail,
  BarChart3,
  Route,
  Activity,
  Webhook,
  Server,
  TrendingUp,
  Headset,
  // 25 new feature icons
  Mic,
  Star,
  Radio,
  Fingerprint,
  Heart,
  Shield,
  Archive,
  Clock,
  ArrowLeftRight,
  Wifi,
  Inbox,
  Trophy,
  PieChart,
  Brain,
  Key,
  Lock,
  Sun,
  Map,
  Cpu,
  AlertTriangle,
  Zap,
  DollarSign,
  Building2,
  Leaf,
  Headphones,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const mainNavItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Wallboard", url: "/wallboard", icon: Activity },
  { title: "Extensions", url: "/extensions", icon: Phone },
  { title: "Phone Numbers", url: "/dids", icon: Hash },
  { title: "Call Flows", url: "/call-flows", icon: GitBranch },
  { title: "Ring Groups", url: "/ring-groups", icon: Users },
  { title: "Call Queues", url: "/queues", icon: PhoneCall },
  { title: "Routing Rules", url: "/routing-rules", icon: Route },
];

const communicationItems = [
  { title: "Contacts", url: "/contacts", icon: Contact2 },
  { title: "Voicemail", url: "/voicemail", icon: Voicemail },
  { title: "Call History", url: "/call-logs", icon: History },
  { title: "SMS", url: "/sms", icon: MessageSquare, badge: "12" },
  { title: "Fax", url: "/fax", icon: FileText },
];

const systemItems = [
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "SIP Trunks", url: "/sip-trunks", icon: Server },
  { title: "Devices", url: "/devices", icon: Monitor },
  { title: "Integrations", url: "/integrations", icon: Puzzle, badge: "150+" },
  { title: "Trading", url: "/trading", icon: TrendingUp },
  { title: "Webhooks", url: "/webhooks", icon: Webhook },
  { title: "AI Assistant", url: "/ai-assistant", icon: Bot },
  { title: "AI Agents", url: "/ai-agents", icon: Headset },
];

const intelligenceItems = [
  { title: "Softphone", url: "/softphone", icon: Mic },
  { title: "Call Quality", url: "/call-quality", icon: Star },
  { title: "Emotion Analytics", url: "/emotion-analytics", icon: Heart },
  { title: "Conv. Intelligence", url: "/conversation-intelligence", icon: Brain },
  { title: "Live Coaching", url: "/live-coaching", icon: Headphones },
  { title: "Agent Gamification", url: "/gamification", icon: Trophy },
];

const operationsItems = [
  { title: "Campaigns", url: "/campaigns", icon: Radio },
  { title: "Omnichannel Inbox", url: "/omnichannel", icon: Inbox },
  { title: "Callback Scheduler", url: "/callback-scheduler", icon: Clock },
  { title: "IVR Analytics", url: "/ivr-analytics", icon: GitBranch },
  { title: "Call Journey", url: "/call-journey", icon: Map },
  { title: "Business Hours", url: "/business-hours", icon: Sun },
  { title: "Report Builder", url: "/report-builder", icon: PieChart },
  { title: "Cost Analytics", url: "/cost-analytics", icon: DollarSign },
];

const securityItems = [
  { title: "Fraud Detection", url: "/fraud-detection", icon: Shield },
  { title: "SIP Security", url: "/sip-security", icon: Lock },
  { title: "Voice Biometrics", url: "/voice-biometrics", icon: Fingerprint },
  { title: "Compliance Rec.", url: "/compliance-recording", icon: Archive },
  { title: "API Keys", url: "/api-keys", icon: Key },
  { title: "Disaster Recovery", url: "/disaster-recovery", icon: AlertTriangle },
];

const infrastructureItems = [
  { title: "Auto-Provisioning", url: "/auto-provisioning", icon: Cpu },
  { title: "Network Quality", url: "/network-quality", icon: Wifi },
  { title: "Number Porting", url: "/number-porting", icon: ArrowLeftRight },
  { title: "Multi-Tenant", url: "/tenants", icon: Building2 },
  { title: "Green Calling", url: "/green-calling", icon: Leaf },
];

const settingsItems = [
  { title: "User Portal", url: "/user-portal", icon: User },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help & Support", url: "/support", icon: HelpCircle },
];

export function AppSidebar() {
  const [location] = useLocation();

  const isActive = (url: string) => {
    if (url === "/") return location === "/";
    return location.startsWith(url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">CloudPBX</span>
            <span className="text-xs text-sidebar-foreground/60">Enterprise Edition</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} data-testid={`nav-${item.url.replace("/", "") || "dashboard"}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Communication</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {communicationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} data-testid={`nav-${item.url.replace("/", "")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} data-testid={`nav-${item.url.replace("/", "")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Intelligence</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {intelligenceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} data-testid={`nav-${item.url.replace("/", "")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {operationsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} data-testid={`nav-${item.url.replace("/", "")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Security &amp; Compliance</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {securityItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} data-testid={`nav-${item.url.replace("/", "")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Infrastructure</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {infrastructureItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} data-testid={`nav-${item.url.replace("/", "")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link href={item.url} data-testid={`nav-${item.url.replace("/", "")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
