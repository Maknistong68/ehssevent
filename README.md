# Event Report — HSE Management System

A health, safety, and environment (HSE) incident-reporting platform for
construction projects: event reporting, corrective-action tracking, safety
inspections, and regulatory-compliance documentation.

> **Status: pre-production / demo.** The app currently runs on an in-memory
> **mock layer** (no real database, auth, storage, or email). See
> [`PRE_PRODUCTION_AUDIT.md`](./PRE_PRODUCTION_AUDIT.md) for the readiness audit
> and the integration gates that must be cleared before connecting live data.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS 4** + **shadcn/ui** (`@base-ui/react`)
- **next-intl** for i18n (routing via `proxy.ts`)
- **Zod** + **React Hook Form** for validation
- **Vitest** for unit tests

## Requirements

- **Node.js >= 20.9.0** (see [`.nvmrc`](./.nvmrc) — run `nvm use`)
- npm (lockfile committed; use `npm ci` for reproducible installs)

## Getting started

```bash
nvm use            # selects Node 20 from .nvmrc
npm install
npm run dev        # http://localhost:3000
```

No environment variables are required in mock mode. To configure real services
later, copy [`.env.example`](./.env.example) to `.env.local` and fill in values.
Env vars are validated in [`src/lib/env.ts`](./src/lib/env.ts).

## Scripts

| Script                 | Description                         |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Start the dev server (Turbopack)    |
| `npm run build`        | Production build                    |
| `npm start`            | Serve the production build          |
| `npm run lint`         | ESLint (Next + jsx-a11y + security) |
| `npm run typecheck`    | `tsc --noEmit`                      |
| `npm test`             | Run the Vitest suite once           |
| `npm run test:watch`   | Run Vitest in watch mode            |
| `npm run format`       | Format the repo with Prettier       |
| `npm run format:check` | Verify formatting (CI gate)         |

## Project structure

```
src/
  app/            App Router routes
    (app)/        Authenticated application shell
    (auth)/       Login, signup, legal pages
    api/          Route handlers (export, photos, effective-profile)
  components/     UI and feature components (shadcn/ui in components/ui)
  lib/
    auth/         Session guards + the permission matrix (single source of truth)
    supabase/     Mock client/server stubs (swap point for real Supabase)
    queries/      Read layer (currently backed by mock-data)
    actions/      Server actions (currently mutate in-memory mock-data)
    mock-data.ts  In-memory fixtures
    env.ts        Zod-validated environment access
  types/          Shared enums and types
proxy.ts          next-intl routing (renamed from middleware in Next 16)
```

## Architecture notes

The codebase is structured so the mock layer can be swapped for real services
without touching feature code: queries, actions, auth guards, storage, and email
are centralized. The seams to replace are documented in
[`PRE_PRODUCTION_AUDIT.md`](./PRE_PRODUCTION_AUDIT.md) (Integration Readiness
Gates).

> **Next.js 16 note:** this version has breaking changes from earlier releases.
> Consult `node_modules/next/dist/docs/` before changing framework-level code
> (see [`AGENTS.md`](./AGENTS.md)).

## Continuous integration

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs lint, typecheck,
format check, tests, and build on every push and pull request to `main`.

## Testing

Unit tests live next to the code they cover (`*.test.ts`). Current coverage
focuses on the authorization core — the permission matrix and session guards:

```bash
npm test
```
