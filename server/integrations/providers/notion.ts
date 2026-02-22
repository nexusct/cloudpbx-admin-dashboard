const NOTION_API_BASE = "https://api.notion.com/v1";
const NOTION_OAUTH_BASE = "https://api.notion.com/v1/oauth";
const NOTION_VERSION = "2022-06-28";

export function getAuthorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    owner: "user",
    state,
  });
  return `${NOTION_OAUTH_BASE}/authorize?${params.toString()}`;
}

export async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ accessToken: string; workspaceId: string; workspaceName: string; botId: string }> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${NOTION_OAUTH_BASE}/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_VERSION,
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion token exchange failed: ${err}`);
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    workspaceId: data.workspace_id,
    workspaceName: data.workspace_name || "Notion Workspace",
    botId: data.bot_id,
  };
}

export async function testConnection(accessToken: string): Promise<{ success: boolean; workspaceName?: string; error?: string }> {
  try {
    const res = await fetch(`${NOTION_API_BASE}/users/me`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Notion-Version": NOTION_VERSION,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, workspaceName: data.name || "Connected" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncData(accessToken: string): Promise<any> {
  const headers = {
    "Authorization": `Bearer ${accessToken}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };

  const [usersRes, dbRes, pagesRes] = await Promise.all([
    fetch(`${NOTION_API_BASE}/users`, { headers }),
    fetch(`${NOTION_API_BASE}/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ filter: { value: "database", property: "object" }, page_size: 50 }),
    }),
    fetch(`${NOTION_API_BASE}/search`, {
      method: "POST",
      headers,
      body: JSON.stringify({ filter: { value: "page", property: "object" }, page_size: 50 }),
    }),
  ]);

  const users = usersRes.ok ? (await usersRes.json()).results || [] : [];
  const databases = dbRes.ok ? (await dbRes.json()).results || [] : [];
  const pages = pagesRes.ok ? (await pagesRes.json()).results || [] : [];

  return {
    users: users.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.person?.email,
      type: u.type,
      avatarUrl: u.avatar_url,
    })),
    databases: databases.map((db: any) => ({
      id: db.id,
      title: db.title?.[0]?.plain_text || "Untitled",
      url: db.url,
      lastEdited: db.last_edited_time,
    })),
    pages: pages.map((p: any) => ({
      id: p.id,
      title: p.properties?.title?.title?.[0]?.plain_text || p.properties?.Name?.title?.[0]?.plain_text || "Untitled",
      url: p.url,
      lastEdited: p.last_edited_time,
    })),
  };
}
