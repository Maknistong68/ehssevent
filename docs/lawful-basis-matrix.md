# Lawful-Basis-Per-Purpose Matrix

**Controller:** `[Legal entity name]` · **Version:** `1.0` · **Last reviewed:** `[date]`
**Legal framework:** Personal Data Protection Law (PDPL), Royal Decree M/19 and Implementing Regulations.

| #   | Processing purpose                     | Data categories                                           | Sensitive?   | Primary lawful basis (PDPL)           | Secondary basis                   | Notes & key consequence                                                                                                                         |
| --- | -------------------------------------- | --------------------------------------------------------- | ------------ | ------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | User account & access management       | Identity, role, credentials, login data                   | No           | **Necessity for the agreement**       | Consent (Terms)                   | Consent covers T&C acceptance only — not the data processing itself.                                                                            |
| P2  | **Incident reporting & investigation** | Names, narrative, location/GPS, **injury/health**, photos | **Yes**      | **Legal obligation** (labor / OSH)    | Legitimate interest (safety)      | **Do NOT rely on consent.** Sensitive data processed under the "required by law / occupational health" exception. Underpins refusal of erasure. |
| P3  | Statutory reporting to authorities     | Incident + injury details                                 | **Yes**      | **Legal obligation**                  | —                                 | Mandatory; data subject cannot object.                                                                                                          |
| P4  | Corrective action management           | Assignee/approver identity, evidence photos               | Sometimes    | **Legitimate interest**               | Legal obligation (mandated fixes) | Minimize any health detail in CA notes/photos.                                                                                                  |
| P5  | Safety inspections                     | Inspector identity, notes, photos                         | Generally no | **Legitimate interest**               | —                                 | Document the legitimate-interest balancing test.                                                                                                |
| P6  | Audit logging & security               | Actor/target identity, actions, metadata                  | No           | **Legal obligation** (security duty)  | Legitimate interest (security)    | Do not log sensitive payloads; keep append-only.                                                                                                |
| P7  | Consent & DSR records                  | Consent stamps, request records                           | No           | **Legal obligation** (accountability) | —                                 | This is how you _prove_ the bases for P1–P9.                                                                                                    |
| P8  | Email notifications to attendees       | Name, email                                               | No           | **Consent** (opt-in flag)             | —                                 | Genuinely optional, so consent is appropriate and withdrawable.                                                                                 |
| P9  | Admin troubleshooting / impersonation  | Target's visible data                                     | Possibly     | **Legitimate interest**               | —                                 | Requires safeguards: read-only, audited, time-boxed.                                                                                            |

---

## How to read this matrix (the core insight)

- **Where consent is the right basis:** only **P8** (and the _acceptance_ action in P1).
  Consent is freely given and withdrawable there.
- **Red flag:** anything that previously relied on consent for **P2 / P3** must move to
  **legal obligation**. In an employer-to-worker context, consent is not "freely given,"
  and an injured worker cannot refuse to be recorded — so consent is the _wrong_ and
  weaker basis.
- **Erasure consequence:** because P2 / P3 rest on legal obligation + statutory retention
  (10 years), a **destruction request for incident records can be lawfully declined** —
  something a consent basis could not justify.
- **Sensitive-data rule:** every row marked sensitive requires heightened controls
  (encryption, least-privilege access, DPIA coverage) and stricter cross-border treatment.

## Legitimate-interest balancing tests (P4, P5, P6, P9)

Each test follows the three-part structure: **(a) Purpose** (is the interest
legitimate?), **(b) Necessity** (is the processing needed for it?), **(c) Balance**
(does it override the data subject's interests/rights, given safeguards?).

- **P4 — Corrective action management.** (a) Closing safety actions arising from
  incidents/inspections is a legitimate operational interest and is often mandated.
  (b) Tracking assignee/approver identity and completion evidence is necessary to
  prove remediation occurred. (c) Impact is low: actors are workplace personnel
  acting in a professional capacity, access is RLS-scoped to the relevant
  organization, and any health detail in CA notes/photos is minimized. **Balance:
  passes.**
- **P5 — Safety inspections.** (a) Assuring site safety via template inspections is
  a legitimate interest. (b) Inspector identity, notes, and finding photos are
  necessary to attribute and act on findings. (c) Data is generally non-sensitive,
  professional-context, RLS-scoped; photos are handled with the same private-storage
  controls as incidents. **Balance: passes.**
- **P6 — Audit logging & security.** (a) Tamper-evident accountability is both a
  legitimate interest and a PDPL security duty. (b) Recording actor/target/action/
  timestamp is necessary for security and non-repudiation. (c) No sensitive payloads
  are logged, the store is append-only with restricted read, and subjects are
  informed via the privacy notice. **Balance: passes.**
- **P9 — Admin troubleshooting / impersonation.** (a) Resolving user-reported issues
  is a legitimate operational interest. (b) Viewing the platform as the affected user
  is sometimes necessary to reproduce a problem. (c) This is the most intrusive
  activity, so it is constrained: **read-only**, **time-boxed**, **reason-captured**,
  and **start/stop audit-logged**, restricted to Admin/Support. With these
  safeguards the residual impact is acceptable. **Balance: passes with safeguards.**

## Resolved in this revision

- **Retention values** feeding P4–P8 are confirmed against the RoPA (P4 follows the
  parent incident/inspection lifecycle; P5 5y; P6 7y; P7 5y; P8 12m).
- **Cross-border:** In-Kingdom (KSA) hosting across all purposes — see RoPA.

## Remaining placeholder (requires business sign-off — do not fabricate)

- `[Legal entity name]` — set from `NEXT_PUBLIC_LEGAL_ENTITY_NAME` once the operating
  entity is confirmed.
