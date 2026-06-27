# Pre-Production Audit — Event Report (HSE) — **SUPERSEDED**

> **Status:** This document **supersedes** the original mock-era readiness audit.
> The original described a demo running on an in-memory mock layer (mock auth,
> no tests, no CI, no RLS, no durable audit). **That state no longer exists** —
> the codebase has moved to a real Supabase backend with real auth, RLS, an
> append-only audit log, a DSR workflow, validated env, and CI. The old findings
> (C-1 mock auth, C-2 zero tests, C-3 in-memory persistence, H-2 no headers,
> H-3 no monitoring, H-4 no CI, H-5 no typed env) are **closed or obsolete** and
> were removed to avoid misleading readers.
>
> The audit below reflects the **actual** current state and the remaining work
> required before connecting a **live, In-Kingdom (KSA) Supabase** backend that
> stores **PDPL-sensitive workplace injury/health data and photographs**.

---

## 1. Current state (verified)

| Area             | State                                                                            | Evidence                                                                  |
| ---------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Auth             | **Real** — resolves the Supabase JWT; no mock/admin fallback                     | `src/lib/auth/guards.ts` (`supabase.auth.getUser()`)                      |
| Authorization    | Single-source permission matrix, shared by guards + UI                           | `src/lib/auth/permissions.ts`                                             |
| RLS              | **Real & comprehensive** — org isolation on every table                          | `supabase/migrations/0002_rls.sql`                                        |
| Audit log        | **Append-only**, immutability triggers, service-role writes                      | `supabase/migrations/0001_schema.sql`, `src/lib/actions/audit.ts`         |
| DSR workflow     | Submit / update / fulfil to `dsr_requests`                                       | `src/lib/actions/dsr.ts`                                                  |
| Env              | **Validated, strict** — Supabase keys required, fail-fast                        | `src/lib/env.ts`                                                          |
| Tests + CI       | Vitest unit tests; GitHub Actions lint/typecheck/test/build                      | `src/lib/auth/*.test.ts`, `.github/workflows/ci.yml`                      |
| Image optimizer  | Env-driven host allowlist (no `**`)                                              | `next.config.ts` (`imageHostnames`)                                       |
| Security headers | HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy              | `next.config.ts`                                                          |
| CSP              | **Per-request nonce** CSP (no `'unsafe-inline'` for scripts)                     | `proxy.ts` (`contentSecurityPolicy`)                                      |
| Storage          | **Private** bucket, org-scoped paths, authenticated proxy + access audit         | `src/lib/storage/index.ts`, `src/app/api/photos/route.ts`, `0002_rls.sql` |
| Monitoring seam  | `reportError` forwards to `NEXT_PUBLIC_MONITORING_DSN`; `error.digest` forwarded | `src/lib/observability/logger.ts`, `src/app/(app)/error.tsx`              |
| Email seam       | Provider-agnostic `sendEmail`; DPO/DSR notification wired                        | `src/lib/email/index.ts`, `src/lib/actions/dsr.ts`                        |
| Retention        | 10-yr scheduled destruction job, audit-logged, secured cron route                | `src/lib/actions/retention.ts`, `src/app/api/cron/retention/route.ts`     |

## 2. Remaining work before live KSA cutover

These items **cannot be completed in application code alone** — they require
infrastructure provisioning, vendor selection, and signed legal/compliance
decisions. They are tracked in the remediation plan, not closable by a commit.

| #       | Item                                                                                                                                            | Why it can't be closed in code                |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| B1 / C7 | **Data residency** — self-hosted Supabase + storage + backups physically in KSA (Supabase Cloud has no KSA region)                              | Infrastructure procurement / hosting decision |
| A1 / A2 | Provision the KSA Supabase project; apply `0001`→`0002` migrations; fill real env keys                                                          | Requires the provisioned backend              |
| A3      | Bind a **KSA-resident** transactional email provider to the `sendEmail` seam                                                                    | Vendor selection + credentials                |
| A4 / B5 | Bind a **KSA-resident** monitoring collector to the `reportError` seam; operationalize the 72h SDAIA breach SOP (`docs/breach-response-sop.md`) | Vendor selection + operational ownership      |
| A5 / B6 | Set real `NEXT_PUBLIC_DPO_*` / `NEXT_PUBLIC_LEGAL_*`; appoint + monitor a registered DPO                                                        | Business/legal identity                       |
| A6 / C4 | Move rate limiting from in-memory to a KSA-resident shared store                                                                                | Infrastructure (shared cache)                 |
| A8 / C2 | Enable Supabase Auth MFA for privileged roles, account lockout, leaked-password protection, session timeout                                     | Supabase Auth dashboard configuration         |
| B9      | Evaluate column-level encryption (pgcrypto/Vault) for health/injury fields                                                                      | DB design + key-management decision           |
| B10     | Complete **and sign off** RoPA / DPIA / lawful-basis matrix (`docs/*.md`)                                                                       | Accountable legal sign-off                    |

## 3. Cutover gate

Do **not** point the app at live data until:

1. DB + storage + backups verified physically in KSA (host console).
2. Cross-tenant test passes: Company A cannot read Company B events/CAs/
   inspections **nor open B's photo URLs**.
3. A `destruction` DSR redacts the profile, **retains** statutory incident
   records with a logged refusal reason, and writes an immutable `audit_logs`
   row.
4. An induced error surfaces in monitoring with its `digest`.
5. Arabic privacy/terms render; consent version is recorded on signup.
6. `npm test`, `npm run typecheck`, `npm run lint`, `npm run format:check`,
   `npm run build` all pass (CI gate).

---

_The full remediation plan with phased steps and per-item evidence lives with the
engineering team's planning notes. This file exists only to correct the stale
original and record the verified current state._
