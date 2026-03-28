import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/lib/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";

import Dashboard from "@/pages/dashboard";
import Extensions from "@/pages/extensions";
import DIDs from "@/pages/dids";
import CallFlows from "@/pages/call-flows";
import CallLogs from "@/pages/call-logs";
import SMS from "@/pages/sms";
import Fax from "@/pages/fax";
import Devices from "@/pages/devices";
import Integrations from "@/pages/integrations";
import AIAssistant from "@/pages/ai-assistant";
import AIAgents from "@/pages/ai-agents";
import UserPortal from "@/pages/user-portal";
import Settings from "@/pages/settings";
import RingGroups from "@/pages/ring-groups";
import Queues from "@/pages/queues";
import Support from "@/pages/support";
import Contacts from "@/pages/contacts";
import Voicemail from "@/pages/voicemail";
import Analytics from "@/pages/analytics";
import RoutingRules from "@/pages/routing-rules";
import Wallboard from "@/pages/wallboard";
import Webhooks from "@/pages/webhooks";
import SipTrunks from "@/pages/sip-trunks";
import Trading from "@/pages/trading";
import IntegrationSetupGuide from "@/pages/integration-setup-guide";
import RCare from "@/pages/rcare";
import NotFound from "@/pages/not-found";
// 25 Industry-First Feature Pages
import Softphone from "@/pages/softphone";
import CallQuality from "@/pages/call-quality";
import Campaigns from "@/pages/campaigns";
import VoiceBiometrics from "@/pages/voice-biometrics";
import EmotionAnalytics from "@/pages/emotion-analytics";
import FraudDetection from "@/pages/fraud-detection";
import ComplianceRecording from "@/pages/compliance-recording";
import CallbackScheduler from "@/pages/callback-scheduler";
import NumberPorting from "@/pages/number-porting";
import NetworkQuality from "@/pages/network-quality";
import Omnichannel from "@/pages/omnichannel";
import Gamification from "@/pages/gamification";
import ReportBuilder from "@/pages/report-builder";
import IVRAnalytics from "@/pages/ivr-analytics";
import APIKeys from "@/pages/api-keys";
import SIPSecurity from "@/pages/sip-security";
import BusinessHours from "@/pages/business-hours";
import CallJourney from "@/pages/call-journey";
import AutoProvisioning from "@/pages/auto-provisioning";
import DisasterRecovery from "@/pages/disaster-recovery";
import ConversationIntelligence from "@/pages/conversation-intelligence";
import CostAnalytics from "@/pages/cost-analytics";
import Tenants from "@/pages/tenants";
import GreenCalling from "@/pages/green-calling";
import LiveCoaching from "@/pages/live-coaching";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/extensions" component={Extensions} />
      <Route path="/dids" component={DIDs} />
      <Route path="/call-flows" component={CallFlows} />
      <Route path="/ring-groups" component={RingGroups} />
      <Route path="/queues" component={Queues} />
      <Route path="/call-logs" component={CallLogs} />
      <Route path="/sms" component={SMS} />
      <Route path="/fax" component={Fax} />
      <Route path="/devices" component={Devices} />
      <Route path="/integrations" component={Integrations} />
      <Route path="/ai-assistant" component={AIAssistant} />
      <Route path="/ai-agents" component={AIAgents} />
      <Route path="/user-portal" component={UserPortal} />
      <Route path="/settings" component={Settings} />
      <Route path="/support" component={Support} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/voicemail" component={Voicemail} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/routing-rules" component={RoutingRules} />
      <Route path="/wallboard" component={Wallboard} />
      <Route path="/webhooks" component={Webhooks} />
      <Route path="/sip-trunks" component={SipTrunks} />
      <Route path="/trading" component={Trading} />
      <Route path="/integration-setup-guide" component={IntegrationSetupGuide} />
      <Route path="/rcare" component={RCare} />
      {/* 25 Industry-First Feature Routes */}
      <Route path="/softphone" component={Softphone} />
      <Route path="/call-quality" component={CallQuality} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/voice-biometrics" component={VoiceBiometrics} />
      <Route path="/emotion-analytics" component={EmotionAnalytics} />
      <Route path="/fraud-detection" component={FraudDetection} />
      <Route path="/compliance-recording" component={ComplianceRecording} />
      <Route path="/callback-scheduler" component={CallbackScheduler} />
      <Route path="/number-porting" component={NumberPorting} />
      <Route path="/network-quality" component={NetworkQuality} />
      <Route path="/omnichannel" component={Omnichannel} />
      <Route path="/gamification" component={Gamification} />
      <Route path="/report-builder" component={ReportBuilder} />
      <Route path="/ivr-analytics" component={IVRAnalytics} />
      <Route path="/api-keys" component={APIKeys} />
      <Route path="/sip-security" component={SIPSecurity} />
      <Route path="/business-hours" component={BusinessHours} />
      <Route path="/call-journey" component={CallJourney} />
      <Route path="/auto-provisioning" component={AutoProvisioning} />
      <Route path="/disaster-recovery" component={DisasterRecovery} />
      <Route path="/conversation-intelligence" component={ConversationIntelligence} />
      <Route path="/cost-analytics" component={CostAnalytics} />
      <Route path="/tenants" component={Tenants} />
      <Route path="/green-calling" component={GreenCalling} />
      <Route path="/live-coaching" component={LiveCoaching} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="cloudpbx-theme">
        <TooltipProvider>
          <SidebarProvider style={sidebarStyle as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <SidebarInset className="flex flex-col flex-1 overflow-hidden">
                <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto">
                  <Router />
                </main>
              </SidebarInset>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
