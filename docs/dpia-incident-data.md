# Data Protection Impact Assessment (DPIA)

## Processing activity P2 — HSE incident reporting & investigation (injury / health data)

**Controller:** `[Legal entity name]`
**Assessment owner / DPO:** `[dpo@your-domain]`
**Version:** `0.1 (DRAFT skeleton)`
**Date started:** `[date]`
**Status:** `Draft / In review / Approved`
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
- **Data flows:** `[Diagram or bullet flow: capture device -> app -> database ->
  object storage (photos) -> regulator export]`. Complete with the chosen
  architecture.
- **Technologies / processors:** Hosting `[name + region]`; object storage
  `[name + region]`; any email/SMS provider `[name]`.

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

| Question | Assessment |
|----------|------------|
| Lawful basis (per purpose) | **Legal obligation** (labor / OSH); sensitive data under the law/occupational-health exception. **Not** consent. |
| Is the processing necessary to achieve the purpose? | `[Yes — explain why incident/injury data cannot be reduced further]` |
| Could the purpose be achieved with less data? | `[Data-minimization review: which fields are truly required vs optional]` |
| Are health fields minimized & segregated? | `[Describe column-level segregation / encryption]` |
| Function creep controls | `[How is the data prevented from being reused for unrelated purposes, e.g. discipline?]` |
| Transparency to data subjects | Privacy notice (PDPL Art. 4 right to be informed); on-site signage for imaging `[confirm]`. |
| Data-subject rights honored | Access, copy, correction, destruction (subject to the 10-year retention exception). |
| Accuracy controls | `[Edit/audit trail; concurrency guard; correction workflow]` |
| International transfer | `[TBD — depends on hosting region; if outside KSA, transfer assessment + safeguards required]` |

---

## 4. Risk assessment

Score each risk: **Likelihood** (Low/Med/High) x **Severity to data subjects**
(Low/Med/High) → **Overall** (Low/Med/High).

| ID | Risk to individuals | Likelihood | Severity | Overall | Notes |
|----|---------------------|------------|----------|---------|-------|
| R1 | Unauthorized access to injury/health data (broken access control / weak RLS) | `[ ]` | High | `[ ]` | Sensitive data exposure. |
| R2 | Injury photographs revealing identity / biometric data | `[ ]` | High | `[ ]` | Faces + medical context. |
| R3 | Cross-tenant leakage (contractor sees another org's data) | `[ ]` | High | `[ ]` | Multi-tenant RLS failure. |
| R4 | Unlawful cross-border transfer via hosting/storage region | `[ ]` | High | `[ ]` | Transfer-rule breach. |
| R5 | Excessive retention beyond legal need | `[ ]` | Med | `[ ]` | No automated destruction. |
| R6 | Function creep (incident data used for discipline/HR) | `[ ]` | High | `[ ]` | Purpose-limitation breach. |
| R7 | Re-identification via GPS + timestamp linking a worker to a place/time | `[ ]` | Med | `[ ]` | Location precision. |
| R8 | Insider misuse via admin impersonation | `[ ]` | Med | `[ ]` | Needs audited, time-boxed access. |
| R9 | Data breach without timely regulator/data-subject notification | `[ ]` | High | `[ ]` | 72-hour SDAIA duty. |
| R10 | Processing of third-party/visitor data without notice | `[ ]` | Med | `[ ]` | Transparency gap. |

---

## 5. Measures to reduce risk

| Risk | Mitigation / control | Reduces to | Owner | Status |
|------|----------------------|-----------|-------|--------|
| R1 | Row-level security; least-privilege roles; encryption at rest; column-level encryption for health fields | `[ ]` | `[ ]` | `[ ]` |
| R2 | Authenticated photo proxy; per-access logging; optional face redaction; storage access controls | `[ ]` | `[ ]` | `[ ]` |
| R3 | Tenant-scoped RLS policies; automated access tests in CI | `[ ]` | `[ ]` | `[ ]` |
| R4 | In-Kingdom hosting OR documented transfer assessment + approved safeguards | `[ ]` | `[ ]` | `[ ]` |
| R5 | Scheduled retention/destruction jobs; deletion logged to immutable audit | `[ ]` | `[ ]` | `[ ]` |
| R6 | Purpose-limitation policy; access confined to HSE workflow; audit review | `[ ]` | `[ ]` | `[ ]` |
| R7 | Restrict GPS precision where feasible; access on need-to-know | `[ ]` | `[ ]` | `[ ]` |
| R8 | Mandatory start/stop audit logging; read-only; time limit; reason capture | `[ ]` | `[ ]` | `[ ]` |
| R9 | Breach-detection alerting; SDAIA + data-subject notification SOP (<= 72h) | `[ ]` | `[ ]` | `[ ]` |
| R10 | On-site notices; layered privacy information; lawful basis (legal obligation) documented | `[ ]` | `[ ]` | `[ ]` |

---

## 6. Outcome & sign-off

- **Residual risk after mitigations:** `[Low / Medium / High]`
- **Is residual risk acceptable?** `[Yes / No]`
- **Prior consultation with SDAIA required?** `[Only if high residual risk remains]`
- **DPO advice:** `[summary]`
- **Decision:** `[Approve / Approve with conditions / Reject]`

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Assessment owner | `[ ]` | `[ ]` | `[ ]` |
| DPO | `[ ]` | `[ ]` | `[ ]` |
| Senior responsible owner | `[ ]` | `[ ]` | `[ ]` |

---

## 7. Review schedule
- **Next scheduled review:** `[date]`
- **Triggers for early review:** new data field/category, change of processor or
  hosting region, new sharing recipient, security incident, change of lawful basis.
