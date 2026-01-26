# The Exchange - Property Management System

## Overview

The Exchange is an all-in-one property and client management system designed for independent estate agents. It provides a dual-portal experience where agents can manage properties, documents, and client relationships, while clients can complete onboarding journeys, upload documents, view rent schedules, and communicate with their agents.

The system follows a property-centric architecture where everything (documents, payments, chats, client access) is scoped to individual properties. Each estate agency deployment operates with its own isolated database.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, built using Vite
- **Routing**: Wouter for client-side routing with separate agent (`/agent/*`) and client (`/client/*`) route hierarchies
- **State Management**: TanStack React Query for server state, local React state and a custom shared store (`sharedStore.ts`) using localStorage for cross-component synchronization
- **UI Components**: shadcn/ui component library with Radix UI primitives, styled using Tailwind CSS v4 with CSS variables
- **Styling**: Tailwind CSS with custom theme configuration, using a slate/stone professional color palette with serif typography for headings

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Location**: `shared/schema.ts` contains all database table definitions using Drizzle's pgTable syntax
- **API Pattern**: RESTful API endpoints under `/api/*` routes with role-based middleware

### Data Model (Property-Centric)
The property is the central entity. Key tables include:
- **users**: Stores both agents and clients with a role enum (`agent` | `client`)
- **properties**: Core entity linked to agents (owners) and clients (tenants)
- **documents**: Property-scoped with status workflow (pending → uploaded → in_review → approved/rejected)
- **payments**: Rent schedule entries with status tracking
- **reports**: Client-submitted issues with messaging thread support
- **messages**: Direct messaging between agents and clients
- **helpLinks**: Agent-managed service provider links with category enum (internet, cleaning, pest, utilities, removals, other)

### Document Checklist Template System
The system uses a "snapshot" pattern for client onboarding checklists:
- **checklistStageTemplates**: Agent-defined stages (e.g., "ID Verification", "Income Proof") per property
- **checklistRequirementTemplates**: Specific document requirements within each stage
- **clientChecklistStages**: Snapshot of stages created when client is added to property
- **clientChecklistRequirements**: Snapshot of requirements with per-client status tracking

**Key Design Pattern**: When an agent adds a client to a property, the system snapshots the current template to create a personalized checklist. This uses `propertyClient.id` (not `userId`) as the linkage so checklists exist before clients log in.

### Authentication
- **Method**: Replit Auth integration via Google OAuth
- **Session Storage**: PostgreSQL-backed sessions using `connect-pg-simple`
- **Role Determination**: User role determined post-authentication based on email address matching against the users table
- **Admin Seeding**: A seed function creates an initial admin agent on startup

### Build System
- **Development**: Vite dev server with HMR for frontend, tsx for backend
- **Production**: Custom build script bundles server with esbuild, client with Vite
- **Output**: Compiled to `dist/` directory with static assets in `dist/public/`

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Used for schema migrations (`npm run db:push`)

### Authentication
- **Replit Auth**: OAuth provider integration for Google login
- **express-session**: Session management with PostgreSQL store

### UI/Frontend Libraries
- **Radix UI**: Accessible component primitives (dialog, dropdown, tabs, etc.)
- **Framer Motion**: Animation library for transitions and micro-interactions
- **Lucide React**: Icon library
- **date-fns**: Date formatting and manipulation
- **cmdk**: Command menu component

### File Storage
- **Replit Object Storage**: Google Cloud Storage-backed file storage for document uploads
- **Presigned URL Upload Flow**: Client requests presigned URL → uploads directly to GCS → stores object path in database
- **Location**: `server/replit_integrations/object_storage/` contains the storage service and routes
- **Client Hook**: `useUploadChecklistRequirement` in `client/src/hooks/use-client-data.ts` handles the 3-step upload flow
- **File Serving**: Files served via `/objects/*` route with authentication

### Validation
- **Zod**: Schema validation for forms and API data
- **drizzle-zod**: Generates Zod schemas from Drizzle table definitions
- **@hookform/resolvers**: Zod resolver for react-hook-form integration

## Deployment Configuration

The system is designed for easy "remix and deploy" setup for new clients. All client-specific configuration is done via environment variables.

### Required Environment Variables

**Agent Access Control:**
- `AGENT_EMAILS` - Comma-separated list of agent email addresses that are authorized to login (e.g., `agent1@example.com,agent2@example.com`)

**Agency Branding:**
- `AGENCY_NAME` - The name of the estate agency
- `AGENCY_TAGLINE` - Agency tagline/slogan (optional)
- `AGENCY_ADDRESS` - Office street address
- `AGENCY_CITY` - City/region
- `AGENCY_POSTCODE` - Postal code
- `AGENCY_EMAIL` - Contact email
- `AGENCY_PHONE` - Contact phone number

**Bank Details (for client payments):**
- `BANK_ACCOUNT_NAME` - Account holder name
- `BANK_NAME` - Bank name
- `BANK_SORT_CODE` - Sort code
- `BANK_ACCOUNT_NUMBER` - Account number
- `BANK_IBAN` - IBAN (optional)
- `BANK_BIC` - BIC/SWIFT code (optional)

### Setup Workflow

1. Remix the clean master version
2. Set environment variables in the Replit Secrets panel
3. Deploy - agents can login and start adding properties

### Authorization Flow

- Agents in `AGENT_EMAILS` are auto-provisioned on first login
- Clients are authorized when their email is added to a property by an agent
- Unauthorized emails are rejected completely (no access)