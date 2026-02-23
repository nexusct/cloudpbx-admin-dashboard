import type { Express } from "express";
import { storage } from "../storage";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export function registerAiRoutes(app: Express) {
  // AI Sessions
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
          ...messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
        max_completion_tokens: 1024,
      });

      const assistantContent =
        completion.choices[0]?.message?.content ||
        "I apologize, but I couldn't generate a response. Please try again.";

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
      const agent = await storage.updateAiAgent(
        parseInt(req.params.id),
        validatedData
      );
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
    const calls = await storage.getAiAgentCallsByAgent(
      parseInt(req.params.agentId)
    );
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
}
