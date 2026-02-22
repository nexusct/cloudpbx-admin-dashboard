const DEFAULT_TIMEOUT = 10000;

interface RCareConfig {
  cubeUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
}

function getHeaders(config: RCareConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  } else if (config.username && config.password) {
    headers["Authorization"] = `Basic ${Buffer.from(`${config.username}:${config.password}`).toString("base64")}`;
  }
  return headers;
}

function normalizeUrl(cubeUrl: string): string {
  let url = cubeUrl.trim().replace(/\/+$/, "");
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  return url;
}

async function apiRequest(config: RCareConfig, path: string, method: string = "GET", body?: any): Promise<any> {
  const url = `${normalizeUrl(config.cubeUrl)}${path}`;
  const options: RequestInit = {
    method,
    headers: getHeaders(config),
    signal: AbortSignal.timeout(DEFAULT_TIMEOUT),
  };
  if (body && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`RCare API ${method} ${path} failed: ${res.status} ${res.statusText} ${text}`);
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

export async function testConnection(config: RCareConfig): Promise<{ success: boolean; cubeName?: string; error?: string }> {
  try {
    const data = await apiRequest(config, "/api/view/");
    const views = Array.isArray(data) ? data : data?.results || data?.views || [];
    return {
      success: true,
      cubeName: views.length > 0 ? `RCare Cube (${views.length} views)` : "RCare Cube",
    };
  } catch (error: any) {
    try {
      await apiRequest(config, "/api/user/");
      return { success: true, cubeName: "RCare Cube" };
    } catch {
      return { success: false, error: error.message };
    }
  }
}

export async function getViews(config: RCareConfig): Promise<any[]> {
  try {
    const data = await apiRequest(config, "/api/view/");
    return Array.isArray(data) ? data : data?.results || data?.views || [];
  } catch {
    return [];
  }
}

export async function getAlarms(config: RCareConfig, viewId?: string): Promise<any[]> {
  try {
    const path = viewId ? `/api/alarm/?view=${viewId}` : "/api/alarm/";
    const data = await apiRequest(config, path);
    const alarms = Array.isArray(data) ? data : data?.results || data?.alarms || [];
    return alarms.map((a: any) => ({
      id: a.id || a.alarm_id,
      deviceId: a.device_id || a.device,
      deviceName: a.device_name || a.name || `Device ${a.device_id || a.device || "Unknown"}`,
      alarmType: a.alarm_type || a.type || "general",
      priority: a.priority || "normal",
      status: a.status || "active",
      zone: a.zone || a.zone_name || a.location || "",
      room: a.room || a.room_name || "",
      resident: a.resident || a.resident_name || "",
      timestamp: a.timestamp || a.created_at || a.time || new Date().toISOString(),
      acknowledgedBy: a.acknowledged_by || null,
      acknowledgedAt: a.acknowledged_at || null,
      resolvedAt: a.resolved_at || null,
    }));
  } catch {
    return [];
  }
}

export async function getIncidents(config: RCareConfig, viewId?: string): Promise<any[]> {
  try {
    const path = viewId ? `/api/incident/?view=${viewId}` : "/api/incident/";
    const data = await apiRequest(config, path);
    const incidents = Array.isArray(data) ? data : data?.results || data?.incidents || [];
    return incidents.map((i: any) => ({
      id: i.id || i.incident_id,
      title: i.title || i.description || `Incident #${i.id || i.incident_id}`,
      type: i.type || i.incident_type || "nurse_call",
      status: i.status || "open",
      priority: i.priority || "normal",
      zone: i.zone || i.zone_name || "",
      room: i.room || i.room_name || "",
      resident: i.resident || i.resident_name || "",
      assignedTo: i.assigned_to || null,
      createdAt: i.created_at || i.timestamp || new Date().toISOString(),
      updatedAt: i.updated_at || null,
      resolvedAt: i.resolved_at || null,
      notes: i.notes || "",
    }));
  } catch {
    return [];
  }
}

export async function getDevices(config: RCareConfig): Promise<any[]> {
  try {
    const data = await apiRequest(config, "/api/device/");
    const devices = Array.isArray(data) ? data : data?.results || data?.devices || [];
    return devices.map((d: any) => ({
      id: d.id || d.device_id,
      name: d.name || d.device_name || `Device ${d.id || d.device_id}`,
      type: d.type || d.device_type || "pendant",
      zone: d.zone || d.zone_name || "",
      room: d.room || d.room_name || "",
      resident: d.resident || d.resident_name || "",
      status: d.status || "online",
      battery: d.battery || d.battery_level || null,
      lastSeen: d.last_seen || d.last_activity || null,
      signalStrength: d.signal_strength || d.rssi || null,
    }));
  } catch {
    return [];
  }
}

export async function getUsers(config: RCareConfig): Promise<any[]> {
  try {
    const data = await apiRequest(config, "/api/user/");
    const users = Array.isArray(data) ? data : data?.results || data?.users || [];
    return users.map((u: any) => ({
      id: u.id || u.user_id,
      username: u.username || u.name || "",
      role: u.role || u.user_type || "caregiver",
      active: u.active ?? u.is_active ?? true,
      lastLogin: u.last_login || null,
    }));
  } catch {
    return [];
  }
}

export async function acknowledgeAlarm(config: RCareConfig, alarmId: string | number, userId?: string): Promise<any> {
  return apiRequest(config, `/api/alarm/${alarmId}/`, "PUT", {
    status: "acknowledged",
    acknowledged_by: userId || "pbx_system",
    acknowledged_at: new Date().toISOString(),
  });
}

export async function resolveIncident(config: RCareConfig, incidentId: string | number, notes?: string): Promise<any> {
  return apiRequest(config, `/api/incident/${incidentId}/`, "PUT", {
    status: "resolved",
    resolved_at: new Date().toISOString(),
    notes: notes || "",
  });
}

export async function syncData(config: RCareConfig): Promise<any> {
  const [views, alarms, incidents, devices, users] = await Promise.all([
    getViews(config),
    getAlarms(config),
    getIncidents(config),
    getDevices(config),
    getUsers(config),
  ]);

  return {
    views,
    alarms,
    incidents,
    devices,
    users,
    summary: {
      totalViews: views.length,
      activeAlarms: alarms.filter((a: any) => a.status === "active").length,
      openIncidents: incidents.filter((i: any) => i.status === "open").length,
      totalDevices: devices.length,
      onlineDevices: devices.filter((d: any) => d.status === "online").length,
      totalUsers: users.length,
    },
  };
}
