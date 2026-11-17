# Database (PostgreSQL via Supabase)

## Files

| File | What it is |
|---|---|
| `migrations/001_initial_schema.sql` | All tables, indexes, auth triggers and Row-Level Security policies |
| `seed/seed_data.sql` | Two sample scans for a test account, for UI development |

## Tables

Follows the pseudocode in the Capstone 1 report, section 4.

| Table | Holds | Written by |
|---|---|---|
| `users` | Profile linked 1:1 to `auth.users` (name, role, plan, preferences) | Auto-created by trigger on sign-up; user can edit name and preferences |
| `scans` | One row per scan: identifier, status, risk score and level | Backend (service role) |
| `scan_results` | Each exposed item found: source, category, severity | Backend (service role) |
| `recommendations` | De-duplicated advice per scan | Backend (service role) |
| `audit_logs` | Security and activity events (`SIGN_UP`, `SCAN_COMPLETED`, ...) | Trigger + backend |

Deleting a scan removes its results and recommendations automatically (`ON DELETE CASCADE`).

## Security (Row-Level Security)

- Every table has RLS enabled. Logged-out visitors (`anon`) can read nothing.
- A logged-in user can read **only their own** profile, scans, results, recommendations and activity log. This blocks the IDOR attack in risk R2 at the database level, even if a backend check is missed.
- Users can update only `first_name`, `last_name` and `preferences`. They cannot change their own `role`, `plan` or `email` (email changes go through Supabase Auth and are synced by a trigger).
- Users can delete their own scans, but cannot insert or edit scans, results or scores. Only the backend can, using the **service role key**, so nobody can fake a risk score from the app.
- Users with `role = 'admin'` can read all rows for monitoring.

## Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste `migrations/001_initial_schema.sql`, click **Run**.
3. In **Project Settings → API**, copy the Project URL, `anon` key and `service_role` key into `.env` (see `.env.example` in the repo root). The `service_role` key bypasses all security: backend only, never in the app, never committed.
4. Optional: sign up a test account, set its email in `seed/seed_data.sql`, and run that file too.

To make someone an admin, run in the SQL Editor:

```sql
update public.users set role = 'admin' where email = 'their@email.com';
```
