-- Paste this entire script into Supabase → SQL Editor → Run.
-- This creates the names the portal expects and adds missing columns.

-- AMC: app looks for amc_contracts, live table is amc
CREATE OR REPLACE VIEW public.amc_contracts
WITH (security_invoker = true) AS
SELECT * FROM public.amc;

-- Payments: app looks for payments, live table is invoices
CREATE OR REPLACE VIEW public.payments
WITH (security_invoker = true) AS
SELECT * FROM public.invoices;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.amc_contracts TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO anon, authenticated, service_role;

-- Clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
UPDATE public.clients SET email = contact_email WHERE email IS NULL AND contact_email IS NOT NULL;
UPDATE public.clients SET phone = contact_phone WHERE phone IS NULL AND contact_phone IS NOT NULL;

-- Requests (app uses subject)
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS name text;
UPDATE public.requests SET subject = title WHERE subject IS NULL AND title IS NOT NULL;
UPDATE public.requests SET name = COALESCE(title, subject) WHERE name IS NULL;

-- Projects (app uses title)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget numeric(12,2);
UPDATE public.projects SET title = name WHERE title IS NULL AND name IS NOT NULL;

-- Files (live column is storage_path)
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS file_size bigint DEFAULT 0;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS mime_type text DEFAULT 'application/octet-stream';
UPDATE public.files SET storage_path = COALESCE(storage_path, file_path, file_name) WHERE storage_path IS NULL;
UPDATE public.files SET file_path = COALESCE(file_path, storage_path, file_name) WHERE file_path IS NULL;

-- AMC extra columns the portal form sends
ALTER TABLE public.amc ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.amc ADD COLUMN IF NOT EXISTS notes text;

-- Invoices extra columns
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS paid_date date;

-- Request messages
ALTER TABLE public.request_messages ADD COLUMN IF NOT EXISTS is_staff boolean DEFAULT false;

NOTIFY pgrst, 'reload schema';

-- Fill every required files column so uploads cannot fail on the next missing field
CREATE OR REPLACE FUNCTION public.files_fill_required()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.storage_path IS NULL OR NEW.storage_path = '' THEN
    NEW.storage_path := COALESCE(NEW.file_path, NEW.file_name, '');
  END IF;
  IF NEW.file_path IS NULL OR NEW.file_path = '' THEN
    NEW.file_path := COALESCE(NEW.storage_path, NEW.file_name, '');
  END IF;
  IF NEW.file_type IS NULL OR NEW.file_type = '' THEN
    NEW.file_type := COALESCE(NEW.mime_type, 'application/octet-stream');
  END IF;
  IF NEW.mime_type IS NULL OR NEW.mime_type = '' THEN
    NEW.mime_type := COALESCE(NEW.file_type, 'application/octet-stream');
  END IF;
  IF NEW.file_size IS NULL THEN
    NEW.file_size := 0;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS files_fill_storage_path_trg ON public.files;
DROP TRIGGER IF EXISTS files_fill_required_trg ON public.files;
CREATE TRIGGER files_fill_required_trg
BEFORE INSERT OR UPDATE ON public.files
FOR EACH ROW EXECUTE FUNCTION public.files_fill_required();

-- Projects: live DB requires project_type (and sometimes name/title)
CREATE OR REPLACE FUNCTION public.projects_fill_required()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  first_label text;
BEGIN
  IF NEW.name IS NULL OR NEW.name::text = '' THEN
    NEW.name := COALESCE(NEW.title, 'Project');
  END IF;
  IF to_jsonb(NEW) ? 'title' AND (NEW.title IS NULL OR NEW.title::text = '') THEN
    NEW.title := COALESCE(NEW.name, 'Project');
  END IF;
  IF NEW.project_type IS NULL OR NEW.project_type::text = '' THEN
    SELECT e.enumlabel INTO first_label
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_enum e ON e.enumtypid = a.atttypid
    WHERE n.nspname = 'public' AND c.relname = 'projects' AND a.attname = 'project_type'
    ORDER BY e.enumsortorder
    LIMIT 1;
    NEW.project_type := COALESCE(first_label, 'general');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_fill_required_trg ON public.projects;
CREATE TRIGGER projects_fill_required_trg
BEFORE INSERT OR UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.projects_fill_required();

DO $$
DECLARE
  coltype oid;
  first_label text;
BEGIN
  SELECT a.atttypid INTO coltype
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'projects' AND a.attname = 'project_type' AND a.attnum > 0 AND NOT a.attisdropped;
  IF coltype IS NULL THEN
    RETURN;
  END IF;
  SELECT e.enumlabel INTO first_label FROM pg_enum e WHERE e.enumtypid = coltype ORDER BY e.enumsortorder LIMIT 1;
  IF first_label IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.projects ALTER COLUMN project_type SET DEFAULT %L', first_label);
    EXECUTE format('UPDATE public.projects SET project_type = %L WHERE project_type IS NULL', first_label);
  ELSE
    BEGIN
      ALTER TABLE public.projects ALTER COLUMN project_type SET DEFAULT 'general';
    EXCEPTION WHEN others THEN
      ALTER TABLE public.projects ALTER COLUMN project_type DROP NOT NULL;
    END;
    UPDATE public.projects SET project_type = 'general' WHERE project_type IS NULL;
  END IF;
END $$;

-- Requests: fill title/subject/description and common required fields
CREATE OR REPLACE FUNCTION public.requests_fill_required()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF to_jsonb(NEW) ? 'title' AND (NEW.title IS NULL OR NEW.title::text = '') THEN
    NEW.title := COALESCE(NEW.subject, NEW.description, 'Request');
  END IF;
  IF to_jsonb(NEW) ? 'subject' AND (NEW.subject IS NULL OR NEW.subject::text = '') THEN
    NEW.subject := COALESCE(NEW.title, NEW.description, 'Request');
  END IF;
  IF to_jsonb(NEW) ? 'description' AND (NEW.description IS NULL OR NEW.description::text = '') THEN
    NEW.description := COALESCE(NEW.subject, NEW.title, '');
  END IF;
  IF NEW.status IS NULL OR NEW.status::text = '' THEN
    NEW.status := 'open';
  END IF;
  IF to_jsonb(NEW) ? 'priority' AND NEW.priority IS NULL THEN
    BEGIN
      NEW.priority := 'normal';
    EXCEPTION WHEN others THEN
      BEGIN
        NEW.priority := 0;
      EXCEPTION WHEN others THEN
        NULL;
      END;
    END;
  END IF;
  IF to_jsonb(NEW) ? 'category' AND (NEW.category IS NULL OR NEW.category::text = '') THEN
    NEW.category := 'general';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS requests_fill_required_trg ON public.requests;
CREATE TRIGGER requests_fill_required_trg
BEFORE INSERT OR UPDATE ON public.requests
FOR EACH ROW EXECUTE FUNCTION public.requests_fill_required();

-- Let signed-in clients create requests and messages
GRANT SELECT, INSERT, UPDATE ON public.requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.request_messages TO authenticated;

DROP POLICY IF EXISTS kynex_requests_insert ON public.requests;
CREATE POLICY kynex_requests_insert ON public.requests
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (
        lower(p.role::text) IN ('admin', 'administrator')
        OR p.client_id = client_id
      )
  )
);

DROP POLICY IF EXISTS kynex_request_messages_insert ON public.request_messages;
CREATE POLICY kynex_request_messages_insert ON public.request_messages
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.requests r ON r.id = request_id
    WHERE p.id = auth.uid()
      AND (
        lower(p.role::text) IN ('admin', 'administrator')
        OR p.client_id = r.client_id
      )
  )
);

NOTIFY pgrst, 'reload schema';
