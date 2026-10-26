<div align="center">

# ☁️ CloudPBX Admin Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://postgresql.org/)

**Enterprise unified control panel for multi-vendor PBX systems.**

*Manage, monitor, and synchronize PBX in a Flash, Asterisk, UniFi Talk, Twilio, Microsoft Teams, and more from a single, secure web interface.*

</div>

---

## 🌟 Overview

The CloudPBX Admin Dashboard is an enterprise-grade telephony management platform designed for IT teams managing heterogeneous PBX infrastructure. Whether you're running a single FreePBX server or orchestrating hundreds of extensions across multiple vendors, CloudPBX provides a unified interface for configuration, monitoring, billing, and analytics.

### Key Features

- **Multi-Vendor Support**: Native integrations for Asterisk AMI, FreePBX, PBX in a Flash, UniFi Talk, Twilio, and Microsoft Teams
- **Real-Time Monitoring**: Live dashboards showing active calls, channels, trunks, and extension status
- **Intelligent Routing**: Advanced call routing rules with time-of-day, geographic, and load-balancing policies
- **AI-Powered Operations**: Built-in assistant for log analysis, configuration translation, and troubleshooting
- **Trading Integration**: Automated prediction market trading system (Polymarket)
- **Secure by Design**: Pre-commit hooks, secret scanning, and comprehensive input validation

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:

- **Node.js** v20+ ([download](https://nodejs.org/))
- **PostgreSQL** 14+ ([download](https://www.postgresql.org/))
- **Git** ([download](https://git-scm.com/))

### 1. Clone & Install

```bash
git clone https://github.com/nexusct/cloudpbx-admin-dashboard.git
cd cloudpbx-admin-dashboard
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root with the following variables:

```bash
# Database (Required)
DATABASE_URL="postgresql://username:password@localhost:5432/cloudpbx"

# Server (Optional)
PORT=5000                    # Default: 5000
NODE_ENV=development         # Values: development | production

# Security (Required in production)
# Generate admin token: openssl rand -base64 48
ADMIN_TOKEN=your-secure-random-token-at-least-32-chars
ALLOWED_ORIGINS=https://yourdomain.com  # Comma-separated origins for CORS

# Webhook Security (Optional - if using webhooks)
TWILIO_AUTH_TOKEN=...        # For Twilio webhook signature verification

# AI Features (Optional)
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...        # OpenAI API key for AI assistant
AI_INTEGRATIONS_OPENAI_BASE_URL=https://...  # Custom OpenAI endpoint (optional)

# Trading System (Optional - Required for Polymarket integration)
TRADING_MODEL_WORKER_URL=http://127.0.0.1:8001     # Trading model service URL
TRADING_CYCLE_MS=300000                             # Trading cycle interval (default: 5min)
TRADING_MARKET_LIMIT=40                             # Max markets to monitor
TRADING_DEFAULT_BANKROLL_USD=100000                 # Starting capital
TRADING_TOP_CATEGORIES=Politics,Macro,Crypto       # Categories to trade
POLYMARKET_GAMMA_BASE_URL=https://gamma-api.polymarket.com
POLYMARKET_EXECUTION_BASE_URL=https://...           # Polymarket execution proxy
POLYMARKET_EXECUTION_API_KEY=...                    # Polymarket API key

# Replit-specific (Optional - ignore if not using Replit)
REPLIT_CONNECTORS_HOSTNAME=...
REPL_IDENTITY=...
WEB_REPL_RENEWAL=...
```

**Security Note**: Never commit `.env` files to git. All credentials should be stored in environment variables or a secure config management system.

### 3. Initialize Database

The application uses Drizzle ORM for database migrations. Push the schema to your PostgreSQL database:

```bash
npm run db:push
```

This creates all necessary tables (extensions, trunks, routing rules, webhooks, integrations, etc.) and seeds initial example data.

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`. The dev server includes hot module reloading for both client and server code.

### 5. Production Build

For production deployments:

```bash
npm run build
npm run start
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive production setup instructions including systemd, nginx, SSL, and security hardening.

---

## 📁 Project Structure

```
cloudpbx-admin-dashboard/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components (shadcn/ui)
│   │   ├── pages/         # Route-level pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and helpers
├── server/                 # Express backend
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API route definitions
│   ├── db.ts              # Database connection pool
│   ├── storage.ts         # Data access layer (Drizzle queries)
│   ├── integrations/      # PBX provider integrations
│   │   └── providers/     # Individual provider implementations
│   ├── trading/           # Polymarket trading system
│   ├── sip/               # SIP runtime and signaling
│   └── replit_integrations/ # AI/OpenAI integrations
├── shared/                 # Code shared between client/server
│   └── schema.ts          # Database schema and Zod validators
├── docs/                   # Additional documentation
├── script/                 # Build and utility scripts
├── .env                    # Environment variables (gitignored)
├── package.json           # Dependencies and scripts
├── drizzle.config.ts      # Database migration config
├── vite.config.ts         # Vite bundler config
└── tsconfig.json          # TypeScript config
```

---

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload (port 5000) |
| `npm run build` | Build production bundle (client + server) |
| `npm run start` | Run production server |
| `npm run db:push` | Push database schema changes |
| `npm run lint` | Run ESLint on all source files |
| `npm run check` | Type-check TypeScript without emitting |
| `npm test` | Alias for `npm run check` |

---

## 🔌 PBX Integration Guide

CloudPBX supports multiple PBX systems through a unified provider interface. Each integration is configured via the Integrations page in the dashboard.

### Supported Providers

| Provider | Status | Connection Type | Features |
|----------|--------|-----------------|----------|
| **PBX in a Flash / Asterisk** | ✅ Production | AMI (Asterisk Manager Interface) | Extensions, active calls, SIP peers, CDR |
| **Twilio** | ✅ Production | REST API | Phone numbers, SMS, call logs, account balance |
| **UniFi Talk** | ⚠️ Beta | UniFi Controller API | Extensions, devices, call history |
| **Microsoft Teams** | ⚠️ Beta | Microsoft Graph API | Users, calls (requires OAuth) |
| **Google Voice** | 🚧 Planned | OAuth + API | - |
| **RingCentral** | 🚧 Planned | REST API | - |

### Connecting a PBX System

1. Navigate to **Integrations** in the dashboard
2. Click **Add Integration** and select your provider
3. Enter connection details (hostname, credentials, API keys)
4. Click **Test Connection** to verify connectivity
5. **Save** and enable the integration

Example: Connecting to FreePBX via AMI:

```
Provider: PBX in a Flash / Asterisk
Host: 192.168.1.100
Port: 5038
Username: admin
Secret: <your AMI secret>
```

See [docs/integrations/](docs/integrations/) for provider-specific setup guides.

---

## 🔒 Security

This project follows enterprise security standards and includes multiple layers of protection:

### Security Features

- **Authentication Required**: All API endpoints require Bearer token authentication
- **CORS Protection**: Explicit origin whitelisting, no wildcard with credentials
- **Webhook Signature Verification**: Built-in verification for Twilio and generic webhooks
- **Secret Scanning**: Pre-commit hooks with gitleaks and detect-secrets
- **Input Validation**: All API endpoints validate input with Zod schemas
- **Dependency Scanning**: Regular npm audit and Dependabot updates
- **No Hardcoded Credentials**: All secrets are externalized to environment variables

### Authentication

All API endpoints require authentication via Bearer token:

```bash
curl -H "Authorization: Bearer your-admin-token" \
  http://localhost:5000/api/extensions
```

**Required Configuration:**
- Set `ADMIN_TOKEN` environment variable (minimum 32 characters)
- Token cannot contain placeholder words (admin, password, test, etc.)
- Generate secure token: `openssl rand -base64 48`

**Security Requirements:**
- Token must be at least 32 characters long
- Token validation rejects weak/placeholder values
- Failed authentication attempts are logged with IP address

### CORS Configuration

Cross-Origin Resource Sharing is explicitly configured:

```bash
# Allow specific origins (comma-separated)
ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
```

**Security Rules:**
- Wildcard (`*`) is rejected when credentials are used
- Only whitelisted origins receive CORS headers
- Credentials are allowed only for approved origins

### Webhook Security

Webhook signature verification is built-in for external integrations:

```typescript
// Twilio webhook (automatic signature verification)
app.post("/webhooks/twilio/incoming", verifyTwilioSignature, handler);

// Generic webhook (GitHub, Stripe, etc.)
app.post("/webhooks/github", verifyGenericWebhookSignature("GITHUB_WEBHOOK_SECRET"), handler);
```

Required environment variables:
- `TWILIO_AUTH_TOKEN` - For Twilio webhook verification
- `GITHUB_WEBHOOK_SECRET` - For GitHub webhook verification
- `STRIPE_WEBHOOK_SECRET` - For Stripe webhook verification

### Reporting Security Issues

**Do not open public GitHub issues for security vulnerabilities.**

Email security issues to: **office@nexusct.com**

Include:
- Description of the vulnerability
- Steps to reproduce (if applicable)
- Affected versions or commit hash

We will acknowledge within 2 business days. See [SECURITY.md](SECURITY.md) for our full security policy.

### Setting Up Pre-commit Hooks

To enable automatic secret scanning before each commit:

```bash
pip install pre-commit
pre-commit install
```

This installs hooks that will:
- Scan for hardcoded secrets (gitleaks)
- Detect common credential patterns (detect-secrets)
- Block known-bad strings (retired passwords, API keys)
- Prevent private keys from being committed

---

## 🧪 Development Guidelines

### Adding a New PBX Integration

1. Create a new provider file in `server/integrations/providers/`
2. Implement the provider interface (test connection, fetch data, etc.)
3. Register the provider in `server/integrations/index.ts`
4. Add frontend components in `client/src/pages/integrations/`
5. Update database schema if new fields are needed
6. Add tests in `*.test.ts` files

See [docs/integrations/overview.md](docs/integrations/overview.md) for detailed instructions.

### Code Style

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with `@typescript-eslint` rules
- **Formatting**: 2-space indentation, semicolons required
- **Imports**: Use path aliases (`@shared`, `@/components`)

### Testing

Run type checks before committing:

```bash
npm run check
```

---

## 📚 Documentation

- **[Architecture Guide](docs/architecture.md)** - System design and data flow
- **[Integration Development](docs/integrations/overview.md)** - Build custom PBX connectors
- **[Trading System](docs/trading-system.md)** - Polymarket automated trading
- **[Deployment Guide](DEPLOYMENT.md)** - Production setup (Ubuntu, systemd, nginx)
- **[Security Policy](SECURITY.md)** - Reporting vulnerabilities and incident history

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes with clear messages
4. Run `npm run check` and ensure no errors
5. Push to your fork and open a Pull Request

For major changes, please open an issue first to discuss the proposed changes.

---

## 📝 License

This software is licensed under the **MIT License**. See [LICENSE](LICENSE) for full text.

---

## 🏢 About Nexus Communications Technology

CloudPBX Admin Dashboard is developed and maintained by **Nexus Communications Technology** (Nexuscomm LLC).

- Website: [nexusct.com](https://nexusct.com)
- Support: office@nexusct.com
- Security: office@nexusct.com

---

## 🙏 Acknowledgments

Built with:
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Express](https://expressjs.com/) - Backend framework
- [Drizzle ORM](https://orm.drizzle.team/) - Database toolkit
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [TanStack Query](https://tanstack.com/query/) - Data fetching
- [PostgreSQL](https://www.postgresql.org/) - Database
