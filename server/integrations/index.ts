import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import * as microsoft from "./providers/microsoft";
import * as zoho from "./providers/zoho";
import * as wordpress from "./providers/wordpress";
import * as notion from "./providers/notion";
import * as twilio from "./providers/twilio";
import * as google from "./providers/google";
import * as unifi from "./providers/unifi";
import * as rcare from "./providers/rcare";
import * as pbxinaflash from "./providers/pbxinaflash";
import crypto from "crypto";
import { z } from "zod";

const configureSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  tenantId: z.string().optional(),
  instanceUrl: z.string().optional(),
  username: z.string().optional(),
  applicationPassword: z.string().optional(),
  datacenter: z.enum(["com", "eu", "in", "au", "jp"]).optional(),
  accountSid: z.string().optional(),
  authToken: z.string().optional(),
  controllerUrl: z.string().optional(),
  apiKey: z.string().optional(),
  siteId: z.string().optional(),
  adminEmail: z.string().optional(),
  cubeUrl: z.string().optional(),
}).strict();

const oauthStates = new Map<string, { slug: string; integrationId: number; timestamp: number }>();

setInterval(() => {
  const now = Date.now();
  const keys = Array.from(oauthStates.keys());
  for (const key of keys) {
    const value = oauthStates.get(key);
    if (value && now - value.timestamp > 10 * 60 * 1000) {
      oauthStates.delete(key);
    }
  }
}, 60 * 1000);

function getBaseUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:5000";
  return `${proto}://${host}`;
}

function sanitizeConnection(conn: any) {
  if (!conn) return null;
  const { accessToken, refreshToken, clientSecret, webhookSecret, extraConfig, ...safe } = conn;
  const safeExtraConfig: Record<string, any> = {};
  if (extraConfig && typeof extraConfig === "object") {
    const secretKeys = ["applicationPassword", "password", "secret", "token", "apiKey", "authToken", "accountSid"];
    for (const [key, value] of Object.entries(extraConfig as Record<string, any>)) {
      if (secretKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        safeExtraConfig[key] = "••••••••";
      } else {
        safeExtraConfig[key] = value;
      }
    }
  }
  return {
    ...safe,
    extraConfig: safeExtraConfig,
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    hasClientSecret: !!clientSecret,
  };
}

export function registerIntegrationRoutes(app: Express) {

  app.post("/api/integrations/:slug/configure", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug as string;
      const integration = await storage.getIntegrationBySlug(slug);
      if (!integration) return res.status(404).json({ error: "Integration not found" });

      const parsed = configureSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid configuration", details: parsed.error.flatten().fieldErrors });
      }
      const { clientId, clientSecret, tenantId, instanceUrl, username, applicationPassword, datacenter, accountSid, authToken, controllerUrl, apiKey, siteId, adminEmail } = parsed.data;

      let existingConn = await storage.getIntegrationConnection(integration.id);

      const connectionData: any = {
        integrationId: integration.id,
        provider: slug,
        clientId: clientId || null,
        clientSecret: clientSecret || null,
        tenantId: tenantId || null,
        instanceUrl: instanceUrl || null,
        syncStatus: "configured",
        extraConfig: {},
      };

      if (datacenter) connectionData.extraConfig.datacenter = datacenter;
      if (username) connectionData.extraConfig.username = username;
      if (applicationPassword) connectionData.extraConfig.applicationPassword = applicationPassword;
      if (accountSid) connectionData.extraConfig.accountSid = accountSid;
      if (authToken) connectionData.extraConfig.authToken = authToken;
      if (controllerUrl) connectionData.extraConfig.controllerUrl = controllerUrl;
      if (apiKey) connectionData.extraConfig.apiKey = apiKey;
      if (siteId) connectionData.extraConfig.siteId = siteId;
      if (adminEmail) connectionData.extraConfig.adminEmail = adminEmail;
      if (parsed.data.cubeUrl) connectionData.extraConfig.cubeUrl = parsed.data.cubeUrl;

      if (existingConn) {
        const mergedExtra = { ...(existingConn.extraConfig as any || {}), ...connectionData.extraConfig };
        connectionData.extraConfig = mergedExtra;
        await storage.updateIntegrationConnection(existingConn.id, connectionData);
      } else {
        existingConn = await storage.createIntegrationConnection(connectionData);
      }

      await storage.updateIntegration(integration.id, { status: "configured" });
      res.json({ success: true, message: "Configuration saved" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/integrations/:slug/authorize", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug as string;
      const integration = await storage.getIntegrationBySlug(slug);
      if (!integration) return res.status(404).json({ error: "Integration not found" });

      const connection = await storage.getIntegrationConnection(integration.id);
      if (!connection || !connection.clientId || !connection.clientSecret) {
        return res.status(400).json({ error: "Please configure the integration first with your API credentials" });
      }

      const state = crypto.randomBytes(32).toString("hex");
      oauthStates.set(state, { slug, integrationId: integration.id, timestamp: Date.now() });

      const bUrl = getBaseUrl(req);
      const redirectUri = `${bUrl}/api/integrations/oauth/callback`;
      let authorizeUrl: string;

      switch (slug) {
        case "ms-teams": {
          const config: microsoft.MicrosoftConfig = { clientId: connection.clientId, clientSecret: connection.clientSecret, tenantId: connection.tenantId || "common", redirectUri };
          authorizeUrl = microsoft.buildAuthorizeUrl(config, microsoft.getTeamsScopes(), state);
          break;
        }
        case "ms-entra": {
          const config: microsoft.MicrosoftConfig = { clientId: connection.clientId, clientSecret: connection.clientSecret, tenantId: connection.tenantId || "common", redirectUri };
          authorizeUrl = microsoft.buildAuthorizeUrl(config, microsoft.getEntraScopes(), state);
          break;
        }
        case "zoho-crm": {
          const dc = (connection.extraConfig as any)?.datacenter || "com";
          const config: zoho.ZohoConfig = { clientId: connection.clientId, clientSecret: connection.clientSecret, redirectUri, datacenter: dc };
          authorizeUrl = zoho.buildAuthorizeUrl(config, zoho.getCrmScopes(), state, "crm");
          break;
        }
        case "zoho-desk": {
          const dc = (connection.extraConfig as any)?.datacenter || "com";
          const config: zoho.ZohoConfig = { clientId: connection.clientId, clientSecret: connection.clientSecret, redirectUri, datacenter: dc };
          authorizeUrl = zoho.buildAuthorizeUrl(config, zoho.getDeskScopes(), state, "desk");
          break;
        }
        case "notion": {
          authorizeUrl = notion.getAuthorizeUrl(connection.clientId, redirectUri, state);
          break;
        }
        case "google-workspace": {
          authorizeUrl = google.getAuthorizeUrl(connection.clientId, redirectUri, state);
          break;
        }
        default:
          return res.status(400).json({ error: "OAuth not supported for this integration" });
      }

      res.json({ authorizeUrl, state });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/integrations/oauth/callback", async (req: Request, res: Response) => {
    try {
      const { code, state, error: oauthError } = req.query;
      if (oauthError) return res.redirect(`/integrations?error=${encodeURIComponent(oauthError as string)}`);
      if (!state || !code) return res.redirect("/integrations?error=missing_params");

      const stateData = oauthStates.get(state as string);
      if (!stateData) return res.redirect("/integrations?error=invalid_state");
      oauthStates.delete(state as string);

      const connection = await storage.getIntegrationConnection(stateData.integrationId);
      if (!connection || !connection.clientId || !connection.clientSecret) {
        return res.redirect("/integrations?error=no_connection");
      }

      const bUrl = getBaseUrl(req);
      const redirectUri = `${bUrl}/api/integrations/oauth/callback`;

      if (stateData.slug === "ms-teams" || stateData.slug === "ms-entra") {
        const config: microsoft.MicrosoftConfig = { clientId: connection.clientId, clientSecret: connection.clientSecret, tenantId: connection.tenantId || "common", redirectUri };
        const tokens = await microsoft.exchangeCodeForTokens(config, code as string);
        await storage.updateIntegrationConnection(connection.id, {
          accessToken: tokens.accessToken, refreshToken: tokens.refreshToken,
          tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000), syncStatus: "connected",
        });
      } else if (stateData.slug === "zoho-crm" || stateData.slug === "zoho-desk") {
        const dc = (connection.extraConfig as any)?.datacenter || "com";
        const config: zoho.ZohoConfig = { clientId: connection.clientId, clientSecret: connection.clientSecret, redirectUri, datacenter: dc };
        const tokens = await zoho.exchangeCodeForTokens(config, code as string);
        await storage.updateIntegrationConnection(connection.id, {
          accessToken: tokens.accessToken, refreshToken: tokens.refreshToken,
          tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000),
          instanceUrl: tokens.apiDomain, syncStatus: "connected",
        });
      } else if (stateData.slug === "notion") {
        const tokens = await notion.exchangeCode(code as string, connection.clientId, connection.clientSecret, redirectUri);
        await storage.updateIntegrationConnection(connection.id, {
          accessToken: tokens.accessToken, syncStatus: "connected",
          extraConfig: { ...(connection.extraConfig as any || {}), workspaceId: tokens.workspaceId, workspaceName: tokens.workspaceName, botId: tokens.botId },
        });
      } else if (stateData.slug === "google-workspace") {
        const tokens = await google.exchangeCode(code as string, connection.clientId, connection.clientSecret, redirectUri);
        await storage.updateIntegrationConnection(connection.id, {
          accessToken: tokens.accessToken, refreshToken: tokens.refreshToken,
          tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000), syncStatus: "connected",
        });
      }

      await storage.updateIntegration(stateData.integrationId, { status: "connected" });
      res.redirect(`/integrations?connected=${stateData.slug}`);
    } catch (error: any) {
      console.error("OAuth callback error:", error);
      res.redirect(`/integrations?error=${encodeURIComponent(error.message)}`);
    }
  });

  app.post("/api/integrations/:slug/connect", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug as string;
      const integration = await storage.getIntegrationBySlug(slug);
      if (!integration) return res.status(404).json({ error: "Integration not found" });

      const connection = await storage.getIntegrationConnection(integration.id);
      if (!connection) return res.status(400).json({ error: "Please configure the integration first" });

      const extra = connection.extraConfig as any || {};
      let testResult: any = { success: false };

      switch (slug) {
        case "wordpress": {
          const config = { siteUrl: connection.instanceUrl || "", username: extra.username || "", applicationPassword: extra.applicationPassword || "" };
          if (!config.siteUrl || !config.username || !config.applicationPassword) {
            return res.status(400).json({ error: "Site URL, username, and application password are required" });
          }
          const result = await wordpress.testConnection(config);
          testResult = { success: result.valid, siteName: result.siteName };
          break;
        }
        case "twilio": {
          if (!extra.accountSid || !extra.authToken) {
            return res.status(400).json({ error: "Account SID and Auth Token are required" });
          }
          testResult = await twilio.testConnection(extra.accountSid, extra.authToken);
          break;
        }
        case "unifi-voice":
        case "unifi-network":
        case "unifi-access":
        case "unifi-protect": {
          if (!extra.controllerUrl) {
            return res.status(400).json({ error: "Controller URL is required" });
          }
          testResult = await unifi.testConnection({
            controllerUrl: extra.controllerUrl,
            apiKey: extra.apiKey,
            username: extra.username,
            password: extra.applicationPassword,
            siteId: extra.siteId || "default",
          });
          break;
        }
        case "rcare": {
          if (!extra.cubeUrl) {
            return res.status(400).json({ error: "RCare Cube URL is required" });
          }
          testResult = await rcare.testConnection({
            cubeUrl: extra.cubeUrl,
            apiKey: extra.apiKey,
            username: extra.username,
            password: extra.applicationPassword,
          });
          break;
        }
        case "pbx-in-a-flash": {
          if (!connection.instanceUrl || !extra.username || !extra.applicationPassword) {
            return res.status(400).json({ error: "PBX host, AMI username, and secret are required" });
          }
          const port = extra.port ? parseInt(extra.port) : 5038;
          testResult = await pbxinaflash.testConnection({
            host: connection.instanceUrl,
            port,
            username: extra.username,
            secret: extra.applicationPassword
          });
          break;
        }
        default:
          return res.status(400).json({ error: "Direct connect not supported. Use OAuth authorization." });
      }

      if (testResult.success) {
        await storage.updateIntegrationConnection(connection.id, { syncStatus: "connected" });
        await storage.updateIntegration(integration.id, { status: "connected" });
      }

      res.json(testResult);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Legacy WordPress endpoint
  app.post("/api/integrations/:slug/connect-wordpress", async (req: Request, res: Response) => {
    req.params.slug = "wordpress";
    const slug = "wordpress";
    try {
      const integration = await storage.getIntegrationBySlug(slug);
      if (!integration) return res.status(404).json({ error: "Integration not found" });
      const connection = await storage.getIntegrationConnection(integration.id);
      if (!connection) return res.status(400).json({ error: "Please configure WordPress first" });
      const extra = connection.extraConfig as any || {};
      const config = { siteUrl: connection.instanceUrl || "", username: extra.username || "", applicationPassword: extra.applicationPassword || "" };
      const result = await wordpress.testConnection(config);
      if (!result.valid) return res.status(400).json({ error: "Could not connect to WordPress" });
      await storage.updateIntegrationConnection(connection.id, { syncStatus: "connected" });
      await storage.updateIntegration(integration.id, { status: "connected" });
      res.json({ success: true, siteName: result.siteName });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/integrations/:slug/disconnect", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug as string;
      const integration = await storage.getIntegrationBySlug(slug);
      if (!integration) return res.status(404).json({ error: "Integration not found" });
      const connection = await storage.getIntegrationConnection(integration.id);
      if (connection) await storage.deleteIntegrationConnection(connection.id);
      await storage.updateIntegration(integration.id, { status: "available" });
      res.json({ success: true, message: `${integration.name} disconnected` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/integrations/:slug/connection", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug as string;
      const integration = await storage.getIntegrationBySlug(slug);
      if (!integration) return res.status(404).json({ error: "Integration not found" });
      const connection = await storage.getIntegrationConnection(integration.id);
      res.json({ connection: sanitizeConnection(connection), integration });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/integrations/:slug/sites", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug as string;
      if (!slug.startsWith("unifi-")) return res.status(400).json({ error: "Site discovery only for UniFi" });
      const integration = await storage.getIntegrationBySlug(slug);
      if (!integration) return res.status(404).json({ error: "Integration not found" });
      const connection = await storage.getIntegrationConnection(integration.id);
      if (!connection) return res.status(400).json({ error: "Not configured" });
      const extra = connection.extraConfig as any || {};
      const sites = await unifi.getSites({
        controllerUrl: extra.controllerUrl,
        apiKey: extra.apiKey,
        username: extra.username,
        password: extra.applicationPassword,
      });
      res.json({ sites });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/integrations/:slug/sync", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug as string;
      const integration = await storage.getIntegrationBySlug(slug);
      if (!integration) return res.status(404).json({ error: "Integration not found" });

      const connection = await storage.getIntegrationConnection(integration.id);
      if (!connection) return res.status(400).json({ error: "Integration not configured" });

      const extra = connection.extraConfig as any || {};

      // Credential-based providers (no OAuth token needed)
      if (slug === "wordpress") {
        const config = { siteUrl: connection.instanceUrl || "", username: extra.username || "", applicationPassword: extra.applicationPassword || "" };
        const health = await wordpress.getSiteHealth(config);
        const users = health.connected ? await wordpress.getUsers(config) : [];
        const pages = health.connected ? await wordpress.getPages(config) : [];
        await storage.updateIntegrationConnection(connection.id, { lastSyncAt: new Date(), syncStatus: health.connected ? "synced" : "error" });
        return res.json({ provider: "wordpress", health, users, pages });
      }

      if (slug === "twilio") {
        if (!extra.accountSid || !extra.authToken) return res.status(400).json({ error: "Twilio not configured" });
        const data = await twilio.syncData(extra.accountSid, extra.authToken);
        await storage.updateIntegrationConnection(connection.id, { lastSyncAt: new Date(), syncStatus: "synced" });
        return res.json({ provider: "twilio", ...data });
      }

      if (slug === "rcare") {
        if (!extra.cubeUrl) return res.status(400).json({ error: "RCare Cube URL not configured" });
        const rConfig = { cubeUrl: extra.cubeUrl, apiKey: extra.apiKey, username: extra.username, password: extra.applicationPassword };
        const data = await rcare.syncData(rConfig);
        await storage.updateIntegrationConnection(connection.id, { lastSyncAt: new Date(), syncStatus: "synced" });
        return res.json({ provider: "rcare", ...data });
      }

      if (slug === "pbx-in-a-flash") {
        if (!connection.instanceUrl || !extra.username || !extra.applicationPassword) {
          return res.status(400).json({ error: "PBX credentials not configured" });
        }
        const port = extra.port ? parseInt(extra.port) : 5038;
        const config = { host: connection.instanceUrl, port, username: extra.username, secret: extra.applicationPassword };
        const data = await pbxinaflash.syncData(config);
        await storage.updateIntegrationConnection(connection.id, { lastSyncAt: new Date(), syncStatus: "synced" });
        return res.json({ provider: "pbx-in-a-flash", ...data });
      }

      if (slug.startsWith("unifi-")) {
        if (!extra.controllerUrl) return res.status(400).json({ error: "UniFi controller not configured" });
        const uConfig = { controllerUrl: extra.controllerUrl, apiKey: extra.apiKey, username: extra.username, password: extra.applicationPassword, siteId: extra.siteId || "default" };
        let data: any;
        switch (slug) {
          case "unifi-voice": data = await unifi.syncVoice(uConfig); break;
          case "unifi-network": data = await unifi.syncNetwork(uConfig); break;
          case "unifi-access": data = await unifi.syncAccess(uConfig); break;
          case "unifi-protect": data = await unifi.syncProtect(uConfig); break;
          default: return res.status(400).json({ error: "Unknown UniFi product" });
        }
        await storage.updateIntegrationConnection(connection.id, { lastSyncAt: new Date(), syncStatus: "synced" });
        return res.json({ provider: slug, ...data });
      }

      // OAuth-based providers
      if (!connection.accessToken) {
        return res.status(400).json({ error: "Integration not connected. Please authorize first." });
      }

      let needsRefresh = false;
      if (connection.tokenExpiry && new Date(connection.tokenExpiry) <= new Date(Date.now() + 5 * 60 * 1000)) {
        needsRefresh = true;
      }
      let accessToken = connection.accessToken;

      if (needsRefresh && connection.refreshToken && connection.clientId && connection.clientSecret) {
        try {
          if (slug === "ms-teams" || slug === "ms-entra") {
            const config: microsoft.MicrosoftConfig = { clientId: connection.clientId, clientSecret: connection.clientSecret, tenantId: connection.tenantId || "common", redirectUri: "" };
            const tokens = await microsoft.refreshAccessToken(config, connection.refreshToken);
            accessToken = tokens.accessToken;
            await storage.updateIntegrationConnection(connection.id, { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000) });
          } else if (slug === "zoho-crm" || slug === "zoho-desk") {
            const dc = extra.datacenter || "com";
            const config: zoho.ZohoConfig = { clientId: connection.clientId, clientSecret: connection.clientSecret, redirectUri: "", datacenter: dc };
            const tokens = await zoho.refreshAccessToken(config, connection.refreshToken);
            accessToken = tokens.accessToken;
            await storage.updateIntegrationConnection(connection.id, { accessToken: tokens.accessToken, tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000) });
          } else if (slug === "google-workspace") {
            const tokens = await google.refreshAccessToken(connection.refreshToken, connection.clientId, connection.clientSecret);
            accessToken = tokens.accessToken;
            await storage.updateIntegrationConnection(connection.id, { accessToken: tokens.accessToken, tokenExpiry: new Date(Date.now() + tokens.expiresIn * 1000) });
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          return res.status(401).json({ error: "Token expired, please re-authorize" });
        }
      }

      let data: any = {};

      switch (slug) {
        case "ms-entra": {
          const [users, groups, org] = await Promise.all([microsoft.getEntraUsers(accessToken), microsoft.getEntraGroups(accessToken), microsoft.getOrganizationInfo(accessToken)]);
          data = { provider: "ms-entra", users, groups, organization: org };
          break;
        }
        case "ms-teams": {
          const users = await microsoft.getTeamsUsers(accessToken);
          const userIds = users.slice(0, 25).map((u: any) => u.id);
          const presence = userIds.length > 0 ? await microsoft.getTeamsPresence(accessToken, userIds) : [];
          data = { provider: "ms-teams", users, presence };
          break;
        }
        case "zoho-crm": {
          const apiDomain = connection.instanceUrl || "https://www.zohoapis.com";
          const [contacts, accounts, deals] = await Promise.all([zoho.getCrmContacts(apiDomain, accessToken), zoho.getCrmAccounts(apiDomain, accessToken), zoho.getCrmDeals(apiDomain, accessToken)]);
          data = { provider: "zoho-crm", contacts, accounts, deals };
          break;
        }
        case "zoho-desk": {
          const apiDomain = connection.instanceUrl || "https://www.zohoapis.com";
          const [tickets, contacts, agents] = await Promise.all([zoho.getDeskTickets(apiDomain, accessToken, ""), zoho.getDeskContacts(apiDomain, accessToken), zoho.getDeskAgents(apiDomain, accessToken)]);
          data = { provider: "zoho-desk", tickets, contacts, agents };
          break;
        }
        case "notion": {
          data = { provider: "notion", ...await notion.syncData(accessToken) };
          break;
        }
        case "google-workspace": {
          data = { provider: "google-workspace", ...await google.syncData(accessToken) };
          break;
        }
        default:
          return res.status(400).json({ error: "Sync not available for this integration" });
      }

      await storage.updateIntegrationConnection(connection.id, { lastSyncAt: new Date(), syncStatus: "synced" });
      res.json(data);
    } catch (error: any) {
      console.error(`Sync error for ${req.params.slug}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/integrations/:slug/test", async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug as string;
      const integration = await storage.getIntegrationBySlug(slug);
      if (!integration) return res.status(404).json({ error: "Integration not found" });

      const connection = await storage.getIntegrationConnection(integration.id);
      if (!connection) return res.status(400).json({ error: "Integration not configured" });

      const extra = connection.extraConfig as any || {};
      let testResult: any = { success: false };

      switch (slug) {
        case "wordpress": {
          const config = { siteUrl: connection.instanceUrl || "", username: extra.username || "", applicationPassword: extra.applicationPassword || "" };
          const result = await wordpress.testConnection(config);
          testResult = { success: result.valid, siteName: result.siteName, siteUrl: result.siteUrl };
          break;
        }
        case "twilio": {
          testResult = extra.accountSid && extra.authToken
            ? await twilio.testConnection(extra.accountSid, extra.authToken)
            : { success: false, error: "Account SID and Auth Token not configured" };
          break;
        }
        case "unifi-voice": case "unifi-network": case "unifi-access": case "unifi-protect": {
          if (!extra.controllerUrl) {
            testResult = { success: false, error: "Controller URL not configured" };
          } else {
            testResult = await unifi.testConnection({
              controllerUrl: extra.controllerUrl, apiKey: extra.apiKey,
              username: extra.username, password: extra.applicationPassword,
              siteId: extra.siteId || "default",
            });
          }
          break;
        }
        case "notion": {
          testResult = connection.accessToken
            ? await notion.testConnection(connection.accessToken)
            : { success: false, error: "Not authorized. Please complete OAuth flow." };
          break;
        }
        case "google-workspace": {
          if (!connection.accessToken) {
            testResult = { success: false, error: "Not authorized. Please complete OAuth flow." };
          } else {
            testResult = await google.testConnection(connection.accessToken);
          }
          break;
        }
        case "ms-teams": case "ms-entra": {
          if (!connection.accessToken) {
            testResult = { success: false, error: "Not authorized. Please complete OAuth flow." };
          } else {
            try {
              const org = await microsoft.getOrganizationInfo(connection.accessToken);
              testResult = { success: true, organization: org?.displayName || "Connected" };
            } catch {
              testResult = { success: false, error: "Token expired. Please re-authorize." };
            }
          }
          break;
        }
        case "zoho-crm": case "zoho-desk": {
          if (!connection.accessToken) {
            testResult = { success: false, error: "Not authorized. Please complete OAuth flow." };
          } else {
            try {
              const apiDomain = connection.instanceUrl || "https://www.zohoapis.com";
              const org = await zoho.getOrganizationInfo(apiDomain, connection.accessToken);
              testResult = { success: true, organization: org?.company_name || "Connected" };
            } catch {
              testResult = { success: false, error: "Token expired. Please re-authorize." };
            }
          }
          break;
        }
        case "rcare": {
          if (!extra.cubeUrl) {
            testResult = { success: false, error: "RCare Cube URL not configured" };
          } else {
            testResult = await rcare.testConnection({
              cubeUrl: extra.cubeUrl, apiKey: extra.apiKey,
              username: extra.username, password: extra.applicationPassword,
            });
          }
          break;
        }
        case "pbx-in-a-flash": {
          if (!connection.instanceUrl || !extra.username || !extra.applicationPassword) {
            testResult = { success: false, error: "PBX credentials not configured" };
          } else {
            const port = extra.port ? parseInt(extra.port) : 5038;
            testResult = await pbxinaflash.testConnection({
              host: connection.instanceUrl, port,
              username: extra.username, secret: extra.applicationPassword,
            });
          }
          break;
        }
        default:
          testResult = { success: false, error: "Test not available for this integration" };
      }

      res.json(testResult);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rcare/alarms", async (req: Request, res: Response) => {
    try {
      const integration = await storage.getIntegrationBySlug("rcare");
      if (!integration) return res.status(404).json({ error: "RCare integration not found" });
      const connection = await storage.getIntegrationConnection(integration.id);
      if (!connection) return res.status(400).json({ error: "RCare not configured" });
      const extra = connection.extraConfig as any || {};
      if (!extra.cubeUrl) return res.status(400).json({ error: "Cube URL not configured" });
      const config = { cubeUrl: extra.cubeUrl, apiKey: extra.apiKey, username: extra.username, password: extra.applicationPassword };
      const viewId = req.query.viewId as string | undefined;
      const alarms = await rcare.getAlarms(config, viewId);
      res.json({ alarms });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rcare/incidents", async (req: Request, res: Response) => {
    try {
      const integration = await storage.getIntegrationBySlug("rcare");
      if (!integration) return res.status(404).json({ error: "RCare integration not found" });
      const connection = await storage.getIntegrationConnection(integration.id);
      if (!connection) return res.status(400).json({ error: "RCare not configured" });
      const extra = connection.extraConfig as any || {};
      if (!extra.cubeUrl) return res.status(400).json({ error: "Cube URL not configured" });
      const config = { cubeUrl: extra.cubeUrl, apiKey: extra.apiKey, username: extra.username, password: extra.applicationPassword };
      const viewId = req.query.viewId as string | undefined;
      const incidents = await rcare.getIncidents(config, viewId);
      res.json({ incidents });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rcare/devices", async (req: Request, res: Response) => {
    try {
      const integration = await storage.getIntegrationBySlug("rcare");
      if (!integration) return res.status(404).json({ error: "RCare integration not found" });
      const connection = await storage.getIntegrationConnection(integration.id);
      if (!connection) return res.status(400).json({ error: "RCare not configured" });
      const extra = connection.extraConfig as any || {};
      if (!extra.cubeUrl) return res.status(400).json({ error: "Cube URL not configured" });
      const config = { cubeUrl: extra.cubeUrl, apiKey: extra.apiKey, username: extra.username, password: extra.applicationPassword };
      const devices = await rcare.getDevices(config);
      res.json({ devices });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rcare/views", async (req: Request, res: Response) => {
    try {
      const integration = await storage.getIntegrationBySlug("rcare");
      if (!integration) return res.status(404).json({ error: "RCare integration not found" });
      const connection = await storage.getIntegrationConnection(integration.id);
      if (!connection) return res.status(400).json({ error: "RCare not configured" });
      const extra = connection.extraConfig as any || {};
      if (!extra.cubeUrl) return res.status(400).json({ error: "Cube URL not configured" });
      const config = { cubeUrl: extra.cubeUrl, apiKey: extra.apiKey, username: extra.username, password: extra.applicationPassword };
      const views = await rcare.getViews(config);
      res.json({ views });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/rcare/alarms/:alarmId/acknowledge", async (req: Request, res: Response) => {
    try {
      const integration = await storage.getIntegrationBySlug("rcare");
      if (!integration) return res.status(404).json({ error: "RCare integration not found" });
      const connection = await storage.getIntegrationConnection(integration.id);
      if (!connection) return res.status(400).json({ error: "RCare not configured" });
      const extra = connection.extraConfig as any || {};
      if (!extra.cubeUrl) return res.status(400).json({ error: "Cube URL not configured" });
      const config = { cubeUrl: extra.cubeUrl, apiKey: extra.apiKey, username: extra.username, password: extra.applicationPassword };
      const result = await rcare.acknowledgeAlarm(config, req.params.alarmId as string, req.body?.userId);
      res.json({ success: true, result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/rcare/incidents/:incidentId/resolve", async (req: Request, res: Response) => {
    try {
      const integration = await storage.getIntegrationBySlug("rcare");
      if (!integration) return res.status(404).json({ error: "RCare integration not found" });
      const connection = await storage.getIntegrationConnection(integration.id);
      if (!connection) return res.status(400).json({ error: "RCare not configured" });
      const extra = connection.extraConfig as any || {};
      if (!extra.cubeUrl) return res.status(400).json({ error: "Cube URL not configured" });
      const config = { cubeUrl: extra.cubeUrl, apiKey: extra.apiKey, username: extra.username, password: extra.applicationPassword };
      const result = await rcare.resolveIncident(config, req.params.incidentId as string, req.body?.notes);
      res.json({ success: true, result });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/rcare/settings", async (req: Request, res: Response) => {
    try {
      const integration = await storage.getIntegrationBySlug("rcare");
      if (!integration) return res.status(404).json({ error: "RCare integration not found" });
      const connection = await storage.getIntegrationConnection(integration.id);
      if (!connection) return res.json({ configured: false });
      const extra = connection.extraConfig as any || {};
      const deviceMappings = extra.deviceMappings || [];
      const notificationRoutes = extra.notificationRoutes || [];
      res.json({
        configured: true,
        status: connection.syncStatus,
        cubeUrl: extra.cubeUrl ? extra.cubeUrl.replace(/\/\/(.+?)@/, "//***@") : null,
        deviceMappings,
        notificationRoutes,
        lastSyncAt: connection.lastSyncAt,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/rcare/settings/device-mappings", async (req: Request, res: Response) => {
    try {
      const integration = await storage.getIntegrationBySlug("rcare");
      if (!integration) return res.status(404).json({ error: "RCare integration not found" });
      const connection = await storage.getIntegrationConnection(integration.id);
      if (!connection) return res.status(400).json({ error: "RCare not configured" });
      const extra = connection.extraConfig as any || {};
      const mappings = req.body?.mappings;
      if (!Array.isArray(mappings)) return res.status(400).json({ error: "Mappings must be an array" });
      extra.deviceMappings = mappings;
      await storage.updateIntegrationConnection(connection.id, { extraConfig: extra });
      res.json({ success: true, deviceMappings: mappings });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/rcare/settings/notification-routes", async (req: Request, res: Response) => {
    try {
      const integration = await storage.getIntegrationBySlug("rcare");
      if (!integration) return res.status(404).json({ error: "RCare integration not found" });
      const connection = await storage.getIntegrationConnection(integration.id);
      if (!connection) return res.status(400).json({ error: "RCare not configured" });
      const extra = connection.extraConfig as any || {};
      const routes = req.body?.routes;
      if (!Array.isArray(routes)) return res.status(400).json({ error: "Routes must be an array" });
      extra.notificationRoutes = routes;
      await storage.updateIntegrationConnection(connection.id, { extraConfig: extra });
      res.json({ success: true, notificationRoutes: routes });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
