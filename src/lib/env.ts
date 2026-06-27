import { z } from 'zod'

/**
 * Typed, validated environment access.
 *
 * The app runs on a real Supabase backend, so the data/auth keys and the public
 * app origin are **required** — a missing one throws at startup, surfacing a
 * misconfigured deployment immediately instead of at first use. Optional keys
 * are deferred integrations (email, monitoring, legal/DPO copy); their shape is
 * still validated when provided.
 *
 * `NEXT_PUBLIC_*` vars are referenced as static literals so Next.js can inline
 * them into both the server and client bundles. Do NOT read these via dynamic
 * `process.env[key]` access — that breaks the inlining.
 */
const envSchema = z.object({
  // ── Supabase (data + auth) — required ─────────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // ── Public app origin (used for absolute URLs, CSP, CSRF posture) ──────────
  NEXT_PUBLIC_APP_ORIGIN: z.string().url(),

  // ── Image optimizer allowlist (comma-separated hostnames) ─────────────────
  NEXT_PUBLIC_IMAGE_DOMAINS: z.string().optional(),

  // ── Transactional email provider ──────────────────────────────────────────
  EMAIL_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),

  // ── Error monitoring / observability ──────────────────────────────────────
  NEXT_PUBLIC_MONITORING_DSN: z.string().url().optional(),

  // ── Scheduled-job auth (retention/destruction cron) — server-only ─────────
  CRON_SECRET: z.string().min(1).optional(),

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
  CRON_SECRET: process.env.CRON_SECRET,
  NEXT_PUBLIC_DPO_EMAIL: process.env.NEXT_PUBLIC_DPO_EMAIL,
  NEXT_PUBLIC_DPO_PHONE: process.env.NEXT_PUBLIC_DPO_PHONE,
  NEXT_PUBLIC_DPO_ADDRESS: process.env.NEXT_PUBLIC_DPO_ADDRESS,
  NEXT_PUBLIC_LEGAL_ENTITY_NAME: process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME,
  NEXT_PUBLIC_LEGAL_EMAIL: process.env.NEXT_PUBLIC_LEGAL_EMAIL,
})

if (!parsed.success) {
  // A missing or malformed value is a real misconfiguration — fail loudly.
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  throw new Error(`Invalid environment configuration:\n${issues}`)
}

export const env = parsed.data

export type Env = typeof env
