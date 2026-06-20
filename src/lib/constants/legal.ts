// PDPL / legal governance constants.
//
// These drive the consent-versioning (re-consent) workflow and the Data
// Subject Rights (DSR) contact surface. When the Terms or Privacy Policy text
// changes, bump the matching version here — users whose stored
// `terms_version` / `privacy_version` no longer match will be prompted to
// re-consent on their next visit.

/** Current published version of the Terms of Service. */
export const CURRENT_TERMS_VERSION = '1.0'

/** Current published version of the Privacy Policy (PDPL). */
export const CURRENT_PRIVACY_VERSION = '1.0'

// TODO(OXAGON): replace the placeholders below with the real Data Protection
// Officer contact details before production launch.
export const DPO_EMAIL = 'dpo@oxagonport.sa' // TODO(OXAGON): confirm monitored inbox
export const DPO_PHONE = '+966-XX-XXX-XXXX' // TODO(OXAGON): real DPO phone number
export const DPO_ADDRESS = 'OXAGON Port Development, NEOM, Kingdom of Saudi Arabia'

/**
 * The PDPL statutory window to respond to a data-subject request.
 * Surfaced to the user when they submit a request so expectations are clear.
 */
export const DSR_RESPONSE_DAYS = 30

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
