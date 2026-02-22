import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  Shield,
  Key,
  Globe,
  ArrowLeft,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied", description: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={handleCopy}
      data-testid="button-copy"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </Button>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 font-mono text-sm">
      <code className="flex-1 break-all" data-testid="text-code-block">{children}</code>
      <CopyButton text={children} />
    </div>
  );
}

function ExternalLinkButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1"
    >
      <Button variant="outline" size="sm" data-testid={`link-external-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        {label}
        <ExternalLink className="w-3 h-3 ml-1" />
      </Button>
    </a>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
      {n}
    </span>
  );
}

function getRedirectUri() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/integrations/oauth/callback`;
  }
  return "https://your-domain.replit.app/api/integrations/oauth/callback";
}

interface IntegrationGuide {
  name: string;
  slug: string;
  category: string;
  authType: "oauth" | "credentials";
  icon: LucideIcon;
  description: string;
  features: string[];
  links: { label: string; url: string }[];
  prerequisites: string[];
  steps: { title: string; content: string[] }[];
  fieldsNeeded: string[];
  troubleshooting: string[];
}

const guides: IntegrationGuide[] = [
  {
    name: "Microsoft Teams",
    slug: "ms-teams",
    category: "Collaboration",
    authType: "oauth",
    icon: Globe,
    description: "Sync presence status, teams, and channels with Microsoft Teams. Enable click-to-call from Teams and manage call routing based on Teams availability.",
    features: [
      "Real-time presence sync (available, busy, away, offline)",
      "Teams and channels listing",
      "User directory synchronization",
      "Call records integration",
    ],
    links: [
      { label: "Azure Portal", url: "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" },
      { label: "App Registration Docs", url: "https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app" },
      { label: "Graph API Permissions", url: "https://learn.microsoft.com/en-us/graph/permissions-reference" },
    ],
    prerequisites: [
      "Microsoft 365 Business or Enterprise subscription",
      "Azure Active Directory (Entra ID) admin access",
      "Global Administrator or Application Administrator role",
    ],
    steps: [
      {
        title: "Register an application in Azure",
        content: [
          "Go to the Azure Portal > Microsoft Entra ID > App registrations",
          "Click 'New registration'",
          "Name: 'CloudPBX Integration'",
          "Supported account types: 'Accounts in this organizational directory only' (single tenant) or 'Accounts in any organizational directory' (multi-tenant)",
          "Redirect URI: Select 'Web' and enter your callback URL (shown below)",
          "Click 'Register'",
        ],
      },
      {
        title: "Create a client secret",
        content: [
          "In your new app registration, go to 'Certificates & secrets'",
          "Click 'New client secret'",
          "Description: 'CloudPBX Secret'",
          "Expiration: Choose 24 months (recommended)",
          "Click 'Add' and immediately copy the secret Value (it won't be shown again)",
        ],
      },
      {
        title: "Configure API permissions",
        content: [
          "Go to 'API permissions' > 'Add a permission' > 'Microsoft Graph'",
          "Select 'Delegated permissions' and add:",
          "  - User.Read.All (Read all users' profiles)",
          "  - Presence.Read.All (Read presence of all users)",
          "  - Team.ReadBasic.All (Read teams)",
          "  - Channel.ReadBasic.All (Read channels)",
          "  - CallRecords.Read.All (Read call records)",
          "Click 'Grant admin consent' to approve the permissions",
        ],
      },
      {
        title: "Enter credentials in CloudPBX",
        content: [
          "Go to Integrations > Microsoft Teams > Configure",
          "Application (Client) ID: Found on the app's Overview page",
          "Client Secret: The value you copied in step 2",
          "Directory (Tenant) ID: Found on the app's Overview page (or use 'common' for multi-tenant)",
          "Click Save, then Authorize to complete the OAuth flow",
        ],
      },
    ],
    fieldsNeeded: ["Application (Client) ID", "Client Secret", "Directory (Tenant) ID"],
    troubleshooting: [
      "If you get 'AADSTS65001', you need admin consent - click 'Grant admin consent' in API permissions",
      "If redirect fails, verify the redirect URI exactly matches (including https and trailing path)",
      "For multi-tenant apps, use 'common' as Tenant ID",
      "Client secrets expire - set a calendar reminder to rotate before expiry",
    ],
  },
  {
    name: "Microsoft Entra ID",
    slug: "ms-entra",
    category: "Identity",
    authType: "oauth",
    icon: Shield,
    description: "Synchronize your organization's user directory from Microsoft Entra ID (formerly Azure AD). Auto-provision extensions and manage user lifecycle.",
    features: [
      "User directory synchronization",
      "Group membership management",
      "Directory role-based provisioning",
      "Automated user lifecycle management",
    ],
    links: [
      { label: "Azure Portal", url: "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" },
      { label: "Entra ID Docs", url: "https://learn.microsoft.com/en-us/entra/identity/" },
      { label: "Directory API Permissions", url: "https://learn.microsoft.com/en-us/graph/api/resources/directory?view=graph-rest-1.0" },
    ],
    prerequisites: [
      "Microsoft Entra ID (Azure AD) P1 or P2 license",
      "Global Administrator or Application Administrator role",
      "Same Azure app registration can be reused from MS Teams integration",
    ],
    steps: [
      {
        title: "Register an application in Azure (or reuse existing)",
        content: [
          "If you already set up MS Teams, you can reuse the same app registration",
          "Otherwise, follow the same steps: Azure Portal > Entra ID > App registrations > New registration",
          "Set the redirect URI to: Web > your callback URL (shown below)",
        ],
      },
      {
        title: "Add directory permissions",
        content: [
          "Go to 'API permissions' > 'Add a permission' > 'Microsoft Graph'",
          "Add these Delegated permissions:",
          "  - User.Read.All (Read all users)",
          "  - Group.Read.All (Read all groups)",
          "  - Directory.Read.All (Read directory data)",
          "Click 'Grant admin consent'",
        ],
      },
      {
        title: "Create a client secret (if not already done)",
        content: [
          "Go to 'Certificates & secrets' > 'New client secret'",
          "Copy the secret Value immediately",
        ],
      },
      {
        title: "Enter credentials in CloudPBX",
        content: [
          "Go to Integrations > Microsoft Entra ID > Configure",
          "Enter the Application (Client) ID, Client Secret, and Tenant ID",
          "Click Save, then Authorize",
        ],
      },
    ],
    fieldsNeeded: ["Application (Client) ID", "Client Secret", "Directory (Tenant) ID"],
    troubleshooting: [
      "Directory.Read.All requires admin consent",
      "You can use the same app registration as MS Teams with combined permissions",
      "If user sync fails, ensure the app has been granted admin consent",
    ],
  },
  {
    name: "Zoho CRM",
    slug: "zoho-crm",
    category: "CRM",
    authType: "oauth",
    icon: Globe,
    description: "Connect to Zoho CRM to sync contacts, display caller info during calls, log call activity, and create leads from incoming calls.",
    features: [
      "Contact and lead synchronization",
      "Caller ID popup with CRM data",
      "Automatic call logging to CRM records",
      "Lead creation from inbound calls",
      "Organization and user sync",
    ],
    links: [
      { label: "Zoho API Console", url: "https://api-console.zoho.com/" },
      { label: "Zoho CRM API Docs", url: "https://www.zoho.com/crm/developer/docs/api/v7/" },
      { label: "Getting Started Guide", url: "https://www.zoho.com/crm/developer/docs/api/v7/register-client.html" },
    ],
    prerequisites: [
      "Zoho CRM Professional, Enterprise, or Ultimate plan",
      "Zoho account with admin access",
      "Know your Zoho datacenter region (US, EU, IN, AU, JP)",
    ],
    steps: [
      {
        title: "Register a server-based application",
        content: [
          "Go to api-console.zoho.com",
          "Click 'Add Client' > 'Server-based Applications'",
          "Client Name: 'CloudPBX'",
          "Homepage URL: your CloudPBX domain",
          "Authorized Redirect URI: your callback URL (shown below)",
          "Click 'Create'",
        ],
      },
      {
        title: "Copy credentials",
        content: [
          "After creation, you'll see the Client ID and Client Secret",
          "Copy both values - you'll need them in the next step",
          "Note: The Client Secret is only shown once during creation",
        ],
      },
      {
        title: "Configure in CloudPBX",
        content: [
          "Go to Integrations > Zoho CRM > Configure",
          "Paste the Client ID and Client Secret",
          "Select your Data Center region (US, EU, IN, AU, or JP)",
          "Click Save, then Authorize to complete the Zoho OAuth flow",
          "Grant all requested CRM permissions when prompted",
        ],
      },
    ],
    fieldsNeeded: ["Client ID", "Client Secret", "Data Center Region"],
    troubleshooting: [
      "Make sure you select the correct datacenter matching your Zoho account region",
      "If you get 'invalid_client', double-check the Client ID and Secret for typos",
      "The redirect URI must exactly match what you entered in Zoho API Console",
      "Zoho tokens expire - the system handles refresh automatically if refresh token is stored",
    ],
  },
  {
    name: "Zoho Desk",
    slug: "zoho-desk",
    category: "CRM",
    authType: "oauth",
    icon: Globe,
    description: "Integrate with Zoho Desk to create tickets from calls, display customer support history during calls, and sync contact information.",
    features: [
      "Automatic ticket creation from calls",
      "Support history popup during calls",
      "Contact synchronization",
      "Ticket status tracking",
      "Agent assignment based on call routing",
    ],
    links: [
      { label: "Zoho API Console", url: "https://api-console.zoho.com/" },
      { label: "Zoho Desk API Docs", url: "https://desk.zoho.com/DeskAPIDocument" },
    ],
    prerequisites: [
      "Zoho Desk Professional or Enterprise plan",
      "Zoho account with admin access",
      "Know your Zoho datacenter region",
    ],
    steps: [
      {
        title: "Register a server-based application",
        content: [
          "Go to api-console.zoho.com",
          "Click 'Add Client' > 'Server-based Applications'",
          "Client Name: 'CloudPBX Desk'",
          "Authorized Redirect URI: your callback URL (shown below)",
          "Click 'Create'",
          "You can reuse the same Zoho app if it has both CRM and Desk scopes",
        ],
      },
      {
        title: "Copy credentials and configure",
        content: [
          "Copy the Client ID and Client Secret",
          "Go to Integrations > Zoho Desk > Configure in CloudPBX",
          "Paste credentials and select your Data Center",
          "Click Save, then Authorize",
        ],
      },
    ],
    fieldsNeeded: ["Client ID", "Client Secret", "Data Center Region"],
    troubleshooting: [
      "Same troubleshooting as Zoho CRM applies",
      "If using a separate Zoho app from CRM, make sure the redirect URI is set",
      "Zoho Desk API requires Professional plan or above",
    ],
  },
  {
    name: "Notion",
    slug: "notion",
    category: "Productivity",
    authType: "oauth",
    icon: Globe,
    description: "Connect Notion workspaces to sync call notes, meeting summaries, and contact databases. Create pages from call data automatically.",
    features: [
      "Workspace and database discovery",
      "Call notes synced to Notion pages",
      "Contact database synchronization",
      "Automatic page creation from calls",
      "Search across Notion content",
    ],
    links: [
      { label: "Notion Integrations", url: "https://www.notion.so/my-integrations" },
      { label: "Notion API Docs", url: "https://developers.notion.com/" },
      { label: "OAuth Setup Guide", url: "https://developers.notion.com/docs/authorization" },
    ],
    prerequisites: [
      "Notion account (free or paid)",
      "Workspace owner or admin access",
      "Pages/databases you want to connect must be shared with the integration",
    ],
    steps: [
      {
        title: "Create a Notion integration",
        content: [
          "Go to notion.so/my-integrations",
          "Click 'New integration'",
          "Name: 'CloudPBX'",
          "Select the workspace you want to connect",
          "Under 'Capabilities', enable: Read content, Update content, Insert content",
          "Under 'OAuth Domain & URIs', set the redirect URI to your callback URL (shown below)",
          "Click 'Submit'",
        ],
      },
      {
        title: "Copy OAuth credentials",
        content: [
          "On the integration page, go to the 'OAuth Domain & URIs' section",
          "Copy the OAuth Client ID and OAuth Client Secret",
          "Note: This is different from the Internal Integration Token",
        ],
      },
      {
        title: "Share pages with the integration",
        content: [
          "In Notion, open each page or database you want CloudPBX to access",
          "Click the '...' menu > 'Add connections' > select 'CloudPBX'",
          "This grants the integration access to that specific content",
        ],
      },
      {
        title: "Configure in CloudPBX",
        content: [
          "Go to Integrations > Notion > Configure",
          "Paste the OAuth Client ID and Client Secret",
          "Click Save, then Authorize to connect your workspace",
          "Select the pages/databases to share when prompted",
        ],
      },
    ],
    fieldsNeeded: ["OAuth Client ID", "OAuth Client Secret"],
    troubleshooting: [
      "Make sure you're using the OAuth credentials, not the Internal Integration Token",
      "If pages don't appear, share them with the integration in Notion first",
      "Notion OAuth requires the integration type to be 'Public' (not 'Internal')",
      "The redirect URI must exactly match your callback URL",
    ],
  },
  {
    name: "Google Workspace",
    slug: "google-workspace",
    category: "Productivity",
    authType: "oauth",
    icon: Globe,
    description: "Integrate with Google Workspace to sync contacts from Google Contacts, read calendar availability, and access Gmail for communication logging.",
    features: [
      "Google Contacts synchronization",
      "Calendar availability for call routing",
      "Gmail message integration",
      "User directory from Google Admin",
      "Profile information sync",
    ],
    links: [
      { label: "Google Cloud Console", url: "https://console.cloud.google.com/apis/dashboard" },
      { label: "Create OAuth Credentials", url: "https://console.cloud.google.com/apis/credentials" },
      { label: "Enable APIs", url: "https://console.cloud.google.com/apis/library" },
      { label: "OAuth Setup Guide", url: "https://developers.google.com/identity/protocols/oauth2/web-server" },
    ],
    prerequisites: [
      "Google Workspace account (Business, Enterprise, or Education)",
      "Google Cloud project with billing enabled (for API access)",
      "Admin access to Google Workspace for directory API",
    ],
    steps: [
      {
        title: "Create or select a Google Cloud project",
        content: [
          "Go to console.cloud.google.com",
          "Select an existing project or click 'New Project'",
          "Name: 'CloudPBX Integration'",
        ],
      },
      {
        title: "Enable required APIs",
        content: [
          "Go to APIs & Services > Library",
          "Search for and enable each of these APIs:",
          "  - People API (for contacts)",
          "  - Google Calendar API",
          "  - Gmail API",
          "  - Admin SDK API (for directory, optional)",
        ],
      },
      {
        title: "Configure OAuth consent screen",
        content: [
          "Go to APIs & Services > OAuth consent screen",
          "User type: 'Internal' (for Google Workspace) or 'External'",
          "App name: 'CloudPBX'",
          "Support email: your admin email",
          "Add scopes: contacts.readonly, calendar.readonly, gmail.readonly",
          "If External, add your domain as an authorized domain",
        ],
      },
      {
        title: "Create OAuth 2.0 credentials",
        content: [
          "Go to APIs & Services > Credentials > Create credentials > OAuth client ID",
          "Application type: 'Web application'",
          "Name: 'CloudPBX'",
          "Authorized redirect URIs: Add your callback URL (shown below)",
          "Click 'Create' and copy the Client ID and Client Secret",
        ],
      },
      {
        title: "Configure in CloudPBX",
        content: [
          "Go to Integrations > Google Workspace > Configure",
          "Paste the OAuth Client ID and Client Secret",
          "Click Save, then Authorize to sign in with Google",
        ],
      },
    ],
    fieldsNeeded: ["OAuth Client ID", "OAuth Client Secret"],
    troubleshooting: [
      "If you get 'access_denied', check the OAuth consent screen is configured and approved",
      "For Internal user type, only users in your Google Workspace org can authorize",
      "If APIs fail, verify each API is enabled in the API Library",
      "Admin SDK requires domain-wide delegation for full directory access",
      "The redirect URI must exactly match (including http vs https)",
    ],
  },
  {
    name: "WordPress",
    slug: "wordpress",
    category: "Website",
    authType: "credentials",
    icon: Globe,
    description: "Connect your WordPress website to enable click-to-call widgets, sync contact forms with the PBX, and manage website-based call flows.",
    features: [
      "Click-to-call widget for your website",
      "Contact form submission sync",
      "User directory from WordPress",
      "Post and page management",
      "Plugin settings access",
    ],
    links: [
      { label: "WordPress Application Passwords", url: "https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/" },
      { label: "REST API Handbook", url: "https://developer.wordpress.org/rest-api/" },
    ],
    prerequisites: [
      "Self-hosted WordPress site (version 5.6+) or WordPress.com Business plan",
      "WordPress admin account",
      "HTTPS enabled on your WordPress site (required for Application Passwords)",
      "REST API must be accessible (not blocked by security plugins)",
    ],
    steps: [
      {
        title: "Enable Application Passwords",
        content: [
          "Application Passwords are built into WordPress 5.6+",
          "If you don't see the option, ensure your site uses HTTPS",
          "Some security plugins may disable this feature - check plugin settings",
        ],
      },
      {
        title: "Generate an Application Password",
        content: [
          "Log in to your WordPress admin dashboard",
          "Go to Users > Profile (or edit your admin user)",
          "Scroll down to 'Application Passwords'",
          "Enter 'CloudPBX' as the application name",
          "Click 'Add New Application Password'",
          "Copy the generated password immediately (format: xxxx xxxx xxxx xxxx xxxx xxxx)",
          "This password will not be shown again",
        ],
      },
      {
        title: "Configure in CloudPBX",
        content: [
          "Go to Integrations > WordPress > Configure",
          "Site URL: Your full WordPress URL (e.g., https://mysite.com)",
          "Username: Your WordPress admin username",
          "Application Password: The password you just generated",
          "Click Save, then Connect to test the connection",
        ],
      },
    ],
    fieldsNeeded: ["WordPress Site URL", "Username", "Application Password"],
    troubleshooting: [
      "If connection fails, verify the site URL ends without a trailing slash",
      "Make sure the REST API is accessible: visit https://yoursite.com/wp-json/ in a browser",
      "Some security plugins (like Wordfence, iThemes) may block REST API - add an exception",
      "If Application Passwords section is missing, ensure HTTPS is enabled",
      "The application password has spaces in it - enter it with or without spaces",
    ],
  },
  {
    name: "Twilio",
    slug: "twilio",
    category: "Telephony",
    authType: "credentials",
    icon: Phone,
    description: "Connect Twilio for SMS/MMS capabilities, voice services, phone number management, and call routing through Twilio's global network.",
    features: [
      "SMS/MMS sending and receiving",
      "Phone number inventory management",
      "Voice call routing via Twilio",
      "Call recording integration",
      "Account balance monitoring",
    ],
    links: [
      { label: "Twilio Console", url: "https://console.twilio.com/" },
      { label: "Get Account SID & Auth Token", url: "https://console.twilio.com/us1/account/keys-credentials/api-keys" },
      { label: "Twilio API Docs", url: "https://www.twilio.com/docs/usage/api" },
      { label: "Buy a Phone Number", url: "https://console.twilio.com/us1/develop/phone-numbers/manage/incoming" },
    ],
    prerequisites: [
      "Twilio account (free trial or paid)",
      "At least one Twilio phone number (for SMS/Voice)",
      "Account SID and Auth Token from the Twilio Console dashboard",
    ],
    steps: [
      {
        title: "Get your Twilio credentials",
        content: [
          "Log in to console.twilio.com",
          "On the main dashboard, you'll see your Account SID",
          "Click the eye icon next to Auth Token to reveal it",
          "Copy both values",
        ],
      },
      {
        title: "Ensure you have a phone number",
        content: [
          "Go to Phone Numbers > Manage > Active numbers",
          "If you don't have a number, click 'Buy a number'",
          "Choose a number with SMS and Voice capabilities",
          "For trial accounts, you can only send to verified numbers",
        ],
      },
      {
        title: "Configure in CloudPBX",
        content: [
          "Go to Integrations > Twilio > Configure",
          "Account SID: Starts with 'AC' followed by 32 hex characters",
          "Auth Token: 32-character string from the dashboard",
          "Click Save, then Connect to verify credentials",
        ],
      },
    ],
    fieldsNeeded: ["Account SID", "Auth Token"],
    troubleshooting: [
      "Account SID always starts with 'AC' - if it doesn't, you may have copied the wrong value",
      "Trial accounts can only send to verified phone numbers",
      "If you get 'Authentication Error', regenerate your Auth Token in Twilio Console",
      "Ensure your Twilio account is not suspended (check for billing issues)",
    ],
  },
  {
    name: "UniFi Voice",
    slug: "unifi-voice",
    category: "UniFi",
    authType: "credentials",
    icon: Phone,
    description: "Integrate with Ubiquiti UniFi Talk/Voice for managing VoIP phones, extensions, and call routing through your UniFi infrastructure.",
    features: [
      "VoIP phone management",
      "Extension provisioning",
      "Call routing configuration",
      "Phone status monitoring",
    ],
    links: [
      { label: "UniFi Site Manager", url: "https://unifi.ui.com/" },
      { label: "UniFi Talk Docs", url: "https://help.ui.com/hc/en-us/categories/360004969954" },
      { label: "UniFi API Guide", url: "https://ubntwiki.com/products/software/unifi-controller/api" },
    ],
    prerequisites: [
      "UniFi Dream Machine Pro, Cloud Gateway, or self-hosted controller",
      "UniFi Talk license (for voice features)",
      "Controller accessible via HTTPS",
      "API key or admin credentials",
    ],
    steps: [
      {
        title: "Find your controller URL",
        content: [
          "For Cloud Gateway/UDM Pro: https://<ip-address> (usually 192.168.1.1)",
          "For UniFi Cloud: https://unifi.ui.com (then get the controller-specific URL)",
          "For self-hosted: https://<controller-ip>:8443",
          "Ensure the controller is reachable from the CloudPBX server",
        ],
      },
      {
        title: "Generate an API key (recommended)",
        content: [
          "Log in to your UniFi controller",
          "Go to Settings > System > API",
          "Click 'Create API Key' or 'Add API Key'",
          "Copy the generated key",
          "Note: API key access may require UniFi OS 3.0+",
        ],
      },
      {
        title: "Alternative: Use admin credentials",
        content: [
          "If API keys are not available, use your controller admin username and password",
          "This is less secure but works with older controller versions",
        ],
      },
      {
        title: "Configure in CloudPBX",
        content: [
          "Go to Integrations > UniFi Voice > Configure",
          "Controller URL: Your UniFi controller address",
          "API Key: Your generated API key (preferred)",
          "Or Username/Password: Your admin credentials (alternative)",
          "Site ID: Usually 'default' (leave blank for default site)",
          "Click Save, then Connect to test",
        ],
      },
    ],
    fieldsNeeded: ["Controller URL", "API Key (or Username + Password)", "Site ID (optional)"],
    troubleshooting: [
      "Self-signed SSL certificates may cause connection failures - the system attempts to work around this",
      "If using UDM Pro, the API path includes '/proxy/network/'",
      "API keys require UniFi OS 3.0 or newer",
      "If connection times out, verify the controller URL is reachable from this server",
      "Default Site ID is 'default' - only change if you have multiple sites",
    ],
  },
  {
    name: "UniFi Network",
    slug: "unifi-network",
    category: "UniFi",
    authType: "credentials",
    icon: Globe,
    description: "Monitor your UniFi network infrastructure to ensure call quality. View network health, client devices, and bandwidth usage relevant to VoIP.",
    features: [
      "Network health monitoring",
      "Client device tracking",
      "Bandwidth and latency metrics",
      "Switch and AP status for VoIP devices",
    ],
    links: [
      { label: "UniFi Site Manager", url: "https://unifi.ui.com/" },
      { label: "UniFi Network Docs", url: "https://help.ui.com/hc/en-us/categories/200320654" },
    ],
    prerequisites: [
      "UniFi controller with Network application",
      "Same controller as UniFi Voice (shared configuration)",
    ],
    steps: [
      {
        title: "Use the same controller configuration",
        content: [
          "UniFi products share a single controller",
          "If you've already configured UniFi Voice, the same credentials work here",
          "Go to Integrations > UniFi Network > Configure",
          "Enter the same Controller URL, API Key (or credentials), and Site ID",
          "Click Save, then Connect",
        ],
      },
    ],
    fieldsNeeded: ["Controller URL", "API Key (or Username + Password)", "Site ID (optional)"],
    troubleshooting: [
      "Same troubleshooting as UniFi Voice applies",
      "Network application must be installed on the controller",
    ],
  },
  {
    name: "UniFi Access",
    slug: "unifi-access",
    category: "UniFi",
    authType: "credentials",
    icon: Shield,
    description: "Integrate with UniFi Access for door access control tied to phone system events. Unlock doors via phone extensions or trigger calls on access events.",
    features: [
      "Door lock/unlock via extensions",
      "Access event notifications",
      "Visitor management integration",
      "Access point status monitoring",
    ],
    links: [
      { label: "UniFi Site Manager", url: "https://unifi.ui.com/" },
      { label: "UniFi Access Docs", url: "https://help.ui.com/hc/en-us/categories/360004491634" },
    ],
    prerequisites: [
      "UniFi controller with Access application installed",
      "UniFi Access hardware (Access Readers, Access Hubs)",
      "Same controller as other UniFi products",
    ],
    steps: [
      {
        title: "Use the same controller configuration",
        content: [
          "UniFi products share a single controller",
          "Enter the same Controller URL, API Key (or credentials), and Site ID as other UniFi integrations",
          "Click Save, then Connect",
        ],
      },
    ],
    fieldsNeeded: ["Controller URL", "API Key (or Username + Password)", "Site ID (optional)"],
    troubleshooting: [
      "Access application must be installed and licensed on the controller",
      "Access hardware must be adopted and online",
    ],
  },
  {
    name: "UniFi Protect",
    slug: "unifi-protect",
    category: "UniFi",
    authType: "credentials",
    icon: Globe,
    description: "Connect UniFi Protect cameras to the phone system for video intercom, doorbell-to-extension calling, and security event-triggered calls.",
    features: [
      "Doorbell-to-extension calling",
      "Camera event notifications",
      "Video intercom integration",
      "Motion detection call triggers",
    ],
    links: [
      { label: "UniFi Site Manager", url: "https://unifi.ui.com/" },
      { label: "UniFi Protect Docs", url: "https://help.ui.com/hc/en-us/categories/360002566914" },
    ],
    prerequisites: [
      "UniFi controller with Protect application installed",
      "UniFi Protect cameras or doorbells",
      "Same controller as other UniFi products",
    ],
    steps: [
      {
        title: "Use the same controller configuration",
        content: [
          "UniFi products share a single controller",
          "Enter the same Controller URL, API Key (or credentials), and Site ID",
          "Click Save, then Connect",
        ],
      },
    ],
    fieldsNeeded: ["Controller URL", "API Key (or Username + Password)", "Site ID (optional)"],
    troubleshooting: [
      "Protect application must be installed on the controller",
      "Cameras must be adopted and online in UniFi Protect",
      "For doorbell integration, ensure the doorbell is configured in Protect first",
    ],
  },
  {
    name: "RCare Nurse Call",
    slug: "rcare",
    category: "Healthcare",
    authType: "credentials",
    icon: Globe,
    description: "Full integration with RCare nurse call systems. Route alarms to PBX extensions, manage incidents, map devices to rooms, and receive real-time notifications from the RCare Cube.",
    features: [
      "Alarm routing to extensions and ring groups",
      "Incident management and resolution tracking",
      "Device-to-extension mapping for automatic call routing",
      "Real-time alarm notifications via phone calls",
      "Zone and view management",
      "Escalation rules for unanswered alarms",
      "ADL (Activities of Daily Living) logging",
      "Resident directory integration",
    ],
    links: [
      { label: "RCare Website", url: "https://rcareinc.com/" },
      { label: "RCare Integrations", url: "https://rcareinc.com/integrations/" },
      { label: "RCare Distributor Portal", url: "https://distributors.rcareinc.com/cbxchangelog/cube-integration-api/" },
    ],
    prerequisites: [
      "RCare Cube server installed and accessible on the network",
      "API access enabled on the Cube (contact your RCare distributor)",
      "API key or admin credentials for the Cube",
      "Network connectivity between CloudPBX and the Cube server",
    ],
    steps: [
      {
        title: "Obtain API credentials from the RCare Cube",
        content: [
          "Access the RCare Cube admin panel or contact your RCare distributor",
          "Request API access credentials (API key recommended)",
          "Note down the Cube URL (IP address or hostname)",
          "Ensure the API endpoints are enabled on the Cube",
        ],
      },
      {
        title: "Configure the integration",
        content: [
          "Open the Integrations page and find 'RCare Nurse Call'",
          "Click 'Configure' and enter your Cube URL",
          "Enter your API Key (recommended) or Username/Password",
          "Click 'Save Configuration'",
        ],
      },
      {
        title: "Connect and test",
        content: [
          "Click 'Connect' to test the connection to your RCare Cube",
          "Verify that views, devices, and alarms are accessible",
          "Navigate to the RCare management page to set up device mappings and notification routes",
        ],
      },
    ],
    fieldsNeeded: ["Cube URL", "API Key (or Username + Password)"],
    troubleshooting: [
      "Ensure the Cube server is accessible from the CloudPBX network",
      "Verify API access is enabled on the Cube (some firmware versions require explicit enablement)",
      "Check that the API key or credentials are valid and not expired",
      "The /api/view/ endpoint should be accessible without authentication for initial testing",
      "Contact your RCare distributor for API documentation and support",
      "Some endpoints (like ADL) require specific licenses to be enabled on the Cube",
    ],
  },
];

export default function IntegrationSetupGuide() {
  const redirectUri = getRedirectUri();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/integrations">
          <Button variant="ghost" size="icon" data-testid="button-back-integrations">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <PageHeader
          title="Integration Setup Guide"
          description="Step-by-step instructions for connecting all 13 supported third-party integrations"
        />
      </div>

      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Key className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold" data-testid="text-redirect-uri-title">OAuth Redirect URI</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          For all OAuth-based integrations (Microsoft, Zoho, Notion, Google), you need to register this callback URL in the provider's developer console:
        </p>
        <CodeBlock>{redirectUri}</CodeBlock>
        <p className="text-xs text-muted-foreground">
          Copy this URL and paste it as the "Redirect URI" or "Callback URL" when registering your application with each provider.
        </p>
      </Card>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          All Integrations
        </h2>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="secondary">6 OAuth</Badge>
          <Badge variant="secondary">7 Credential-based</Badge>
          <Badge variant="secondary">13 Total</Badge>
        </div>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {guides.map((guide) => (
          <AccordionItem key={guide.slug} value={guide.slug} className="border rounded-md px-4">
            <AccordionTrigger className="hover:no-underline" data-testid={`accordion-${guide.slug}`}>
              <div className="flex items-center gap-3 text-left">
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold">{guide.name}</span>
                  <span className="text-xs text-muted-foreground">{guide.category}</span>
                </div>
                <Badge variant={guide.authType === "oauth" ? "default" : "secondary"} className="ml-auto mr-4">
                  {guide.authType === "oauth" ? "OAuth 2.0" : "API Credentials"}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-5 pt-2 pb-4">
              <p className="text-sm text-muted-foreground" data-testid={`text-description-${guide.slug}`}>{guide.description}</p>

              <div>
                <h4 className="text-sm font-semibold mb-2">Features</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {guide.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Prerequisites</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {guide.prerequisites.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Required Links</h4>
                <div className="flex gap-2 flex-wrap">
                  {guide.links.map((link, i) => (
                    <ExternalLinkButton key={i} href={link.url} label={link.label} />
                  ))}
                </div>
              </div>

              {guide.authType === "oauth" && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Redirect URI for {guide.name}</h4>
                  <CodeBlock>{redirectUri}</CodeBlock>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-3">Setup Steps</h4>
                <div className="space-y-4">
                  {guide.steps.map((step, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <StepNumber n={i + 1} />
                        <span className="font-medium text-sm">{step.title}</span>
                      </div>
                      <div className="ml-8 space-y-1">
                        {step.content.map((line, j) => (
                          <p key={j} className="text-sm text-muted-foreground">{line}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Fields You'll Need</h4>
                <div className="flex gap-2 flex-wrap">
                  {guide.fieldsNeeded.map((field, i) => (
                    <Badge key={i} variant="outline">{field}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-2">Troubleshooting</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  {guide.troubleshooting.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2">
                <Link href="/integrations">
                  <Button variant="default" data-testid={`button-configure-${guide.slug}`}>
                    Go to {guide.name} Integration
                    <ExternalLink className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
