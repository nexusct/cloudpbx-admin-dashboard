<div align="center">

# ☁️ CloudPBX Admin Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)](https://postgresql.org/)

**The ultimate control panel for all your PBX systems.**

*Manage, monitor, and synchronize PBX in a Flash, Asterisk, UniFi, Twilio, Microsoft Teams, and more from a single, blazing-fast web interface.*

</div>

---

## 🌟 Overview

The CloudPBX Admin Dashboard bridges the gap between modern IT management and traditional telephony. Whether you are managing a single FreePBX server or orchestrating a fleet of diverse PBX systems globally, CloudPBX provides a unified, extensible interface to handle extensions, routing, monitoring, and billing.

### Key Features

- **Unified Management**: Oversee multiple SIP providers and PBX engines from one screen.
- **Deep Integrations**: First-class support for Asterisk AMI (PBX in a Flash, FreePBX), UniFi Talk, Twilio, and MS Teams.
- **Modern Tech Stack**: Built with React, Vite, Express, Drizzle ORM, and PostgreSQL.
- **AI-Powered**: Includes an AI assistant for log analysis, translation, and auto-configuration.
- **Live Monitoring**: Real-time dashboards showing active channels, trunks, and extensions.

---

## 🚀 Quick Start (Local Installation)

Getting started locally is incredibly simple. Follow these steps to spin up the CloudPBX dashboard in under 2 minutes.

### Prerequisites

Ensure you have the following installed:

1. **[Node.js](https://nodejs.org/)** (v20 or higher)
2. **[Git](https://git-scm.com/)**
3. **[PostgreSQL](https://www.postgresql.org/)**

### 1. Clone & Install

Open your terminal and run:

```bash
git clone https://github.com/nexusct/cloudpbx-admin-dashboard.git
cd cloudpbx-admin-dashboard
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root by copying the example or creating a new one:

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/cloudpbx"
```

*(Replace `username`, `password`, and `cloudpbx` with your actual Postgres credentials and database name)*

### 3. Initialize Database & Run

Push the database schema and start the development server:

```bash
npm run db:push
npm run dev
```

🎉 Open your browser to [http://localhost:5000](http://localhost:5000) and log in!

---

## 🚀 Production Installation

For production deployments, we provide automated installation scripts for different platforms.

### Ubuntu Server (24.10 / 24.04 LTS)

For standalone Ubuntu servers:

```bash
git clone https://github.com/nexusct/cloudpbx-admin-dashboard.git
cd cloudpbx-admin-dashboard
chmod +x scripts/install.sh
sudo ./scripts/install.sh
```

Access at: `http://YOUR_SERVER_IP`

See the [Ubuntu Deployment Guide](DEPLOYMENT.md) for detailed instructions.

### PBX in a Flash (CentOS/RHEL/Debian)

For PBX in a Flash, FreePBX, or Asterisk servers:

```bash
git clone https://github.com/nexusct/cloudpbx-admin-dashboard.git
cd cloudpbx-admin-dashboard
chmod +x scripts/install-pbx-flash.sh
sudo ./scripts/install-pbx-flash.sh
```

Access at: `http://YOUR_SERVER_IP:8080`

This script supports:
- CentOS 6/7/8, RHEL 7/8/9
- AlmaLinux 8/9, Rocky Linux 8/9
- Debian 9/10/11/12, Ubuntu

See the [PBX in a Flash Installation Guide](docs/integrations/pbx-in-a-flash-install.md) for detailed instructions.

---

## 📚 Extensive Documentation

We provide extensive documentation for system administrators, developers, and advanced users.

### Developer Guides

- **[Architecture & Structure](docs/architecture.md)** - Understand the codebase (client/server), tech stack, and data flow.
- **[Adding New Integrations](docs/integrations/overview.md)** - Learn how to build plugins for new PBX systems.
- **[Polymarket Trading System](docs/trading-system.md)** - Operate the agentic prediction-market trading subsystem.

### Integration Guides

Learn how to connect specific PBX systems to your dashboard:

- **[PBX in a Flash / Asterisk (AMI)](docs/integrations/pbx-in-a-flash.md)**
- **Twilio** (Coming Soon)
- **UniFi Talk** (Coming Soon)

### Deployment & Production

Deploying to a live server? We've got you covered.

- **[Ubuntu 24.10 Comprehensive Deployment Guide](DEPLOYMENT.md)** - Complete systemd, nginx, and SSL setup.
- **[PBX in a Flash Installation Guide](docs/integrations/pbx-in-a-flash-install.md)** - Install CloudPBX directly on your PBX in a Flash server.

---

## 🛠 Tech Stack Details

**Frontend (Client)**

- **React 18** + **Vite**: For a lightning-fast UI.
- **Tailwind CSS** + **shadcn/ui**: For beautiful, accessible components.
- **TanStack Query (React Query)**: For state management and data fetching.
- **Wouter**: Minimalistic routing.

**Backend (Server)**

- **Express.js**: Robust API server.
- **Drizzle ORM**: Type-safe queries and schema management.
- **PostgreSQL**: Reliable relational data storage.
- **Zod**: Runtime type validation.

---

## 🤝 Contributing

We welcome contributions! Please see our [Developer Guides](docs/architecture.md) to understand the project structure before submitting a Pull Request.

---

## 📝 License

This software is provided under the [MIT License](LICENSE).
