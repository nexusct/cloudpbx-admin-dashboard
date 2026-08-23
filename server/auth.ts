import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

const FORBIDDEN_TOKENS = [
  "admin",
  "password",
  "secret",
  "token",
  "changeme",
  "placeholder",
  "example",
  "test",
  "demo",
  "default",
];

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken) {
    console.error("SECURITY: ADMIN_TOKEN environment variable is not set");
    return res.status(500).json({ 
      error: "Server configuration error: authentication not configured" 
    });
  }

  const normalizedToken = adminToken.toLowerCase();
  if (FORBIDDEN_TOKENS.some(forbidden => normalizedToken.includes(forbidden))) {
    console.error("SECURITY: ADMIN_TOKEN contains forbidden value (placeholder/default)");
    return res.status(500).json({ 
      error: "Server configuration error: authentication not properly configured" 
    });
  }

  if (adminToken.length < 32) {
    console.error("SECURITY: ADMIN_TOKEN is too short (must be at least 32 characters)");
    return res.status(500).json({ 
      error: "Server configuration error: authentication token too weak" 
    });
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: "Authentication required",
      message: "Missing Authorization header. Use: Authorization: Bearer <token>"
    });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ 
      error: "Invalid authentication format",
      message: "Use: Authorization: Bearer <token>"
    });
  }

  const providedToken = parts[1];

  // Use timing-safe comparison to prevent timing attacks
  try {
    const isValid = crypto.timingSafeEqual(
      Buffer.from(providedToken),
      Buffer.from(adminToken)
    );
    
    if (!isValid) {
      console.warn(`SECURITY: Failed authentication attempt from ${req.ip}`);
      return res.status(403).json({ 
        error: "Invalid authentication token" 
      });
    }
  } catch {
    // Buffers have different lengths
    console.warn(`SECURITY: Failed authentication attempt from ${req.ip}`);
    return res.status(403).json({ 
      error: "Invalid authentication token" 
    });
  }

  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const adminToken = process.env.ADMIN_TOKEN;
  const authHeader = req.headers.authorization;

  if (adminToken && authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") {
      try {
        const isValid = crypto.timingSafeEqual(
          Buffer.from(parts[1]),
          Buffer.from(adminToken)
        );
        if (isValid) {
          (req as any).authenticated = true;
        }
      } catch {
        // Buffers have different lengths, token is invalid
      }
    }
  }

  next();
}
