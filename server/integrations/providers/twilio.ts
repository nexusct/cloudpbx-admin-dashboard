const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";

export async function testConnection(accountSid: string, authToken: string): Promise<{ success: boolean; accountName?: string; error?: string }> {
  try {
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const res = await fetch(`${TWILIO_API_BASE}/Accounts/${accountSid}.json`, {
      headers: { "Authorization": `Basic ${credentials}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    return { success: true, accountName: data.friendly_name };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function syncData(accountSid: string, authToken: string): Promise<any> {
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const headers = { "Authorization": `Basic ${credentials}` };

  const [numbersRes, messagesRes, callsRes, accountRes] = await Promise.all([
    fetch(`${TWILIO_API_BASE}/Accounts/${accountSid}/IncomingPhoneNumbers.json?PageSize=100`, { headers }),
    fetch(`${TWILIO_API_BASE}/Accounts/${accountSid}/Messages.json?PageSize=50`, { headers }),
    fetch(`${TWILIO_API_BASE}/Accounts/${accountSid}/Calls.json?PageSize=50`, { headers }),
    fetch(`${TWILIO_API_BASE}/Accounts/${accountSid}/Balance.json`, { headers }),
  ]);

  const numbers = numbersRes.ok ? (await numbersRes.json()).incoming_phone_numbers || [] : [];
  const messages = messagesRes.ok ? (await messagesRes.json()).messages || [] : [];
  const calls = callsRes.ok ? (await callsRes.json()).calls || [] : [];
  let balance = null;
  if (accountRes.ok) {
    const b = await accountRes.json();
    balance = { currency: b.currency, amount: b.balance };
  }

  return {
    phoneNumbers: numbers.map((n: any) => ({
      sid: n.sid,
      phoneNumber: n.phone_number,
      friendlyName: n.friendly_name,
      capabilities: n.capabilities,
      smsEnabled: n.capabilities?.sms,
      voiceEnabled: n.capabilities?.voice,
      faxEnabled: n.capabilities?.fax,
      status: n.status,
    })),
    recentMessages: messages.map((m: any) => ({
      sid: m.sid,
      from: m.from,
      to: m.to,
      body: m.body?.substring(0, 100),
      status: m.status,
      direction: m.direction,
      dateSent: m.date_sent,
    })),
    recentCalls: calls.map((c: any) => ({
      sid: c.sid,
      from: c.from,
      to: c.to,
      status: c.status,
      direction: c.direction,
      duration: c.duration,
      startTime: c.start_time,
    })),
    balance,
  };
}

export async function sendSms(accountSid: string, authToken: string, from: string, to: string, body: string): Promise<any> {
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const res = await fetch(`${TWILIO_API_BASE}/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: from, To: to, Body: body }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to send SMS");
  }
  return res.json();
}

export async function getPhoneNumbers(accountSid: string, authToken: string): Promise<any[]> {
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const res = await fetch(`${TWILIO_API_BASE}/Accounts/${accountSid}/IncomingPhoneNumbers.json?PageSize=100`, {
    headers: { "Authorization": `Basic ${credentials}` },
  });
  if (!res.ok) throw new Error("Failed to fetch phone numbers");
  const data = await res.json();
  return data.incoming_phone_numbers || [];
}
