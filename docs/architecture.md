# CloudPBX Architecture & Repo Structure

This document outlines the high-level architecture of the CloudPBX Admin Dashboard. The system is designed as a monolithic full-stack application leveraging the power of modern TypeScript.

## Folder Structure Overview

The repository is logically divided into three primary domain areas, ensuring an organized separation of concerns:

```text
cloudpbx-admin-dashboard/
├── client/          # The React 18 frontend
├── server/          # The Express.js backend API
├── shared/          # Types, Schemas, and common utilities
├── docs/            # Extensive documentation
└── scripts/         # Automated deployment and build scripts
```

---

### 1. The `client/` Directory

The client application is a Single Page Application (SPA) built using **React 18** and **Vite**.

- **Routing:** Handled via minimalist `wouter`.
- **State Management & Fetching:** Powered by `@tanstack/react-query` to manage sever state and caching efficiently.
- **Styling:** A combination of **Tailwind CSS** and **shadcn/ui** components ensures a consistent, accessible, and fast UI.
- **Structure:**
  - `src/components/`: Reusable UI components (buttons, dialogs, forms).
  - `src/pages/`: Main route views (Dashboard, Extensions, Settings).
  - `src/lib/`: Frontend utilities, API helpers.
  - `src/hooks/`: Custom React hooks (e.g., `use-toast`, `use-mobile`).

### 2. The `server/` Directory

The backend server is built on **Node.js** with **Express.js**, focusing on high performance and robustness.

- **API:** RESTful routes define interaction between the client and the core data.
- **Database Access:** Uses **Drizzle ORM** with **PostgreSQL**.
- **Integrations:** Contains the core logic for connecting to third-party PBX systems natively (e.g., Asterisk AMI streams, Twilio API).
- **Structure:**
  - `routes.ts`: Defines all API endpoints.
  - `db.ts`: Database connection and Drizzle instance.
  - `integrations/`: Subdirectories for specific PBX connectivity logic. Plugins live here.

### 3. The `shared/` Directory

This directory acts as the crucial bridge holding the full-stack system together with total type safety.

- **Schema:** Defined primarily using **Zod**. This ensures the data sent from the client exactly matches what the database expects. The types are shared automatically.
- **Drizzle Models:** Defines table schemas which generate both the database migrations and the TypeScript types utilized by the client.
- **Structure:**
  - `schema.ts`: Core data structures.

---

## Data Flow

1. **Client Request**: The React UI utilizes `@tanstack/react-query` to make an API request to an `/api/*` endpoint via `queryFn`.
2. **Server Validation**: The Express route parses the request body and validates it against the expected **Zod** schema imported from the `shared/` folder.
3. **Database Layer**: If valid, the server executes a **Drizzle ORM** query against the **PostgreSQL** database.
4. **Third-Party Sync**: If the request involves a PBX change (e.g., adding an extension), the server concurrently routes the call to the respective module in `server/integrations/` to update the external phone system.
5. **Response**: The server responds, the client cache is invalidated, and the React UI re-renders optimistically.

---

## AI Architecture

The CloudPBX Dashboard integrates optional AI functionality. By leveraging tools like the `openai` SDK, the backend can parse complex PBX log files, transcribe voicemail, and proactively suggest optimal dialplan routing configurations.

This architecture ensures high cohesion, loose coupling, and rapid full-stack iteration.
