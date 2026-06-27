# Data Protection Impact Assessment (DPIA)

## Processing activity P2 — HSE incident reporting & investigation (injury / health data)

**Controller:** `[Legal entity name]`
**Assessment owner / DPO:** `[dpo@your-domain]`
**Version:** `0.9 (Draft — technical assessment complete; pending DPO/SRO sign-off)`
**Date started:** `[date]`
**Status:** `Draft — pending sign-off`
**Linked records:** RoPA activity **A2**; Lawful-Basis Matrix purpose **P2**.

> **Why this DPIA is required.** The processing involves **Sensitive Data**
> (health/injury), data about **vulnerable data subjects** (workers in an
> employment hierarchy), **systematic monitoring** of a worksite (location/GPS,
> photographs), and **large-scale** records. Under the PDPL Implementing
> Regulations any one of these typically triggers a mandatory impact assessment;
> here, several apply. This DPIA must be completed **before** live processing and
> reviewed when the processing materially changes.

---

## 1. Description of the processing

### 1.1 Nature

- **What happens:** Workers and HSE staff create incident / near-miss / hazard
  reports. Reports may flag injury/illness, capture first-aid actions, attach
  photographs, record GPS coordinates, and name individuals involved. Reports move
  through a multi-level review / investigation / approval / closure workflow.
- **Data flows:** Capture device (browser, on-site photo) → Next.js app (server
  actions / API routes, per-request CSP) → Postgres (RLS-enforced, org-scoped) →
  private object-storage bucket for photos (org-scoped paths, served only via the
  authenticated photo proxy with per-access audit) → manual regulator export
  (XLSX) where legally required. All hops are **In-Kingdom (KSA)**.
- **Technologies / processors:** Hosting `[name]` — **KSA region**; object storage
  `[name]` — **KSA region**; transactional email provider `[name]` — **KSA region**.
  (Vendor names pending procurement; region is fixed to In-Kingdom.)

### 1.2 Scope

- **Personal data categories:** Names of involved parties; event narrative; site /
  specific area; GPS coordinates; event date/time; impacted-party classification.
- **Sensitive data categories:** Injury/illness status; health-impact descriptions;
  immediate medical / first-aid actions; **injury photographs** (potential
  biometric exposure where faces are visible).
- **Volume / frequency:** `[estimated reports per month; number of users; number of sites]`.
- **Geographic scope:** `[sites / jurisdictions]`.
- **Retention:** Minimum **10 years** for incident records (labor-law requirement).

### 1.3 Data subjects

- Injured / affected workers (incl. potentially **vulnerable** individuals).
- Attendees, witnesses, leadership members.
- Reviewers, investigators, validators, approvers.
- Visitors / third parties who did not register with the platform.

### 1.4 Context

- Power imbalance: employer ↔ worker. Data subjects cannot realistically refuse.
- Multi-tenant: client and contractor organizations share scoped access.

---

## 2. Consultation

- **Internal stakeholders consulted:** `[HSE lead, security, legal, IT, DPO]`.
- **Data subjects / representatives:** `[worker representatives / unions consulted? how?]`.
- **Processors:** `[confirm each processor's PDPL/security posture and DPA status]`.
- **Date(s) of consultation:** `[date]`.

---

## 3. Necessity & proportionality

| Question                                            | Assessment                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lawful basis (per purpose)                          | **Legal obligation** (labor / OSH); sensitive data under the law/occupational-health exception. **Not** consent.                                                                                                                                                                                                                 |
| Is the processing necessary to achieve the purpose? | Yes — labor / OSH law requires the employer to record, investigate, and retain incident and injury particulars; the injury status, narrative, location, and supporting photographs are the evidentiary core of a compliant incident record and cannot be omitted without defeating the statutory purpose.                        |
| Could the purpose be achieved with less data?       | Health detail is confined to the incident context (injury flag + impact description + first-aid action); GPS is captured for the incident location only; optional fields (e.g. closeout photos) are gathered only where the workflow requires them. No profiling or analytics on health data beyond aggregate safety statistics. |
| Are health fields minimized & segregated?           | Health/injury fields live on the `events` record under RLS least-privilege access. Disk-level encryption at rest applies today; **column-level encryption (pgcrypto/Vault) for the health/injury columns is a planned mitigation (B9)** — pending key-management decision.                                                       |
| Function creep controls                             | Access is confined to the HSE reporting/investigation workflow and scoped by RLS; the platform exposes no HR/disciplinary surface; purpose-limitation is stated in the privacy notice; admin "view-as" is read-only, time-boxed, and fully audited.                                                                              |
| Transparency to data subjects                       | Privacy notice (PDPL Art. 4 right to be informed), now stating the legal-obligation basis and In-Kingdom residency; on-site signage for imaging `[operational — confirm posted]`.                                                                                                                                                |
| Data-subject rights honored                         | Access, copy, correction, destruction (subject to the 10-year retention exception, with a logged refusal recorded to the DSR record and surfaced to the requester).                                                                                                                                                              |
| Accuracy controls                                   | Validated forms; immutable append-only audit trail of changes; structured review/investigation/approval workflow; correction-request handling via the DSR flow.                                                                                                                                                                  |
| International transfer                              | **None — In-Kingdom (KSA) hosting.** No transfer outside the Kingdom; PDPL Art. 29 not engaged.                                                                                                                                                                                                                                  |

---

## 4. Risk assessment

Score each risk: **Likelihood** (Low/Med/High) x **Severity to data subjects**
(Low/Med/High) → **Overall** (Low/Med/High). The scores below are the **inherent**
(pre-control) risk; residual risk after the controls in §5 is shown there.

| ID  | Risk to individuals                                                          | Likelihood | Severity | Overall | Notes                             |
| --- | ---------------------------------------------------------------------------- | ---------- | -------- | ------- | --------------------------------- |
| R1  | Unauthorized access to injury/health data (broken access control / weak RLS) | High       | High     | High    | Sensitive data exposure.          |
| R2  | Injury photographs revealing identity / biometric data                       | High       | High     | High    | Faces + medical context.          |
| R3  | Cross-tenant leakage (contractor sees another org's data)                    | Med        | High     | High    | Multi-tenant RLS failure.         |
| R4  | Unlawful cross-border transfer via hosting/storage region                    | High       | High     | High    | Transfer-rule breach.             |
| R5  | Excessive retention beyond legal need                                        | High       | Med      | Med     | No automated destruction.         |
| R6  | Function creep (incident data used for discipline/HR)                        | Med        | High     | High    | Purpose-limitation breach.        |
| R7  | Re-identification via GPS + timestamp linking a worker to a place/time       | Med        | Med      | Med     | Location precision.               |
| R8  | Insider misuse via admin impersonation                                       | Med        | Med      | Med     | Needs audited, time-boxed access. |
| R9  | Data breach without timely regulator/data-subject notification               | Med        | High     | High    | 72-hour SDAIA duty.               |
| R10 | Processing of third-party/visitor data without notice                        | Med        | Med      | Med     | Transparency gap.                 |

---

## 5. Measures to reduce risk

Status legend: **Implemented** (in code/migrations today) · **Planned** (designed,
not yet built) · **Operational** (depends on a deployment/process action).

| Risk | Mitigation / control                                                                                     | Reduces to | Owner | Status                                                                                     |
| ---- | -------------------------------------------------------------------------------------------------------- | ---------- | ----- | ------------------------------------------------------------------------------------------ |
| R1   | Row-level security; least-privilege roles; encryption at rest; column-level encryption for health fields | Low        | `[ ]` | Implemented (RLS + at-rest); column encryption **Planned** (B9)                            |
| R2   | Authenticated photo proxy; per-access logging; optional face redaction; storage access controls          | Low        | `[ ]` | Implemented (private bucket + proxy + audit); redaction Planned                            |
| R3   | Tenant-scoped RLS policies; automated access tests in CI                                                 | Low        | `[ ]` | Implemented (RLS + permission tests)                                                       |
| R4   | In-Kingdom hosting OR documented transfer assessment + approved safeguards                               | Low        | `[ ]` | Implemented by design (In-Kingdom); **verify in host console**                             |
| R5   | Scheduled retention/destruction jobs; deletion logged to immutable audit                                 | Low        | `[ ]` | Implemented (`retention.ts` + cron route + audit)                                          |
| R6   | Purpose-limitation policy; access confined to HSE workflow; audit review                                 | Low        | `[ ]` | Implemented (HSE-only surface; read-only impersonation)                                    |
| R7   | Restrict GPS precision where feasible; access on need-to-know                                            | Low        | `[ ]` | Partial — need-to-know RLS Implemented; GPS coarsening Planned                             |
| R8   | Mandatory start/stop audit logging; read-only; time limit; reason capture                                | Low        | `[ ]` | Implemented (impersonation start/stop audited, read-only)                                  |
| R9   | Breach-detection alerting; SDAIA + data-subject notification SOP (<= 72h)                                | Med        | `[ ]` | SOP Implemented (`docs/breach-response-sop.md`); alerting **Operational** (bind collector) |
| R10  | On-site notices; layered privacy information; lawful basis (legal obligation) documented                 | Low        | `[ ]` | Privacy notice + lawful basis Implemented; on-site notices **Operational**                 |

---

## 6. Outcome & sign-off

- **Residual risk after mitigations (technical assessment):** **Low–Medium.** Most
  risks reduce to Low once the platform controls are in place; the residual driver is
  **R9** (breach detection/alerting remains Medium until a KSA-resident monitoring
  collector is bound to the existing `reportError` seam and the SOP is exercised).
- **Conditions to reach Low overall (must close before live processing):**
  1. Verify DB + storage + backups physically In-Kingdom in the host console (R4).
  2. Bind the monitoring collector and rehearse the 72h SDAIA breach SOP (R9).
  3. Decide on column-level encryption for health fields (R1/B9).
- **Is residual risk acceptable?** `[DPO/SRO to confirm at sign-off]`
- **Prior consultation with SDAIA required?** `[Only if high residual risk remains — not anticipated if the conditions above are met]`
- **DPO advice:** `[summary — DPO to complete]`
- **Decision:** `[Approve / Approve with conditions / Reject — pending sign-off]`

> Signatures are intentionally left blank; this DPIA must be reviewed and signed by
> the accountable individuals below before live processing. **Do not** record a
> sign-off that has not occurred.

| Role                     | Name  | Signature | Date  |
| ------------------------ | ----- | --------- | ----- |
| Assessment owner         | `[ ]` | `[ ]`     | `[ ]` |
| DPO                      | `[ ]` | `[ ]`     | `[ ]` |
| Senior responsible owner | `[ ]` | `[ ]`     | `[ ]` |

---

## 7. Review schedule

- **Next scheduled review:** `[date]`
- **Triggers for early review:** new data field/category, change of processor or
  hosting region, new sharing recipient, security incident, change of lawful basis.
