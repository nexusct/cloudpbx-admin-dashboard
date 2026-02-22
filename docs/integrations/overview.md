# CloudPBX Integrations Overview

The CloudPBX Admin Dashboard is designed to be the central nervous system for your telephony infrastructure. Instead of replacing your existing PBX engines, it integrates with them, pulling data in real-time, managing configurations, and providing a unified pane of glass.

## How Integrations Work

At its core, the dashboard uses a **Plugin Architecture** in the backend.

When you configure an integration in the web interface (e.g., adding a PBX in a Flash server), the dashboard stores the connection credentials (like IP addresses, API keys, and AMI secrets) securely in the PostgreSQL database.

The Node.js backend then uses these credentials to establish a direct connection to the target system.

### The Sync Process

1. **Trigger**: A sync can be triggered manually via the UI or automatically via a scheduled cron job on the server.
2. **Connection**: The backend instantiates the specific integration module (e.g., `server/integrations/providers/pbxinaflash.ts`).
3. **Fetching**: The module communicates with the PBX using its native protocol:
   - *Asterisk/FreePBX*: Connects via TCP to port 5038 using the Asterisk Manager Interface (AMI) to execute commands like `SIPpeers` and `SIPshowregistry`.
   - *Twilio*: Connects via HTTPS using the Twilio REST API.
4. **Normalization**: The raw data returned by the disparate PBX systems is transformed into a standardized format defined by our shared Zod schemas (`shared/schema.ts`).
5. **Storage & Broadcast**: The normalized data (Extensions, Trunks, Call Routes) is saved to the local database for rapid querying and broadcast to connected web clients via WebSockets or React Query invalidation.

## Supported Integration Types

### 1. Asterisk-Based (AMI)

These integrations connect directly to the Asterisk core using the Manager Interface. This provides extremely low-latency access to active channels and configuration states.

- **PBX in a Flash** (Fully Supported)
- **FreePBX** (Fully Supported)
- **Incredible PBX** (Fully Supported)
- **Vanilla Asterisk** (Fully Supported)

*See the [PBX in a Flash Setup Guide](pbx-in-a-flash.md) for detailed configuration steps.*

### 2. Cloud APIs (REST)

These integrations interface with modern cloud providers via standard HTTP REST APIs.

- **Twilio** (Beta)
- **Telnyx** (Planned)
- **Microsoft Teams Direct Routing** (Planned)

### 3. Appliance APIs

- **UniFi Talk** (Beta) - Connects to the UniFi OS Console API.

## Building a Custom Integration

If you need to connect a proprietary PBX system, you can build a custom integration module.

1. Create a new file in `server/integrations/providers/my-custom-pbx.ts`.
2. Ensure it implements the standard `Integrator` interface, providing at minimum a `syncData(credentials)` method.
3. Register your provider in the main `server/integrations/index.ts` manifest.
4. The React UI will automatically pick up the new provider type for users to configure.
