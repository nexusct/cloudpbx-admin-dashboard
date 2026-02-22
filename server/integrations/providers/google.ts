const GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_API_BASE = "https://www.googleapis.com";
const GOOGLE_PEOPLE_API = "https://people.googleapis.com/v1";

const SCOPES = [
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/admin.directory.user.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

export function getAuthorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_BASE}?${params.toString()}`;
}

export async function exchangeCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Failed to refresh Google token");
  const data = await res.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

export async function testConnection(accessToken: string): Promise<{ success: boolean; email?: string; domain?: string; error?: string }> {
  try {
    const res = await fetch(`${GOOGLE_API_BASE}/oauth2/v2/userinfo`, {
      headers: { "Authorization": `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { success: true, email: data.email, domain: data.hd };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncData(accessToken: string): Promise<any> {
  const headers = { "Authorization": `Bearer ${accessToken}` };

  const [contactsRes, calendarRes, userInfoRes] = await Promise.all([
    fetch(`${GOOGLE_PEOPLE_API}/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations&pageSize=100`, { headers }),
    fetch(`${GOOGLE_API_BASE}/calendar/v3/calendars/primary/events?maxResults=25&orderBy=startTime&singleEvents=true&timeMin=${new Date().toISOString()}`, { headers }),
    fetch(`${GOOGLE_API_BASE}/oauth2/v2/userinfo`, { headers }),
  ]);

  const contacts = contactsRes.ok ? (await contactsRes.json()).connections || [] : [];
  const events = calendarRes.ok ? (await calendarRes.json()).items || [] : [];
  const userInfo = userInfoRes.ok ? await userInfoRes.json() : null;

  return {
    userInfo: userInfo ? {
      email: userInfo.email,
      name: userInfo.name,
      domain: userInfo.hd,
      picture: userInfo.picture,
    } : null,
    contacts: contacts.map((c: any) => ({
      name: c.names?.[0]?.displayName,
      email: c.emailAddresses?.[0]?.value,
      phone: c.phoneNumbers?.[0]?.value,
      organization: c.organizations?.[0]?.name,
    })),
    upcomingEvents: events.map((e: any) => ({
      id: e.id,
      summary: e.summary,
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      attendees: e.attendees?.length || 0,
      meetLink: e.hangoutLink,
    })),
  };
}
