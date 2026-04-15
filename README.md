# Polymarket Farm Manager MVP

Manual account rotation and daily check-in manager for two roles: `owner` and `worker`.

This MVP deliberately does not include trading automation, Polymarket API integration, bots, or portfolio sync. The structure leaves space for future portfolio metrics, activity calendar, worker distribution, action logs, and history export.

## Architecture

- `Next.js App Router` renders dashboards and forms with server components.
- `Server Actions` mutate accounts, daily rotations, and check-ins.
- `Supabase Auth` handles email/password login.
- `Supabase Postgres + RLS` is the authorization boundary.
- `Tailwind` provides a minimal desktop-first admin UI.
- `daily_rotations` stores the daily account snapshot.
- `daily_checkins` stores per-account work status and comments by date.

## Project structure

```txt
app/
  actions.ts                  server actions for rotation/accounts/check-ins
  login/                      email/password login
  owner/                      owner dashboard
  worker/                     worker dashboard
  accounts/                   list, create, detail/edit
  rotation/                   owner daily rotation view
  history/                    check-in history
components/                   shared shell, badges, forms, cards
lib/                          auth, Supabase clients, types, rotation logic
supabase/migrations/          schema, RLS, seed example
```

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local`:

```bash
cp .env.example .env.local
```

Set:

```txt
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. Run SQL in Supabase:

Run `supabase/migrations/001_init.sql`, then `supabase/migrations/002_seed_example.sql`.

Seed logins:

```txt
owner@example.com / password123
worker@example.com / password123
```

For hosted Supabase, you can instead create users in Auth UI and update `profiles.role` manually.

4. Start app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Vercel deploy

1. Push this project to GitHub.
2. Import the repo in Vercel.
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Run the SQL migrations in your hosted Supabase project.
5. Deploy.

## Main pages

- `/login` - email/password sign in.
- `/owner` - owner dashboard, metrics, active accounts, quick actions.
- `/worker` - worker dashboard, today assigned active accounts.
- `/accounts` - account list with role-based visibility.
- `/accounts/new` - owner-only account creation.
- `/accounts/[id]` - account details, owner edit form, today check-in, history.
- `/rotation` - owner daily rotation snapshot and manual active/resting override.
- `/history` - check-in history under RLS visibility.

## Daily rotation

Owner clicks `Generate Today Rotation`. The server action:

- reads active accounts,
- counts recent active days in the last 7 days,
- selects about 65% of accounts as active,
- penalizes accounts with more recent active days,
- upserts `daily_rotations`,
- creates planned `daily_checkins` for active accounts.

The logic is intentionally simple and replaceable later.
# poly-dayly-farm
