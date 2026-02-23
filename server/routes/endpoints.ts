import type { Express } from "express";
import { storage } from "../storage";

export function registerEndpointRoutes(app: Express) {
  // Extensions
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

  // DIDs
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

  // Call Flows
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

  // Devices
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

  // Call Logs
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

  // SMS
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

  // Fax
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

  // Ring Groups
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

  // Call Queues
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

  // Connect Contacts
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

  // Voicemails
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

  // Routing Rules
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

  // Webhooks
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

  // Users
  app.get("/api/users/:id", async (req, res) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    const { password, ...safeUser } = user;
    res.json(safeUser);
  });
}
