# Kynex Code — Client Portal

Premium multi-client portal for Kynex Code built with **Next.js 14 (App Router)** and **Supabase** (Postgres + Auth + Storage).

---

## Architecture in one sentence

One portal URL, many client accounts. Every client logs in at the same `/login` page and sees only their own data — enforced by Postgres Row Level Security, not frontend hiding.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, React Server Components) |
| Database | Supabase Postgres |
| Auth | Supabase Auth (cookie-based via `@supabase/ssr`) |
| Storage | Supabase Storage (private `files` bucket) |
| Styling | Tailwind CSS |
| Types | TypeScript |
| Deployment | Vercel (recommended) |

---

## Getting started

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Note your **Project URL** and **anon key** (Project Settings → API).
3. Also copy the **service role key** — keep this secret, it bypasses RLS.

### 2. Run the schema

Open **Supabase Dashboard → SQL Editor → New query**, paste the entire contents of `supabase/schema.sql`, and click **Run**.

This creates all tables, enums, helper functions, RLS policies, and the private `files` storage bucket.

### 3. Create your first admin user

1. **Supabase Dashboard → Authentication → Users → Add user**  
   Enter email + password, tick "Auto Confirm User", click Create.
2. Copy the new user's **UUID**.
3. In SQL Editor, run:

```sql
insert into public.profiles (id, role, client_id, full_name, email)
values (
  'PASTE-UUID-HERE',  -- the UUID from step 2
  'admin',
  null,
  'Your Name',
  'you@kynexcode.com'
);
```

That's your admin account. All future client accounts are provisioned through the app's **Clients → Add client** page.

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> `SUPABASE_SERVICE_ROLE_KEY` is server-only and never sent to the browser. It's only used in `src/actions/clients.ts` to create auth users — the action verifies the caller is an admin first.

### 5. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`. Sign in with your admin credentials.

---

## Folder structure

```
src/
├── actions/           # Server Actions (auth, clients, projects, files, requests, payments, amc)
├── app/
│   ├── (auth)/        # Login, forgot-password, reset-password
│   ├── (client)/      # Client-facing pages (dashboard, projects, files, requests, payments, amc, profile)
│   └── (admin)/       # Admin pages (dashboard, clients, projects, files, requests, payments, amc, settings)
├── components/
│   ├── nav/           # Sidebar, MobileNav, Topbar
│   ├── requests/      # RequestThread (shared by client and admin)
│   └── ui/            # StatusPill, EmptyState, DataTable, PageHeader, DownloadButton
└── lib/
    ├── database.types.ts  # Hand-typed DB types (regenerate with `npm run db:types` once connected)
    ├── supabase/          # Client, server, middleware Supabase helpers
    └── utils.ts           # cn(), formatDate(), formatMoney(), label maps
middleware.ts              # Route protection + session refresh
supabase/
├── schema.sql             # Complete DB schema + RLS policies + storage policies
└── seed.sql               # Instructions + optional sample data
```

---

## Security model

- **Postgres RLS** is the enforcement layer, not the middleware.  
  Every table has `alter table ... enable row level security`. Policies call `public.current_client_id()` and `public.is_admin()` — helper functions that read the caller's own `profiles` row. A client querying `projects` with a forged `client_id` in a filter still only gets rows where `client_id = their own id`.
- **Storage** follows the same pattern — the bucket is private, and the `storage.objects` policies check that the path starts with the caller's own `client_id`.
- **Middleware** (`middleware.ts`) redirects roles away from each other's routes for UX — it is not the security boundary.
- **Service role key** is used exactly once, in `src/actions/clients.ts`, only after verifying the caller is an admin. It is never imported into any client-side file.

---

## Adding a new client (after setup)

1. Sign in as admin.
2. **Clients → Add client** — fill in company name, contact, email, and initial password.
3. The server action creates the Supabase Auth user, the `clients` row, and the `profiles` row in one operation.
4. The client can log in immediately at `/login`.

---

## Deploying to Vercel

```bash
vercel
```

Set the same four environment variables in the Vercel project settings (Project → Settings → Environment Variables). Set `NEXT_PUBLIC_SITE_URL` to your production domain.

---

## Regenerating TypeScript types

Once your Supabase project is live:

```bash
npm install -g supabase
supabase login
SUPABASE_PROJECT_ID=your-project-ref npm run db:types
```

This overwrites `src/lib/database.types.ts` with the auto-generated types from your live schema.

---

## What this portal does NOT include

Per the product spec, the following were intentionally excluded:
- CRM / lead management
- Marketing automation
- Accounting / inventory
- Complex analytics
- Chat systems
- AI features

The goal is simple: **Kynex Code → Client logs in → sees their project → receives files → sends requests → sees payments → sees AMC if applicable.**
