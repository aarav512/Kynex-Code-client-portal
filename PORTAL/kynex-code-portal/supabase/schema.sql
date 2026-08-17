-- ============================================================================
-- KYNEX CODE CLIENT PORTAL — DATABASE SCHEMA
-- ============================================================================
-- Run this once against a fresh Supabase project (SQL Editor -> New query ->
-- paste this whole file -> Run). It creates every table, enum, helper
-- function, and Row Level Security (RLS) policy the app depends on.
--
-- SECURITY MODEL
-- Every table that holds client-owned data has RLS enabled. Policies check
-- the requesting user's role and client_id (read from `public.profiles`,
-- which is keyed 1:1 to `auth.users`). Clients can only ever read/write rows
-- that belong to their own `client_id`. Admins bypass the client_id checks.
-- This is enforced by Postgres itself on every query — the frontend never
-- has to be trusted to hide data correctly.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. EXTENSIONS
-- ----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. ENUMS
-- ----------------------------------------------------------------------------
create type user_role as enum ('admin', 'client');

create type project_status as enum (
  'not_started', 'in_progress', 'client_review', 'completed', 'live'
);

create type file_category as enum (
  'website_files', 'images_assets', 'documents', 'content', 'other'
);

create type request_category as enum (
  'website_change', 'bug_error', 'content_update', 'technical_support', 'other'
);

create type request_priority as enum ('low', 'medium', 'high', 'urgent');

create type request_status as enum (
  'submitted', 'in_progress', 'waiting_for_client', 'completed'
);

create type payment_status as enum ('paid', 'pending', 'overdue');

create type amc_status as enum ('active', 'expiring_soon', 'expired', 'cancelled');

-- ----------------------------------------------------------------------------
-- 2. CLIENTS  (the company / account a set of people belong to)
-- ----------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. PROFILES  (1:1 extension of auth.users — carries role + client link)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'client',
  client_id uuid references public.clients (id) on delete set null,
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

-- A client-role profile must belong to a client. Admin profiles have no client.
alter table public.profiles
  add constraint profiles_client_link_chk
  check (
    (role = 'client' and client_id is not null) or
    (role = 'admin' and client_id is null)
  );

-- ----------------------------------------------------------------------------
-- 4. PROJECTS
-- ----------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  project_type text not null,
  description text,
  status project_status not null default 'not_started',
  start_date date,
  expected_completion_date date,
  live_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_client_id_idx on public.projects (client_id);

-- ----------------------------------------------------------------------------
-- 5. FILES  (metadata row; binary lives in Supabase Storage bucket "files")
-- ----------------------------------------------------------------------------
create table public.files (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  category file_category not null default 'other',
  file_name text not null,
  storage_path text not null unique, -- e.g. "{client_id}/{project_id}/filename.ext"
  file_type text not null,
  file_size_bytes bigint not null default 0,
  uploaded_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index files_client_id_idx on public.files (client_id);
create index files_project_id_idx on public.files (project_id);

-- ----------------------------------------------------------------------------
-- 6. REQUESTS  (support / change requests)
-- ----------------------------------------------------------------------------
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  description text not null,
  category request_category not null default 'other',
  priority request_priority not null default 'medium',
  status request_status not null default 'submitted',
  attachment_path text,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index requests_client_id_idx on public.requests (client_id);

-- Threaded replies on a request (client <-> admin conversation)
create table public.request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade, -- denormalized for RLS simplicity
  author_id uuid not null references public.profiles (id),
  -- author_name/author_role are denormalized at insert time (see
  -- src/actions/requests.ts) because the "profiles" RLS policy only lets a
  -- client read their own profile row, not the admin's — without this a
  -- client couldn't see who replied to their request.
  author_name text not null,
  author_role user_role not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index request_messages_request_id_idx on public.request_messages (request_id);
create index request_messages_client_id_idx on public.request_messages (client_id);

-- ----------------------------------------------------------------------------
-- 7. INVOICES + PAYMENTS
-- ----------------------------------------------------------------------------
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  invoice_number text not null unique,
  description text not null, -- "Project/service" line
  amount numeric(12, 2) not null,
  currency text not null default 'USD',
  status payment_status not null default 'pending',
  due_date date not null,
  payment_date date,
  invoice_file_path text, -- storage path to the invoice PDF
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invoices_client_id_idx on public.invoices (client_id);

-- ----------------------------------------------------------------------------
-- 8. AMC  (Annual Maintenance Contract — optional, at most one active per client)
-- ----------------------------------------------------------------------------
create table public.amc (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  plan_name text not null,
  services_included text[] not null default '{}',
  amount numeric(12, 2) not null,
  currency text not null default 'USD',
  start_date date not null,
  renewal_date date not null,
  status amc_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index amc_client_id_idx on public.amc (client_id);

-- ----------------------------------------------------------------------------
-- 9. updated_at TRIGGER HELPER
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clients_set_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger requests_set_updated_at before update on public.requests
  for each row execute function public.set_updated_at();
create trigger invoices_set_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();
create trigger amc_set_updated_at before update on public.amc
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 10. AUTH HELPER FUNCTIONS  (used inside every RLS policy below)
-- ----------------------------------------------------------------------------
-- SECURITY DEFINER + a fixed search_path so these are safe to call from RLS
-- and always resolve against public.profiles regardless of caller's role.

create or replace function public.current_role()
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_client_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select client_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_role() = 'admin';
$$;

-- ----------------------------------------------------------------------------
-- 11. ENABLE ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.files enable row level security;
alter table public.requests enable row level security;
alter table public.request_messages enable row level security;
alter table public.invoices enable row level security;
alter table public.amc enable row level security;

-- ----------------------------------------------------------------------------
-- 12. POLICIES — profiles
-- ----------------------------------------------------------------------------
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "profiles_admin_all"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- 13. POLICIES — clients
-- ----------------------------------------------------------------------------
create policy "clients_select_own_or_admin"
  on public.clients for select
  using (id = public.current_client_id() or public.is_admin());

create policy "clients_admin_write"
  on public.clients for insert
  with check (public.is_admin());

create policy "clients_admin_update"
  on public.clients for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "clients_admin_delete"
  on public.clients for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 14. POLICIES — projects
-- ----------------------------------------------------------------------------
create policy "projects_select_scoped"
  on public.projects for select
  using (client_id = public.current_client_id() or public.is_admin());

create policy "projects_admin_write"
  on public.projects for insert
  with check (public.is_admin());

create policy "projects_admin_update"
  on public.projects for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "projects_admin_delete"
  on public.projects for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 15. POLICIES — files
-- ----------------------------------------------------------------------------
create policy "files_select_scoped"
  on public.files for select
  using (client_id = public.current_client_id() or public.is_admin());

create policy "files_admin_write"
  on public.files for insert
  with check (public.is_admin());

create policy "files_admin_delete"
  on public.files for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 16. POLICIES — requests
-- ----------------------------------------------------------------------------
create policy "requests_select_scoped"
  on public.requests for select
  using (client_id = public.current_client_id() or public.is_admin());

create policy "requests_insert_scoped"
  on public.requests for insert
  with check (client_id = public.current_client_id() or public.is_admin());

create policy "requests_update_scoped"
  on public.requests for update
  using (client_id = public.current_client_id() or public.is_admin())
  with check (
    -- clients may only edit their own request while it's not yet closed;
    -- status transitions to "completed" are admin-only
    (client_id = public.current_client_id() and status <> 'completed')
    or public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- 17. POLICIES — request_messages
-- ----------------------------------------------------------------------------
create policy "request_messages_select_scoped"
  on public.request_messages for select
  using (client_id = public.current_client_id() or public.is_admin());

create policy "request_messages_insert_scoped"
  on public.request_messages for insert
  with check (client_id = public.current_client_id() or public.is_admin());

-- ----------------------------------------------------------------------------
-- 18. POLICIES — invoices
-- ----------------------------------------------------------------------------
create policy "invoices_select_scoped"
  on public.invoices for select
  using (client_id = public.current_client_id() or public.is_admin());

create policy "invoices_admin_write"
  on public.invoices for insert
  with check (public.is_admin());

create policy "invoices_admin_update"
  on public.invoices for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "invoices_admin_delete"
  on public.invoices for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 19. POLICIES — amc
-- ----------------------------------------------------------------------------
create policy "amc_select_scoped"
  on public.amc for select
  using (client_id = public.current_client_id() or public.is_admin());

create policy "amc_admin_write"
  on public.amc for insert
  with check (public.is_admin());

create policy "amc_admin_update"
  on public.amc for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "amc_admin_delete"
  on public.amc for delete
  using (public.is_admin());

-- ----------------------------------------------------------------------------
-- 20. STORAGE BUCKET + POLICIES
-- ----------------------------------------------------------------------------
-- Files are stored under paths shaped "{client_id}/{project_id_or_general}/name".
-- The bucket is private; access goes through the same admin/client_id checks.
insert into storage.buckets (id, name, public)
values ('files', 'files', false)
on conflict (id) do nothing;

create policy "storage_files_select_scoped"
  on storage.objects for select
  using (
    bucket_id = 'files'
    and (
      public.is_admin()
      or (storage.foldername(name))[1] = public.current_client_id()::text
    )
  );

create policy "storage_files_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'files' and public.is_admin());

create policy "storage_files_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'files' and public.is_admin());

-- ----------------------------------------------------------------------------
-- 21. NEW-USER BOOTSTRAP
-- ----------------------------------------------------------------------------
-- When an admin creates a client login via Supabase Auth (see
-- src/actions/clients.ts), the profile row is inserted explicitly by that
-- server action using the service role key — not by a trigger — so the
-- role/client_id can be set correctly at creation time in one transaction.
-- No public self-signup is exposed by this app: every account is provisioned
-- by an admin, which is why there is no public "sign up" page.

-- ----------------------------------------------------------------------------
-- End of schema.
-- ----------------------------------------------------------------------------
