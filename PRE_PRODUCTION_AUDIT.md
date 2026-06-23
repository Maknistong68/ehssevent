# Pre-Production Readiness Audit — Event Report

**App:** Event Report (HSE event-reporting SaaS)
**Stack:** Next.js 16.2.9 · React 19.2.4 · TypeScript (strict) · Tailwind 4 · shadcn/ui · next-intl · Zod 4 · React Hook Form
**Audit type:** Pre-production readiness (full production picture) — performed **before** wiring real Supabase data + login.
**Deliverable:** This document only. **No source code was modified.**

---

## 1. Executive Summary

The codebase is a **well-architected demo running entirely on a mock layer**. Auth, data, storage, and email are all stubbed, and every server route currently resolves to a hardcoded `client_admin` identity. The application is **not production-ready** and **must not be pointed at live data or real login** until the Critical items below are closed.

The good news: the seams that integration must replace are **centralized and clearly marked** (Supabase client/server stubs, `guards.ts` session resolution, `storage/`, `email/`, and a query/action layer with 19 explicit `TODO(prod)` markers). This is a deliberate, swap-friendly design — the risk is almost entirely in _unfinished integration_, not in tangled architecture.

**Readiness verdict: NOT READY for production / live login. Ready to _begin_ integration from a documented baseline.**

### Severity tally

| Severity  | Count  |
| --------- | ------ |
| Critical  | 3      |
| High      | 5      |
| Medium    | 5      |
| Low       | 3      |
| **Total** | **16** |

---

## 2. Scope & Method

**Reviewed (static, read-only):**

- Mock service layer: `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`
- Auth/authorization: `src/lib/auth/guards.ts`, `src/lib/auth/permissions.ts`
- Server actions: `src/lib/actions/{auth,audit,dsr,settings,notifications}.ts`
- Integration seams: `src/lib/storage/index.ts`, `src/lib/email/send.ts`, `src/lib/mock-data.ts`
- Config & ops: `next.config.ts`, `proxy.ts`, `package.json`, `.gitignore`, `.env.local`, `README.md`
- App structure: `src/app/(app)`, `src/app/(auth)`, `src/app/api/{effective-profile,export,photos}`, `src/app/(app)/error.tsx`
- Full in-source `TODO` inventory (19 markers)

**Not in scope / not performed:**

- No live environment, no running Supabase project, no real credentials.
- No penetration test, no dynamic/DAST scanning, no `npm audit` against a resolved lockfile.
- No load/performance testing.
- No review of legal text content itself (only the placeholders that gate launch).

---

## 3. Architecture Snapshot

**Framework & libraries (from `package.json`):**

- `next@16.2.9`, `react@19.2.4`, `react-dom@19.2.4`
- TypeScript 5 (strict), Tailwind 4 (`@tailwindcss/postcss`), shadcn/ui + `@base-ui/react`, `lucide-react`
- i18n: `next-intl@4` (with RTL intent for Arabic), routing via `proxy.ts`
- Forms/validation: `react-hook-form@7` + `@hookform/resolvers` + `zod@4`
- Export/data: `exceljs@4`, `date-fns@4`, `sonner` (toasts), `next-themes`

**Route groups:**

- `src/app/(app)/` — authenticated product surface: `dashboard`, `events`, `corrective-actions`, `inspections`, `projects`, `team`, `notifications`, `profile`, `settings`, `admin` (plus `error.tsx`, `not-found.tsx`, `layout.tsx`).
- `src/app/(auth)/` — login / signup / reset.
- `src/app/api/` — `effective-profile`, `export`, `photos` route handlers.

**Mock-layer seams integration must replace:**

| Seam                    | File                             | Current behavior                              |
| ----------------------- | -------------------------------- | --------------------------------------------- |
| Browser Supabase client | `src/lib/supabase/client.ts`     | Returns canned admin user; no-op auth/storage |
| Server Supabase client  | `src/lib/supabase/server.ts`     | Returns canned admin user; empty queries      |
| Session resolution      | `src/lib/auth/guards.ts`         | Cookie → mock profile, else hardcoded admin   |
| Object storage          | `src/lib/storage/index.ts`       | `URL.createObjectURL`, in-memory log          |
| Transactional email     | `src/lib/email/send.ts`          | `console.info` only                           |
| Persistence             | `src/lib/mock-data.ts` + actions | In-memory arrays mutated at runtime           |

Authorization itself (`permissions.ts`) is a clean, single-source-of-truth matrix (`ROLE_PERMISSIONS`, `can()`, event-workflow transitions) and is already shared by server guards and UI gating — it is reusable as-is once a _real_ session feeds it.

---

## 4. Findings by Severity

### CRITICAL

---

**C-1 — Mock authentication authenticates every request as a hardcoded admin**

- **Location:** `src/lib/supabase/client.ts:8`, `src/lib/supabase/server.ts:6`, `src/lib/auth/guards.ts:19` & `:40`
- **Description:** `createClient().auth.getUser()` (both browser and server) unconditionally returns user `00000000-…-0001` / `john.admin@neomport.sa` with `error: null`. `guards.ts` `getSessionProfile()` reads the `mock_session_uid` cookie and, when absent, falls back to `MOCK_SESSION` (`role: 'client_admin'`, `status: 'active'`). `requireUser()` then passes that profile straight through. `signInWithPassword`/`signUp`/`signOut` are no-ops returning success.
- **Risk:** Every route, server action, and API handler is effectively authenticated as an active admin with no credentials. `login()` in `actions/auth.ts:29` simply `redirect('/dashboard')` after shape validation — no password is ever checked. If deployed against real data, this is total auth bypass.
- **Recommendation:** Replace both stub clients with real `@supabase/ssr` clients and rewrite `getSessionProfile()` to resolve the profile from the Supabase JWT (`auth.uid()`), removing the `MOCK_SESSION` fallback entirely. Treat "no session" as unauthenticated (redirect to login), never as admin.

---

**C-2 — Zero automated tests**

- **Location:** `package.json:5-10` (scripts: `dev`, `build`, `start`, `lint` only)
- **Description:** No test runner is present (no Jest/Vitest/Playwright in dependencies), no `test` script, and no test files. The `.gitignore` reserves `/coverage` but nothing produces it.
- **Risk:** The most security-sensitive code about to be written — session resolution, permission matrix enforcement, impersonation read-only rules, event-workflow transitions — has no regression safety net. Authorization bugs introduced during the Supabase swap would ship undetected.
- **Recommendation:** Add Vitest for unit tests (start with `permissions.ts` transitions and `guards.ts` status/role gating) and Playwright for auth/permission E2E flows. Make tests a required CI gate before the live-data cutover.

---

**C-3 — All persistence, storage, and email are in-memory / no-op mocks**

- **Location:** 19 `TODO(prod)` markers across `actions/auth.ts:79,147`, `actions/dsr.ts:44,60,64,133`, `actions/settings.ts:63,77,90,97`, `actions/notifications.ts:31`, `actions/audit.ts:20`, `storage/index.ts:7`, `email/send.ts:13`, `mock-data.ts:766,777`, `constants/legal.ts:15,17,18`
- **Description:** Every mutation writes to module-level arrays in `mock-data.ts` (`MOCK_PROFILES`, `MOCK_AUDIT_LOGS`, `MOCK_DSR_REQUESTS`, `MOCK_NOTIFICATIONS`, etc.) that reset on each server restart. The audit log (`actions/audit.ts:44`) is an in-memory `unshift` — not durable or append-only. Storage uploads create ephemeral object URLs (`storage/index.ts:35-46`). Email is a `console.info` (`email/send.ts:17`).
- **Risk:** No durable data, no Row-Level Security, no real audit trail (a SOC 2 / PDPL accountability requirement), no real notifications or email delivery, no real file storage. Anything that "worked" in the demo silently does nothing in production.
- **Recommendation:** Implement the real DB schema with RLS, an append-only `audit_logs` table, Supabase Storage, and a transactional email provider. Resolve each `TODO(prod)` marker (full inventory in Appendix A).

---

### HIGH

---

**H-1 — Next.js image `remotePatterns` allows any HTTPS host**

- **Location:** `next.config.ts:7-13` (`hostname: "**"`)
- **Description:** The image optimizer is configured to fetch and optimize images from **any** HTTPS hostname.
- **Risk:** The Next image proxy can be coerced into fetching arbitrary remote URLs (SSRF surface) and can be abused as an open image-resizing proxy, inflating cost and exposure.
- **Recommendation:** Whitelist only the Supabase Storage / CDN domains the app actually serves images from.

---

**H-2 — No security headers, CSP, or documented CSRF posture**

- **Location:** `proxy.ts:6-22` (i18n middleware only), no `headers()` in `next.config.ts`
- **Description:** The middleware (`proxy.ts`) only runs `next-intl` routing and explicitly excludes `/api`. There is no Content-Security-Policy, `Strict-Transport-Security`, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, or `Referrer-Policy`. No documented CSRF strategy for the many `'use server'` actions.
- **Risk:** Clickjacking, XSS blast-radius, and mixed-content exposure go unmitigated; server actions' CSRF protection is undocumented and unverified.
- **Recommendation:** Add a security-headers layer (via `next.config.ts headers()` or middleware) with a tuned CSP, and document/verify Next's server-action CSRF protections (same-origin enforcement) for the production origin.

---

**H-3 — No error monitoring / observability**

- **Location:** `src/app/(app)/error.tsx:7-25`
- **Description:** The error boundary renders a generic "Something went wrong" state. The `error.digest` field is destructured in the type but never reported anywhere. No Sentry/OpenTelemetry/logging pipeline exists.
- **Risk:** Production errors (including failed auth/DB calls after the swap) are invisible to the team; no way to correlate user reports to `digest` or trace incidents.
- **Recommendation:** Integrate an error-tracking/observability platform (e.g. Sentry), forward `digest`, and add structured server-side logging for actions and API routes.

---

**H-4 — No CI/CD, container, or deploy configuration**

- **Location:** Repository root (no `.github/workflows/`, no `Dockerfile`, no `vercel.json`)
- **Description:** There is no automated build/lint/test pipeline and no infrastructure-as-config for deployment.
- **Risk:** Nothing enforces lint/test/build before merge; deploys are manual and unreproducible; the Critical test gate (C-2) has nowhere to run.
- **Recommendation:** Add a CI workflow (install → lint → typecheck → test → build) as a required check, and codify the deploy target (Vercel config or Dockerfile).

---

**H-5 — Environment scaffolding is a placeholder; no typed env validation**

- **Location:** `.env.local:1` ("No external services required — app uses mock data"), `.gitignore:33-35`
- **Description:** There is no `.env.example`, no env schema, and no runtime validation. The Supabase URL/keys, email provider keys, and storage config that integration will introduce have no typed contract.
- **Risk:** Misconfigured or missing secrets fail late and opaquely; no guardrail prevents shipping with a missing/anon-vs-service-role key mix-up.
- **Recommendation:** Add a Zod-validated env module (fail fast on boot) and a committed `.env.example` documenting every required key. `.gitignore` already excludes `.env*.local`/`.env*.production` — keep real secrets out of git.

---

### MEDIUM

---

**M-1 — No Prettier; ESLint limited to Next defaults**

- **Location:** `package.json:9` (`"lint": "eslint"`), no `.prettierrc`, deps list (`eslint-config-next` only)
- **Description:** Formatting is unstandardized and linting carries only `eslint-config-next` rules — no `jsx-a11y`, no security/`no-secrets` plugins, no import hygiene rules.
- **Risk:** Inconsistent style and missed accessibility/security lint signals during a phase that adds a lot of new code.
- **Recommendation:** Add Prettier and extend ESLint with `jsx-a11y` and a security plugin; wire both into CI (H-4).

---

**M-2 — PDPL/GDPR contacts and erasure are placeholders/in-memory**

- **Location:** `src/lib/constants/legal.ts:15-18` (DPO email/phone placeholders), `src/lib/actions/dsr.ts:133-162` (in-memory redaction)
- **Description:** The Data Protection Officer contact is `dpo@oxagonport.sa` / `+966-XX-XXX-XXXX` (marked `TODO(OXAGON)`). DSR fulfilment (`fulfilDsr`) redacts only the in-memory `MOCK_PROFILES` row and never emails the DPO/requester (`dsr.ts:64` is a `void DPO_EMAIL`).
- **Risk:** Statutory PDPL data-subject obligations (Article 4 rights, 30-day window in `legal.ts:25`) cannot actually be met; erasure is non-durable and partial.
- **Recommendation:** Confirm real DPO contact details, implement transactional erasure across all tables holding personal data, and wire the DPO/requester notifications.

---

**M-3 — Settings MFA and password change are stubs**

- **Location:** `src/lib/actions/settings.ts:63-86` (`changePassword`), `:88-106` (`setMfaEnabled`)
- **Description:** Both validate input shape and write an audit entry but perform **no** credential verification or MFA enrollment (`TODO(prod)` at `:77` and `:97`). They return `success: true` regardless.
- **Risk:** Users (and admins) will believe MFA is enabled / passwords changed when nothing happened — a dangerous false sense of account security.
- **Recommendation:** Implement real credential update and TOTP enrollment via Supabase Auth; only audit/return success after the provider confirms.

---

**M-4 — No rate limiting on API routes**

- **Location:** `src/app/api/{export,photos,effective-profile}/route.ts`
- **Description:** The export (`exceljs` generation), photo, and effective-profile endpoints have no throttling.
- **Risk:** Expensive export generation and image/photo endpoints are abuse/DoS-amplification targets once publicly reachable.
- **Recommendation:** Add per-user/IP rate limiting (e.g. Upstash/edge middleware) to the API routes, especially `export`.

---

**M-5 — Production-looking identifiers baked into mock data**

- **Location:** `src/lib/mock-data.ts` (e.g. `john.admin@neomport.sa` per `supabase/client.ts:12`), NEOM/Oxagon org names, `constants/legal.ts:19`
- **Description:** Fixtures contain real-looking corporate names (NEOM/Oxagon Port) and email addresses on real-looking domains.
- **Risk:** If any non-demo deployment leaks this data, it implies relationships/PII that may not exist and could embarrass or mislead.
- **Recommendation:** Scrub fixtures to clearly synthetic values (`example.com` domains, generic org names) before any shared/non-demo deployment.

---

### LOW

---

**L-1 — README is the default Next.js template**

- **Location:** `README.md:1` ("bootstrapped with create-next-app")
- **Description:** No project-specific setup, architecture, or integration notes.
- **Risk:** Onboarding friction; the mock-vs-real boundary is undocumented for new contributors.
- **Recommendation:** Replace with real setup, env, and architecture docs (can link this audit).

---

**L-2 — No Node version pin**

- **Location:** `package.json` (no `engines` field), repo root (no `.nvmrc`)
- **Description:** Nothing pins the Node/runtime version for Next 16 / React 19.
- **Risk:** "Works on my machine" build drift across devs and CI.
- **Recommendation:** Add `engines.node` and an `.nvmrc`.

---

**L-3 — Snapshot date hardcoded in mock stats**

- **Location:** `src/lib/mock-data.ts:54` (`const NOW = new Date('2025-06-15T00:00:00Z')`)
- **Description:** Dashboard stats/relative dates are computed against a frozen "now". Fine for a stable demo.
- **Risk:** None in demo; misleading "current" figures if shipped against real data.
- **Recommendation:** Remove the frozen date on cutover so stats use real time.

---

## 5. Production Concerns Matrix

| Concern                     | Current state                                                                             | Gap                                                                | Recommendation                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **Testing**                 | None (no runner, no `test` script)                                                        | No regression safety net for auth/permissions                      | Vitest unit + Playwright E2E; CI gate (C-2)                                       |
| **Observability**           | Generic error boundary; `digest` unused                                                   | No error tracking, no logs/metrics                                 | Sentry + structured logging (H-3)                                                 |
| **Security**                | i18n-only middleware; `images "**"`; no CSP/headers; auth stubbed                         | SSRF surface, no headers, total auth bypass                        | Real auth, header/CSP layer, domain whitelist, rate limiting (C-1, H-1, H-2, M-4) |
| **CI/CD**                   | None                                                                                      | No automated build/lint/test/deploy                                | CI workflow + deploy config (H-4)                                                 |
| **Performance**             | Next image optimizer open to any host; no rate limiting                                   | Cost/abuse on image + export routes                                | Whitelist hosts, throttle API (H-1, M-4)                                          |
| **Accessibility**           | shadcn/Base UI primitives (good baseline); no a11y lint                                   | A11y not enforced/tested                                           | `jsx-a11y` lint + a11y E2E checks (M-1)                                           |
| **i18n / RTL**              | `next-intl` wired via `proxy.ts`; RTL intent                                              | Not load/RTL-tested end-to-end                                     | Add RTL snapshot/E2E coverage                                                     |
| **Compliance (PDPL/SOC 2)** | Consent versioning + DSR workflow modeled; audit log + erasure in-memory; DPO placeholder | No durable audit trail, non-transactional erasure, unconfirmed DPO | Durable append-only audit, real erasure, confirm DPO (C-3, M-2)                   |

---

## 6. Integration Readiness Gates

The codebase is **well-positioned** for the swap: queries, actions, and guards are centralized, and authorization (`permissions.ts`) is decoupled from session source. Each seam below has a clear "ready" definition.

| Seam               | File(s)                                    | "Ready" means                                                                                                   |
| ------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Supabase clients   | `supabase/client.ts`, `supabase/server.ts` | Real `@supabase/ssr` clients; `getUser()` reflects the actual JWT; no canned user                               |
| Session resolution | `auth/guards.ts`                           | `getSessionProfile()` resolves from JWT/`auth.uid()`; `MOCK_SESSION` fallback removed; unauthenticated → login  |
| Storage            | `storage/index.ts`                         | `uploadToStorage` writes to Supabase Storage; returns durable signed/public URL + key; RLS-protected access log |
| Email              | `email/send.ts`                            | `sendEmail` dispatches via a real transactional provider with templating + delivery logging                     |
| Query layer        | `lib/queries/*`                            | Reads hit RLS-protected tables instead of `MOCK_*` arrays                                                       |
| Action layer       | `lib/actions/*`                            | All 19 `TODO(prod)` markers resolved to real INSERT/UPDATE with auditing                                        |
| Audit              | `actions/audit.ts`                         | `logAudit` INSERTs into append-only, RLS-protected `audit_logs`; actor from JWT                                 |
| Config             | `next.config.ts`, env                      | Image hosts whitelisted; typed/validated env; security headers present                                          |

**Gate to flip live:** all Critical items closed, an authenticated unauthorized user is provably blocked (test-backed), and the audit trail is durable.

---

## 7. Prioritized Remediation Checklist

**Critical (block live data/login until all checked):**

- [ ] C-1 Replace mock Supabase clients; rewrite `guards.ts` to resolve session from JWT; remove `MOCK_SESSION` fallback; make `login()` verify credentials
- [ ] C-2 Add Vitest + Playwright; cover `permissions.ts` and `guards.ts`; make tests a CI gate
- [ ] C-3 Implement real DB + RLS, durable append-only audit log, Supabase Storage, transactional email; resolve all 19 `TODO(prod)` markers

**High:**

- [ ] H-1 Whitelist image `remotePatterns` to CDN/storage domains
- [ ] H-2 Add security headers + CSP; document/verify server-action CSRF posture
- [ ] H-3 Integrate error monitoring; forward `error.digest`; add server logging
- [ ] H-4 Add CI pipeline (lint/typecheck/test/build) + deploy config
- [ ] H-5 Add Zod-validated env module + committed `.env.example`

**Medium:**

- [ ] M-1 Add Prettier + ESLint a11y/security plugins; wire into CI
- [ ] M-2 Confirm real DPO contact; implement transactional erasure + DPO/requester notifications
- [ ] M-3 Implement real password change + MFA enrollment via Supabase Auth
- [ ] M-4 Add rate limiting to `api/{export,photos,effective-profile}`
- [ ] M-5 Scrub production-looking identifiers from mock fixtures

**Low:**

- [ ] L-1 Replace default README with project docs
- [ ] L-2 Pin Node via `engines` + `.nvmrc`
- [ ] L-3 Remove frozen snapshot date (`mock-data.ts:54`) on cutover

---

## 8. Appendix

### Appendix A — `TODO(prod)` inventory (file:line → action)

| #   | Location                      | Action required                                                     |
| --- | ----------------------------- | ------------------------------------------------------------------- |
| 1   | `actions/auth.ts:79`          | Create auth user + INSERT profile row with persisted consent fields |
| 2   | `actions/auth.ts:147`         | UPDATE authenticated user's consent stamp from `auth.uid()`         |
| 3   | `actions/dsr.ts:44`           | Replace `MOCK_CURRENT_USER` with Supabase-session user              |
| 4   | `actions/dsr.ts:60`           | INSERT DSR into `dsr_requests` (RLS)                                |
| 5   | `actions/dsr.ts:64`           | Email DPO + requester acknowledgement                               |
| 6   | `actions/dsr.ts:133`          | Real transactional erasure across all PII tables                    |
| 7   | `actions/settings.ts:63`      | Verify current password + update credential via auth provider       |
| 8   | `actions/settings.ts:77`      | Real credential verification + update                               |
| 9   | `actions/settings.ts:90`      | Enroll/unenroll TOTP factor; persist verified state                 |
| 10  | `actions/settings.ts:97`      | Real MFA enrollment/verification flow                               |
| 11  | `actions/notifications.ts:31` | INSERT into `notifications` table + realtime delivery               |
| 12  | `actions/audit.ts:20`         | INSERT into append-only `audit_logs`; actor from JWT                |
| 13  | `storage/index.ts:7`          | Real object storage (upload, durable URL+key, RLS access log)       |
| 14  | `email/send.ts:13`            | Real transactional email (templating, retries, delivery logging)    |
| 15  | `mock-data.ts:766`            | Replace with `notifications` table (RLS)                            |
| 16  | `mock-data.ts:777`            | Replace with `notification_preferences` table keyed by `user_id`    |
| 17  | `constants/legal.ts:15`       | Replace DPO placeholders before launch                              |
| 18  | `constants/legal.ts:17`       | Confirm monitored DPO inbox                                         |
| 19  | `constants/legal.ts:18`       | Real DPO phone number                                               |

> Items 1–16 are the persistence/integration TODOs (`actions/*`, `audit.ts`, `storage`, `email`, `mock-data`); items 17–19 are the PDPL DPO-contact placeholders (see M-2).

### Appendix B — Dependency versions

> Run `npm audit` against the resolved lockfile on cutover (not performed in this static audit).

**Dependencies:** `@base-ui/react ^1.5.0`, `@hookform/resolvers ^5.4.0`, `class-variance-authority ^0.7.1`, `clsx ^2.1.1`, `date-fns ^4.4.0`, `exceljs ^4.4.0`, `lucide-react ^1.21.0`, `next 16.2.9`, `next-intl ^4.13.0`, `next-themes ^0.4.6`, `react 19.2.4`, `react-day-picker ^10.0.1`, `react-dom 19.2.4`, `react-hook-form ^7.79.0`, `shadcn ^4.11.0`, `sonner ^2.0.7`, `tailwind-merge ^3.6.0`, `tw-animate-css ^1.4.0`, `zod ^4.4.3`

**Dev dependencies:** `@tailwindcss/postcss ^4`, `@types/node ^20`, `@types/react ^19`, `@types/react-dom ^19`, `eslint ^9`, `eslint-config-next 16.2.9`, `tailwindcss ^4`, `typescript ^5`

---

_Generated as a read-only pre-production audit. No application source files were modified._
