# The Exchange — Property Management System

An all-in-one property and client management system built for independent estate agents. Provides a dual-portal experience: an **agent dashboard** for managing properties, clients, and documents, and a **client portal** for tenants to complete onboarding, upload documents, track rent, and communicate with their agent.

## Features

### Agent Portal
- **Property management** — create and manage multiple properties
- **Client onboarding** — add tenants and send them a login invitation
- **Document checklist builder** — define multi-stage document requirements per property; clients get a personal snapshot on joining
- **Rent schedule** — create and track payment entries with status (paid / pending / overdue)
- **Welcome Pack editor** — populate per-property information cards (WiFi, heating, bins, emergency contacts, house rules, local info) that clients can view
- **Help Links** — curate a list of local service providers (internet, cleaning, utilities, etc.) for tenants
- **Issue management** — review and respond to client-reported maintenance issues
- **Direct messaging** — one-to-one messaging with each tenant

### Client Portal
- **Onboarding checklist** — stage-by-stage document upload with live status tracking
- **Welcome Pack viewer** — property-specific information provided by the agent
- **Rent schedule** — view upcoming and historical payments with bank details
- **Issue reporting** — submit and track maintenance reports with in-thread messaging
- **Help Links** — access agent-curated local service providers

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite, Wouter routing |
| UI Components | shadcn/ui, Radix UI, Tailwind CSS v4, Framer Motion |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL via Drizzle ORM |
| Authentication | Replit Auth (OpenID Connect / Google OAuth) |
| File Storage | Replit Object Storage (GCS-backed presigned uploads) |
| Data Fetching | TanStack React Query |
| Validation | Zod + drizzle-zod |

## Getting Started

### 1. Remix this project on Replit

Click **Use Template** (or remix the project) to create your own isolated copy with its own database.

### 2. Configure environment variables

Set the following secrets in the Replit Secrets panel:

**Agent access (required)**
```
AGENT_EMAILS=agent@youragency.com,another@youragency.com
```

**Agency branding**
```
AGENCY_NAME=Your Agency Name
AGENCY_TAGLINE=Your tagline
AGENCY_ADDRESS=123 High Street
AGENCY_CITY=London
AGENCY_POSTCODE=SW1A 1AA
AGENCY_EMAIL=hello@youragency.com
AGENCY_PHONE=020 1234 5678
```

**Bank details (shown to clients on the rent schedule)**
```
BANK_ACCOUNT_NAME=Your Agency Ltd
BANK_NAME=Barclays
BANK_SORT_CODE=20-00-00
BANK_ACCOUNT_NUMBER=12345678
BANK_IBAN=GB00BARC00000000000000
BANK_BIC=BARCGB22
```

### 3. Run the app

```bash
npm install
npm run db:push   # apply the database schema
npm run dev       # start development server
```

### 4. First login

Agents whose email is listed in `AGENT_EMAILS` are automatically provisioned on first login. Clients are added by agents via the dashboard and can log in once their email has been registered.

## Project Structure

```
├── client/               # React frontend
│   └── src/
│       ├── pages/        # Route-level page components
│       ├── components/   # Shared UI components
│       └── hooks/        # React Query hooks
├── server/               # Express backend
│   ├── routes.ts         # API route handlers
│   ├── storage.ts        # Drizzle ORM data access layer
│   ├── config.ts         # Environment variable parsing
│   ├── seed.ts           # Agent pre-provisioning
│   └── replit_integrations/
│       ├── auth/         # Replit Auth / Passport setup
│       └── object_storage/ # File upload service
└── shared/
    └── schema.ts         # Drizzle table definitions (single source of truth)
```

## Security Notes

- All secrets and credentials are read from environment variables — nothing is hardcoded
- Authentication is enforced via Replit's OpenID Connect integration
- File access is authenticated; object storage URLs are not publicly guessable
- Clients can only access properties they have been linked to by an agent
- Agents can only manage properties they own

## Deployment

Click **Deploy** in the Replit toolbar to publish to a `.replit.app` domain with TLS, health checks, and a separate production database.
