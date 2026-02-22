import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Integration } from "@shared/schema";
import { Link, useLocation } from "wouter";
import {
  Search,
  Puzzle,
  Check,
  Star,
  Settings,
  Zap,
  Users,
  Video,
  Building2,
  Ticket,
  Globe,
  Calendar,
  FileText,
  Phone,
  Shield,
  Activity,
  BookOpen,
  Loader2,
  ExternalLink,
  RefreshCw,
  Unplug,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  CircleDot,
  HeartPulse,
  Server,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Building2, Ticket, Users, Shield, Globe, Video,
  Calendar, FileText, Phone, Activity, HeartPulse, Server
};

function getIcon(iconName: string | null): LucideIcon {
  if (iconName && iconMap[iconName]) return iconMap[iconName];
  return Puzzle;
}

const OAUTH_SLUGS = ["ms-teams", "ms-entra", "zoho-crm", "zoho-desk", "notion", "google-workspace"];
const CREDENTIAL_SLUGS = ["wordpress", "twilio", "unifi-voice", "unifi-network", "unifi-access", "unifi-protect", "rcare", "pbx-in-a-flash"];
const UNIFI_SLUGS = ["unifi-voice", "unifi-network", "unifi-access", "unifi-protect"];

interface WizardStep {
  title: string;
  description: string;
}

function getWizardSteps(slug: string): WizardStep[] {
  if (slug === "ms-teams" || slug === "ms-entra") {
    return [
      { title: "Register App", description: "Create an app registration in Azure portal" },
      { title: "Enter Credentials", description: "Paste your Client ID, Secret, and Tenant ID" },
      { title: "Authorize", description: "Complete the OAuth consent flow" },
      { title: "Verify", description: "Test the connection" },
    ];
  }
  if (slug === "zoho-crm" || slug === "zoho-desk") {
    return [
      { title: "Create App", description: "Register at api-console.zoho.com" },
      { title: "Enter Credentials", description: "Paste your Client ID and Secret" },
      { title: "Authorize", description: "Complete the Zoho consent flow" },
      { title: "Verify", description: "Test the connection" },
    ];
  }
  if (slug === "notion") {
    return [
      { title: "Create Integration", description: "Go to notion.so/my-integrations" },
      { title: "Enter Credentials", description: "Paste your Integration ID and Secret" },
      { title: "Authorize", description: "Connect your Notion workspace" },
      { title: "Verify", description: "Test the connection" },
    ];
  }
  if (slug === "google-workspace") {
    return [
      { title: "Create Project", description: "Set up OAuth in Google Cloud Console" },
      { title: "Enter Credentials", description: "Paste your Client ID and Secret" },
      { title: "Authorize", description: "Sign in with Google" },
      { title: "Verify", description: "Test the connection" },
    ];
  }
  if (slug === "wordpress") {
    return [
      { title: "Create Password", description: "Generate an Application Password in WordPress" },
      { title: "Enter Details", description: "Enter your site URL and credentials" },
      { title: "Connect", description: "Test and establish the connection" },
    ];
  }
  if (slug === "twilio") {
    return [
      { title: "Get Credentials", description: "Find your Account SID and Auth Token in Twilio Console" },
      { title: "Enter Credentials", description: "Paste your Account SID and Auth Token" },
      { title: "Connect", description: "Test and establish the connection" },
    ];
  }
  if (UNIFI_SLUGS.includes(slug)) {
    return [
      { title: "Controller Info", description: "Enter your UniFi controller URL" },
      { title: "Authentication", description: "Choose API Key or username/password" },
      { title: "Connect", description: "Test and establish the connection" },
    ];
  }
  if (slug === "rcare") {
    return [
      { title: "Cube URL", description: "Enter your RCare Cube server URL" },
      { title: "Authentication", description: "Provide API Key or username/password" },
      { title: "Connect", description: "Test and establish the connection" },
    ];
  }
  if (slug === "pbx-in-a-flash") {
    return [
      { title: "PBX Details", description: "Enter your PBX in a Flash Host IP and AMI Port" },
      { title: "Authentication", description: "Provide AMI Username and Secret" },
      { title: "Connect", description: "Test and establish the connection" },
    ];
  }
  return [];
}

function getConfigFields(slug: string) {
  if (slug === "ms-teams" || slug === "ms-entra") {
    return [
      { key: "clientId", label: "Application (Client) ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", required: true },
      { key: "clientSecret", label: "Client Secret", placeholder: "Your client secret value", required: true, type: "password" },
      { key: "tenantId", label: "Directory (Tenant) ID", placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx or common", required: true },
    ];
  }
  if (slug === "zoho-crm" || slug === "zoho-desk") {
    return [
      { key: "clientId", label: "Client ID", placeholder: "1000.XXXXXXXXXX", required: true },
      { key: "clientSecret", label: "Client Secret", placeholder: "Your Zoho client secret", required: true, type: "password" },
      {
        key: "datacenter", label: "Data Center", placeholder: "com", required: false, type: "select", options: [
          { value: "com", label: "US (.com)" }, { value: "eu", label: "EU (.eu)" },
          { value: "in", label: "India (.in)" }, { value: "au", label: "Australia (.au)" }, { value: "jp", label: "Japan (.jp)" },
        ]
      },
    ];
  }
  if (slug === "notion") {
    return [
      { key: "clientId", label: "OAuth Client ID", placeholder: "Your Notion integration OAuth client ID", required: true },
      { key: "clientSecret", label: "OAuth Client Secret", placeholder: "Your Notion integration secret", required: true, type: "password" },
    ];
  }
  if (slug === "google-workspace") {
    return [
      { key: "clientId", label: "OAuth Client ID", placeholder: "xxxx.apps.googleusercontent.com", required: true },
      { key: "clientSecret", label: "OAuth Client Secret", placeholder: "GOCSPX-xxxx", required: true, type: "password" },
    ];
  }
  if (slug === "wordpress") {
    return [
      { key: "instanceUrl", label: "WordPress Site URL", placeholder: "https://yoursite.com", required: true },
      { key: "username", label: "WordPress Username", placeholder: "admin", required: true },
      { key: "applicationPassword", label: "Application Password", placeholder: "xxxx xxxx xxxx xxxx xxxx xxxx", required: true, type: "password" },
    ];
  }
  if (slug === "twilio") {
    return [
      { key: "accountSid", label: "Account SID", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", required: true },
      { key: "authToken", label: "Auth Token", placeholder: "Your Twilio auth token", required: true, type: "password" },
    ];
  }
  if (UNIFI_SLUGS.includes(slug)) {
    return [
      { key: "controllerUrl", label: "Controller URL", placeholder: "https://192.168.1.1", required: true },
      { key: "apiKey", label: "API Key (recommended)", placeholder: "Your UniFi API key", required: false, type: "password" },
      { key: "username", label: "Username (alternative)", placeholder: "admin", required: false },
      { key: "applicationPassword", label: "Password (alternative)", placeholder: "Controller password", required: false, type: "password" },
      { key: "siteId", label: "Site ID", placeholder: "default", required: false },
    ];
  }
  if (slug === "rcare") {
    return [
      { key: "cubeUrl", label: "RCare Cube URL", placeholder: "https://your-cube.rcareinc.com", required: true },
      { key: "apiKey", label: "API Key (recommended)", placeholder: "Your RCare API key", required: false, type: "password" },
      { key: "username", label: "Username (alternative)", placeholder: "admin", required: false },
      { key: "applicationPassword", label: "Password (alternative)", placeholder: "Your password", required: false, type: "password" },
    ];
  }
  if (slug === "pbx-in-a-flash") {
    return [
      { key: "instanceUrl", label: "Asterisk Host IP", placeholder: "192.168.1.50", required: true },
      { key: "port", label: "AMI Port", placeholder: "5038", required: false },
      { key: "username", label: "AMI Username", placeholder: "admin", required: true },
      { key: "applicationPassword", label: "AMI Secret", placeholder: "secret", required: true, type: "password" },
    ];
  }
  return [];
}

function getSetupInstructions(slug: string, step: number): string {
  switch (slug) {
    case "ms-teams":
    case "ms-entra":
      if (step === 0) return "1. Go to portal.azure.com > Microsoft Entra ID > App registrations\n2. Click 'New registration'\n3. Name it 'CloudPBX Integration'\n4. Set redirect URI to: Web > [your-domain]/api/integrations/oauth/callback\n5. Under 'Certificates & secrets', create a new client secret\n6. Under 'API permissions', add the required Microsoft Graph permissions";
      if (step === 1) return "Copy the Application (Client) ID, Client Secret value, and Directory (Tenant) ID from your Azure app registration.";
      if (step === 2) return "Click 'Authorize' to open the Microsoft login page. Sign in with your admin account and grant the requested permissions.";
      return "Click 'Test Connection' to verify everything is working.";
    case "zoho-crm":
    case "zoho-desk":
      if (step === 0) return "1. Go to api-console.zoho.com\n2. Click 'Add Client' > 'Server-based Applications'\n3. Set redirect URI to: [your-domain]/api/integrations/oauth/callback\n4. Copy the Client ID and Client Secret";
      if (step === 1) return "Paste the Client ID and Client Secret from the Zoho API Console. Select your data center region.";
      if (step === 2) return "Click 'Authorize' to open the Zoho login page. Sign in and grant the requested permissions.";
      return "Click 'Test Connection' to verify everything is working.";
    case "notion":
      if (step === 0) return "1. Go to notion.so/my-integrations\n2. Click 'New integration'\n3. Name it 'CloudPBX'\n4. Under 'Capabilities', enable the permissions you need\n5. Under 'OAuth Domain & URIs', set redirect URI to: [your-domain]/api/integrations/oauth/callback\n6. Copy the OAuth Client ID and Client Secret";
      if (step === 1) return "Paste the OAuth Client ID and Client Secret from your Notion integration page.";
      if (step === 2) return "Click 'Authorize' to connect your Notion workspace. Select the pages and databases you want to share.";
      return "Click 'Test Connection' to verify your Notion workspace is accessible.";
    case "google-workspace":
      if (step === 0) return "1. Go to console.cloud.google.com\n2. Create or select a project\n3. Enable the Google People API, Calendar API, and Gmail API\n4. Go to 'Credentials' > 'Create credentials' > 'OAuth 2.0 Client ID'\n5. Set authorized redirect URI to: [your-domain]/api/integrations/oauth/callback\n6. Copy the Client ID and Client Secret";
      if (step === 1) return "Paste the OAuth Client ID and Client Secret from the Google Cloud Console.";
      if (step === 2) return "Click 'Authorize' to sign in with your Google Workspace account.";
      return "Click 'Test Connection' to verify your Google Workspace connection.";
    case "wordpress":
      if (step === 0) return "1. Log in to your WordPress admin panel\n2. Go to Users > Profile\n3. Scroll to 'Application Passwords'\n4. Enter 'CloudPBX' as the name and click 'Add New Application Password'\n5. Copy the generated password (it won't be shown again)";
      if (step === 1) return "Enter your WordPress site URL, username, and the application password you just created.";
      return "Click 'Connect' to test and establish the connection.";
    case "twilio":
      if (step === 0) return "1. Log in to console.twilio.com\n2. On the dashboard, find your Account SID and Auth Token\n3. Click the eye icon next to Auth Token to reveal it\n4. Copy both values";
      if (step === 1) return "Paste your Twilio Account SID and Auth Token.";
      return "Click 'Connect' to verify your Twilio credentials and establish the connection.";
    case "rcare":
      if (step === 0) return "Enter the URL of your RCare Cube server. This is typically the IP address or hostname of your Cube (e.g., https://cube.yourfacility.com or https://192.168.1.100).";
      if (step === 1) return "Choose your authentication method:\n\nAPI Key (recommended): Contact your RCare distributor or access the Cube admin panel to obtain an API key.\n\nUsername/Password (alternative): Use your RCare Cube admin credentials.";
      return "Click 'Connect' to test the connection to your RCare Cube and verify API access.";
    case "pbx-in-a-flash":
      if (step === 0) return "Enter the IP address or hostname of your PBX in a Flash server and its AMI (Asterisk Manager Interface) port (default is 5038).";
      if (step === 1) return "Enter your AMI Username and Secret from the manager.conf file.";
      return "Click 'Connect' to verify your PBX credentials and establish the connection.";
    default:
      if (UNIFI_SLUGS.includes(slug)) {
        if (step === 0) return "Enter the URL of your UniFi controller (e.g., https://192.168.1.1 or your UniFi Cloud Gateway address). This URL is shared across all UniFi products.";
        if (step === 1) return "Choose your authentication method:\n\nAPI Key (recommended): Go to your UniFi controller > Settings > API. Generate a new API key.\n\nUsername/Password (alternative): Use your UniFi controller admin credentials.";
        return "Click 'Connect' to test the connection to your UniFi controller.";
      }
      return "";
  }
}

function getOAuthProviderName(slug: string): string {
  if (slug.startsWith("ms-")) return "Microsoft";
  if (slug.startsWith("zoho-")) return "Zoho";
  if (slug === "notion") return "Notion";
  if (slug === "google-workspace") return "Google";
  return "";
}

export default function Integrations() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});
  const [syncData, setSyncData] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();
  const [location] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    if (connected) {
      toast({ title: "Connected", description: `${connected} integration connected successfully.` });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      window.history.replaceState({}, "", "/integrations");
    }
    if (error) {
      toast({ title: "Connection Error", description: decodeURIComponent(error), variant: "destructive" });
      window.history.replaceState({}, "", "/integrations");
    }
  }, [location]);

  const { data: integrations = [], isLoading } = useQuery<Integration[]>({
    queryKey: ["/api/integrations"],
  });

  const configureMutation = useMutation({
    mutationFn: async ({ slug, config }: { slug: string; config: Record<string, string> }) => {
      const res = await apiRequest("POST", `/api/integrations/${slug}/configure`, config);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      toast({ title: "Saved", description: "Configuration saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await apiRequest("POST", `/api/integrations/${slug}/disconnect`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      if (selectedIntegration) {
        setSelectedIntegration({ ...selectedIntegration, status: "available" });
      }
      toast({ title: "Disconnected", description: data.message });
      setWizardStep(0);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const testMutation = useMutation({
    mutationFn: async (slug: string) => {
      const res = await apiRequest("POST", `/api/integrations/${slug}/test`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "Connection Verified", description: data.organization || data.siteName || data.accountName || data.workspaceName || data.email || "Connection is working." });
        queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      } else {
        toast({ title: "Test Failed", description: data.error || "Could not verify connection.", variant: "destructive" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Test Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleAuthorize = async (slug: string) => {
    try {
      const res = await apiRequest("GET", `/api/integrations/${slug}/authorize`);
      const data = await res.json();
      if (data.authorizeUrl) window.location.href = data.authorizeUrl;
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to start authorization", variant: "destructive" });
    }
  };

  const handleDirectConnect = async (slug: string) => {
    setIsConnecting(true);
    try {
      const res = await apiRequest("POST", `/api/integrations/${slug}/connect`);
      const data = await res.json();
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
        if (selectedIntegration) setSelectedIntegration({ ...selectedIntegration, status: "connected" });
        toast({ title: "Connected", description: data.accountName || data.siteName || data.controllerVersion || "Connection established." });
      } else {
        toast({ title: "Connection Failed", description: data.error || "Could not connect.", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Connection Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSync = async (slug: string) => {
    setIsSyncing(true);
    setSyncData(null);
    try {
      const res = await apiRequest("GET", `/api/integrations/${slug}/sync`);
      const data = await res.json();
      setSyncData(data);
      toast({ title: "Sync Complete", description: "Data synced successfully." });
    } catch (error: any) {
      toast({ title: "Sync Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveConfig = async (slug: string) => {
    await configureMutation.mutateAsync({ slug, config: configValues });
  };

  const openWizard = (integration: Integration) => {
    setSelectedIntegration(integration);
    setWizardStep(integration.status === "connected" ? getWizardSteps(integration.slug).length - 1 : 0);
    setConfigValues({});
    setSyncData(null);
    setIsWizardOpen(true);
  };

  const categories = Array.from(new Set(integrations.map((i) => i.category)));

  const filteredIntegrations = integrations.filter((int) => {
    const matchesSearch = int.name.toLowerCase().includes(searchQuery.toLowerCase()) || (int.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || int.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const connectedCount = integrations.filter((i) => i.status === "connected").length;

  const isOAuth = (slug: string) => OAUTH_SLUGS.includes(slug);
  const isCredential = (slug: string) => CREDENTIAL_SLUGS.includes(slug);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <PageHeader title="Integrations" description="Loading integrations..." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-full mt-3" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Integrations"
        description={`${integrations.length} supported integrations with real API connectivity`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-sm" data-testid="badge-connected-count">
            {connectedCount} Connected
          </Badge>
          <Link href="/integration-setup-guide">
            <Button variant="outline" size="sm" data-testid="button-setup-guide">
              <BookOpen className="w-4 h-4 mr-1" />
              Setup Guide
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-integrations"
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedCategory === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("all")}
          data-testid="filter-category-all"
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            data-testid={`filter-category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">
          {selectedCategory === "all" ? "All Integrations" : selectedCategory}
          <span className="text-muted-foreground font-normal ml-2">
            ({filteredIntegrations.length})
          </span>
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredIntegrations.map((integration) => {
            const Icon = getIcon(integration.icon);
            const features = Array.isArray(integration.features) ? integration.features as string[] : [];
            return (
              <Card
                key={integration.id}
                className="p-4 cursor-pointer hover-elevate"
                onClick={() => openWizard(integration)}
                data-testid={`integration-card-${integration.slug}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{integration.name}</span>
                      {integration.status === "connected" && (
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs mt-1">
                      {integration.category}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-3">
                  {integration.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {features.slice(0, 3).map((f) => (
                    <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                  ))}
                  {features.length > 3 && (
                    <Badge variant="outline" className="text-xs">+{features.length - 3}</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12 text-muted-foreground" data-testid="text-no-results">
            No integrations found matching your search.
          </div>
        )}
      </div>

      {selectedIntegration && (
        <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <WizardContent
              integration={selectedIntegration}
              step={wizardStep}
              setStep={setWizardStep}
              configValues={configValues}
              setConfigValues={setConfigValues}
              onSaveConfig={handleSaveConfig}
              isSaving={configureMutation.isPending}
              onAuthorize={handleAuthorize}
              onDirectConnect={handleDirectConnect}
              isConnecting={isConnecting}
              onTest={(slug) => testMutation.mutate(slug)}
              isTesting={testMutation.isPending}
              onDisconnect={(slug) => disconnectMutation.mutate(slug)}
              isDisconnecting={disconnectMutation.isPending}
              onSync={handleSync}
              isSyncing={isSyncing}
              syncData={syncData}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

interface WizardContentProps {
  integration: Integration;
  step: number;
  setStep: (s: number) => void;
  configValues: Record<string, string>;
  setConfigValues: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  onSaveConfig: (slug: string) => Promise<void>;
  isSaving: boolean;
  onAuthorize: (slug: string) => void;
  onDirectConnect: (slug: string) => void;
  isConnecting: boolean;
  onTest: (slug: string) => void;
  isTesting: boolean;
  onDisconnect: (slug: string) => void;
  isDisconnecting: boolean;
  onSync: (slug: string) => void;
  isSyncing: boolean;
  syncData: any;
}

function WizardContent({
  integration, step, setStep, configValues, setConfigValues,
  onSaveConfig, isSaving, onAuthorize, onDirectConnect, isConnecting,
  onTest, isTesting, onDisconnect, isDisconnecting, onSync, isSyncing, syncData,
}: WizardContentProps) {
  const Icon = getIcon(integration.icon);
  const steps = getWizardSteps(integration.slug);
  const fields = getConfigFields(integration.slug);
  const isConnected = integration.status === "connected";
  const isConfigured = integration.status === "configured" || isConnected;
  const oauthFlow = OAUTH_SLUGS.includes(integration.slug);
  const credentialFlow = CREDENTIAL_SLUGS.includes(integration.slug);
  const features = Array.isArray(integration.features) ? integration.features as string[] : [];

  const credentialStepIndex = oauthFlow ? 1 : (credentialFlow ? 1 : 1);
  const connectStepIndex = oauthFlow ? 2 : (credentialFlow ? 2 : 2);
  const verifyStepIndex = steps.length - 1;

  function getStepStatus(i: number): "completed" | "current" | "pending" {
    if (isConnected && i < verifyStepIndex) return "completed";
    if (isConfigured && i < connectStepIndex) return "completed";
    if (i === step) return "current";
    if (i < step) return "completed";
    return "pending";
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <DialogTitle data-testid="text-wizard-title">{integration.name}</DialogTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{integration.category}</Badge>
              {isConnected && <Badge variant="default" className="bg-green-600">Connected</Badge>}
              {integration.status === "configured" && <Badge variant="default" className="bg-amber-600">Configured</Badge>}
            </div>
          </div>
        </div>
      </DialogHeader>

      {steps.length > 0 && (
        <div className="flex items-center gap-1 py-4" data-testid="wizard-steps">
          {steps.map((s, i) => {
            const status = getStepStatus(i);
            return (
              <div key={i} className="flex items-center gap-1 flex-1">
                <button
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setStep(i)}
                  data-testid={`wizard-step-${i}`}
                >
                  {status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : status === "current" ? (
                    <CircleDot className="h-5 w-5 text-primary flex-shrink-0" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
                  )}
                  <span className={`text-xs font-medium hidden sm:inline ${status === "current" ? "text-primary" : status === "completed" ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                    {s.title}
                  </span>
                </button>
                {i < steps.length - 1 && <div className="flex-1 h-px bg-border mx-1" />}
              </div>
            );
          })}
        </div>
      )}

      <div className="min-h-[200px]">
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-muted-foreground">{integration.description}</p>
            {features.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2"><Zap className="h-4 w-4" /> Features</h4>
                <div className="flex flex-wrap gap-2">
                  {features.map((f) => <Badge key={f} variant="secondary">{f}</Badge>)}
                </div>
              </div>
            )}
            <div className="p-3 rounded-md bg-muted text-sm whitespace-pre-line">
              {getSetupInstructions(integration.slug, 0)}
            </div>
          </div>
        )}

        {step === credentialStepIndex && step > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{getSetupInstructions(integration.slug, step)}</p>
            {fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                {field.type === "select" ? (
                  <Select
                    value={configValues[field.key] || (field.options as any)?.[0]?.value || "com"}
                    onValueChange={(val) => setConfigValues((prev: Record<string, string>) => ({ ...prev, [field.key]: val }))}
                  >
                    <SelectTrigger data-testid={`select-${field.key}`}>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options as any)?.map((opt: any) => (
                        <SelectItem key={typeof opt === "string" ? opt : opt.value} value={typeof opt === "string" ? opt : opt.value}>
                          {typeof opt === "string" ? opt.toUpperCase() : opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.key}
                    type={field.type || "text"}
                    placeholder={field.placeholder}
                    value={configValues[field.key] || ""}
                    onChange={(e) => setConfigValues((prev: Record<string, string>) => ({ ...prev, [field.key]: e.target.value }))}
                    data-testid={`input-${field.key}`}
                  />
                )}
              </div>
            ))}
            <Button
              onClick={async () => {
                await onSaveConfig(integration.slug);
                setStep(connectStepIndex);
              }}
              disabled={isSaving}
              data-testid="button-save-config"
            >
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save & Continue
            </Button>
          </div>
        )}

        {step === connectStepIndex && step > 0 && step !== verifyStepIndex && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{getSetupInstructions(integration.slug, step)}</p>

            {isConnected ? (
              <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <Check className="h-4 w-4" />
                  <span className="font-medium">Already Connected</span>
                </div>
              </div>
            ) : oauthFlow ? (
              <Button
                onClick={() => onAuthorize(integration.slug)}
                data-testid="button-authorize"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Authorize with {getOAuthProviderName(integration.slug)}
              </Button>
            ) : (
              <Button
                onClick={() => onDirectConnect(integration.slug)}
                disabled={isConnecting}
                data-testid="button-connect"
              >
                {isConnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                Connect
              </Button>
            )}
          </div>
        )}

        {step === verifyStepIndex && (
          <div className="space-y-4">
            {isConnected && (
              <div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Integration is Connected and Active</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-500 mt-1">
                  This integration is live and syncing data with your phone system.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => onTest(integration.slug)}
                disabled={isTesting}
                data-testid="button-test-connection"
              >
                {isTesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Settings className="h-4 w-4 mr-2" />}
                Test Connection
              </Button>

              {isConnected && (
                <Button
                  variant="outline"
                  onClick={() => onSync(integration.slug)}
                  disabled={isSyncing}
                  data-testid="button-sync"
                >
                  {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Sync Data
                </Button>
              )}

              {isConnected && integration.slug === "rcare" && (
                <Link href="/rcare">
                  <Button variant="default" data-testid="button-manage-rcare">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage RCare
                  </Button>
                </Link>
              )}

              {isConnected && (
                <Button
                  variant="outline"
                  onClick={() => onDisconnect(integration.slug)}
                  disabled={isDisconnecting}
                  className="text-destructive"
                  data-testid="button-disconnect"
                >
                  {isDisconnecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Unplug className="h-4 w-4 mr-2" />}
                  Disconnect
                </Button>
              )}
            </div>

            {syncData && (
              <div className="space-y-3 mt-4">
                <h4 className="font-medium flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" /> Synced Data
                </h4>
                <SyncDataDisplay data={syncData} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          data-testid="button-wizard-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        {step < verifyStepIndex && (
          <Button
            onClick={() => setStep(step + 1)}
            data-testid="button-wizard-next"
          >
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </>
  );
}

function SyncDataDisplay({ data }: { data: any }) {
  if (!data) return null;

  const renderSection = (title: string, items: any[], labelKey: string) => {
    if (!items || items.length === 0) return null;
    return (
      <div>
        <h5 className="text-sm font-medium mb-1">{title} ({items.length})</h5>
        <div className="max-h-40 overflow-y-auto rounded-md border">
          <table className="w-full text-sm">
            <tbody>
              {items.slice(0, 20).map((item: any, i: number) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-3 py-1.5 font-medium truncate max-w-[200px]">
                    {item[labelKey] || item.name || item.displayName || item.friendlyName || item.hostname || item.summary || item.title || `Item ${i + 1}`}
                  </td>
                  <td className="px-3 py-1.5 text-muted-foreground truncate">
                    {item.email || item.phoneNumber || item.phone_number || item.status || item.type || item.ip || item.extension || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length > 20 && <p className="px-3 py-1 text-xs text-muted-foreground">...and {items.length - 20} more</p>}
        </div>
      </div>
    );
  };

  const renderSummary = (summary: any) => {
    if (!summary) return null;
    return (
      <div className="flex flex-wrap gap-3 mb-3">
        {Object.entries(summary).map(([key, value]) => (
          <div key={key} className="text-center">
            <div className="text-lg font-semibold">{String(value)}</div>
            <div className="text-xs text-muted-foreground">{key.replace(/([A-Z])/g, " $1").trim()}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4" data-testid="sync-data-display">
      {data.summary && renderSummary(data.summary)}
      {data.users && renderSection("Users", data.users, "displayName")}
      {data.contacts && renderSection("Contacts", data.contacts, "name")}
      {data.groups && renderSection("Groups", data.groups, "displayName")}
      {data.databases && renderSection("Databases", data.databases, "title")}
      {data.pages && renderSection("Pages", data.pages, "title")}
      {data.phoneNumbers && renderSection("Phone Numbers", data.phoneNumbers, "friendlyName")}
      {data.recentMessages && renderSection("Recent Messages", data.recentMessages, "body")}
      {data.recentCalls && renderSection("Recent Calls", data.recentCalls, "from")}
      {data.devices && renderSection("Devices", data.devices, "name")}
      {data.clients && renderSection("Clients", data.clients, "hostname")}
      {data.networks && renderSection("Networks", data.networks, "name")}
      {data.cameras && renderSection("Cameras", data.cameras, "name")}
      {data.events && renderSection("Events", data.events, "type")}
      {data.doors && renderSection("Doors", data.doors, "name")}
      {data.accessLogs && renderSection("Access Logs", data.accessLogs, "event")}
      {data.extensions && renderSection("Extensions", data.extensions, "name")}
      {data.callLogs && renderSection("Call Logs", data.callLogs, "from")}
      {data.upcomingEvents && renderSection("Upcoming Events", data.upcomingEvents, "summary")}
      {data.tickets && renderSection("Tickets", data.tickets, "subject")}
      {data.accounts && renderSection("Accounts", data.accounts, "Account_Name")}
      {data.deals && renderSection("Deals", data.deals, "Deal_Name")}
      {data.agents && renderSection("Agents", data.agents, "name")}
      {data.health && (
        <div className="p-2 rounded-md bg-muted text-sm">
          <span className="font-medium">Site Health:</span> {data.health.connected ? "Connected" : "Disconnected"}
          {data.health.siteName && <span> - {data.health.siteName}</span>}
        </div>
      )}
      {data.organization && (
        <div className="p-2 rounded-md bg-muted text-sm">
          <span className="font-medium">Organization:</span> {data.organization.displayName || data.organization.company_name || JSON.stringify(data.organization)}
        </div>
      )}
      {data.nvr && (
        <div className="p-2 rounded-md bg-muted text-sm">
          <span className="font-medium">NVR:</span> {data.nvr.name} (v{data.nvr.version})
        </div>
      )}
      {data.balance && (
        <div className="p-2 rounded-md bg-muted text-sm">
          <span className="font-medium">Account Balance:</span> {data.balance.currency} {data.balance.amount}
        </div>
      )}
      {data.userInfo && (
        <div className="p-2 rounded-md bg-muted text-sm">
          <span className="font-medium">Signed in as:</span> {data.userInfo.email} ({data.userInfo.domain || "personal"})
        </div>
      )}
    </div>
  );
}
