/**
 * SIP Runtime Service — CORE-001
 *
 * Manages the in-memory registration state of SIP endpoints.
 * Endpoints register with a contact URI and an expiry (seconds).
 * Registrations are automatically expired after their TTL.
 *
 * Rollback: Remove the import of `sipRuntime` from `server/routes.ts`,
 *   delete the SIP route block above `return httpServer;`, and delete
 *   this file to restore prior state. No schema migrations are needed.
 */

export interface SipRegistration {
  extensionNumber: string;
  contact: string;
  userAgent?: string;
  expiresAt: Date;
  registeredAt: Date;
  refreshedAt: Date;
}

export interface SipRegistrationRequest {
  extensionNumber: string;
  contact: string;
  userAgent?: string;
  /** Expiry in seconds (default: 3600, max: 86400) */
  expires?: number;
}

const DEFAULT_EXPIRES_SECONDS = 3600;
const MAX_EXPIRES_SECONDS = 86400; // 24 hours

export class SipRuntimeService {
  private readonly registrations = new Map<string, SipRegistration>();
  private pruneTimer: ReturnType<typeof setInterval> | null = null;
  /** Injectable clock for deterministic testing. */
  private readonly now: () => Date;

  constructor(pruneIntervalMs = 60_000, now: () => Date = () => new Date()) {
    this.now = now;
    if (pruneIntervalMs > 0) {
      this.pruneTimer = setInterval(() => this.pruneExpired(), pruneIntervalMs);
      if (this.pruneTimer.unref) {
        // Allow the Node.js process to exit even if the timer is still active
        this.pruneTimer.unref();
      }
    }
  }

  /**
   * Register or refresh a SIP endpoint.
   * Returns the created/updated registration record.
   */
  register(req: SipRegistrationRequest): SipRegistration {
    const expires = Math.min(
      MAX_EXPIRES_SECONDS,
      Math.max(1, req.expires ?? DEFAULT_EXPIRES_SECONDS),
    );
    const now = this.now();
    const expiresAt = new Date(now.getTime() + expires * 1000);

    const existing = this.registrations.get(req.extensionNumber);
    const entry: SipRegistration = {
      extensionNumber: req.extensionNumber,
      contact: req.contact,
      userAgent: req.userAgent,
      registeredAt: existing?.registeredAt ?? now,
      refreshedAt: now,
      expiresAt,
    };

    this.registrations.set(req.extensionNumber, entry);
    return entry;
  }

  /**
   * Unregister a SIP endpoint.
   * Returns true if the endpoint was registered, false otherwise.
   */
  unregister(extensionNumber: string): boolean {
    return this.registrations.delete(extensionNumber);
  }

  /**
   * Return the registration record for a given extension, or undefined
   * if not registered (or if its registration has expired).
   */
  getRegistration(extensionNumber: string): SipRegistration | undefined {
    const entry = this.registrations.get(extensionNumber);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.registrations.delete(extensionNumber);
      return undefined;
    }
    return entry;
  }

  /** Return all non-expired registrations. */
  getAllRegistrations(): SipRegistration[] {
    this.pruneExpired();
    return Array.from(this.registrations.values());
  }

  /** Return true if the extension currently has a valid (non-expired) registration. */
  isRegistered(extensionNumber: string): boolean {
    return this.getRegistration(extensionNumber) !== undefined;
  }

  /** Remove all expired registrations from the in-memory store. */
  pruneExpired(): void {
    const now = this.now();
    for (const [key, entry] of Array.from(this.registrations.entries())) {
      if (entry.expiresAt <= now) {
        this.registrations.delete(key);
      }
    }
  }

  /** Return a health summary for the runtime service. */
  health(): { status: "ok"; registeredEndpoints: number } {
    this.pruneExpired();
    return { status: "ok", registeredEndpoints: this.registrations.size };
  }

  /** Stop the background prune timer. Call during graceful shutdown. */
  destroy(): void {
    if (this.pruneTimer !== null) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
  }
}

/** Singleton instance used by the route handlers. */
export const sipRuntime = new SipRuntimeService();
