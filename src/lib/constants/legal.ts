// PDPL / legal governance constants.
//
// These drive the consent-versioning (re-consent) workflow and the Data
// Subject Rights (DSR) contact surface. When the Terms or Privacy Policy text
// changes, bump the matching version here — users whose stored
// `terms_version` / `privacy_version` no longer match will be prompted to
// re-consent on their next visit.

import { env } from '@/lib/env'

/** Current published version of the Terms of Service. */
export const CURRENT_TERMS_VERSION = '1.0'

/**
 * Current published version of the Privacy Policy (PDPL).
 *
 * Bumped 1.0 → 2.0: the lawful basis for incident/injury/health processing was
 * corrected from "consent" to "legal obligation" (Saudi Labor Law / OSH / GOSI),
 * and the data-location statement was corrected to In-Kingdom residency. Both are
 * material changes, so existing users are re-prompted to acknowledge the notice.
 */
export const CURRENT_PRIVACY_VERSION = '2.0'

// Data Protection Officer contact surface. Configured via environment so the
// real, monitored details can be set per deployment without code changes; the
// values below are clearly-synthetic placeholders for the mock/demo build.
//
// TODO(prod): set NEXT_PUBLIC_DPO_EMAIL / NEXT_PUBLIC_DPO_PHONE /
// NEXT_PUBLIC_DPO_ADDRESS to the real, monitored DPO contact before launch.
export const DPO_EMAIL = env.NEXT_PUBLIC_DPO_EMAIL ?? 'dpo@example.com'
export const DPO_PHONE = env.NEXT_PUBLIC_DPO_PHONE ?? '+000-00-000-0000'
export const DPO_ADDRESS =
  env.NEXT_PUBLIC_DPO_ADDRESS ??
  'Data Protection Officer (address not configured)'

// Operating legal entity referenced in the Terms of Service and Privacy Policy.
// Env-driven so the real company identity is set per deployment; the fallbacks
// are clearly-generic placeholders for the mock/demo build.
//
// TODO(prod): set NEXT_PUBLIC_LEGAL_ENTITY_NAME / NEXT_PUBLIC_LEGAL_EMAIL to the
// real operating entity and legal contact before launch.
export const LEGAL_ENTITY_NAME =
  env.NEXT_PUBLIC_LEGAL_ENTITY_NAME ?? 'the Service Provider'
export const LEGAL_EMAIL = env.NEXT_PUBLIC_LEGAL_EMAIL ?? 'legal@example.com'

/**
 * The PDPL statutory window to respond to a data-subject request.
 * Surfaced to the user when they submit a request so expectations are clear.
 */
export const DSR_RESPONSE_DAYS = 30

/**
 * Labor-law retention period for HSE incident records. Records younger than
 * this must be kept (and erasure of them lawfully refused); the scheduled
 * retention job destroys records once they pass it. See docs/ropa.md (A2) and
 * the DPIA (R5 mitigation).
 */
export const INCIDENT_RETENTION_YEARS = 10

// The actionable rights a data subject can exercise under PDPL Article 4.
// (The fifth right — to be informed — is satisfied by the privacy notice
// itself, so it is not an on-demand request.) Note these are PDPL's actual
// rights, not the GDPR set: "portability" and a general "right to object" are
// intentionally excluded.
export const DSR_REQUEST_TYPES = [
  'access',
  'copy',
  'correction',
  'destruction',
] as const

export type DsrRequestType = (typeof DSR_REQUEST_TYPES)[number]
