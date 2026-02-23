import type { Express } from "express";
import { storage } from "../storage";
import { registerIntegrationRoutes as externalIntegrations } from "../integrations/index";
import { registerTradingRoutes } from "../trading/routes";

export async function registerIntegrationsRoutes(app: Express) {
  // Pull in existing router modules
  externalIntegrations(app);
  await registerTradingRoutes(app);

  // Integrations (App marketplace integrations)
  app.get("/api/integrations", async (req, res) => {
    const allIntegrations = await storage.getIntegrations();
    res.json(allIntegrations);
  });

  app.get("/api/integrations/:id", async (req, res) => {
    const integration = await storage.getIntegration(parseInt(req.params.id));
    if (!integration)
      return res.status(404).json({ error: "Integration not found" });
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
      const integration = await storage.updateIntegration(
        parseInt(req.params.id),
        validatedData
      );
      if (!integration)
        return res.status(404).json({ error: "Integration not found" });
      res.json(integration);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/integrations/:id", async (req, res) => {
    const deleted = await storage.deleteIntegration(parseInt(req.params.id));
    if (!deleted)
      return res.status(404).json({ error: "Integration not found" });
    res.status(204).send();
  });

  // SIP Providers
  app.get("/api/sip-providers", async (req, res) => {
    const providers = await storage.getSipProviders();
    res.json(providers);
  });

  app.get("/api/sip-providers/:id", async (req, res) => {
    const provider = await storage.getSipProvider(parseInt(req.params.id));
    if (!provider)
      return res.status(404).json({ error: "SIP provider not found" });
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
      const provider = await storage.updateSipProvider(
        parseInt(req.params.id),
        validatedData
      );
      if (!provider)
        return res.status(404).json({ error: "SIP provider not found" });
      res.json(provider);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Invalid request data" });
    }
  });

  app.delete("/api/sip-providers/:id", async (req, res) => {
    const deleted = await storage.deleteSipProvider(parseInt(req.params.id));
    if (!deleted)
      return res.status(404).json({ error: "SIP provider not found" });
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
      const trunk = await storage.updateSipTrunk(
        parseInt(req.params.id),
        validatedData
      );
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
}
