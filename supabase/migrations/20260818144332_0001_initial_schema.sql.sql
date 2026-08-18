/*
# Kynex Code Client Portal — Initial Schema

## Overview
Creates the complete database schema for a multi-client portal where Kynex Code
admins manage clients, and each client sees only their own projects, files,
requests, payments, and AMC (Annual Maintenance Contract) records.

## Tables
1. `clients` — One row per client company (name, contact, email, status, timestamps).
2. `profiles` — One row per auth user. Links to auth.users via id. Has a `role`
   of 'admin' or 'client' and an optional `client_id` (null for admins).
3. `projects` — Client-scoped project records (title, description, status, dates).
4. `files` — Metadata for uploaded files in the private `files` storage bucket.
5. `requests` — Support/change requests with threaded messages.
6. `request_messages` — Individual messages within a request thread.
7. `payments` — Payment records tied to a client and optionally a project.
8. `amc_contracts` — Annual Maintenance Contract records per client.

## Security
- RLS enabled on every table.
- Helper functions: `is_admin()` and `current_client_id()` read the caller's
  profiles row to determine role and client scope.
- Admins see all rows; clients see only their own client_id's rows.
- Storage bucket `files` is private; policies check path starts with client_id.

## Notes
- `profiles.id` references `auth.users(id)` so each auth user has exactly one profile.
- `profiles.client_id` is null for admin users.
- All client-scoped tables use `client_id` FK to `clients(id)`.
*/

-- ============================================================================
-- ENUMS
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'client');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('planning', 'in_progress', 'review', 'completed', 'on_hold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE amc_status AS ENUM ('active', 'expired', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE client_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  status client_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'client',
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status project_status NOT NULL DEFAULT 'planning',
  start_date date,
  due_date date,
  budget numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  uploaded_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  subject text NOT NULL,
  status request_status NOT NULL DEFAULT 'open',
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS request_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  author_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  body text NOT NULL,
  is_staff boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  due_date date,
  paid_date date,
  invoice_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS amc_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  amount numeric(12,2) NOT NULL,
  status amc_status NOT NULL DEFAULT 'active',
  start_date date NOT NULL,
  end_date date NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_files_client_id ON files(client_id);
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_requests_client_id ON requests(client_id);
CREATE INDEX IF NOT EXISTS idx_request_messages_request_id ON request_messages(request_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_amc_client_id ON amc_contracts(client_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Returns true if the current auth user has role='admin' in profiles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Returns the client_id of the current auth user (null for admins).
CREATE OR REPLACE FUNCTION public.current_client_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT client_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================================
-- RLS — clients
-- ============================================================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_select" ON clients;
CREATE POLICY "clients_select" ON clients FOR SELECT
  TO authenticated USING (public.is_admin() OR id = public.current_client_id());

DROP POLICY IF EXISTS "clients_insert" ON clients;
CREATE POLICY "clients_insert" ON clients FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "clients_update" ON clients;
CREATE POLICY "clients_update" ON clients FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "clients_delete" ON clients;
CREATE POLICY "clients_delete" ON clients FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- RLS — profiles
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO authenticated USING (
    public.is_admin() OR id = auth.uid() OR client_id = public.current_client_id()
  );

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  TO authenticated USING (public.is_admin() OR id = auth.uid())
  WITH CHECK (public.is_admin() OR id = auth.uid());

DROP POLICY IF EXISTS "profiles_delete" ON profiles;
CREATE POLICY "profiles_delete" ON profiles FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- RLS — projects
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_select" ON projects FOR SELECT
  TO authenticated USING (public.is_admin() OR client_id = public.current_client_id());

DROP POLICY IF EXISTS "projects_insert" ON projects;
CREATE POLICY "projects_insert" ON projects FOR INSERT
  TO authenticated WITH CHECK (public.is_admin() OR client_id = public.current_client_id());

DROP POLICY IF EXISTS "projects_update" ON projects;
CREATE POLICY "projects_update" ON projects FOR UPDATE
  TO authenticated USING (public.is_admin() OR client_id = public.current_client_id())
  WITH CHECK (public.is_admin() OR client_id = public.current_client_id());

DROP POLICY IF EXISTS "projects_delete" ON projects;
CREATE POLICY "projects_delete" ON projects FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- RLS — files
-- ============================================================================

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "files_select" ON files;
CREATE POLICY "files_select" ON files FOR SELECT
  TO authenticated USING (public.is_admin() OR client_id = public.current_client_id());

DROP POLICY IF EXISTS "files_insert" ON files;
CREATE POLICY "files_insert" ON files FOR INSERT
  TO authenticated WITH CHECK (public.is_admin() OR client_id = public.current_client_id());

DROP POLICY IF EXISTS "files_update" ON files;
CREATE POLICY "files_update" ON files FOR UPDATE
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "files_delete" ON files;
CREATE POLICY "files_delete" ON files FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- RLS — requests
-- ============================================================================

ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "requests_select" ON requests;
CREATE POLICY "requests_select" ON requests FOR SELECT
  TO authenticated USING (public.is_admin() OR client_id = public.current_client_id());

DROP POLICY IF EXISTS "requests_insert" ON requests;
CREATE POLICY "requests_insert" ON requests FOR INSERT
  TO authenticated WITH CHECK (public.is_admin() OR client_id = public.current_client_id());

DROP POLICY IF EXISTS "requests_update" ON requests;
CREATE POLICY "requests_update" ON requests FOR UPDATE
  TO authenticated USING (public.is_admin() OR client_id = public.current_client_id())
  WITH CHECK (public.is_admin() OR client_id = public.current_client_id());

DROP POLICY IF EXISTS "requests_delete" ON requests;
CREATE POLICY "requests_delete" ON requests FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- RLS — request_messages
-- ============================================================================

ALTER TABLE request_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "request_messages_select" ON request_messages;
CREATE POLICY "request_messages_select" ON request_messages FOR SELECT
  TO authenticated USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_messages.request_id
      AND r.client_id = public.current_client_id()
    )
  );

DROP POLICY IF EXISTS "request_messages_insert" ON request_messages;
CREATE POLICY "request_messages_insert" ON request_messages FOR INSERT
  TO authenticated WITH CHECK (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.requests r
      WHERE r.id = request_messages.request_id
      AND r.client_id = public.current_client_id()
    )
  );

DROP POLICY IF EXISTS "request_messages_update" ON request_messages;
CREATE POLICY "request_messages_update" ON request_messages FOR UPDATE
  TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "request_messages_delete" ON request_messages;
CREATE POLICY "request_messages_delete" ON request_messages FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- RLS — payments
-- ============================================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select" ON payments;
CREATE POLICY "payments_select" ON payments FOR SELECT
  TO authenticated USING (public.is_admin() OR client_id = public.current_client_id());

DROP POLICY IF EXISTS "payments_insert" ON payments;
CREATE POLICY "payments_insert" ON payments FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "payments_update" ON payments;
CREATE POLICY "payments_update" ON payments FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "payments_delete" ON payments;
CREATE POLICY "payments_delete" ON payments FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- RLS — amc_contracts
-- ============================================================================

ALTER TABLE amc_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "amc_select" ON amc_contracts;
CREATE POLICY "amc_select" ON amc_contracts FOR SELECT
  TO authenticated USING (public.is_admin() OR client_id = public.current_client_id());

DROP POLICY IF EXISTS "amc_insert" ON amc_contracts;
CREATE POLICY "amc_insert" ON amc_contracts FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "amc_update" ON amc_contracts;
CREATE POLICY "amc_update" ON amc_contracts FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "amc_delete" ON amc_contracts;
CREATE POLICY "amc_delete" ON amc_contracts FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============================================================================
-- STORAGE — private files bucket
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', false)
ON CONFLICT (id) DO NOTHING;

-- Clients can read files under their own client_id path
DROP POLICY IF EXISTS "files_storage_read" ON storage.objects;
CREATE POLICY "files_storage_read" ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'files'
    AND (
      public.is_admin()
      OR (
        (storage.foldername(name))[1] = public.current_client_id()::text
      )
    )
  );

-- Clients and admins can upload files
DROP POLICY IF EXISTS "files_storage_insert" ON storage.objects;
CREATE POLICY "files_storage_insert" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'files'
    AND (
      public.is_admin()
      OR (
        (storage.foldername(name))[1] = public.current_client_id()::text
      )
    )
  );

-- Admins can delete files
DROP POLICY IF EXISTS "files_storage_delete" ON storage.objects;
CREATE POLICY "files_storage_delete" ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'files' AND public.is_admin());

-- ============================================================================
-- updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clients_touch ON clients;
CREATE TRIGGER clients_touch BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS profiles_touch ON profiles;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS projects_touch ON projects;
CREATE TRIGGER projects_touch BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS requests_touch ON requests;
CREATE TRIGGER requests_touch BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS amc_touch ON amc_contracts;
CREATE TRIGGER amc_touch BEFORE UPDATE ON amc_contracts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
