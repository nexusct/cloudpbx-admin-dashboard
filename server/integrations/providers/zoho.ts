import type { IntegrationConnection } from "@shared/schema";

const ZOHO_ACCOUNTS_URL = "https://accounts.zoho.com";

export interface ZohoConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  datacenter?: string;
}

function getAccountsUrl(datacenter: string = "com"): string {
  const dcMap: Record<string, string> = {
    com: "https://accounts.zoho.com",
    eu: "https://accounts.zoho.eu",
    in: "https://accounts.zoho.in",
    au: "https://accounts.zoho.com.au",
    jp: "https://accounts.zoho.jp",
  };
  return dcMap[datacenter] || dcMap.com;
}

function getApiUrl(datacenter: string = "com"): string {
  const dcMap: Record<string, string> = {
    com: "https://www.zohoapis.com",
    eu: "https://www.zohoapis.eu",
    in: "https://www.zohoapis.in",
    au: "https://www.zohoapis.com.au",
    jp: "https://www.zohoapis.jp",
  };
  return dcMap[datacenter] || dcMap.com;
}

export function getCrmScopes(): string {
  return "ZohoCRM.modules.ALL,ZohoCRM.settings.ALL,ZohoCRM.users.ALL,ZohoCRM.org.ALL";
}

export function getDeskScopes(): string {
  return "Desk.tickets.ALL,Desk.contacts.ALL,Desk.basic.ALL,Desk.settings.ALL,Desk.search.ALL";
}

export function buildAuthorizeUrl(config: ZohoConfig, scopes: string, state: string, service: "crm" | "desk"): string {
  const accountsUrl = getAccountsUrl(config.datacenter);
  const params = new URLSearchParams({
    scope: scopes,
    client_id: config.clientId,
    response_type: "code",
    access_type: "offline",
    redirect_uri: config.redirectUri,
    state,
    prompt: "consent",
  });
  return `${accountsUrl}/oauth/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  config: ZohoConfig,
  code: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number; apiDomain: string }> {
  const accountsUrl = getAccountsUrl(config.datacenter);
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code,
  });

  const response = await fetch(`${accountsUrl}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoho token exchange failed: ${error}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Zoho error: ${data.error}`);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in || 3600,
    apiDomain: data.api_domain || getApiUrl(config.datacenter),
  };
}

export async function refreshAccessToken(
  config: ZohoConfig,
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const accountsUrl = getAccountsUrl(config.datacenter);
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
  });

  const response = await fetch(`${accountsUrl}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error("Zoho token refresh failed");
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in || 3600,
  };
}

async function zohoApiRequest(apiDomain: string, accessToken: string, endpoint: string) {
  const response = await fetch(`${apiDomain}${endpoint}`, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zoho API error (${response.status}): ${error}`);
  }

  return response.json();
}

export async function getCrmContacts(apiDomain: string, accessToken: string) {
  const data = await zohoApiRequest(apiDomain, accessToken, "/crm/v5/Contacts?fields=Full_Name,Email,Phone,Mobile,Company,Title&per_page=100");
  return data.data || [];
}

export async function getCrmAccounts(apiDomain: string, accessToken: string) {
  const data = await zohoApiRequest(apiDomain, accessToken, "/crm/v5/Accounts?fields=Account_Name,Phone,Website,Industry,Annual_Revenue&per_page=100");
  return data.data || [];
}

export async function getCrmDeals(apiDomain: string, accessToken: string) {
  const data = await zohoApiRequest(apiDomain, accessToken, "/crm/v5/Deals?fields=Deal_Name,Amount,Stage,Closing_Date,Account_Name&per_page=100");
  return data.data || [];
}

export async function logCrmCall(apiDomain: string, accessToken: string, callData: {
  subject: string;
  callType: string;
  callDuration: string;
  callFrom: string;
  callTo: string;
}) {
  const response = await fetch(`${apiDomain}/crm/v5/Calls`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: [{
        Subject: callData.subject,
        Call_Type: callData.callType,
        Call_Duration: callData.callDuration,
        Call_From: callData.callFrom,
        Call_To: callData.callTo,
      }],
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to log call to Zoho CRM");
  }

  return response.json();
}

export async function getDeskTickets(apiDomain: string, accessToken: string, orgId: string) {
  const data = await zohoApiRequest(apiDomain, accessToken, `/desk/v1/tickets?limit=100`);
  return data.data || [];
}

export async function getDeskContacts(apiDomain: string, accessToken: string) {
  const data = await zohoApiRequest(apiDomain, accessToken, `/desk/v1/contacts?limit=100`);
  return data.data || [];
}

export async function getDeskAgents(apiDomain: string, accessToken: string) {
  const data = await zohoApiRequest(apiDomain, accessToken, `/desk/v1/agents?limit=100`);
  return data.data || [];
}

export async function createDeskTicket(apiDomain: string, accessToken: string, ticketData: {
  subject: string;
  description: string;
  contactId?: string;
  departmentId?: string;
  priority?: string;
}) {
  const response = await fetch(`${apiDomain}/desk/v1/tickets`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: ticketData.subject,
      description: ticketData.description,
      contactId: ticketData.contactId,
      departmentId: ticketData.departmentId,
      priority: ticketData.priority || "Medium",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create Zoho Desk ticket");
  }

  return response.json();
}

export async function getOrganizationInfo(apiDomain: string, accessToken: string) {
  const data = await zohoApiRequest(apiDomain, accessToken, "/crm/v5/org");
  return data.org?.[0] || null;
}

export function isTokenExpired(connection: IntegrationConnection): boolean {
  if (!connection.tokenExpiry) return true;
  return new Date(connection.tokenExpiry) <= new Date(Date.now() + 5 * 60 * 1000);
}
