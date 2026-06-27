# Personal-Data Breach Response SOP (PDPL / SDAIA 72-hour duty)

**Controller:** `[Legal entity name]`
**Owner:** Data Protection Officer (DPO) — `NEXT_PUBLIC_DPO_EMAIL`
**Version:** `1.0`
**Legal framework:** Personal Data Protection Law (PDPL), Royal Decree M/19 and its
Implementing Regulations. Sensitive (health/injury) data is in scope, so breaches are
treated as high-severity by default.

> **Statutory clock.** A qualifying personal-data breach must be notified to **SDAIA
> without undue delay**, and affected data subjects must be informed where the breach
> is likely to cause them harm. Treat **72 hours from detection** as the hard ceiling
> and start the clock the moment a breach is _suspected_, not when it is confirmed.

---

## 1. Detection inputs

A breach may surface from any of:

- **Error monitoring** — `reportError` forwards to `NEXT_PUBLIC_MONITORING_DSN`
  (`src/lib/observability/logger.ts`). Alert on spikes, auth failures, and 5xx storms.
- **Audit trail** — `audit_logs` (immutable). Watch for anomalous `photo.access`,
  cross-org reads, impersonation, or bulk exports.
- **Storage access logs** — the authenticated photo proxy (`/api/photos`) logs every
  sensitive-photo read; unexpected volume or cross-tenant attempts are a signal.
- **Rate-limit 429s**, failed-login bursts, and infrastructure/host alerts.
- **Human reports** — staff, data subjects, or the hosting provider.

## 2. Severity triage (DPO, immediately on suspicion)

| Factor        | Raises severity                                           |
| ------------- | --------------------------------------------------------- |
| Data category | **Health/injury, photos, biometric → automatically high** |
| Volume        | Many subjects / records                                   |
| Cross-tenant  | Company A data exposed to Company B                       |
| Containment   | Still ongoing / attacker retains access                   |
| Reversibility | Data exfiltrated or destroyed vs. transient exposure      |

If sensitive data is involved, assume notifiable unless the DPO documents why it is not.

## 3. Response timeline

| When      | Action                                                                                                                               | Owner         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------- |
| **0–1h**  | Open incident record; assign incident lead; preserve logs (`audit_logs`, monitoring, host).                                          | DPO / on-call |
| **0–4h**  | **Contain**: revoke compromised sessions/keys, rotate `SUPABASE_SERVICE_ROLE_KEY`, disable affected accounts, patch the access path. | Eng           |
| **4–24h** | **Assess scope**: which tables/buckets/subjects; reconstruct from the immutable audit trail.                                         | Eng + DPO     |
| **≤72h**  | **Notify SDAIA** if qualifying (see §4).                                                                                             | DPO           |
| **ASAP**  | **Notify affected data subjects** where harm is likely; provide guidance.                                                            | DPO           |
| **Post**  | Root-cause analysis; remediation; update DPIA/RoPA; close incident.                                                                  | DPO + Eng     |

## 4. SDAIA notification — minimum content

- Nature of the breach and categories/approximate number of subjects and records.
- Categories of data, **flagging sensitive (health/injury/photos)**.
- Name and contact of the DPO.
- Likely consequences to data subjects.
- Measures taken or proposed to address it and mitigate harm.
- Timeline of detection, containment, and assessment.

If full details are not yet known within 72 hours, send an initial notification and
follow up in phases — do **not** wait for completeness before notifying.

## 5. Containment runbook (technical)

1. Rotate `SUPABASE_SERVICE_ROLE_KEY` and any leaked anon/JWT secrets; force re-auth.
2. Verify storage bucket is **private** and RLS policies intact (`0002_rls.sql`);
   confirm the photo proxy still enforces org-scoping.
3. Pull the relevant `audit_logs` and monitoring window; snapshot before remediation.
4. Confirm hosting, DB, storage, backups remain **In-Kingdom** (no exfil to non-KSA
   regions).
5. Capture indicators of compromise; file the RCA.

## 6. Records

Every breach — notifiable or not — is logged with its facts, reasoning, and decision
(PDPL accountability). Keep breach records for at least the incident-retention period.

---

### Contacts

- **DPO:** `NEXT_PUBLIC_DPO_EMAIL` / `NEXT_PUBLIC_DPO_PHONE`
- **Hosting provider (KSA):** `[provider + emergency contact]`
- **SDAIA reporting channel:** `[official SDAIA breach-reporting URL/contact]`
