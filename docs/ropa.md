# Record of Processing Activities (RoPA)

**Controller:** `[Legal entity name]`
**Data Protection Officer (DPO):** `[dpo@your-domain]`
**Version:** `1.0`
**Last reviewed:** `[date]`
**Next review due:** `[date]`

**Legal framework:** Personal Data Protection Law (PDPL), Royal Decree M/19 and its
Implementing Regulations.

**Scope:** A Health, Safety & Environment (HSE) incident-management platform that
processes personal and sensitive personal data of workers and platform users.

> **Sensitive-data flag.** Under the PDPL, **health/injury information is Sensitive
> Data** and carries heightened obligations (stricter security, least-privilege
> access, mandatory DPIA, tighter cross-border rules). Activities that touch it are
> marked **[SENSITIVE]**.

---

## A1 — User account & access management

- **Purpose:** Authenticate users; enforce role-based access; manage organizations and teams.
- **Data subjects:** Platform users (admins, managers, users, inspectors) employed by client/contractor organizations.
- **Personal data:** Email, full name, role, organization affiliation, account status, login timestamps, password credential (hashed).
- **Sensitive data:** None.
- **Source:** Directly from the user at registration; admin-created accounts.
- **Lawful basis:** Necessity for performance of the service agreement; Consent (acceptance of Terms).
- **Recipients / access:** Controller administrators; Support role; the user.
- **Processors:** Hosting / identity provider `[name]` — region: **In-Kingdom (KSA)**.
- **Cross-border:** None — the controller has elected **In-Kingdom (KSA) hosting**; account/identity data resides within the Kingdom. No transfer outside KSA (PDPL Art. 29 not engaged). Confirm the processor's region in the host console.
- **Retention:** Account lifetime + 5 years after the employment relationship ends.
- **Security:** TLS; encryption at rest; MFA for privileged roles; row-level security (RLS); audit logging.

## A2 — HSE incident / event reporting & investigation **[SENSITIVE]**

- **Purpose:** Record, investigate, and close workplace incidents, near-misses, and hazards; manage the multi-level approval workflow.
- **Data subjects:** Injured/affected parties; attendees; leadership members; reviewers, investigators, validators, approvers; witnesses; visitors / third parties named in reports.
- **Personal data:** Names of involved parties; event narrative; site / specific area; GPS coordinates (latitude/longitude); event date/time; impacted-party classification; photographs of incidents.
- **Sensitive data:** Injury/illness status (`was_injury`), health-impact descriptions, immediate first-aid / medical actions, injury imagery.
- **Source:** Reporting users; investigators; photographic capture on site.
- **Lawful basis:** **Legal obligation** (labor / occupational safety & health law); **Legitimate interest** in workplace safety. Sensitive data is processed under the PDPL exception for obligations imposed by law and occupational-health purposes — **not** consent.
- **Recipients / access:** Need-to-know within the reporting workflow; the relevant client and contractor organizations (segregated by RLS); regulatory authorities where legally required.
- **Processors:** Hosting `[name]`; object storage for photos `[name]` — both **In-Kingdom (KSA)**.
- **Cross-border:** None — **In-Kingdom (KSA) hosting**; incident/health data, photographs, backups and logs all reside within the Kingdom. No transfer outside KSA; PDPL Art. 29 not engaged. (If this ever changes, a sensitive-data transfer assessment + safeguards become mandatory.)
- **Retention:** **Minimum 10 years** for incident records (labor-law requirement); destroyed thereafter by the scheduled retention job with the deletion logged to the immutable audit trail.
- **Security:** Column-level encryption for health fields; segregated / least-privilege access; authenticated photo proxy with access logging; immutable audit trail.

## A3 — Statutory reporting to authorities

- **Purpose:** Meet mandatory 24-hour and 3-day incident-reporting deadlines and social-insurance reporting obligations.
- **Data subjects:** Injured / affected workers.
- **Personal data / Sensitive:** Incident and injury details necessary for the statutory report. **[SENSITIVE]**
- **Source:** Derived from A2.
- **Lawful basis:** **Legal obligation.**
- **Recipients:** Government labor / OSH authority; social-insurance authority.
- **Cross-border:** N/A (domestic regulators).
- **Retention:** Per the relevant statutory record-keeping period (>= incident retention).
- **Security:** As A2; transmission controls / logging.

## A4 — Corrective action management

- **Purpose:** Assign, track, and verify corrective actions arising from incidents / inspections.
- **Data subjects:** Assignees; approvers; creators.
- **Personal data:** Assignee / approver identity; action descriptions; completion-evidence photographs.
- **Sensitive data:** Possible if photos/notes reference injuries (treat as **[SENSITIVE]** where applicable).
- **Lawful basis:** **Legitimate interest** (safety remediation); **Legal obligation** where remediation is mandated.
- **Recipients / access:** Assigned organization; managers; approvers (RLS-scoped).
- **Retention:** Linked to the parent incident / inspection lifecycle.
- **Security:** As A2.

## A5 — Safety inspections

- **Purpose:** Conduct template-based inspections; score compliance.
- **Data subjects:** Inspectors; individuals referenced in findings.
- **Personal data:** Inspector identity; inspection notes; finding photographs.
- **Sensitive data:** Generally none (treat photos with caution).
- **Lawful basis:** **Legitimate interest** in safety assurance.
- **Recipients / access:** Inspecting organization; managers (RLS-scoped).
- **Retention:** 5 years, aligned to project records (review against project-closure requirements).
- **Security:** As A2.

## A6 — Audit logging, accountability & security

- **Purpose:** Record who did what (including admin impersonation) for accountability, security, and tamper-evidence.
- **Data subjects:** Platform users (actors and targets).
- **Personal data:** Actor identity / email; action; target reference; change metadata; timestamps.
- **Sensitive data:** None (do not log sensitive payloads).
- **Lawful basis:** **Legal obligation** (PDPL security duty); **Legitimate interest** (security / fraud prevention).
- **Recipients / access:** Administrators; Support; DPO.
- **Retention:** 7 years (security / accountability record).
- **Security:** Append-only / immutable store; no update/delete; restricted read.

## A7 — Consent & data-subject-rights (DSR) records

- **Purpose:** Prove a valid lawful basis; receive and fulfil access / copy / correction / destruction requests within the statutory window.
- **Data subjects:** Platform users / data subjects raising requests.
- **Personal data:** Consent timestamps + policy version; DSR type, note, status, deadline, resolution.
- **Lawful basis:** **Legal obligation** (PDPL compliance & accountability).
- **Recipients / access:** DPO; administrators.
- **Retention:** Consent proof for the account lifetime + limitation period; DSR records 5 years.
- **Security:** Restricted access; audit-logged.

## A8 — Email notifications to attendees (optional feature)

- **Purpose:** Notify named attendees of an event by email where the reporter opts in.
- **Data subjects:** Attendees.
- **Personal data:** Name, email; event reference.
- **Lawful basis:** **Consent** (the per-event opt-in flag).
- **Recipients / access:** Email / transactional provider `[name]` (Processor).
- **Cross-border:** None — use an **In-Kingdom (KSA-resident)** transactional email provider; confirm the region in the provider contract / DPA.
- **Retention:** Notification logs 12 months.
- **Security:** Provider DPA; minimal payload.

## A9 — Administrative troubleshooting (impersonation / "view as")

- **Purpose:** Allow administrators to view the platform as another user (read-only) to resolve issues.
- **Data subjects:** The impersonated user (and any data visible in their context).
- **Personal data / Sensitive:** Whatever the target can see, potentially **[SENSITIVE]**.
- **Lawful basis:** **Legitimate interest** (support / operations) with strict safeguards.
- **Recipients / access:** Administrators / Support only.
- **Retention:** Impersonation events retained in the audit log (A6).
- **Security:** Mandatory start/stop audit logging; read-only; time-boxed; reason recommended.

---

## Resolved in this revision

- **Cross-border determination:** **In-Kingdom (KSA) hosting** elected across all
  activities — no transfer outside the Kingdom; PDPL Art. 29 not engaged. (Revert
  to a transfer assessment only if a non-KSA processor is ever introduced.)
- **Retention values:** A1 account +5y; A2/A3 incident **10y** (then audited
  destruction); A5 inspections 5y; A6 audit 7y; A7 DSR 5y; A8 email logs 12m.

## Remaining placeholders (require business / legal sign-off — do not fabricate)

- `[Legal entity name]`, `[dpo@your-domain]` — set from `NEXT_PUBLIC_LEGAL_ENTITY_NAME`
  / `NEXT_PUBLIC_DPO_EMAIL` once the operating entity and registered DPO are confirmed.
- Hosting / storage / email **Processor names** (region is fixed to In-Kingdom above).
- **Review / sign-off dates** and approver identities.
