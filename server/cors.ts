import type { Request, Response, NextFunction } from "express";

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  const origin = req.headers.origin;

  if (!allowedOriginsEnv) {
    console.warn("SECURITY: ALLOWED_ORIGINS not configured, rejecting cross-origin requests");
    return next();
  }

  const allowedOrigins = allowedOriginsEnv
    .split(",")
    .map(o => o.trim())
    .filter(o => o.length > 0);

  if (allowedOrigins.includes("*")) {
    console.error("SECURITY: Wildcard (*) in ALLOWED_ORIGINS is not permitted with credentials");
    return next();
  }

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.setHeader("Access-Control-Max-Age", "86400");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }
  }

  next();
}
