# Live-Cutover Checklist — Event Report (HSE)

**Purpose:** Track every blocker that must close before pointing the app at a
**live, In-Kingdom (KSA) Supabase** backend holding **PDPL-sensitive workplace
injury/health data and photographs**.

**Status legend:** `[ ]` open · `[~]` in progress · `[x]` done & verified.

> **Hard rule.** Do **not** connect live data until every item in
> [§6 Cutover gate](#6-cutover-gate) is verified. The application-layer code is
> complete; the items below are **infrastructure, vendor, and legal** actions
> that cannot be closed by a commit.

> **Sequencing note.** Items are grouped by priority (P0→P4). P0 (residency)
> unblocks the technical verification in P1–P3. The legal/sign-off track (P4) and
> host/DPO selection should **start on day one** because they have the longest
> human lead time, but final sign-off (B10) can only happen after P0–P3 close.

---

## P0 — Provision In-Kingdom infrastructure (unblocks everything)

| ID    | Item                                                                                | Owner | Status | Verification                                                                              |
| ----- | ----------------------------------------------------------------------------------- | ----- | ------ | ----------------------------------------------------------------------------------------- |
| B1    | Choose & contract a **KSA-resident** host; self-host Supabase (DB + Storage + Auth) | `[ ]` | `[ ]`  | Signed contract names a KSA region; **no** `*.supabase.co` cloud in the production path.  |
| A1/A2 | Provision the project; apply migrations `0001_schema.sql` → `0002_rls.sql`          | `[ ]` | `[ ]`  | Migrations applied in order; tables + RLS present; app **boots** (env validation passes). |
| A2    | Load a **scrubbed** seed in **dev only** (`set app.allow_seed = 'on';`)             | `[ ]` | `[ ]`  | Seed runs only after the opt-in gate; production DB is **never** seeded.                  |
| C7    | Enable **backups / PITR**, KSA-resident                                             | `[ ]` | `[ ]`  | Backup + point-in-time-recovery enabled; backup storage region confirmed in-Kingdom.      |

## P1 — Verify the sensitive-data lockdown (highest legal risk)

| ID    | Item                                                  | Owner | Status | Verification                                                                                                                |
| ----- | ----------------------------------------------------- | ----- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| B2/C3 | Cross-tenant isolation proven on the **live** backend | `[ ]` | `[ ]`  | Sign in as Company A and B: A **cannot** read B's events/CAs/inspections **nor open B's photo URLs**.                       |
| B4    | DSR destruction behaves correctly on real data        | `[ ]` | `[ ]`  | A `destruction` DSR redacts the profile, **retains** statutory incident records with a logged refusal, writes an audit row. |

## P2 — Bind vendors (detection + notifications)

| ID    | Item                                                                  | Owner | Status | Verification                                                                                  |
| ----- | --------------------------------------------------------------------- | ----- | ------ | --------------------------------------------------------------------------------------------- |
| A4/B5 | Bind **KSA-resident** monitoring to the `reportError` seam            | `[ ]` | `[ ]`  | An induced error surfaces in the collector **with its `digest`**.                             |
| B5    | Rehearse the **72h SDAIA** breach SOP (`docs/breach-response-sop.md`) | `[ ]` | `[ ]`  | Table-top exercise completed; notification path + owner confirmed; timing < 72h demonstrable. |
| A3    | Bind a **KSA-resident** transactional email provider                  | `[ ]` | `[ ]`  | DSR/DPO notice and an attendee email both deliver from the in-Kingdom provider.               |

## P3 — Auth & abuse hardening (mostly dashboard config)

| ID    | Item                                                                                 | Owner | Status | Verification                                                                     |
| ----- | ------------------------------------------------------------------------------------ | ----- | ------ | -------------------------------------------------------------------------------- |
| A8/C2 | Supabase Auth: **MFA** (privileged roles), lockout, leaked-password, session timeout | `[ ]` | `[ ]`  | Privileged login requires MFA; repeated failures lock out; idle session expires. |
| A6/C4 | Move rate limiting to a **KSA-resident shared store**                                | `[ ]` | `[ ]`  | Limit persists across instances/deploys (not per-process in-memory).             |

## P4 — Legal accountability & sign-off (human; start early, finish last)

| ID  | Item                                                                 | Owner | Status | Verification                                                                   |
| --- | -------------------------------------------------------------------- | ----- | ------ | ------------------------------------------------------------------------------ |
| B6  | Appoint & **register a monitored DPO**; set real env values          | `[ ]` | `[ ]`  | `NEXT_PUBLIC_DPO_*` + `NEXT_PUBLIC_LEGAL_*` set; DPO inbox monitored.          |
| B9  | Decide on **column-level encryption** for health/injury fields       | `[ ]` | `[ ]`  | Documented key-management decision (apply `pgcrypto`/Vault or accept at-rest). |
| B10 | DPO/SRO **sign** RoPA, DPIA, lawful-basis matrix                     | `[ ]` | `[ ]`  | Signatures + dates recorded in `docs/*.md`; DPIA residual risk accepted.       |
| B7  | Final Arabic legal copy reviewed by counsel; consent version stamped | `[ ]` | `[ ]`  | Arabic privacy/terms render; signup records the current consent version.       |

---

## 6. Cutover gate

Do **not** point the app at live data until **all** of the following pass:

1. `[ ]` DB + storage + backups verified **physically in KSA** (host console).
2. `[ ]` Cross-tenant test passes (B2/C3): A cannot read B's records **or** open B's photo URLs.
3. `[ ]` A `destruction` DSR redacts the profile, **retains** statutory incident records with a logged refusal, and writes an immutable `audit_logs` row.
4. `[ ]` An induced error surfaces in monitoring **with its `digest`** (A4/B5).
5. `[ ]` Arabic privacy/terms render; consent version recorded on signup (B7).
6. `[ ]` `npm test`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build` all pass (CI gate).
7. `[ ]` RoPA / DPIA / lawful-basis matrix **signed** by DPO/SRO (B10).

---

## Critical-path dependencies

- **P0 → P1/P2/P3:** the live backend must exist before any cross-tenant, DSR,
  monitoring, or auth behavior can be _verified_ (the code is already written).
- **P0 → P4 (B10):** the DPIA conditions its "Low" residual risk on verified
  In-Kingdom residency, bound monitoring + rehearsed SOP, and the B9 encryption
  decision — so sign-off comes **after** P0–P3 close.
- **Start early (longest lead time):** B1 (host selection/contract) and B6 (DPO
  appointment) gate everything else and depend on procurement/legal, not code.
