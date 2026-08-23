import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Webhook signature verification middleware
 * 
 * Usage example:
 * 
 * // For Twilio webhooks:
 * app.post("/webhooks/twilio/incoming", verifyTwilioSignature, (req, res) => {
 *   // Handle Twilio webhook
 * });
 * 
 * // For generic webhooks (GitHub, Stripe, etc.):
 * app.post("/webhooks/github", verifyGenericWebhookSignature("GITHUB_WEBHOOK_SECRET"), (req, res) => {
 *   // Handle GitHub webhook
 * });
 */

export function verifyTwilioSignature(req: Request, res: Response, next: NextFunction) {
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!twilioAuthToken) {
    console.error("SECURITY: TWILIO_AUTH_TOKEN not configured but Twilio webhook was called");
    return res.status(500).json({ 
      error: "Webhook signature verification not configured" 
    });
  }

  const signature = req.headers["x-twilio-signature"];
  
  if (!signature || typeof signature !== "string") {
    console.warn(`SECURITY: Missing Twilio signature from ${req.ip}`);
    return res.status(403).json({ 
      error: "Missing webhook signature" 
    });
  }

  const url = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
  
  const params = Object.keys(req.body)
    .sort()
    .reduce((acc, key) => acc + key + req.body[key], "");
  
  const data = url + params;
  
  const expectedSignature = crypto
    .createHmac("sha1", twilioAuthToken)
    .update(Buffer.from(data, "utf-8"))
    .digest("base64");

  if (signature !== expectedSignature) {
    console.warn(`SECURITY: Invalid Twilio signature from ${req.ip}`);
    return res.status(403).json({ 
      error: "Invalid webhook signature" 
    });
  }

  next();
}

export function verifyGenericWebhookSignature(secretEnvVar: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const secret = process.env[secretEnvVar];
    
    if (!secret) {
      console.error(`SECURITY: ${secretEnvVar} not configured but webhook was called`);
      return res.status(500).json({ 
        error: "Webhook signature verification not configured" 
      });
    }

    const signature = req.headers["x-webhook-signature"] || req.headers["x-hub-signature-256"];
    
    if (!signature || typeof signature !== "string") {
      console.warn(`SECURITY: Missing webhook signature from ${req.ip}`);
      return res.status(403).json({ 
        error: "Missing webhook signature" 
      });
    }

    let expectedSignature: string;
    const rawBody = (req as any).rawBody;
    
    if (!rawBody) {
      console.error("SECURITY: Raw body not available for signature verification");
      return res.status(500).json({ 
        error: "Webhook verification error" 
      });
    }

    if (signature.startsWith("sha256=")) {
      expectedSignature = "sha256=" + crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");
    } else {
      expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex");
    }

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      console.warn(`SECURITY: Invalid webhook signature from ${req.ip}`);
      return res.status(403).json({ 
        error: "Invalid webhook signature" 
      });
    }

    next();
  };
}
