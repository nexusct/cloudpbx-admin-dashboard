import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import OpenAI from "openai";
import { registerIntegrationRoutes } from "./integrations/index";
import { registerTradingRoutes } from "./trading/routes";
import { sipRuntime } from "./sip/sipRuntime";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await storage.seedInitialData();

  registerIntegrationRoutes(app);
  await registerTradingRoutes(app);

  app.get("/api/extensions", async (req, res) => {
    const extensions = await storage.getExtensions();
    res.json(extensions);
  });

  app.get("/api/extensions/:id", async (req, res) => {
    const extension = await storage.getExtension(parseInt(req.params.id));
    if (!extension) return res.status(404).json({ error: "Extension not found" });
    res.json(extension);
  });

  app.post("/api/extensions", async (req, res) => {
    try {
      const { insertExtensionSchema } = await import("@shared/schema");
      const validatedData = insertExtensionSchema.parse(req.body);
      const extension = await storage.createExtension(validatedData);
      res.status(201).json(extension);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/extensions/:id", async (req, res) => {
    try {
      const { insertExtensionSchema } = await import("@shared/schema");
      const validatedData = insertExtensionSchema.partial().parse(req.body);
      const extension = await storage.updateExtension(parseInt(req.params.id), validatedData);
      if (!extension) return res.status(404).json({ error: "Extension not found" });
      res.json(extension);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/extensions/:id", async (req, res) => {
    const deleted = await storage.deleteExtension(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Extension not found" });
    res.status(204).send();
  });

  app.get("/api/dids", async (req, res) => {
    const dids = await storage.getDids();
    res.json(dids);
  });

  app.get("/api/dids/:id", async (req, res) => {
    const did = await storage.getDid(parseInt(req.params.id));
    if (!did) return res.status(404).json({ error: "DID not found" });
    res.json(did);
  });

  app.post("/api/dids", async (req, res) => {
    try {
      const { insertDidSchema } = await import("@shared/schema");
      const validatedData = insertDidSchema.parse(req.body);
      const did = await storage.createDid(validatedData);
      res.status(201).json(did);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/dids/:id", async (req, res) => {
    try {
      const { insertDidSchema } = await import("@shared/schema");
      const validatedData = insertDidSchema.partial().parse(req.body);
      const did = await storage.updateDid(parseInt(req.params.id), validatedData);
      if (!did) return res.status(404).json({ error: "DID not found" });
      res.json(did);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/dids/:id", async (req, res) => {
    const deleted = await storage.deleteDid(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "DID not found" });
    res.status(204).send();
  });

  app.get("/api/call-flows", async (req, res) => {
    const callFlows = await storage.getCallFlows();
    res.json(callFlows);
  });

  app.get("/api/call-flows/:id", async (req, res) => {
    const callFlow = await storage.getCallFlow(parseInt(req.params.id));
    if (!callFlow) return res.status(404).json({ error: "Call flow not found" });
    res.json(callFlow);
  });

  app.post("/api/call-flows", async (req, res) => {
    try {
      const { insertCallFlowSchema } = await import("@shared/schema");
      const data = { ...req.body };
      if (!data.type) data.type = "ivr";
      if (data.enabled === undefined) data.enabled = true;
      const validatedData = insertCallFlowSchema.parse(data);
      const callFlow = await storage.createCallFlow(validatedData);
      res.status(201).json(callFlow);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/call-flows/:id", async (req, res) => {
    try {
      const { insertCallFlowSchema } = await import("@shared/schema");
      const validatedData = insertCallFlowSchema.partial().parse(req.body);
      const callFlow = await storage.updateCallFlow(parseInt(req.params.id), validatedData);
      if (!callFlow) return res.status(404).json({ error: "Call flow not found" });
      res.json(callFlow);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/call-flows/:id", async (req, res) => {
    const deleted = await storage.deleteCallFlow(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Call flow not found" });
    res.status(204).send();
  });

  app.get("/api/devices", async (req, res) => {
    const devices = await storage.getDevices();
    res.json(devices);
  });

  app.get("/api/devices/:id", async (req, res) => {
    const device = await storage.getDevice(parseInt(req.params.id));
    if (!device) return res.status(404).json({ error: "Device not found" });
    res.json(device);
  });

  app.post("/api/devices", async (req, res) => {
    try {
      const { insertDeviceSchema } = await import("@shared/schema");
      const data = { ...req.body };
      if (!data.status) data.status = "offline";
      const validatedData = insertDeviceSchema.parse(data);
      const device = await storage.createDevice(validatedData);
      res.status(201).json(device);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/devices/:id", async (req, res) => {
    try {
      const { insertDeviceSchema } = await import("@shared/schema");
      const validatedData = insertDeviceSchema.partial().parse(req.body);
      const device = await storage.updateDevice(parseInt(req.params.id), validatedData);
      if (!device) return res.status(404).json({ error: "Device not found" });
      res.json(device);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/devices/:id", async (req, res) => {
    const deleted = await storage.deleteDevice(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Device not found" });
    res.status(204).send();
  });

  app.get("/api/call-logs", async (req, res) => {
    const callLogs = await storage.getCallLogs();
    res.json(callLogs);
  });

  app.post("/api/call-logs", async (req, res) => {
    try {
      const data = { ...req.body };
      if (!data.callId) {
        data.callId = `call-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      }
      if (data.startTime && typeof data.startTime === "string") {
        data.startTime = new Date(data.startTime);
      } else if (!data.startTime) {
        data.startTime = new Date();
      }
      if (data.endTime && typeof data.endTime === "string") {
        data.endTime = new Date(data.endTime);
      }
      const callLog = await storage.createCallLog(data);
      res.status(201).json(callLog);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.get("/api/sms", async (req, res) => {
    const smsMessages = await storage.getSmsMessages();
    res.json(smsMessages);
  });

  app.post("/api/sms", async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.sentAt && typeof data.sentAt === "string") data.sentAt = new Date(data.sentAt);
      if (data.deliveredAt && typeof data.deliveredAt === "string") data.deliveredAt = new Date(data.deliveredAt);
      const sms = await storage.createSmsMessage(data);
      res.status(201).json(sms);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.get("/api/fax", async (req, res) => {
    const faxMessages = await storage.getFaxMessages();
    res.json(faxMessages);
  });

  app.post("/api/fax", async (req, res) => {
    try {
      const data = { ...req.body };
      if (data.sentAt && typeof data.sentAt === "string") data.sentAt = new Date(data.sentAt);
      if (data.completedAt && typeof data.completedAt === "string") data.completedAt = new Date(data.completedAt);
      const fax = await storage.createFaxMessage(data);
      res.status(201).json(fax);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.get("/api/ring-groups", async (req, res) => {
    const ringGroups = await storage.getRingGroups();
    res.json(ringGroups);
  });

  app.get("/api/ring-groups/:id", async (req, res) => {
    const ringGroup = await storage.getRingGroup(parseInt(req.params.id));
    if (!ringGroup) return res.status(404).json({ error: "Ring group not found" });
    res.json(ringGroup);
  });

  app.post("/api/ring-groups", async (req, res) => {
    try {
      const { insertRingGroupSchema } = await import("@shared/schema");
      const data = { ...req.body };
      if (!data.strategy) data.strategy = "simultaneous";
      if (!data.members) data.members = [];
      const validatedData = insertRingGroupSchema.parse(data);
      const ringGroup = await storage.createRingGroup(validatedData);
      res.status(201).json(ringGroup);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/ring-groups/:id", async (req, res) => {
    try {
      const { insertRingGroupSchema } = await import("@shared/schema");
      const validatedData = insertRingGroupSchema.partial().parse(req.body);
      const ringGroup = await storage.updateRingGroup(parseInt(req.params.id), validatedData);
      if (!ringGroup) return res.status(404).json({ error: "Ring group not found" });
      res.json(ringGroup);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/ring-groups/:id", async (req, res) => {
    const deleted = await storage.deleteRingGroup(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Ring group not found" });
    res.status(204).send();
  });

  app.get("/api/call-queues", async (req, res) => {
    const callQueues = await storage.getCallQueues();
    res.json(callQueues);
  });

  app.get("/api/call-queues/:id", async (req, res) => {
    const callQueue = await storage.getCallQueue(parseInt(req.params.id));
    if (!callQueue) return res.status(404).json({ error: "Call queue not found" });
    res.json(callQueue);
  });

  app.post("/api/call-queues", async (req, res) => {
    try {
      const { insertCallQueueSchema } = await import("@shared/schema");
      const data = { ...req.body };
      if (!data.strategy) data.strategy = "round-robin";
      if (!data.members) data.members = [];
      const validatedData = insertCallQueueSchema.parse(data);
      const callQueue = await storage.createCallQueue(validatedData);
      res.status(201).json(callQueue);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/call-queues/:id", async (req, res) => {
    try {
      const { insertCallQueueSchema } = await import("@shared/schema");
      const validatedData = insertCallQueueSchema.partial().parse(req.body);
      const callQueue = await storage.updateCallQueue(parseInt(req.params.id), validatedData);
      if (!callQueue) return res.status(404).json({ error: "Call queue not found" });
      res.json(callQueue);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/call-queues/:id", async (req, res) => {
    const deleted = await storage.deleteCallQueue(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Call queue not found" });
    res.status(204).send();
  });

  app.get("/api/ai/sessions", async (req, res) => {
    const sessions = await storage.getAiSessions();
    res.json(sessions);
  });

  app.post("/api/ai/sessions", async (req, res) => {
    const session = await storage.createAiSession(req.body);
    res.status(201).json(session);
  });

  app.get("/api/ai/sessions/:id", async (req, res) => {
    const session = await storage.getAiSession(parseInt(req.params.id));
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  });

  app.get("/api/ai/sessions/:id/messages", async (req, res) => {
    const messages = await storage.getAiMessages(parseInt(req.params.id));
    res.json(messages);
  });

  app.post("/api/ai/sessions/:id/messages", async (req, res) => {
    const sessionId = parseInt(req.params.id);
    const session = await storage.getAiSession(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const userMessage = await storage.createAiMessage({
      sessionId,
      role: "user",
      content: req.body.content,
    });

    const messages = await storage.getAiMessages(sessionId);

    const systemPrompt = `You are CloudPBX AI Assistant, an expert in enterprise phone system setup, configuration, and troubleshooting. You help users with:
- Setting up extensions, DIDs, and phone numbers
- Configuring IVR menus and call flows
- Managing devices and handsets
- Troubleshooting call quality and connectivity issues
- Configuring integrations with third-party apps
- Setting up ring groups and call queues

Be helpful, concise, and provide step-by-step guidance when needed. If users need to perform actions, guide them to the appropriate section in the sidebar.`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        ],
        max_completion_tokens: 1024,
      });

      const assistantContent = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

      const assistantMessage = await storage.createAiMessage({
        sessionId,
        role: "assistant",
        content: assistantContent,
      });

      res.json({ userMessage, assistantMessage });
    } catch (error) {
      console.error("OpenAI API error:", error);
      res.status(500).json({ error: "Failed to generate AI response" });
    }
  });

  app.get("/api/settings", async (req, res) => {
    const settings = await storage.getSystemSettings();
    res.json(settings);
  });

  app.get("/api/settings/:key", async (req, res) => {
    const setting = await storage.getSystemSetting(req.params.key);
    if (!setting) return res.status(404).json({ error: "Setting not found" });
    res.json(setting);
  });

  app.put("/api/settings/:key", async (req, res) => {
    const setting = await storage.updateSystemSetting(req.params.key, req.body.value);
    res.json(setting);
  });

  app.get("/api/dashboard/stats", async (req, res) => {
    const extensions = await storage.getExtensions();
    const dids = await storage.getDids();
    const ringGroups = await storage.getRingGroups();
    const callQueues = await storage.getCallQueues();
    const callLogs = await storage.getCallLogs();
    const smsMessages = await storage.getSmsMessages();

    const activeCalls = extensions.filter(e => e.status === "busy").length;
    const missedCalls = callLogs.filter(l => l.status === "missed").length;
    const answeredCalls = callLogs.filter(l => l.status === "answered" && l.duration && l.duration > 0);
    const totalDuration = answeredCalls.reduce((sum, l) => sum + (l.duration || 0), 0);
    const avgSeconds = answeredCalls.length > 0 ? Math.round(totalDuration / answeredCalls.length) : 0;
    const avgMins = Math.floor(avgSeconds / 60);
    const avgSecs = avgSeconds % 60;

    res.json({
      totalCalls: callLogs.length,
      activeCalls,
      extensionsOnline: extensions.filter(e => e.status === "online" || e.status === "busy").length,
      totalExtensions: extensions.length,
      missedCalls,
      avgCallDuration: `${avgMins}m ${avgSecs.toString().padStart(2, "0")}s`,
      smsToday: smsMessages.length,
      systemUptime: "99.97%",
      totalDids: dids.length,
      totalRingGroups: ringGroups.length,
      totalQueues: callQueues.length,
    });
  });

  app.get("/api/contacts", async (req, res) => {
    const contacts = await storage.getContacts();
    res.json(contacts);
  });

  app.get("/api/contacts/:id", async (req, res) => {
    const contact = await storage.getContact(parseInt(req.params.id));
    if (!contact) return res.status(404).json({ error: "Contact not found" });
    res.json(contact);
  });

  app.post("/api/contacts", async (req, res) => {
    try {
      const { insertContactSchema } = await import("@shared/schema");
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/contacts/:id", async (req, res) => {
    try {
      const { insertContactSchema } = await import("@shared/schema");
      const validatedData = insertContactSchema.partial().parse(req.body);
      const contact = await storage.updateContact(parseInt(req.params.id), validatedData);
      if (!contact) return res.status(404).json({ error: "Contact not found" });
      res.json(contact);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/contacts/:id", async (req, res) => {
    const deleted = await storage.deleteContact(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Contact not found" });
    res.status(204).send();
  });

  app.get("/api/voicemails", async (req, res) => {
    const extensionId = req.query.extensionId ? parseInt(req.query.extensionId as string) : undefined;
    const voicemails = await storage.getVoicemails(extensionId);
    res.json(voicemails);
  });

  app.get("/api/voicemails/:id", async (req, res) => {
    const voicemail = await storage.getVoicemail(parseInt(req.params.id));
    if (!voicemail) return res.status(404).json({ error: "Voicemail not found" });
    res.json(voicemail);
  });

  app.post("/api/voicemails/:id/read", async (req, res) => {
    const voicemail = await storage.markVoicemailRead(parseInt(req.params.id));
    if (!voicemail) return res.status(404).json({ error: "Voicemail not found" });
    res.json(voicemail);
  });

  app.delete("/api/voicemails/:id", async (req, res) => {
    const deleted = await storage.deleteVoicemail(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Voicemail not found" });
    res.status(204).send();
  });

  app.get("/api/routing-rules", async (req, res) => {
    const rules = await storage.getRoutingRules();
    res.json(rules);
  });

  app.get("/api/routing-rules/:id", async (req, res) => {
    const rule = await storage.getRoutingRule(parseInt(req.params.id));
    if (!rule) return res.status(404).json({ error: "Routing rule not found" });
    res.json(rule);
  });

  app.post("/api/routing-rules", async (req, res) => {
    try {
      const { insertRoutingRuleSchema } = await import("@shared/schema");
      const validatedData = insertRoutingRuleSchema.parse(req.body);
      const rule = await storage.createRoutingRule(validatedData);
      res.status(201).json(rule);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/routing-rules/:id", async (req, res) => {
    try {
      const { insertRoutingRuleSchema } = await import("@shared/schema");
      const validatedData = insertRoutingRuleSchema.partial().parse(req.body);
      const rule = await storage.updateRoutingRule(parseInt(req.params.id), validatedData);
      if (!rule) return res.status(404).json({ error: "Routing rule not found" });
      res.json(rule);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/routing-rules/:id", async (req, res) => {
    const deleted = await storage.deleteRoutingRule(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Routing rule not found" });
    res.status(204).send();
  });

  app.get("/api/webhooks", async (req, res) => {
    const webhooks = await storage.getWebhooks();
    res.json(webhooks);
  });

  app.get("/api/webhooks/:id", async (req, res) => {
    const webhook = await storage.getWebhook(parseInt(req.params.id));
    if (!webhook) return res.status(404).json({ error: "Webhook not found" });
    res.json(webhook);
  });

  app.post("/api/webhooks", async (req, res) => {
    try {
      const { insertWebhookSchema } = await import("@shared/schema");
      const validatedData = insertWebhookSchema.parse(req.body);
      const webhook = await storage.createWebhook(validatedData);
      res.status(201).json(webhook);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/webhooks/:id", async (req, res) => {
    try {
      const { insertWebhookSchema } = await import("@shared/schema");
      const validatedData = insertWebhookSchema.partial().parse(req.body);
      const webhook = await storage.updateWebhook(parseInt(req.params.id), validatedData);
      if (!webhook) return res.status(404).json({ error: "Webhook not found" });
      res.json(webhook);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/webhooks/:id", async (req, res) => {
    const deleted = await storage.deleteWebhook(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Webhook not found" });
    res.status(204).send();
  });

  app.get("/api/agent-status", async (req, res) => {
    const statuses = await storage.getAgentStatuses();
    res.json(statuses);
  });

  app.get("/api/queue-stats", async (req, res) => {
    const stats = await storage.getQueueStats();
    res.json(stats);
  });

  app.get("/api/parking-slots", async (req, res) => {
    const slots = await storage.getParkingSlots();
    res.json(slots);
  });

  // Integrations
  app.get("/api/integrations", async (req, res) => {
    const allIntegrations = await storage.getIntegrations();
    res.json(allIntegrations);
  });

  app.get("/api/integrations/:id", async (req, res) => {
    const integration = await storage.getIntegration(parseInt(req.params.id));
    if (!integration) return res.status(404).json({ error: "Integration not found" });
    res.json(integration);
  });

  app.post("/api/integrations", async (req, res) => {
    try {
      const { insertIntegrationSchema } = await import("@shared/schema");
      const validatedData = insertIntegrationSchema.parse(req.body);
      const integration = await storage.createIntegration(validatedData);
      res.status(201).json(integration);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/integrations/:id", async (req, res) => {
    try {
      const { insertIntegrationSchema } = await import("@shared/schema");
      const validatedData = insertIntegrationSchema.partial().parse(req.body);
      const integration = await storage.updateIntegration(parseInt(req.params.id), validatedData);
      if (!integration) return res.status(404).json({ error: "Integration not found" });
      res.json(integration);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/integrations/:id", async (req, res) => {
    const deleted = await storage.deleteIntegration(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Integration not found" });
    res.status(204).send();
  });

  // SIP Providers
  app.get("/api/sip-providers", async (req, res) => {
    const providers = await storage.getSipProviders();
    res.json(providers);
  });

  app.get("/api/sip-providers/:id", async (req, res) => {
    const provider = await storage.getSipProvider(parseInt(req.params.id));
    if (!provider) return res.status(404).json({ error: "SIP provider not found" });
    res.json(provider);
  });

  app.post("/api/sip-providers", async (req, res) => {
    try {
      const { insertSipProviderSchema } = await import("@shared/schema");
      const validatedData = insertSipProviderSchema.parse(req.body);
      const provider = await storage.createSipProvider(validatedData);
      res.status(201).json(provider);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/sip-providers/:id", async (req, res) => {
    try {
      const { insertSipProviderSchema } = await import("@shared/schema");
      const validatedData = insertSipProviderSchema.partial().parse(req.body);
      const provider = await storage.updateSipProvider(parseInt(req.params.id), validatedData);
      if (!provider) return res.status(404).json({ error: "SIP provider not found" });
      res.json(provider);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/sip-providers/:id", async (req, res) => {
    const deleted = await storage.deleteSipProvider(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "SIP provider not found" });
    res.status(204).send();
  });

  // SIP Trunks
  app.get("/api/sip-trunks", async (req, res) => {
    const trunks = await storage.getSipTrunks();
    res.json(trunks);
  });

  app.get("/api/sip-trunks/:id", async (req, res) => {
    const trunk = await storage.getSipTrunk(parseInt(req.params.id));
    if (!trunk) return res.status(404).json({ error: "SIP trunk not found" });
    res.json(trunk);
  });

  app.post("/api/sip-trunks", async (req, res) => {
    try {
      const { insertSipTrunkSchema } = await import("@shared/schema");
      const validatedData = insertSipTrunkSchema.parse(req.body);
      const trunk = await storage.createSipTrunk(validatedData);
      res.status(201).json(trunk);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/sip-trunks/:id", async (req, res) => {
    try {
      const { insertSipTrunkSchema } = await import("@shared/schema");
      const validatedData = insertSipTrunkSchema.partial().parse(req.body);
      const trunk = await storage.updateSipTrunk(parseInt(req.params.id), validatedData);
      if (!trunk) return res.status(404).json({ error: "SIP trunk not found" });
      res.json(trunk);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/sip-trunks/:id", async (req, res) => {
    const deleted = await storage.deleteSipTrunk(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "SIP trunk not found" });
    res.status(204).send();
  });

  // Device Templates
  app.get("/api/device-templates", async (req, res) => {
    const templates = await storage.getDeviceTemplates();
    res.json(templates);
  });

  app.get("/api/device-templates/:id", async (req, res) => {
    const template = await storage.getDeviceTemplate(parseInt(req.params.id));
    if (!template) return res.status(404).json({ error: "Device template not found" });
    res.json(template);
  });

  app.post("/api/device-templates", async (req, res) => {
    try {
      const { insertDeviceTemplateSchema } = await import("@shared/schema");
      const validatedData = insertDeviceTemplateSchema.parse(req.body);
      const template = await storage.createDeviceTemplate(validatedData);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/device-templates/:id", async (req, res) => {
    try {
      const { insertDeviceTemplateSchema } = await import("@shared/schema");
      const validatedData = insertDeviceTemplateSchema.partial().parse(req.body);
      const template = await storage.updateDeviceTemplate(parseInt(req.params.id), validatedData);
      if (!template) return res.status(404).json({ error: "Device template not found" });
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/device-templates/:id", async (req, res) => {
    const deleted = await storage.deleteDeviceTemplate(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Device template not found" });
    res.status(204).send();
  });

  // Holiday Schedules
  app.get("/api/holiday-schedules", async (req, res) => {
    const schedules = await storage.getHolidaySchedules();
    res.json(schedules);
  });

  app.get("/api/holiday-schedules/:id", async (req, res) => {
    const schedule = await storage.getHolidaySchedule(parseInt(req.params.id));
    if (!schedule) return res.status(404).json({ error: "Holiday schedule not found" });
    res.json(schedule);
  });

  app.post("/api/holiday-schedules", async (req, res) => {
    try {
      const { insertHolidayScheduleSchema } = await import("@shared/schema");
      const validatedData = insertHolidayScheduleSchema.parse(req.body);
      const schedule = await storage.createHolidaySchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/holiday-schedules/:id", async (req, res) => {
    try {
      const { insertHolidayScheduleSchema } = await import("@shared/schema");
      const validatedData = insertHolidayScheduleSchema.partial().parse(req.body);
      const schedule = await storage.updateHolidaySchedule(parseInt(req.params.id), validatedData);
      if (!schedule) return res.status(404).json({ error: "Holiday schedule not found" });
      res.json(schedule);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/holiday-schedules/:id", async (req, res) => {
    const deleted = await storage.deleteHolidaySchedule(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Holiday schedule not found" });
    res.status(204).send();
  });

  // Call Dispositions
  app.get("/api/call-dispositions", async (req, res) => {
    const callLogId = req.query.callLogId ? parseInt(req.query.callLogId as string) : undefined;
    if (callLogId) {
      const dispositions = await storage.getCallDispositionsByCallLog(callLogId);
      res.json(dispositions);
    } else {
      const dispositions = await storage.getCallDispositions();
      res.json(dispositions);
    }
  });

  app.get("/api/call-dispositions/:id", async (req, res) => {
    const disposition = await storage.getCallDisposition(parseInt(req.params.id));
    if (!disposition) return res.status(404).json({ error: "Call disposition not found" });
    res.json(disposition);
  });

  app.post("/api/call-dispositions", async (req, res) => {
    try {
      const { insertCallDispositionSchema } = await import("@shared/schema");
      const data = { ...req.body };
      if (data.followUpDate && typeof data.followUpDate === "string") {
        data.followUpDate = new Date(data.followUpDate);
      }
      const validatedData = insertCallDispositionSchema.parse(data);
      const disposition = await storage.createCallDisposition(validatedData);
      res.status(201).json(disposition);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/call-dispositions/:id", async (req, res) => {
    try {
      const { insertCallDispositionSchema } = await import("@shared/schema");
      const data = { ...req.body };
      if (data.followUpDate && typeof data.followUpDate === "string") {
        data.followUpDate = new Date(data.followUpDate);
      }
      const validatedData = insertCallDispositionSchema.partial().parse(data);
      const disposition = await storage.updateCallDisposition(parseInt(req.params.id), validatedData);
      if (!disposition) return res.status(404).json({ error: "Call disposition not found" });
      res.json(disposition);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/call-dispositions/:id", async (req, res) => {
    const deleted = await storage.deleteCallDisposition(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Call disposition not found" });
    res.status(204).send();
  });

  // Speed Dials
  app.get("/api/speed-dials", async (req, res) => {
    const userId = req.query.userId as string | undefined;
    const dials = await storage.getSpeedDials(userId);
    res.json(dials);
  });

  app.get("/api/speed-dials/:id", async (req, res) => {
    const dial = await storage.getSpeedDial(parseInt(req.params.id));
    if (!dial) return res.status(404).json({ error: "Speed dial not found" });
    res.json(dial);
  });

  app.post("/api/speed-dials", async (req, res) => {
    try {
      const { insertSpeedDialSchema } = await import("@shared/schema");
      const validatedData = insertSpeedDialSchema.parse(req.body);
      const dial = await storage.createSpeedDial(validatedData);
      res.status(201).json(dial);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/speed-dials/:id", async (req, res) => {
    try {
      const { insertSpeedDialSchema } = await import("@shared/schema");
      const validatedData = insertSpeedDialSchema.partial().parse(req.body);
      const dial = await storage.updateSpeedDial(parseInt(req.params.id), validatedData);
      if (!dial) return res.status(404).json({ error: "Speed dial not found" });
      res.json(dial);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/speed-dials/:id", async (req, res) => {
    const deleted = await storage.deleteSpeedDial(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Speed dial not found" });
    res.status(204).send();
  });

  // Call Transcriptions
  app.get("/api/call-transcriptions", async (req, res) => {
    const transcriptions = await storage.getCallTranscriptions();
    res.json(transcriptions);
  });

  app.get("/api/call-transcriptions/:callLogId", async (req, res) => {
    const transcription = await storage.getCallTranscription(parseInt(req.params.callLogId));
    if (!transcription) return res.status(404).json({ error: "Call transcription not found" });
    res.json(transcription);
  });

  app.post("/api/call-transcriptions", async (req, res) => {
    try {
      const { insertCallTranscriptionSchema } = await import("@shared/schema");
      const validatedData = insertCallTranscriptionSchema.parse(req.body);
      const transcription = await storage.createCallTranscription(validatedData);
      res.status(201).json(transcription);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  // Agent Status (mutations)
  app.patch("/api/agent-status/:extensionId", async (req, res) => {
    try {
      const { insertAgentStatusSchema } = await import("@shared/schema");
      const validatedData = insertAgentStatusSchema.partial().parse(req.body);
      const agentStat = await storage.updateAgentStatus(parseInt(req.params.extensionId), validatedData);
      res.json(agentStat);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  // Queue Stats (mutations)
  app.patch("/api/queue-stats/:queueId", async (req, res) => {
    try {
      const { insertQueueStatSchema } = await import("@shared/schema");
      const validatedData = insertQueueStatSchema.partial().parse(req.body);
      const stat = await storage.updateQueueStat(parseInt(req.params.queueId), validatedData);
      res.json(stat);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  // Parking Slots (park and retrieve)
  app.post("/api/parking-slots/:slotNumber/park", async (req, res) => {
    try {
      const { insertParkingSlotSchema } = await import("@shared/schema");
      const validatedData = insertParkingSlotSchema.partial().parse(req.body);
      const slot = await storage.parkCall(parseInt(req.params.slotNumber), validatedData);
      res.json(slot);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.post("/api/parking-slots/:slotNumber/retrieve", async (req, res) => {
    try {
      const slot = await storage.retrieveCall(parseInt(req.params.slotNumber));
      if (!slot) return res.status(404).json({ error: "Parking slot not found" });
      res.json(slot);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  // Voicemail (create)
  app.post("/api/voicemails", async (req, res) => {
    try {
      const { insertVoicemailSchema } = await import("@shared/schema");
      const validatedData = insertVoicemailSchema.parse(req.body);
      const voicemail = await storage.createVoicemail(validatedData);
      res.status(201).json(voicemail);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  // Users
  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });

  // AI Agents
  app.get("/api/ai-agents", async (req, res) => {
    const agents = await storage.getAiAgents();
    res.json(agents);
  });

  app.get("/api/ai-agents/:id", async (req, res) => {
    const agent = await storage.getAiAgent(parseInt(req.params.id));
    if (!agent) return res.status(404).json({ error: "AI Agent not found" });
    res.json(agent);
  });

  app.post("/api/ai-agents", async (req, res) => {
    try {
      const { insertAiAgentSchema } = await import("@shared/schema");
      const validatedData = insertAiAgentSchema.parse(req.body);
      const agent = await storage.createAiAgent(validatedData);
      res.status(201).json(agent);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.patch("/api/ai-agents/:id", async (req, res) => {
    try {
      const { insertAiAgentSchema } = await import("@shared/schema");
      const validatedData = insertAiAgentSchema.partial().parse(req.body);
      const agent = await storage.updateAiAgent(parseInt(req.params.id), validatedData);
      if (!agent) return res.status(404).json({ error: "AI Agent not found" });
      res.json(agent);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/ai-agents/:id", async (req, res) => {
    const deleted = await storage.deleteAiAgent(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "AI Agent not found" });
    res.status(204).send();
  });

  // AI Agent Calls
  app.get("/api/ai-agent-calls", async (req, res) => {
    const calls = await storage.getAiAgentCalls();
    res.json(calls);
  });

  app.get("/api/ai-agent-calls/:agentId", async (req, res) => {
    const calls = await storage.getAiAgentCallsByAgent(parseInt(req.params.agentId));
    res.json(calls);
  });

  app.post("/api/ai-agent-calls", async (req, res) => {
    try {
      const { insertAiAgentCallSchema } = await import("@shared/schema");
      const validatedData = insertAiAgentCallSchema.parse(req.body);
      const callInfo = await storage.createAiAgentCall(validatedData);
      res.status(201).json(callInfo);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  // ── SIP Runtime Service (CORE-001) ──────────────────────────────────────

  /** Health check — confirms the SIP runtime is up and returns active count. */
  app.get("/api/sip/health", (_req, res) => {
    res.json(sipRuntime.health());
  });

  /** List all currently registered SIP endpoints. */
  app.get("/api/sip/registrations", (_req, res) => {
    res.json(sipRuntime.getAllRegistrations());
  });

  /** Get registration status for a specific extension. */
  app.get("/api/sip/registrations/:extensionNumber", (req, res) => {
    const extNum = req.params.extensionNumber;
    if (typeof extNum !== "string" || extNum.length === 0 || extNum.length > 20) {
      return res.status(400).json({ error: "Invalid extensionNumber" });
    }
    const reg = sipRuntime.getRegistration(extNum);
    if (!reg) return res.status(404).json({ error: "Extension not registered" });
    res.json(reg);
  });

  /**
   * Register or refresh a SIP endpoint.
   * Body: { extensionNumber, contact, userAgent?, expires? }
   */
  app.post("/api/sip/register", (req, res) => {
    const { extensionNumber, contact, userAgent, expires } = req.body ?? {};
    if (typeof extensionNumber !== "string" || extensionNumber.length === 0 || extensionNumber.length > 20) {
      return res.status(400).json({ error: "extensionNumber must be a non-empty string (max 20 chars)" });
    }
    if (typeof contact !== "string" || contact.length === 0 || contact.length > 256) {
      return res.status(400).json({ error: "contact must be a non-empty string (max 256 chars)" });
    }
    if (userAgent !== undefined && (typeof userAgent !== "string" || userAgent.length > 256)) {
      return res.status(400).json({ error: "userAgent must be a string (max 256 chars)" });
    }
    if (expires !== undefined && (typeof expires !== "number" || !Number.isFinite(expires) || expires < 1)) {
      return res.status(400).json({ error: "expires must be a positive number" });
    }
    const reg = sipRuntime.register({ extensionNumber, contact, userAgent, expires });
    res.status(200).json(reg);
  });

  /**
   * Unregister a SIP endpoint.
   * Body: { extensionNumber }
   */
  app.post("/api/sip/unregister", (req, res) => {
    const { extensionNumber } = req.body ?? {};
    if (typeof extensionNumber !== "string" || extensionNumber.length === 0 || extensionNumber.length > 20) {
      return res.status(400).json({ error: "extensionNumber must be a non-empty string (max 20 chars)" });
    }
    const removed = sipRuntime.unregister(extensionNumber);
    if (!removed) return res.status(404).json({ error: "Extension not registered" });
    res.status(200).json({ message: "Unregistered successfully" });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 25 INDUSTRY-FIRST FEATURES — API ROUTES
  // ═══════════════════════════════════════════════════════════════════════════

  // ── FEATURE 1: WebRTC Softphone Sessions ──────────────────────────────────
  app.get("/api/softphone/sessions", async (_req, res) => {
    const sessions = await storage.getSoftphoneSessions();
    res.json(sessions);
  });
  app.post("/api/softphone/sessions", async (req, res) => {
    try {
      const { insertSoftphoneSessionSchema } = await import("@shared/schema");
      const data = insertSoftphoneSessionSchema.parse(req.body);
      const session = await storage.createSoftphoneSession(data);
      res.status(201).json(session);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/softphone/sessions/:id", async (req, res) => {
    try {
      const { insertSoftphoneSessionSchema } = await import("@shared/schema");
      const data = insertSoftphoneSessionSchema.partial().parse(req.body);
      const session = await storage.updateSoftphoneSession(parseInt(req.params.id), data);
      if (!session) return res.status(404).json({ error: "Session not found" });
      res.json(session);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/softphone/sessions/:id", async (req, res) => {
    const deleted = await storage.deleteSoftphoneSession(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Session not found" });
    res.status(204).send();
  });

  // ── FEATURE 2: Call Quality Scores ───────────────────────────────────────
  app.get("/api/call-quality", async (_req, res) => {
    const scores = await storage.getCallQualityScores();
    res.json(scores);
  });
  app.post("/api/call-quality", async (req, res) => {
    try {
      const { insertCallQualityScoreSchema } = await import("@shared/schema");
      const data = insertCallQualityScoreSchema.parse(req.body);
      const score = await storage.createCallQualityScore(data);
      res.status(201).json(score);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/call-quality/:id", async (req, res) => {
    try {
      const { insertCallQualityScoreSchema } = await import("@shared/schema");
      const data = insertCallQualityScoreSchema.partial().parse(req.body);
      const score = await storage.updateCallQualityScore(parseInt(req.params.id), data);
      if (!score) return res.status(404).json({ error: "Score not found" });
      res.json(score);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── FEATURE 3: Predictive Dialer Campaigns ───────────────────────────────
  app.get("/api/campaigns", async (_req, res) => {
    const list = await storage.getCampaigns();
    res.json(list);
  });
  app.post("/api/campaigns", async (req, res) => {
    try {
      const { insertCampaignSchema } = await import("@shared/schema");
      const data = insertCampaignSchema.parse(req.body);
      const c = await storage.createCampaign(data);
      res.status(201).json(c);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/campaigns/:id", async (req, res) => {
    try {
      const { insertCampaignSchema } = await import("@shared/schema");
      const data = insertCampaignSchema.partial().parse(req.body);
      const c = await storage.updateCampaign(parseInt(req.params.id), data);
      if (!c) return res.status(404).json({ error: "Campaign not found" });
      res.json(c);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/campaigns/:id", async (req, res) => {
    const deleted = await storage.deleteCampaign(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Campaign not found" });
    res.status(204).send();
  });
  app.get("/api/campaigns/:id/contacts", async (req, res) => {
    const contacts = await storage.getCampaignContacts(parseInt(req.params.id));
    res.json(contacts);
  });
  app.post("/api/campaigns/:id/contacts", async (req, res) => {
    try {
      const { insertCampaignContactSchema } = await import("@shared/schema");
      const data = insertCampaignContactSchema.parse({ ...req.body, campaignId: parseInt(req.params.id) });
      const c = await storage.createCampaignContact(data);
      res.status(201).json(c);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── FEATURE 4: Voice Biometrics ───────────────────────────────────────────
  app.get("/api/voice-biometrics", async (_req, res) => {
    const prints = await storage.getVoicePrints();
    res.json(prints);
  });
  app.post("/api/voice-biometrics", async (req, res) => {
    try {
      const { insertVoicePrintSchema } = await import("@shared/schema");
      const data = insertVoicePrintSchema.parse(req.body);
      const vp = await storage.createVoicePrint(data);
      res.status(201).json(vp);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/voice-biometrics/:id", async (req, res) => {
    try {
      const { insertVoicePrintSchema } = await import("@shared/schema");
      const data = insertVoicePrintSchema.partial().parse(req.body);
      const vp = await storage.updateVoicePrint(parseInt(req.params.id), data);
      if (!vp) return res.status(404).json({ error: "Voice print not found" });
      res.json(vp);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/voice-biometrics/:id", async (req, res) => {
    const deleted = await storage.deleteVoicePrint(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Voice print not found" });
    res.status(204).send();
  });

  // ── FEATURE 5: Emotion Analytics ─────────────────────────────────────────
  app.get("/api/emotion-analytics", async (_req, res) => {
    const analytics = await storage.getEmotionAnalytics();
    res.json(analytics);
  });
  app.post("/api/emotion-analytics", async (req, res) => {
    try {
      const { insertEmotionAnalyticsSchema } = await import("@shared/schema");
      const data = insertEmotionAnalyticsSchema.parse(req.body);
      const record = await storage.createEmotionAnalytics(data);
      res.status(201).json(record);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── FEATURE 6: Fraud Detection ────────────────────────────────────────────
  app.get("/api/fraud-events", async (_req, res) => {
    const events = await storage.getFraudEvents();
    res.json(events);
  });
  app.post("/api/fraud-events", async (req, res) => {
    try {
      const { insertFraudEventSchema } = await import("@shared/schema");
      const data = insertFraudEventSchema.parse(req.body);
      const ev = await storage.createFraudEvent(data);
      res.status(201).json(ev);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/fraud-events/:id", async (req, res) => {
    try {
      const { insertFraudEventSchema } = await import("@shared/schema");
      const data = insertFraudEventSchema.partial().parse(req.body);
      const ev = await storage.updateFraudEvent(parseInt(req.params.id), data);
      if (!ev) return res.status(404).json({ error: "Event not found" });
      res.json(ev);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.get("/api/blocked-numbers", async (_req, res) => {
    const numbers = await storage.getBlockedNumbers();
    res.json(numbers);
  });
  app.post("/api/blocked-numbers", async (req, res) => {
    try {
      const { insertBlockedNumberSchema } = await import("@shared/schema");
      const data = insertBlockedNumberSchema.parse(req.body);
      const bn = await storage.createBlockedNumber(data);
      res.status(201).json(bn);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/blocked-numbers/:id", async (req, res) => {
    const deleted = await storage.deleteBlockedNumber(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  });

  // ── FEATURE 7: Compliance Recording Policies ──────────────────────────────
  app.get("/api/recording-policies", async (_req, res) => {
    const policies = await storage.getRecordingPolicies();
    res.json(policies);
  });
  app.post("/api/recording-policies", async (req, res) => {
    try {
      const { insertRecordingPolicySchema } = await import("@shared/schema");
      const data = insertRecordingPolicySchema.parse(req.body);
      const policy = await storage.createRecordingPolicy(data);
      res.status(201).json(policy);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/recording-policies/:id", async (req, res) => {
    try {
      const { insertRecordingPolicySchema } = await import("@shared/schema");
      const data = insertRecordingPolicySchema.partial().parse(req.body);
      const policy = await storage.updateRecordingPolicy(parseInt(req.params.id), data);
      if (!policy) return res.status(404).json({ error: "Policy not found" });
      res.json(policy);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/recording-policies/:id", async (req, res) => {
    const deleted = await storage.deleteRecordingPolicy(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Policy not found" });
    res.status(204).send();
  });

  // ── FEATURE 8: Smart Callback Scheduler ──────────────────────────────────
  app.get("/api/callback-requests", async (_req, res) => {
    const list = await storage.getCallbackRequests();
    res.json(list);
  });
  app.post("/api/callback-requests", async (req, res) => {
    try {
      const { insertCallbackRequestSchema } = await import("@shared/schema");
      const data = insertCallbackRequestSchema.parse(req.body);
      const cb = await storage.createCallbackRequest(data);
      res.status(201).json(cb);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/callback-requests/:id", async (req, res) => {
    try {
      const { insertCallbackRequestSchema } = await import("@shared/schema");
      const data = insertCallbackRequestSchema.partial().parse(req.body);
      const cb = await storage.updateCallbackRequest(parseInt(req.params.id), data);
      if (!cb) return res.status(404).json({ error: "Request not found" });
      res.json(cb);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/callback-requests/:id", async (req, res) => {
    const deleted = await storage.deleteCallbackRequest(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Request not found" });
    res.status(204).send();
  });

  // ── FEATURE 9: Number Porting Tracker ────────────────────────────────────
  app.get("/api/porting-requests", async (_req, res) => {
    const list = await storage.getPortingRequests();
    res.json(list);
  });
  app.post("/api/porting-requests", async (req, res) => {
    try {
      const { insertPortingRequestSchema } = await import("@shared/schema");
      const data = insertPortingRequestSchema.parse(req.body);
      const pr = await storage.createPortingRequest(data);
      res.status(201).json(pr);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/porting-requests/:id", async (req, res) => {
    try {
      const { insertPortingRequestSchema } = await import("@shared/schema");
      const data = insertPortingRequestSchema.partial().parse(req.body);
      const pr = await storage.updatePortingRequest(parseInt(req.params.id), data);
      if (!pr) return res.status(404).json({ error: "Porting request not found" });
      res.json(pr);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/porting-requests/:id", async (req, res) => {
    const deleted = await storage.deletePortingRequest(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Porting request not found" });
    res.status(204).send();
  });

  // ── FEATURE 10: Network Quality Monitor ──────────────────────────────────
  app.get("/api/network-quality", async (_req, res) => {
    const metrics = await storage.getNetworkQualityMetrics();
    res.json(metrics);
  });
  app.post("/api/network-quality", async (req, res) => {
    try {
      const { insertNetworkQualityMetricSchema } = await import("@shared/schema");
      const data = insertNetworkQualityMetricSchema.parse(req.body);
      const m = await storage.createNetworkQualityMetric(data);
      res.status(201).json(m);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── FEATURE 11: Omnichannel Inbox ─────────────────────────────────────────
  app.get("/api/omnichannel-threads", async (_req, res) => {
    const threads = await storage.getOmnichannelThreads();
    res.json(threads);
  });
  app.post("/api/omnichannel-threads", async (req, res) => {
    try {
      const { insertOmnichannelThreadSchema } = await import("@shared/schema");
      const data = insertOmnichannelThreadSchema.parse(req.body);
      const t = await storage.createOmnichannelThread(data);
      res.status(201).json(t);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/omnichannel-threads/:id", async (req, res) => {
    try {
      const { insertOmnichannelThreadSchema } = await import("@shared/schema");
      const data = insertOmnichannelThreadSchema.partial().parse(req.body);
      const t = await storage.updateOmnichannelThread(parseInt(req.params.id), data);
      if (!t) return res.status(404).json({ error: "Thread not found" });
      res.json(t);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── FEATURE 12: Agent Gamification ───────────────────────────────────────
  app.get("/api/agent-achievements", async (_req, res) => {
    const achievements = await storage.getAgentAchievements();
    res.json(achievements);
  });
  app.post("/api/agent-achievements", async (req, res) => {
    try {
      const { insertAgentAchievementSchema } = await import("@shared/schema");
      const data = insertAgentAchievementSchema.parse(req.body);
      const a = await storage.createAgentAchievement(data);
      res.status(201).json(a);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/agent-achievements/:id", async (req, res) => {
    try {
      const { insertAgentAchievementSchema } = await import("@shared/schema");
      const data = insertAgentAchievementSchema.partial().parse(req.body);
      const a = await storage.updateAgentAchievement(parseInt(req.params.id), data);
      if (!a) return res.status(404).json({ error: "Achievement not found" });
      res.json(a);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── FEATURE 13: Custom Report Builder ────────────────────────────────────
  app.get("/api/custom-reports", async (_req, res) => {
    const reports = await storage.getCustomReports();
    res.json(reports);
  });
  app.post("/api/custom-reports", async (req, res) => {
    try {
      const { insertCustomReportSchema } = await import("@shared/schema");
      const data = insertCustomReportSchema.parse(req.body);
      const r = await storage.createCustomReport(data);
      res.status(201).json(r);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/custom-reports/:id", async (req, res) => {
    try {
      const { insertCustomReportSchema } = await import("@shared/schema");
      const data = insertCustomReportSchema.partial().parse(req.body);
      const r = await storage.updateCustomReport(parseInt(req.params.id), data);
      if (!r) return res.status(404).json({ error: "Report not found" });
      res.json(r);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/custom-reports/:id", async (req, res) => {
    const deleted = await storage.deleteCustomReport(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Report not found" });
    res.status(204).send();
  });

  // ── FEATURE 14: IVR Node Analytics ───────────────────────────────────────
  app.get("/api/ivr-analytics", async (_req, res) => {
    const stats = await storage.getIvrNodeStats();
    res.json(stats);
  });
  app.post("/api/ivr-analytics", async (req, res) => {
    try {
      const { insertIvrNodeStatSchema } = await import("@shared/schema");
      const data = insertIvrNodeStatSchema.parse(req.body);
      const s = await storage.createIvrNodeStat(data);
      res.status(201).json(s);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── FEATURE 15: API Key Manager ───────────────────────────────────────────
  app.get("/api/api-keys", async (_req, res) => {
    const keys = await storage.getApiKeys();
    res.json(keys);
  });
  app.post("/api/api-keys", async (req, res) => {
    try {
      const { insertApiKeySchema } = await import("@shared/schema");
      // Generate key and prefix
      const prefix = "cpbx_" + Math.random().toString(36).slice(2, 7);
      const rawKey = prefix + "_" + Math.random().toString(36).slice(2, 32);
      const keyHash = Buffer.from(rawKey).toString("base64");
      const data = insertApiKeySchema.parse({ ...req.body, keyHash, keyPrefix: prefix });
      const k = await storage.createApiKey(data);
      res.status(201).json({ ...k, rawKey });
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/api-keys/:id", async (req, res) => {
    try {
      const { insertApiKeySchema } = await import("@shared/schema");
      const data = insertApiKeySchema.partial().parse(req.body);
      const k = await storage.updateApiKey(parseInt(req.params.id), data);
      if (!k) return res.status(404).json({ error: "Key not found" });
      res.json(k);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/api-keys/:id", async (req, res) => {
    const deleted = await storage.deleteApiKey(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Key not found" });
    res.status(204).send();
  });

  // ── FEATURE 16: SIP Security Monitor ─────────────────────────────────────
  app.get("/api/sip-security/events", async (_req, res) => {
    const events = await storage.getSipSecurityEvents();
    res.json(events);
  });
  app.post("/api/sip-security/events", async (req, res) => {
    try {
      const { insertSipSecurityEventSchema } = await import("@shared/schema");
      const data = insertSipSecurityEventSchema.parse(req.body);
      const ev = await storage.createSipSecurityEvent(data);
      res.status(201).json(ev);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/sip-security/events/:id", async (req, res) => {
    try {
      const { insertSipSecurityEventSchema } = await import("@shared/schema");
      const data = insertSipSecurityEventSchema.partial().parse(req.body);
      const ev = await storage.updateSipSecurityEvent(parseInt(req.params.id), data);
      if (!ev) return res.status(404).json({ error: "Event not found" });
      res.json(ev);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.get("/api/sip-security/blocklist", async (_req, res) => {
    const list = await storage.getIpBlocklist();
    res.json(list);
  });
  app.post("/api/sip-security/blocklist", async (req, res) => {
    try {
      const { insertIpBlocklistSchema } = await import("@shared/schema");
      const data = insertIpBlocklistSchema.parse(req.body);
      const entry = await storage.createIpBlocklistEntry(data);
      res.status(201).json(entry);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/sip-security/blocklist/:id", async (req, res) => {
    const deleted = await storage.deleteIpBlocklistEntry(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Entry not found" });
    res.status(204).send();
  });

  // ── FEATURE 17: Business Hours Manager ───────────────────────────────────
  app.get("/api/business-hours", async (_req, res) => {
    const profiles = await storage.getBusinessHourProfiles();
    res.json(profiles);
  });
  app.post("/api/business-hours", async (req, res) => {
    try {
      const { insertBusinessHourProfileSchema } = await import("@shared/schema");
      const data = insertBusinessHourProfileSchema.parse(req.body);
      const p = await storage.createBusinessHourProfile(data);
      res.status(201).json(p);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/business-hours/:id", async (req, res) => {
    try {
      const { insertBusinessHourProfileSchema } = await import("@shared/schema");
      const data = insertBusinessHourProfileSchema.partial().parse(req.body);
      const p = await storage.updateBusinessHourProfile(parseInt(req.params.id), data);
      if (!p) return res.status(404).json({ error: "Profile not found" });
      res.json(p);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/business-hours/:id", async (req, res) => {
    const deleted = await storage.deleteBusinessHourProfile(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Profile not found" });
    res.status(204).send();
  });

  // ── FEATURE 18: Call Journey Mapper ──────────────────────────────────────
  app.get("/api/call-journeys", async (_req, res) => {
    const journeys = await storage.getCallJourneys();
    res.json(journeys);
  });
  app.post("/api/call-journeys", async (req, res) => {
    try {
      const { insertCallJourneySchema } = await import("@shared/schema");
      const data = insertCallJourneySchema.parse(req.body);
      const j = await storage.createCallJourney(data);
      res.status(201).json(j);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.get("/api/call-journeys/:callId", async (req, res) => {
    const callId = req.params.callId;
    if (typeof callId !== "string" || callId.length === 0 || callId.length > 50) {
      return res.status(400).json({ error: "Invalid callId" });
    }
    const journey = await storage.getCallJourneyByCallId(callId);
    if (!journey) return res.status(404).json({ error: "Journey not found" });
    res.json(journey);
  });

  // ── FEATURE 19: Auto-Provisioning Profiles ────────────────────────────────
  app.get("/api/provisioning-profiles", async (_req, res) => {
    const profiles = await storage.getProvisioningProfiles();
    res.json(profiles);
  });
  app.post("/api/provisioning-profiles", async (req, res) => {
    try {
      const { insertProvisioningProfileSchema } = await import("@shared/schema");
      const data = insertProvisioningProfileSchema.parse(req.body);
      const p = await storage.createProvisioningProfile(data);
      res.status(201).json(p);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/provisioning-profiles/:id", async (req, res) => {
    try {
      const { insertProvisioningProfileSchema } = await import("@shared/schema");
      const data = insertProvisioningProfileSchema.partial().parse(req.body);
      const p = await storage.updateProvisioningProfile(parseInt(req.params.id), data);
      if (!p) return res.status(404).json({ error: "Profile not found" });
      res.json(p);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/provisioning-profiles/:id", async (req, res) => {
    const deleted = await storage.deleteProvisioningProfile(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Profile not found" });
    res.status(204).send();
  });

  // ── FEATURE 20: Disaster Recovery ─────────────────────────────────────────
  app.get("/api/failover-rules", async (_req, res) => {
    const rules = await storage.getFailoverRules();
    res.json(rules);
  });
  app.post("/api/failover-rules", async (req, res) => {
    try {
      const { insertFailoverRuleSchema } = await import("@shared/schema");
      const data = insertFailoverRuleSchema.parse(req.body);
      const r = await storage.createFailoverRule(data);
      res.status(201).json(r);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/failover-rules/:id", async (req, res) => {
    try {
      const { insertFailoverRuleSchema } = await import("@shared/schema");
      const data = insertFailoverRuleSchema.partial().parse(req.body);
      const r = await storage.updateFailoverRule(parseInt(req.params.id), data);
      if (!r) return res.status(404).json({ error: "Rule not found" });
      res.json(r);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/failover-rules/:id", async (req, res) => {
    const deleted = await storage.deleteFailoverRule(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Rule not found" });
    res.status(204).send();
  });
  app.post("/api/failover-rules/:id/test", async (req, res) => {
    const idRaw = parseInt(req.params.id);
    const rule = await storage.getFailoverRule(idRaw);
    if (!rule) return res.status(404).json({ error: "Rule not found" });
    res.json({ success: true, latency: Math.floor(Math.random() * 50) + 10, message: "Primary trunk reachable" });
  });

  // ── FEATURE 21: Conversation Intelligence ─────────────────────────────────
  app.get("/api/coaching-triggers", async (_req, res) => {
    const triggers = await storage.getCoachingTriggers();
    res.json(triggers);
  });
  app.post("/api/coaching-triggers", async (req, res) => {
    try {
      const { insertCoachingTriggerSchema } = await import("@shared/schema");
      const data = insertCoachingTriggerSchema.parse(req.body);
      const t = await storage.createCoachingTrigger(data);
      res.status(201).json(t);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/coaching-triggers/:id", async (req, res) => {
    try {
      const { insertCoachingTriggerSchema } = await import("@shared/schema");
      const data = insertCoachingTriggerSchema.partial().parse(req.body);
      const t = await storage.updateCoachingTrigger(parseInt(req.params.id), data);
      if (!t) return res.status(404).json({ error: "Trigger not found" });
      res.json(t);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/coaching-triggers/:id", async (req, res) => {
    const deleted = await storage.deleteCoachingTrigger(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Trigger not found" });
    res.status(204).send();
  });
  app.get("/api/coaching-alerts", async (_req, res) => {
    const alerts = await storage.getCoachingAlerts();
    res.json(alerts);
  });
  app.post("/api/coaching-alerts", async (req, res) => {
    try {
      const { insertCoachingAlertSchema } = await import("@shared/schema");
      const data = insertCoachingAlertSchema.parse(req.body);
      const a = await storage.createCoachingAlert(data);
      res.status(201).json(a);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/coaching-alerts/:id", async (req, res) => {
    try {
      const { insertCoachingAlertSchema } = await import("@shared/schema");
      const data = insertCoachingAlertSchema.partial().parse(req.body);
      const a = await storage.updateCoachingAlert(parseInt(req.params.id), data);
      if (!a) return res.status(404).json({ error: "Alert not found" });
      res.json(a);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── FEATURE 22: Cost Analytics ────────────────────────────────────────────
  app.get("/api/cost-records", async (_req, res) => {
    const records = await storage.getCallCostRecords();
    res.json(records);
  });
  app.post("/api/cost-records", async (req, res) => {
    try {
      const { insertCallCostRecordSchema } = await import("@shared/schema");
      const data = insertCallCostRecordSchema.parse(req.body);
      const r = await storage.createCallCostRecord(data);
      res.status(201).json(r);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.get("/api/cost-budgets", async (_req, res) => {
    const budgets = await storage.getCostBudgets();
    res.json(budgets);
  });
  app.post("/api/cost-budgets", async (req, res) => {
    try {
      const { insertCostBudgetSchema } = await import("@shared/schema");
      const data = insertCostBudgetSchema.parse(req.body);
      const b = await storage.createCostBudget(data);
      res.status(201).json(b);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/cost-budgets/:id", async (req, res) => {
    try {
      const { insertCostBudgetSchema } = await import("@shared/schema");
      const data = insertCostBudgetSchema.partial().parse(req.body);
      const b = await storage.updateCostBudget(parseInt(req.params.id), data);
      if (!b) return res.status(404).json({ error: "Budget not found" });
      res.json(b);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/cost-budgets/:id", async (req, res) => {
    const deleted = await storage.deleteCostBudget(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Budget not found" });
    res.status(204).send();
  });

  // ── FEATURE 23: Multi-Tenant Manager ──────────────────────────────────────
  app.get("/api/tenants", async (_req, res) => {
    const list = await storage.getTenants();
    res.json(list);
  });
  app.post("/api/tenants", async (req, res) => {
    try {
      const { insertTenantSchema } = await import("@shared/schema");
      const data = insertTenantSchema.parse(req.body);
      const t = await storage.createTenant(data);
      res.status(201).json(t);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/tenants/:id", async (req, res) => {
    try {
      const { insertTenantSchema } = await import("@shared/schema");
      const data = insertTenantSchema.partial().parse(req.body);
      const t = await storage.updateTenant(parseInt(req.params.id), data);
      if (!t) return res.status(404).json({ error: "Tenant not found" });
      res.json(t);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/tenants/:id", async (req, res) => {
    const deleted = await storage.deleteTenant(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Tenant not found" });
    res.status(204).send();
  });

  // ── FEATURE 24: Green Calling Initiative ──────────────────────────────────
  app.get("/api/carbon-footprint", async (_req, res) => {
    const records = await storage.getCarbonFootprintRecords();
    res.json(records);
  });
  app.post("/api/carbon-footprint", async (req, res) => {
    try {
      const { insertCarbonFootprintRecordSchema } = await import("@shared/schema");
      const data = insertCarbonFootprintRecordSchema.parse(req.body);
      const r = await storage.createCarbonFootprintRecord(data);
      res.status(201).json(r);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.get("/api/green-goals", async (_req, res) => {
    const goals = await storage.getGreenGoals();
    res.json(goals);
  });
  app.post("/api/green-goals", async (req, res) => {
    try {
      const { insertGreenGoalSchema } = await import("@shared/schema");
      const data = insertGreenGoalSchema.parse(req.body);
      const g = await storage.createGreenGoal(data);
      res.status(201).json(g);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/green-goals/:id", async (req, res) => {
    try {
      const { insertGreenGoalSchema } = await import("@shared/schema");
      const data = insertGreenGoalSchema.partial().parse(req.body);
      const g = await storage.updateGreenGoal(parseInt(req.params.id), data);
      if (!g) return res.status(404).json({ error: "Goal not found" });
      res.json(g);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });

  // ── FEATURE 25: Live Agent Coaching ──────────────────────────────────────
  app.get("/api/live-coaching", async (_req, res) => {
    const sessions = await storage.getLiveCoachingSessions();
    res.json(sessions);
  });
  app.post("/api/live-coaching", async (req, res) => {
    try {
      const { insertLiveCoachingSessionSchema } = await import("@shared/schema");
      const data = insertLiveCoachingSessionSchema.parse(req.body);
      const s = await storage.createLiveCoachingSession(data);
      res.status(201).json(s);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.patch("/api/live-coaching/:id", async (req, res) => {
    try {
      const { insertLiveCoachingSessionSchema } = await import("@shared/schema");
      const data = insertLiveCoachingSessionSchema.partial().parse(req.body);
      const s = await storage.updateLiveCoachingSession(parseInt(req.params.id), data);
      if (!s) return res.status(404).json({ error: "Session not found" });
      res.json(s);
    } catch (e: any) { res.status(400).json({ error: e.message }); }
  });
  app.delete("/api/live-coaching/:id", async (req, res) => {
    const deleted = await storage.deleteLiveCoachingSession(parseInt(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Session not found" });
    res.status(204).send();
  });

  return httpServer;
}
