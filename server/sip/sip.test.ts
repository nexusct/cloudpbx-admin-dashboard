/**
 * SIP Runtime Service Tests — CORE-001
 *
 * Validates acceptance criterion:
 *   "Test endpoints can register and remain stable"
 *
 * Run with:  npx tsx server/sip/sip.test.ts
 */

import { SipRuntimeService } from "./sipRuntime.js";

async function runTests() {
  console.log("Running SIP Runtime Service Tests...");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // ── 1. Register an endpoint ─────────────────────────────────────────────
  const svc = new SipRuntimeService(0); // pruneIntervalMs=0 → no background timer

  const reg = svc.register({
    extensionNumber: "101",
    contact: "sip:101@192.168.1.10:5060",
    userAgent: "Test-UA/1.0",
    expires: 3600,
  });

  assert(reg.extensionNumber === "101", "Register returns correct extensionNumber");
  assert(reg.contact === "sip:101@192.168.1.10:5060", "Register returns correct contact");
  assert(reg.userAgent === "Test-UA/1.0", "Register returns correct userAgent");
  assert(reg.expiresAt > new Date(), "Registration expiry is in the future");

  // ── 2. isRegistered returns true for active registration ─────────────────
  assert(svc.isRegistered("101"), "isRegistered returns true for active endpoint");

  // ── 3. getRegistration returns the record ────────────────────────────────
  const fetched = svc.getRegistration("101");
  assert(fetched !== undefined, "getRegistration finds the active registration");
  assert(fetched?.contact === "sip:101@192.168.1.10:5060", "getRegistration returns correct contact");

  // ── 4. getAllRegistrations includes the endpoint ──────────────────────────
  const all = svc.getAllRegistrations();
  assert(all.length === 1, "getAllRegistrations returns one entry");
  assert(all[0].extensionNumber === "101", "getAllRegistrations entry has correct extensionNumber");

  // ── 5. Register a second endpoint ────────────────────────────────────────
  svc.register({ extensionNumber: "102", contact: "sip:102@192.168.1.11:5060", expires: 120 });
  assert(svc.getAllRegistrations().length === 2, "getAllRegistrations returns two entries after second register");

  // ── 6. Refresh (re-register) extends expiry ───────────────────────────────
  const before = svc.getRegistration("101")!.expiresAt.getTime();
  // Small delay to ensure a measurable time difference
  await new Promise((r) => setTimeout(r, 5));
  svc.register({ extensionNumber: "101", contact: "sip:101@192.168.1.10:5060", expires: 7200 });
  const after = svc.getRegistration("101")!.expiresAt.getTime();
  assert(after > before, "Re-register extends expiry (endpoint remains stable)");

  // ── 7. registeredAt is preserved on refresh ────────────────────────────
  const original = reg.registeredAt.getTime();
  const refreshed = svc.getRegistration("101")!.registeredAt.getTime();
  assert(refreshed === original, "registeredAt is preserved across refresh");

  // ── 8. Unregister removes the endpoint ───────────────────────────────────
  const removed = svc.unregister("101");
  assert(removed === true, "unregister returns true for a known endpoint");
  assert(!svc.isRegistered("101"), "isRegistered returns false after unregister");
  assert(svc.getAllRegistrations().length === 1, "getAllRegistrations returns one entry after unregister");

  // ── 9. Unregister unknown endpoint returns false ─────────────────────────
  const removedUnknown = svc.unregister("999");
  assert(removedUnknown === false, "unregister returns false for unknown endpoint");

  // ── 10. Expired registrations are not returned (via injected clock) ───────
  // Use a manually-advanceable clock so we can simulate TTL expiry
  let clockMs = Date.now();
  const manualClock = () => new Date(clockMs);
  const expiredSvc = new SipRuntimeService(0, manualClock);
  expiredSvc.register({ extensionNumber: "103", contact: "sip:103@192.168.1.12:5060", expires: 60 });
  // Advance the clock past the 60-second TTL
  clockMs += 120_000;
  assert(!expiredSvc.isRegistered("103"), "Expired registration is not considered active");
  assert(expiredSvc.getRegistration("103") === undefined, "getRegistration returns undefined for expired entry");
  assert(
    expiredSvc.getAllRegistrations().every((r) => r.extensionNumber !== "103"),
    "getAllRegistrations excludes expired entries",
  );
  expiredSvc.destroy();

  // ── 11. pruneExpired cleans up the internal map ───────────────────────────
  let pruneClockMs = Date.now();
  const pruneClock = () => new Date(pruneClockMs);
  const pruneSvc = new SipRuntimeService(0, pruneClock);
  pruneSvc.register({ extensionNumber: "104", contact: "sip:104@192.168.1.13:5060", expires: 60 });
  pruneClockMs += 120_000; // advance past TTL
  const sizeBefore = pruneSvc.getAllRegistrations().length + 1; // +1 for the expired one not yet pruned
  pruneSvc.pruneExpired();
  const sizeAfter = pruneSvc.getAllRegistrations().length;
  assert(sizeAfter < sizeBefore, "pruneExpired reduces map size after expiry");
  pruneSvc.destroy();

  // ── 12. health() reports correct count ────────────────────────────────────
  const h = svc.health();
  assert(h.status === "ok", "health() returns status ok");
  assert(typeof h.registeredEndpoints === "number", "health() returns numeric registeredEndpoints");
  assert(h.registeredEndpoints === svc.getAllRegistrations().length, "health() registeredEndpoints matches actual count");

  // ── 13. expires is capped at 86400 seconds ───────────────────────────────
  const capped = svc.register({ extensionNumber: "105", contact: "sip:105@192.168.1.14:5060", expires: 999999 });
  const expectedMax = new Date(Date.now() + 86400 * 1000);
  const diff = Math.abs(capped.expiresAt.getTime() - expectedMax.getTime());
  assert(diff < 2000, "expires is capped at 86400 seconds (24 hours)");
  svc.unregister("105");

  // ── 14. destroy() clears the prune timer ─────────────────────────────────
  const svc2 = new SipRuntimeService(50);
  svc2.destroy();
  assert((svc2 as any).pruneTimer === null, "destroy() clears the prune timer");

  svc.destroy();

  console.log(`\nTests finished: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch(console.error);
