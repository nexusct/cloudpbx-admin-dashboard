interface UniFiConfig {
  controllerUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  siteId?: string;
}

function getHeaders(config: UniFiConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
  if (config.apiKey) {
    headers["X-API-KEY"] = config.apiKey;
  }
  return headers;
}

function baseUrl(config: UniFiConfig): string {
  const url = config.controllerUrl.replace(/\/+$/, "");
  return url;
}

async function loginWithCredentials(config: UniFiConfig): Promise<string | null> {
  if (!config.username || !config.password) return null;
  try {
    const res = await fetch(`${baseUrl(config)}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: config.username, password: config.password }),
    });
    if (!res.ok) return null;
    const cookies = res.headers.get("set-cookie");
    return cookies || null;
  } catch {
    return null;
  }
}

export async function testConnection(config: UniFiConfig): Promise<{ success: boolean; controllerVersion?: string; siteName?: string; error?: string }> {
  try {
    const headers = getHeaders(config);
    const siteId = config.siteId || "default";

    let cookie: string | null = null;
    if (!config.apiKey && config.username) {
      cookie = await loginWithCredentials(config);
      if (cookie) headers["Cookie"] = cookie;
    }

    const res = await fetch(`${baseUrl(config)}/proxy/network/api/s/${siteId}/stat/sysinfo`, {
      headers,
    });

    if (!res.ok) {
      const altRes = await fetch(`${baseUrl(config)}/api/s/${siteId}/stat/sysinfo`, { headers });
      if (!altRes.ok) throw new Error(`Controller returned ${altRes.status}`);
      const altData = await altRes.json();
      return {
        success: true,
        controllerVersion: altData.data?.[0]?.version || "Unknown",
        siteName: siteId,
      };
    }

    const data = await res.json();
    return {
      success: true,
      controllerVersion: data.data?.[0]?.version || data.meta?.server_version || "Connected",
      siteName: siteId,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSites(config: UniFiConfig): Promise<any[]> {
  const headers = getHeaders(config);
  if (!config.apiKey && config.username) {
    const cookie = await loginWithCredentials(config);
    if (cookie) headers["Cookie"] = cookie;
  }
  try {
    const res = await fetch(`${baseUrl(config)}/proxy/network/api/self/sites`, { headers });
    if (!res.ok) {
      const altRes = await fetch(`${baseUrl(config)}/api/self/sites`, { headers });
      if (!altRes.ok) return [];
      const data = await altRes.json();
      return data.data || [];
    }
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

// ==================== UniFi Network ====================

export async function syncNetwork(config: UniFiConfig): Promise<any> {
  const headers = getHeaders(config);
  const siteId = config.siteId || "default";
  if (!config.apiKey && config.username) {
    const cookie = await loginWithCredentials(config);
    if (cookie) headers["Cookie"] = cookie;
  }
  const base = `${baseUrl(config)}/proxy/network/api/s/${siteId}`;

  const [devicesRes, clientsRes, networksRes, portForwardsRes, firewallRes] = await Promise.allSettled([
    fetch(`${base}/stat/device`, { headers }),
    fetch(`${base}/stat/sta`, { headers }),
    fetch(`${base}/rest/networkconf`, { headers }),
    fetch(`${base}/rest/portforward`, { headers }),
    fetch(`${base}/rest/firewallrule`, { headers }),
  ]);

  const devices = devicesRes.status === "fulfilled" && devicesRes.value.ok ? (await devicesRes.value.json()).data || [] : [];
  const clients = clientsRes.status === "fulfilled" && clientsRes.value.ok ? (await clientsRes.value.json()).data || [] : [];
  const networks = networksRes.status === "fulfilled" && networksRes.value.ok ? (await networksRes.value.json()).data || [] : [];
  const portForwards = portForwardsRes.status === "fulfilled" && portForwardsRes.value.ok ? (await portForwardsRes.value.json()).data || [] : [];
  const firewallRules = firewallRes.status === "fulfilled" && firewallRes.value.ok ? (await firewallRes.value.json()).data || [] : [];

  return {
    devices: devices.map((d: any) => ({
      mac: d.mac,
      name: d.name || d.model,
      model: d.model,
      type: d.type,
      ip: d.ip,
      version: d.version,
      uptime: d.uptime,
      status: d.state === 1 ? "online" : "offline",
      numClients: d.num_sta,
      cpuUsage: d["system-stats"]?.cpu,
      memUsage: d["system-stats"]?.mem,
      txBytes: d.tx_bytes,
      rxBytes: d.rx_bytes,
    })),
    clients: clients.slice(0, 100).map((c: any) => ({
      mac: c.mac,
      hostname: c.hostname || c.name,
      ip: c.ip,
      network: c.network,
      uptime: c.uptime,
      txBytes: c.tx_bytes,
      rxBytes: c.rx_bytes,
      signal: c.signal,
      channel: c.channel,
      isWired: c.is_wired,
    })),
    networks: networks.map((n: any) => ({
      id: n._id,
      name: n.name,
      purpose: n.purpose,
      subnet: n.ip_subnet,
      vlan: n.vlan,
      dhcpEnabled: n.dhcpd_enabled,
      igmpSnooping: n.igmp_snooping,
    })),
    portForwards: portForwards.map((p: any) => ({
      id: p._id,
      name: p.name,
      enabled: p.enabled,
      srcPort: p.src,
      dstPort: p.fwd_port,
      dstIp: p.fwd,
      proto: p.proto,
    })),
    firewallRules: firewallRules.map((f: any) => ({
      id: f._id,
      name: f.name,
      enabled: f.enabled,
      ruleIndex: f.rule_index,
      action: f.action,
      protocol: f.protocol,
    })),
    summary: {
      totalDevices: devices.length,
      totalClients: clients.length,
      totalNetworks: networks.length,
      onlineDevices: devices.filter((d: any) => d.state === 1).length,
    },
  };
}

// ==================== UniFi Voice ====================

export async function syncVoice(config: UniFiConfig): Promise<any> {
  const headers = getHeaders(config);
  const siteId = config.siteId || "default";
  if (!config.apiKey && config.username) {
    const cookie = await loginWithCredentials(config);
    if (cookie) headers["Cookie"] = cookie;
  }
  const base = `${baseUrl(config)}/proxy/talk/api`;

  const [devicesRes, extensionsRes, callLogsRes] = await Promise.allSettled([
    fetch(`${base}/devices`, { headers }),
    fetch(`${base}/extensions`, { headers }),
    fetch(`${base}/cdr?limit=50`, { headers }),
  ]);

  const devices = devicesRes.status === "fulfilled" && devicesRes.value.ok ? await devicesRes.value.json() : [];
  const extensions = extensionsRes.status === "fulfilled" && extensionsRes.value.ok ? await extensionsRes.value.json() : [];
  const callLogs = callLogsRes.status === "fulfilled" && callLogsRes.value.ok ? await callLogsRes.value.json() : [];

  const devList = Array.isArray(devices) ? devices : devices.data || [];
  const extList = Array.isArray(extensions) ? extensions : extensions.data || [];
  const cdrList = Array.isArray(callLogs) ? callLogs : callLogs.data || [];

  return {
    devices: devList.map((d: any) => ({
      id: d._id || d.id,
      mac: d.mac,
      name: d.name,
      model: d.model,
      extension: d.extension,
      status: d.status || (d.registered ? "registered" : "offline"),
      firmware: d.version || d.firmware,
      ip: d.ip,
    })),
    extensions: extList.map((e: any) => ({
      id: e._id || e.id,
      number: e.extension || e.number,
      name: e.name,
      type: e.type,
      status: e.status,
      voicemailEnabled: e.voicemail_enabled,
      callForwarding: e.call_forwarding,
    })),
    callLogs: cdrList.slice(0, 50).map((c: any) => ({
      id: c._id || c.id,
      from: c.src || c.caller,
      to: c.dst || c.callee,
      duration: c.duration || c.billsec,
      direction: c.direction,
      status: c.disposition || c.status,
      timestamp: c.start || c.timestamp,
    })),
    summary: {
      totalDevices: devList.length,
      totalExtensions: extList.length,
      recentCalls: cdrList.length,
    },
  };
}

// ==================== UniFi Access ====================

export async function syncAccess(config: UniFiConfig): Promise<any> {
  const headers = getHeaders(config);
  if (!config.apiKey && config.username) {
    const cookie = await loginWithCredentials(config);
    if (cookie) headers["Cookie"] = cookie;
  }
  const base = `${baseUrl(config)}/proxy/access/api/v2`;

  const [doorsRes, usersRes, logsRes, policiesRes] = await Promise.allSettled([
    fetch(`${base}/devices`, { headers }),
    fetch(`${base}/users?limit=100`, { headers }),
    fetch(`${base}/device/logs?limit=50`, { headers }),
    fetch(`${base}/access_policies`, { headers }),
  ]);

  const doors = doorsRes.status === "fulfilled" && doorsRes.value.ok ? await doorsRes.value.json() : [];
  const users = usersRes.status === "fulfilled" && usersRes.value.ok ? await usersRes.value.json() : [];
  const logs = logsRes.status === "fulfilled" && logsRes.value.ok ? await logsRes.value.json() : [];
  const policies = policiesRes.status === "fulfilled" && policiesRes.value.ok ? await policiesRes.value.json() : [];

  const doorList = Array.isArray(doors) ? doors : doors.data || [];
  const userList = Array.isArray(users) ? users : users.data || [];
  const logList = Array.isArray(logs) ? logs : logs.data || [];
  const policyList = Array.isArray(policies) ? policies : policies.data || [];

  return {
    doors: doorList.map((d: any) => ({
      id: d._id || d.id || d.unique_id,
      name: d.name || d.alias,
      type: d.device_type || d.type,
      status: d.adopted ? "adopted" : "pending",
      location: d.location,
      locked: d.lock_status === "locked",
      firmware: d.firmware || d.version,
    })),
    users: userList.map((u: any) => ({
      id: u._id || u.id,
      name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.name,
      email: u.email,
      status: u.status,
      accessGroups: u.access_groups || [],
      nfcCards: u.nfc_cards?.length || 0,
      pinCodes: u.pin_codes?.length || 0,
    })),
    accessLogs: logList.slice(0, 50).map((l: any) => ({
      id: l._id || l.id,
      event: l.event_type || l.type,
      door: l.door_name || l.device_name,
      user: l.actor_name || l.user_name,
      timestamp: l.timestamp || l.datetime,
      result: l.result || l.event_result,
    })),
    policies: policyList.map((p: any) => ({
      id: p._id || p.id,
      name: p.name,
      schedule: p.schedule_type,
      doors: p.resources?.length || 0,
      users: p.actors?.length || 0,
    })),
    summary: {
      totalDoors: doorList.length,
      totalUsers: userList.length,
      totalPolicies: policyList.length,
      recentEvents: logList.length,
    },
  };
}

// ==================== UniFi Protect ====================

export async function syncProtect(config: UniFiConfig): Promise<any> {
  const headers = getHeaders(config);
  if (!config.apiKey && config.username) {
    const cookie = await loginWithCredentials(config);
    if (cookie) headers["Cookie"] = cookie;
  }
  const base = `${baseUrl(config)}/proxy/protect/api`;

  const [camerasRes, eventsRes, nvrRes, viewerRes] = await Promise.allSettled([
    fetch(`${base}/cameras`, { headers }),
    fetch(`${base}/events?limit=50&orderDirection=DESC`, { headers }),
    fetch(`${base}/nvr`, { headers }),
    fetch(`${base}/viewers`, { headers }),
  ]);

  const cameras = camerasRes.status === "fulfilled" && camerasRes.value.ok ? await camerasRes.value.json() : [];
  const events = eventsRes.status === "fulfilled" && eventsRes.value.ok ? await eventsRes.value.json() : [];
  const nvr = nvrRes.status === "fulfilled" && nvrRes.value.ok ? await nvrRes.value.json() : null;
  const viewers = viewerRes.status === "fulfilled" && viewerRes.value.ok ? await viewerRes.value.json() : [];

  const cameraList = Array.isArray(cameras) ? cameras : [];
  const eventList = Array.isArray(events) ? events : [];
  const viewerList = Array.isArray(viewers) ? viewers : [];

  return {
    cameras: cameraList.map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type || c.modelKey,
      model: c.model,
      status: c.state || (c.isConnected ? "connected" : "disconnected"),
      ip: c.host,
      mac: c.mac,
      firmware: c.firmwareVersion,
      resolution: c.videoMode,
      recording: c.isRecording,
      motionDetection: c.isMotionDetected,
      isDoorbell: c.featureFlags?.isDoorbell,
      hasSmartDetect: c.featureFlags?.hasSmartDetect,
      lastMotion: c.lastMotion,
      uptime: c.upSince,
    })),
    events: eventList.slice(0, 50).map((e: any) => ({
      id: e.id,
      type: e.type,
      camera: e.camera,
      start: e.start,
      end: e.end,
      score: e.score,
      smartDetectTypes: e.smartDetectTypes,
      thumbnail: e.thumbnail ? `${baseUrl(config)}/proxy/protect/api/events/${e.id}/thumbnail` : null,
    })),
    nvr: nvr ? {
      name: nvr.name,
      version: nvr.version,
      uptime: nvr.uptime,
      storageUsed: nvr.storageInfo?.totalSize,
      storageAvailable: nvr.storageInfo?.totalSpaceAvailable,
      recordingRetention: nvr.recordingRetentionDurationMs,
    } : null,
    viewers: viewerList.map((v: any) => ({
      id: v.id,
      name: v.name,
      type: v.type,
      liveviews: v.liveviews?.length || 0,
    })),
    summary: {
      totalCameras: cameraList.length,
      onlineCameras: cameraList.filter((c: any) => c.state === "CONNECTED" || c.isConnected).length,
      recentEvents: eventList.length,
      doorbells: cameraList.filter((c: any) => c.featureFlags?.isDoorbell).length,
      smartDetect: cameraList.filter((c: any) => c.featureFlags?.hasSmartDetect).length,
    },
  };
}
