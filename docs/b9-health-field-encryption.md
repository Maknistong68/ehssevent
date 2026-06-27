# B9 — Column-Level Encryption for Health/Injury Fields (Design Note)

**Status:** `Decision pending — DPO + engineering`
**Linked records:** DPIA mitigation **B9** (R1/R2); RoPA **A2** security; cutover
checklist **P4 / B9**.

> **Purpose of this note.** Give the DPO and engineering a concrete basis to
> decide _whether_ and _how_ to encrypt the health/injury fields beyond the
> platform's existing at-rest disk encryption. This is a **trade-off decision**
> (security vs. queryability vs. key-management burden), **not** a compliance
> shortcut — see [§5](#5-what-this-does-not-change). Nothing here removes the
> In-Kingdom hosting obligation (B1) or the sign-off track.

---

## 1. Scope — which data this covers

In-scope **sensitive** fields on `events` (per RoPA A2 / DPIA §1.2):

- `was_injury` (injury/illness flag)
- health-impact description / narrative health detail
- immediate first-aid / medical action text
- injury **photographs** (already private-bucket + proxy; encryption-at-rest of
  the object is a separate storage-layer control)

**Out of scope:** `org_id`, role, timestamps, non-health event metadata, and
anything RLS keys on. These must stay queryable and are not sensitive.

---

## 2. The central trade-off

If the field is encrypted such that **only the app can decrypt it**, the database
can no longer read the plaintext — which means it can no longer **query, filter,
sort, search, aggregate, or export** that field server-side.

| Capability                            | Today (at-rest only) | App-layer encrypted | DB-side (pgcrypto) |
| ------------------------------------- | -------------------- | ------------------- | ------------------ |
| RLS tenant isolation (keys on org)    | ✅                   | ✅ (unaffected)     | ✅                 |
| Server-side search/filter on health   | ✅                   | ❌                  | ⚠️ (key in DB)     |
| Regulator **XLSX export** of health   | ✅                   | ⚠️ app must decrypt | ⚠️ key in DB       |
| Retention/destruction job             | ✅                   | ✅ (delete row)     | ✅                 |
| DSR access/copy (must return plain)   | ✅                   | ⚠️ app must decrypt | ⚠️                 |
| Plaintext hidden from DB admin/backup | ❌                   | ✅ (strongest)      | ❌ (key in DB)     |
| Plaintext hidden from app server      | ❌                   | ❌                  | ❌                 |

Key reading: **app-layer** encryption gives the strongest confidentiality (DB
admins, backups, and replicas never see plaintext) but **breaks server-side use
of the field**. **pgcrypto** keeps queryability but, if the key lives in the DB,
adds little protection against a DB-level compromise.

---

## 3. Options

### Option A — Status quo (at-rest disk encryption only)

- **Pros:** zero added complexity; full queryability/export; no key management.
- **Cons:** DB admins, backup files, and read replicas hold plaintext health data;
  weakest against an insider/backup-theft scenario (DPIA R1/R2 stay at their
  current residual).
- **When acceptable:** if the In-Kingdom host enforces strong DBA access controls,
  encrypted backups, and audited privileged access — and the DPO accepts the
  residual.

### Option B — DB-side `pgcrypto` with a KSA-resident KMS key

- Encrypt/decrypt in Postgres (`pgp_sym_encrypt`/`decrypt`), key supplied per
  session from an **in-Kingdom KMS/Vault** (never stored in the DB).
- **Pros:** keeps most server-side capability _if_ the key is loaded for the
  query; keys never persist in the DB.
- **Cons:** key transits into DB memory for each use; query performance hit;
  search/index on encrypted columns is impractical; careful session-key handling
  required to avoid leaking the key into logs/`pg_stat_statements`.

### Option C — Application-layer encryption (decrypt only in the app)

- App encrypts before write, decrypts on read, using a key from an **in-Kingdom
  KMS**. DB stores ciphertext only.
- **Pros:** strongest confidentiality; DB, backups, replicas never see plaintext.
- **Cons:** **no server-side query/filter/aggregate** on health fields; export and
  DSR access must round-trip through the app to decrypt; retention job operates on
  whole rows (fine) but cannot inspect health content; adds a hard dependency on
  the KMS being available for every read.

### Option D — Hybrid (recommended starting position)

- **App-layer encrypt** the free-text health detail + first-aid narrative (rarely
  queried; highest sensitivity).
- **Leave queryable** the `was_injury` boolean and any aggregate safety-statistic
  fields (needed for dashboards/exports; low re-identification value on their own).
- Photos stay on the **private bucket + proxy**; add object-level encryption with
  the same KMS.
- **Pros:** protects the most sensitive payload without breaking injury-rate
  reporting or the XLSX export of structured fields.
- **Cons:** two handling paths (encrypted vs. clear) to keep straight; the
  narrative is excluded from server-side search.

---

## 4. Key management (the real decision)

Whatever option is chosen, **the key must be In-Kingdom** and outlive no single
host. Decide:

1. **Where the key lives:** KSA-resident KMS / HSM / Vault (not in the DB, not in
   app source, not in `.env` committed anywhere).
2. **Rotation:** envelope encryption (data-encryption key wrapped by a key-
   encryption key) so rotation re-wraps the DEK without re-encrypting every row.
3. **Access:** which service identity may call decrypt; logged per access.
4. **Break-glass & recovery:** losing the key = losing 10 years of statutory
   records → must reconcile with the **10-year retention obligation** (A2). Key
   custody and backup are themselves a compliance-critical control.
5. **DSR/export impact:** confirm access/copy and regulator export still return
   plaintext via an authorized decrypt path.

---

## 5. What this does NOT change

- ❌ Does **not** remove the In-Kingdom residency obligation (B1). Encrypted
  personal data is still personal data; ciphertext hosted abroad is still a
  cross-border transfer, and the key would pull KSA infra back in anyway.
- ❌ Does **not** make the data anonymous or out of PDPL scope — it stays
  **sensitive personal data** (reversible by design, because the statutory record
  must remain identifiable).
- ❌ Does **not** replace RLS, the audit trail, the photo proxy, or the DPO/sign-
  off track. It is **defense-in-depth** layered on top of them.

---

## 6. Recommendation

Adopt **Option D (hybrid)** as the default: app-layer encrypt the free-text
health/first-aid narrative + object-encrypt photos with an **in-Kingdom KMS**,
while keeping `was_injury` and aggregate safety metrics queryable. Revisit to
full **Option C** only if the DPO requires the structured health flag also be
opaque to the database.

**Open decisions for sign-off:**

- `[ ]` Option (A / B / C / **D**) confirmed by DPO + engineering.
- `[ ]` In-Kingdom KMS/HSM selected; envelope-encryption + rotation policy set.
- `[ ]` Key custody / break-glass reconciled with the 10-year retention duty.
- `[ ]` DSR access/copy and regulator XLSX export verified through the decrypt path.
- `[ ]` DPIA R1/R2 residual re-scored after the chosen control.
