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
- **Processors:** Hosting / identity provider `[name]`.
- **Cross-border:** `[TBD — depends on hosting region; safeguards required if outside KSA]`.
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
- **Processors:** Hosting `[name]`; object storage for photos `[name]`.
- **Cross-border:** `[TBD — sensitive-data transfer requires a PDPL transfer assessment + safeguards]`.
- **Retention:** **Minimum 10 years** for incident records (labor-law requirement).
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
- **Retention:** `[e.g., 5 years]` or aligned to project records.
- **Security:** As A2.

## A6 — Audit logging, accountability & security

- **Purpose:** Record who did what (including admin impersonation) for accountability, security, and tamper-evidence.
- **Data subjects:** Platform users (actors and targets).
- **Personal data:** Actor identity / email; action; target reference; change metadata; timestamps.
- **Sensitive data:** None (do not log sensitive payloads).
- **Lawful basis:** **Legal obligation** (PDPL security duty); **Legitimate interest** (security / fraud prevention).
- **Recipients / access:** Administrators; Support; DPO.
- **Retention:** `[e.g., 7 years]`.
- **Security:** Append-only / immutable store; no update/delete; restricted read.

## A7 — Consent & data-subject-rights (DSR) records

- **Purpose:** Prove a valid lawful basis; receive and fulfil access / copy / correction / destruction requests within the statutory window.
- **Data subjects:** Platform users / data subjects raising requests.
- **Personal data:** Consent timestamps + policy version; DSR type, note, status, deadline, resolution.
- **Lawful basis:** **Legal obligation** (PDPL compliance & accountability).
- **Recipients / access:** DPO; administrators.
- **Retention:** Consent proof for duration + limitation period; DSR records `[e.g., 5 years]`.
- **Security:** Restricted access; audit-logged.

## A8 — Email notifications to attendees (optional feature)

- **Purpose:** Notify named attendees of an event by email where the reporter opts in.
- **Data subjects:** Attendees.
- **Personal data:** Name, email; event reference.
- **Lawful basis:** **Consent** (the per-event opt-in flag).
- **Recipients / access:** Email / transactional provider `[name]` (Processor).
- **Cross-border:** `[TBD per provider region]`.
- **Retention:** Notification logs `[e.g., 12 months]`.
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

## Placeholders to complete

- `[Legal entity name]`, `[dpo@your-domain]`
- Hosting / storage / email **Processor names + regions**
- Exact **retention values** for A5–A8
- The **cross-border determination** (gated on the hosting-region decision)
