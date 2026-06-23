import { z } from 'zod'

/**
 * Typed, validated environment access.
 *
 * The app currently runs entirely on a mock layer, so every integration key is
 * **optional** here — a missing key is valid in mock mode and the value falls
 * back to `undefined`. The schema still validates the *shape* of any key that
 * IS provided (e.g. a malformed Supabase URL fails fast at boot), and it gives
 * the upcoming Supabase/login integration a single, typed contract to make
 * keys required.
 *
 * `NEXT_PUBLIC_*` vars are referenced as static literals so Next.js can inline
 * them into both the server and client bundles. Do NOT read these via dynamic
 * `process.env[key]` access — that breaks the inlining.
 *
 * TODO(prod): on cutover, change the keys the live build depends on from
 * `.optional()` to required (e.g. `z.string().url()`), so a misconfigured
 * deployment fails at startup instead of at first use.
 */
const envSchema = z.object({
  // ── Supabase (data + auth) ────────────────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // ── Public app origin (used for absolute URLs, CSP, CSRF posture) ──────────
  NEXT_PUBLIC_APP_ORIGIN: z.string().url().optional(),

  // ── Image optimizer allowlist (comma-separated hostnames) ─────────────────
  NEXT_PUBLIC_IMAGE_DOMAINS: z.string().optional(),

  // ── Transactional email provider ──────────────────────────────────────────
  EMAIL_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),

  // ── Error monitoring / observability ──────────────────────────────────────
  NEXT_PUBLIC_MONITORING_DSN: z.string().url().optional(),

  // ── PDPL Data Protection Officer contact (shown in UI, so public) ─────────
  NEXT_PUBLIC_DPO_EMAIL: z.string().email().optional(),
  NEXT_PUBLIC_DPO_PHONE: z.string().min(1).optional(),
  NEXT_PUBLIC_DPO_ADDRESS: z.string().min(1).optional(),

  // ── Operating legal entity shown in Terms / Privacy copy ──────────────────
  NEXT_PUBLIC_LEGAL_ENTITY_NAME: z.string().min(1).optional(),
  NEXT_PUBLIC_LEGAL_EMAIL: z.string().email().optional(),
})

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_ORIGIN: process.env.NEXT_PUBLIC_APP_ORIGIN,
  NEXT_PUBLIC_IMAGE_DOMAINS: process.env.NEXT_PUBLIC_IMAGE_DOMAINS,
  EMAIL_API_KEY: process.env.EMAIL_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  NEXT_PUBLIC_MONITORING_DSN: process.env.NEXT_PUBLIC_MONITORING_DSN,
  NEXT_PUBLIC_DPO_EMAIL: process.env.NEXT_PUBLIC_DPO_EMAIL,
  NEXT_PUBLIC_DPO_PHONE: process.env.NEXT_PUBLIC_DPO_PHONE,
  NEXT_PUBLIC_DPO_ADDRESS: process.env.NEXT_PUBLIC_DPO_ADDRESS,
  NEXT_PUBLIC_LEGAL_ENTITY_NAME: process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME,
  NEXT_PUBLIC_LEGAL_EMAIL: process.env.NEXT_PUBLIC_LEGAL_EMAIL,
})

if (!parsed.success) {
  // A *malformed* (not missing) value is a real misconfiguration — fail loudly.
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  throw new Error(`Invalid environment configuration:\n${issues}`)
}

export const env = parsed.data

export type Env = typeof env
