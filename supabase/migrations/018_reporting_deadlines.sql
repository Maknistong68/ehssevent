-- 018: Incident Reporting Deadline Tracking
-- Saudi Labor Law requires 24-hour reporting; GOSI requires 3-day reporting

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS reporting_deadline_24h TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reporting_deadline_3day TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deadline_24h_met BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deadline_3day_met BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deadline_24h_met_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deadline_3day_met_at TIMESTAMPTZ;

-- Backfill existing events: set deadlines from reported_date
UPDATE events
SET
  reporting_deadline_24h = (reported_date::timestamptz + INTERVAL '24 hours'),
  reporting_deadline_3day = (reported_date::timestamptz + INTERVAL '3 days')
WHERE reported_date IS NOT NULL
  AND reporting_deadline_24h IS NULL;

-- Mark events that have already advanced past draft as having met deadlines
UPDATE events
SET
  deadline_24h_met = true,
  deadline_24h_met_at = updated_at,
  deadline_3day_met = true,
  deadline_3day_met_at = updated_at
WHERE approval_level != 'draft'
  AND reporting_deadline_24h IS NOT NULL;

-- Partial indexes for efficient queries on unmet deadlines
CREATE INDEX IF NOT EXISTS idx_events_unmet_24h_deadline
  ON events (reporting_deadline_24h)
  WHERE deadline_24h_met = false AND reporting_deadline_24h IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_unmet_3day_deadline
  ON events (reporting_deadline_3day)
  WHERE deadline_3day_met = false AND reporting_deadline_3day IS NOT NULL;
