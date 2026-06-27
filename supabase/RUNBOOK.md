# Database setup runbook (Supabase)

Apply the database for the Event Report pilot. Do this once against your Supabase
project, then again later if you ever reset the database.

**Order matters. Run the files in this exact sequence:**

1. `migrations/0001_schema.sql` — tables, enums, triggers
2. `migrations/0002_rls.sql` — Row Level Security + storage bucket
3. `seed.sql` — starter organizations, sample projects, bootstrap helpers

There are two ways to apply them. **Method A (dashboard) is the simplest and
needs no tools installed.** Method B is for if you already use the Supabase CLI.

---

## Method A — Supabase Dashboard (recommended)

### Step 1 — Run the schema

1. Open your project at https://supabase.com/dashboard → your project.
2. Left sidebar → **SQL Editor** → **+ New query**.
3. Open `event-report/supabase/migrations/0001_schema.sql` in your editor, copy
   **all** of it, paste into the SQL Editor.
4. Click **Run** (or Ctrl/Cmd + Enter). Wait for "Success. No rows returned".

### Step 2 — Run the RLS policies

1. New query → paste **all** of `migrations/0002_rls.sql` → **Run**.
2. This also creates the `observation-photos` storage bucket used for photos.

### Step 3 — Run the seed

1. New query → paste **all** of `seed.sql` → **Run**.
2. This creates **Company A**, **Company B**, a contractor org, one sample
   project per company, and two helper functions used below.

> If you ever need to start over: SQL Editor → run
> `drop schema public cascade; create schema public;` then redo steps 1–3.
> (This deletes ALL app data. Only do it on a throwaway/pilot database.)

---

## Method B — Supabase CLI (optional)

Requires the CLI installed and your project ref + db password.

```bash
cd event-report
supabase link --project-ref <your-project-ref>
supabase db push          # applies everything in supabase/migrations in order
# then run the seed once:
supabase db execute --file supabase/seed.sql
```

---

## Create your first admin login

The app auto-creates a **pending** profile whenever an auth user is added
(via a database trigger). You then promote that profile to admin.

1. Dashboard → **Authentication** → **Users** → **Add user**.
2. Enter your email + a password. **Tick "Auto Confirm User"** (so you can log
   in immediately without an email link).
3. Dashboard → **SQL Editor** → new query → run:
   ```sql
   select public.promote_to_system_admin('you@example.com');
   ```
   (Use the exact email you just added.)
4. You're now a platform admin (active, no organization).

---

## Create a second-company user (for the privacy test)

This sets up the **#1 pilot requirement** test: proving Company A can never see
Company B's data.

1. Add a non-admin tester to **Company A**:
   - Authentication → Add user (e.g. `user-a@example.com`, Auto Confirm).
   - SQL Editor:
     ```sql
     select public.assign_to_org(
       'user-a@example.com',
       'a0000000-0000-0000-0000-0000000000a1',   -- Company A
       'client_admin'
     );
     ```
2. Add a tester to **Company B**:
   - Authentication → Add user (e.g. `user-b@example.com`, Auto Confirm).
   - SQL Editor:
     ```sql
     select public.assign_to_org(
       'user-b@example.com',
       'b0000000-0000-0000-0000-0000000000b1',   -- Company B
       'client_admin'
     );
     ```

### Seed organization IDs (for reference)

| Organization       | ID                                     |
| ------------------ | -------------------------------------- |
| Company A (client) | `a0000000-0000-0000-0000-0000000000a1` |
| Company B (client) | `b0000000-0000-0000-0000-0000000000b1` |
| Pilot Contractors  | `c0000000-0000-0000-0000-0000000000c1` |

---

## Verify it worked

- Dashboard → **Table Editor**: you see empty tables plus `organizations` with
  Company A / Company B / Pilot Contractors, and two rows in `projects`.
- Dashboard → **Authentication → Users**: your admin (and any testers) appear.
- Dashboard → **Table Editor → profiles**: each user has a row; your admin is
  `system_admin` / `active`; testers are `client_admin` / `active` with the
  correct `organization_id`.
- Dashboard → **Storage**: an `observation-photos` bucket exists.

---

## Then run the app

1. Paste your real keys into `event-report/.env.local` (Project Settings → API:
   Project URL, anon key, service_role key).
2. `npm run dev`, open http://localhost:3000.
3. Work through the manual checklist (real login → create event → restart server
   → confirm it persists → **the Company A vs Company B privacy test** → photo
   upload → logout).

If the privacy test ever shows Company B the wrong data, **stop** and fix the
database rules before deploying.
