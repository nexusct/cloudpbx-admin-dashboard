import type { IntegrationConnection } from "@shared/schema";

const MICROSOFT_AUTH_URL = "https://login.microsoftonline.com";
const MICROSOFT_GRAPH_URL = "https://graph.microsoft.com/v1.0";

export interface MicrosoftConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
}

export function getTeamsScopes(): string {
  return "https://graph.microsoft.com/.default offline_access User.Read.All Presence.Read.All Team.ReadBasic.All Channel.ReadBasic.All CallRecords.Read.All";
}

export function getEntraScopes(): string {
  return "https://graph.microsoft.com/.default offline_access User.Read.All Group.Read.All Directory.Read.All";
}

export function buildAuthorizeUrl(config: MicrosoftConfig, scopes: string, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: config.redirectUri,
    response_mode: "query",
    scope: scopes,
    state,
  });
  return `${MICROSOFT_AUTH_URL}/${config.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  config: MicrosoftConfig,
  code: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
    scope: "https://graph.microsoft.com/.default offline_access",
  });

  const response = await fetch(`${MICROSOFT_AUTH_URL}/${config.tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Microsoft token exchange failed: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function refreshAccessToken(
  config: MicrosoftConfig,
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    scope: "https://graph.microsoft.com/.default offline_access",
  });

  const response = await fetch(`${MICROSOFT_AUTH_URL}/${config.tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error("Microsoft token refresh failed");
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: data.expires_in,
  };
}

async function graphRequest(accessToken: string, endpoint: string) {
  const response = await fetch(`${MICROSOFT_GRAPH_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Graph API error (${response.status}): ${error}`);
  }

  return response.json();
}

export async function getEntraUsers(accessToken: string) {
  const data = await graphRequest(accessToken, "/users?$select=id,displayName,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone,businessPhones&$top=100");
  return data.value || [];
}

export async function getEntraGroups(accessToken: string) {
  const data = await graphRequest(accessToken, "/groups?$select=id,displayName,description,mail,groupTypes&$top=100");
  return data.value || [];
}

export async function getTeamsUsers(accessToken: string) {
  const data = await graphRequest(accessToken, "/users?$select=id,displayName,mail,userPrincipalName,assignedLicenses&$top=100");
  return data.value || [];
}

export async function getTeamsPresence(accessToken: string, userIds: string[]) {
  if (userIds.length === 0) return [];
  const body = { ids: userIds.slice(0, 25) };
  const response = await fetch(`${MICROSOFT_GRAPH_URL}/communications/getPresencesByUserId`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) return [];
  const data = await response.json();
  return data.value || [];
}

export async function getTeamsChannels(accessToken: string, teamId: string) {
  const data = await graphRequest(accessToken, `/teams/${teamId}/channels`);
  return data.value || [];
}

export async function getOrganizationInfo(accessToken: string) {
  const data = await graphRequest(accessToken, "/organization");
  return data.value?.[0] || null;
}

export function isTokenExpired(connection: IntegrationConnection): boolean {
  if (!connection.tokenExpiry) return true;
  return new Date(connection.tokenExpiry) <= new Date(Date.now() + 5 * 60 * 1000);
}
