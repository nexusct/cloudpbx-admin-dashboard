import type { Express } from "express";
import { storage } from "../storage";

export function registerSystemRoutes(app: Express) {
  // Settings
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

  // System Stats
  app.get("/api/dashboard/stats", async (req, res) => {
    const extensions = await storage.getExtensions();
    const dids = await storage.getDids();
    const ringGroups = await storage.getRingGroups();
    const callQueues = await storage.getCallQueues();
    const callLogs = await storage.getCallLogs();
    const smsMessages = await storage.getSmsMessages();

    const activeCalls = extensions.filter((e) => e.status === "busy").length;
    const missedCalls = callLogs.filter((l) => l.status === "missed").length;
    const answeredCalls = callLogs.filter(
      (l) => l.status === "answered" && l.duration && l.duration > 0
    );
    const totalDuration = answeredCalls.reduce(
      (sum, l) => sum + (l.duration || 0),
      0
    );
    const avgSeconds =
      answeredCalls.length > 0
        ? Math.round(totalDuration / answeredCalls.length)
        : 0;
    const avgMins = Math.floor(avgSeconds / 60);
    const avgSecs = avgSeconds % 60;

    res.json({
      totalCalls: callLogs.length,
      activeCalls,
      extensionsOnline: extensions.filter(
        (e) => e.status === "online" || e.status === "busy"
      ).length,
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

  // Agent Status
  app.get("/api/agent-status", async (req, res) => {
    const statuses = await storage.getAgentStatuses();
    res.json(statuses);
  });

  app.patch("/api/agent-status/:extensionId", async (req, res) => {
    try {
      const { insertAgentStatusSchema } = await import("@shared/schema");
      const validatedData = insertAgentStatusSchema.partial().parse(req.body);
      const agentStat = await storage.updateAgentStatus(
        parseInt(req.params.extensionId),
        validatedData
      );
      res.json(agentStat);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  // Queue Stats
  app.get("/api/queue-stats", async (req, res) => {
    const stats = await storage.getQueueStats();
    res.json(stats);
  });

  app.patch("/api/queue-stats/:queueId", async (req, res) => {
    try {
      const { insertQueueStatSchema } = await import("@shared/schema");
      const validatedData = insertQueueStatSchema.partial().parse(req.body);
      const stat = await storage.updateQueueStat(
        parseInt(req.params.queueId),
        validatedData
      );
      res.json(stat);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  // Parking Slots
  app.get("/api/parking-slots", async (req, res) => {
    const slots = await storage.getParkingSlots();
    res.json(slots);
  });

  app.post("/api/parking-slots/:slotNumber/park", async (req, res) => {
    try {
      const { insertParkingSlotSchema } = await import("@shared/schema");
      const validatedData = insertParkingSlotSchema.partial().parse(req.body);
      const slot = await storage.parkCall(
        parseInt(req.params.slotNumber),
        validatedData
      );
      res.json(slot);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.post("/api/parking-slots/:slotNumber/retrieve", async (req, res) => {
    try {
      const slot = await storage.retrieveCall(parseInt(req.params.slotNumber));
      if (!slot)
        return res.status(404).json({ error: "Parking slot not found" });
      res.json(slot);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });
}
