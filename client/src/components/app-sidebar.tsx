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
  { title: "Webhooks", url: "/webhooks", icon: Webhook },
  { title: "AI Assistant", url: "/ai-assistant", icon: Bot },
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
