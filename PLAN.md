# Plan: Compact Date/Time + Edit Events + Audit Trail

## User decisions
- **Audit scope**: Events module only (generic table for future extension)
- **Reason for change**: Always optional
- **Closed events**: Nobody can edit (fully immutable)
- **Time format**: 24-hour

---

## Part 1 — Compact Date + Time Pickers (UI)

### 1a. Create `src/components/ui/popover.tsx`
Wrap `@base-ui/react/popover` (Root, Trigger, Portal, Positioner, Popup, Arrow).
Export `Popover`, `PopoverTrigger`, `PopoverContent` matching shadcn-style API.

### 1b. Create `src/components/ui/date-picker.tsx`
- A button displaying the selected date (e.g. "18 Jun 2026") or placeholder "Pick a date".
- Clicking opens a Popover containing the existing `Calendar` component.
- On select, popover closes and value updates.
- Props: `value: Date | undefined`, `onChange: (d: Date | undefined) => void`, `disabled?: { before?: Date; after?: Date }`, `placeholder?: string`.

### 1c. Create `src/components/ui/time-picker.tsx`
- A compact 24h time input. Two `<select>` dropdowns side by side: hours (00–23) and minutes (00–59 in 5-min steps) inside a Popover triggered by a button showing "14:30" or "Select time".
- Props: `value: string` (HH:mm), `onChange: (t: string) => void`.

### 1d. Update `create-event-form.tsx`
Replace the big inline calendar card with a compact row:
```
Event Date & Time
[  18 Jun 2026  ▾ ]   [ 14:30 ▾ ]
```
- `DatePicker` for date (disabled after today).
- `TimePicker` for time.
- On submit, combine: `format(eventDate, 'yyyy-MM-dd') + 'T' + eventTime + ':00'` → send as ISO string for `event_date` TIMESTAMPTZ.

### 1e. Update `create-ca-form.tsx`
Same treatment: replace inline Calendar with `DatePicker` (no time needed for due dates).

### 1f. Update event validators/actions
- `event_date` validator: accept ISO datetime string (already `optionalText`; will keep accepting strings).
- `createEvent` action: pass `event_date` as-is (timestamptz).

---

## Part 2 — Edit Events

### 2a. Create `updateEvent` server action (`src/lib/actions/events.ts`)
- `updateEvent(input)` — validates with `updateEventSchema` (same fields as create + `event_id` + optional `reason`).
- **Lock rule**: if `approval_level === 'closed'` → return error "Closed events cannot be edited".
- Fetches current event row (for audit diff).
- Performs `.update(...)` on the `events` table (RLS enforced).
- Computes changed-fields diff (old → new per field, skip unchanged).
- Calls `recordEventAudit(event_id, 'update', diff, reason)` — see Part 3.
- `revalidatePath` + redirect back to detail.

### 2b. Create `updateEventSchema` (`src/lib/validators/events.ts`)
Same as `createEventSchema` but with `event_id: z.string().uuid()` and `reason: z.string().optional()`. All other fields optional (partial update).

### 2c. Create `edit-event-form.tsx` (`src/components/events/edit-event-form.tsx`)
- Mirrors `create-event-form.tsx` but pre-fills all fields from the existing event.
- Adds optional "Reason for change" textarea at the bottom.
- Uses `DatePicker` + `TimePicker` (not big calendar).
- Calls `updateEvent` on submit.
- Type-driven visibility works the same (derived from event.type, which is not editable — type is locked after creation to prevent reclassification).

### 2d. Create edit page (`src/app/(app)/events/[id]/edit/page.tsx`)
- Server component. Fetches event by id.
- If `approval_level === 'closed'` → redirect to detail with toast or show lock message.
- Renders `<EditEventForm event={event} projects={projects} />`.

### 2e. Add "Edit" button to `event-detail.tsx`
- Below the header, conditionally show `Edit` button (hidden when `approval_level === 'closed'`).
- Links to `/events/{id}/edit`.

### 2f. Optimistic concurrency guard
- `updateEvent` accepts `expected_updated_at` (the `updated_at` value loaded by the form).
- Before writing, checks current `updated_at` matches. If stale → return error "This event was modified by someone else. Refresh and try again."
- Prevents two users overwriting each other silently.

---

## Part 3 — Immutable Audit Trail (DB + App)

### 3a. Migration `012_audit_logs.sql`
```sql
CREATE TABLE public.audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   TEXT NOT NULL,          -- 'events' (generic for future)
  record_id    UUID NOT NULL,          -- the event id
  action       TEXT NOT NULL,          -- 'insert' | 'update' | 'delete'
  changed_fields JSONB,               -- { "field": { "old": ..., "new": ... } }
  reason       TEXT,                   -- optional user-entered reason
  actor_id     UUID REFERENCES profiles(id),
  actor_name   TEXT,
  actor_email  TEXT,
  actor_role   TEXT,
  actor_org_id UUID,
  -- Denormalized scoping columns for RLS (snapshot at write time)
  event_creator_org_id UUID,
  event_project_id     UUID,
  ip_address   TEXT,                   -- reserved for future
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_event_org ON audit_logs(event_creator_org_id);
CREATE INDEX idx_audit_logs_event_project ON audit_logs(event_project_id);
```

### 3b. Migration `013_audit_logs_rls.sql`
```sql
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Append-only: INSERT via SECURITY DEFINER function only; NO update/delete policies
-- This makes the audit trail tamper-proof.

-- SELECT: admin sees all
CREATE POLICY "audit_select_admin" ON audit_logs
  FOR SELECT USING (public.auth_is_admin());

-- SELECT: client sees audit for events on their projects or their org
CREATE POLICY "audit_select_client" ON audit_logs
  FOR SELECT USING (
    public.auth_user_org_type() = 'client'
    AND (
      event_creator_org_id = public.auth_user_org_id()
      OR event_project_id IN (
        SELECT id FROM projects WHERE client_org_id = public.auth_user_org_id()
      )
    )
  );

-- SELECT: contractor sees audit for their org's events only
CREATE POLICY "audit_select_contractor" ON audit_logs
  FOR SELECT USING (
    public.auth_user_org_type() = 'contractor'
    AND event_creator_org_id = public.auth_user_org_id()
  );

-- No INSERT/UPDATE/DELETE policies for normal users.
-- Writes go through SECURITY DEFINER function only.
```

### 3c. SECURITY DEFINER function `record_event_audit`
```sql
CREATE OR REPLACE FUNCTION public.record_event_audit(
  p_event_id UUID,
  p_action TEXT,
  p_changed_fields JSONB DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_profile RECORD;
  v_event   RECORD;
BEGIN
  SELECT id, full_name, email, role, organization_id
    INTO v_profile FROM profiles WHERE id = auth.uid();
  SELECT creator_org_id, project_id
    INTO v_event FROM events WHERE id = p_event_id;

  INSERT INTO audit_logs (
    table_name, record_id, action, changed_fields, reason,
    actor_id, actor_name, actor_email, actor_role, actor_org_id,
    event_creator_org_id, event_project_id
  ) VALUES (
    'events', p_event_id, p_action, p_changed_fields, p_reason,
    v_profile.id, v_profile.full_name, v_profile.email,
    v_profile.role::text, v_profile.organization_id,
    v_event.creator_org_id, v_event.project_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
This function runs with elevated privileges (bypasses RLS) to INSERT into `audit_logs`. Normal users cannot write to `audit_logs` directly. The actor identity comes from `auth.uid()` (cannot be forged — resolved from the JWT by Supabase).

### 3d. DB trigger backstop on events (defense in depth)
A lightweight AFTER INSERT OR UPDATE trigger on events that calls `record_event_audit` with a computed diff. This catches any update path (even direct SQL/API) not going through the server action. The trigger computes changed fields via `hstore(NEW) - hstore(OLD)` if hstore is available, or a JSONB comparison function.

### 3e. Audit query `src/lib/queries/audit.ts`
- `getEventAuditLog(eventId)` — fetches audit_logs for that event, ordered by created_at desc.
- `getRecentAuditLogs(filters)` — for the admin audit page; filters: table_name, actor_id, date range, org_id.

### 3f. Audit action `src/lib/actions/audit.ts`
- `recordAudit(eventId, action, changedFields, reason)` — calls the RPC `record_event_audit` via supabase.

---

## Part 4 — Audit UI

### 4a. `AuditTimeline` component (`src/components/audit/audit-timeline.tsx`)
- Renders a vertical timeline of audit entries for an event.
- Each entry shows: actor name, action ("updated 3 fields"), timestamp, reason (if provided), expandable changed-fields diff (old → new per field, with human-readable field labels).
- Color-coded: green for create, blue for update, red for delete.

### 4b. Integrate into event detail page
- Add an "Audit History" card at the bottom of `event-detail.tsx` (or a separate tab/section).
- Fetch via `getEventAuditLog(event.id)` in the `[id]/page.tsx` server component and pass down.
- The creation of the event is also logged (action='insert'), so the full lifecycle is visible.

### 4c. Admin audit page (`src/app/(app)/audit/page.tsx`) — optional stretch
- If time permits: a dedicated `/audit` page for system admins showing recent changes across all events.
- Filters: date range, actor, event reference.
- This demonstrates the "scalable role-based perspectives" requirement.
- Add nav item for admins only (in sidebar under Admin section).

---

## Part 5 — Security Additions (My Recommendations)

1. **Append-only audit** — `audit_logs` has no UPDATE/DELETE RLS policies; even admins can only read. The SECURITY DEFINER function is the sole write path. This gives legal-grade immutability.

2. **Server-stamped identity** — `auth.uid()` inside the SECURITY DEFINER function resolves the actor from the JWT. No client-side actor parameter → impossible to forge who performed the change.

3. **Optimistic concurrency** — `expected_updated_at` check prevents silent overwrites when two people edit simultaneously. The second save gets a clear error.

4. **Closed-event immutability** — Events at `approval_level = 'closed'` reject all updates at the application layer AND via a DB CHECK constraint/trigger. Nobody can edit, period.

5. **Type immutability** — Event type cannot be changed after creation (prevents reclassification that could void the audit trail's context).

6. **DB trigger backstop** — Even if someone bypasses the app and uses the Supabase API directly, the trigger still captures the change in the audit log. Defense in depth.

7. **RLS-scoped audit visibility** — Contractors see only their own events' audit trail; clients see their projects' events; admins see everything. Each role gets exactly the perspective they should have.

---

## Files Summary

### New files:
| File | Purpose |
|------|---------|
| `src/components/ui/popover.tsx` | Popover primitive (base-ui) |
| `src/components/ui/date-picker.tsx` | Compact calendar popover |
| `src/components/ui/time-picker.tsx` | 24h time selector |
| `src/components/events/edit-event-form.tsx` | Edit form (pre-filled, type-driven) |
| `src/app/(app)/events/[id]/edit/page.tsx` | Edit page |
| `src/components/audit/audit-timeline.tsx` | Audit history timeline |
| `src/lib/queries/audit.ts` | Audit log queries |
| `src/lib/actions/audit.ts` | Audit write via RPC |
| `supabase/migrations/012_audit_logs.sql` | Audit table + trigger + RPC |
| `supabase/migrations/013_audit_logs_rls.sql` | Audit RLS (append-only + role-scoped reads) |
| `supabase/audit_install.sql` | Combined install for manual paste |

### Modified files:
| File | Change |
|------|--------|
| `src/components/events/create-event-form.tsx` | Replace big calendar → DatePicker + TimePicker |
| `src/components/corrective-actions/create-ca-form.tsx` | Replace big calendar → DatePicker |
| `src/lib/validators/events.ts` | Add `updateEventSchema` + `event_time` handling |
| `src/lib/actions/events.ts` | Add `updateEvent` with diff + audit + concurrency check |
| `src/components/events/event-detail.tsx` | Add Edit button + Audit History section |
| `src/app/(app)/events/[id]/page.tsx` | Fetch audit log + pass to detail |
| `scripts/run-migrations.mjs` | Add 012, 013 |

---

## Execution Order
1. Create popover.tsx, date-picker.tsx, time-picker.tsx
2. Update create-event-form (compact date+time)
3. Update create-ca-form (compact date picker)
4. Create audit migrations (012, 013) + install file + update runner
5. Create audit queries + actions
6. Create updateEventSchema + updateEvent action
7. Create edit-event-form + edit page
8. Create audit-timeline component
9. Integrate edit button + audit into event detail + [id] page
10. Build + typecheck
