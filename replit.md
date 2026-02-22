# CloudPBX Admin Dashboard

## Overview

A full-stack enterprise cloud PBX (Private Branch Exchange) administration platform built with React and Express. The application provides a comprehensive interface for managing business phone systems, including extensions, phone numbers (DIDs), call flows, ring groups, call queues, SMS/fax messaging, device provisioning, and third-party integrations. Features an AI-powered assistant for system configuration and troubleshooting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a page-based architecture with shared components. Pages are organized under `client/src/pages/` covering all PBX management functions:
- Core: dashboard, extensions, DIDs, call-flows, ring-groups, queues
- Communication: contacts, voicemail, call-logs, SMS, fax
- System: analytics, devices, integrations, webhooks, AI assistant
- Settings: user portal, settings, support
- Real-time: wallboard (live call center dashboard), routing-rules

### Backend Architecture
- **Framework**: Express 5 on Node.js with TypeScript
- **API Pattern**: RESTful JSON API with `/api/*` routes
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Build Process**: esbuild for production bundling with selective dependency bundling for optimized cold starts

The server uses a storage abstraction layer (`server/storage.ts`) implementing the repository pattern for all database operations. Routes are registered in `server/routes.ts` with OpenAI integration for the AI assistant feature.

### Database Schema
PostgreSQL database with Drizzle ORM. Schema defined in `shared/schema.ts` includes:
- Users (authentication and authorization)
- Extensions (phone extensions with voicemail, forwarding settings)
- DIDs (phone numbers with routing configuration)
- Call Flows (IVR and routing logic)
- Ring Groups and Call Queues
- Devices (phone hardware provisioning)
- Call Logs, SMS Messages, Fax Messages
- Integrations (12 supported third-party service connections with real API connectivity)
- AI Sessions and Messages (conversation history)
- System Settings
- Contacts (phonebook with VIP/DNC support)
- Voicemails (with AI transcription support)
- Routing Rules (smart call routing with time/caller-based conditions)
- Webhooks (API event notifications)
- Agent Status (real-time agent availability)
- Queue Stats (call queue performance metrics)
- Parking Slots (call parking management)
- Holiday Schedules (business hours exceptions)
- Call Dispositions (call outcome tracking)
- Speed Dials (quick dial shortcuts)
- SIP Providers (24 pre-configured provider templates with connectivity settings)
- SIP Trunks (configured trunk instances with credentials)
- Device Templates (100 handset/endpoint models from 8 manufacturers)

Additional chat models in `shared/models/chat.ts` for conversation and message storage.

### Development vs Production
- **Development**: Vite dev server with HMR, middleware mode integration with Express
- **Production**: Static file serving from `dist/public`, esbuild-bundled server

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Drizzle Kit**: Schema migrations with `drizzle-kit push`

### AI Integration
- **OpenAI API**: Used for AI assistant functionality via Replit AI Integrations
  - Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
  - Supports text chat, voice transcription (speech-to-text), text-to-speech, and image generation
  - Audio processing utilities in `server/replit_integrations/audio/` and `client/replit_integrations/audio/`

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### Key Runtime Dependencies
- Express 5 for HTTP server
- Drizzle ORM with pg driver for database
- TanStack React Query for data fetching
- Radix UI primitives for accessible components
- Tailwind CSS for styling
- Zod for schema validation (with drizzle-zod integration)

### Third-Party Integrations (13 supported)
- **Provider Adapters**: Located in `server/integrations/providers/`
  - `microsoft.ts` - Microsoft Teams & Entra ID (OAuth)
  - `zoho.ts` - Zoho CRM & Desk (OAuth)
  - `notion.ts` - Notion workspace/database sync (OAuth)
  - `google.ts` - Google Workspace contacts/calendar/Gmail (OAuth)
  - `twilio.ts` - SMS/voice/numbers (API key auth)
  - `wordpress.ts` - Click-to-call widget (application password auth)
  - `unifi.ts` - Shared controller for Voice/Network/Access/Protect (API key or username/password)
  - `rcare.ts` - RCare nurse call system (Cube API key or username/password)
- **Integration Routes**: `server/integrations/index.ts` handles configure, authorize, callback, connect, test, sync, disconnect
- **RCare-specific Routes**: Dedicated endpoints at `/api/rcare/*` for alarms, incidents, devices, views, settings, device mappings, and notification routes
- **Categories**: Collaboration, Identity, CRM, Website, Productivity, Telephony, UniFi, Healthcare
- **OAuth Providers**: MS Teams, MS Entra, Zoho CRM, Zoho Desk, Notion, Google Workspace
- **Credential-based**: WordPress, Twilio, UniFi (4 products share controller config), RCare Nurse Call

### Build & Development
- Vite with React plugin
- esbuild for server bundling
- TypeScript with strict mode
- Custom Replit plugins for development experience