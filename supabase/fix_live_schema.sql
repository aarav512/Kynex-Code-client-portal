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
UPDATE public.requests SET subject = title WHERE subject IS NULL AND title IS NOT NULL;

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

-- If a file is inserted without storage_path, copy file_name into it
CREATE OR REPLACE FUNCTION public.files_fill_storage_path()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.storage_path IS NULL OR NEW.storage_path = '' THEN
    NEW.storage_path := COALESCE(NEW.file_name, '');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS files_fill_storage_path_trg ON public.files;
CREATE TRIGGER files_fill_storage_path_trg
BEFORE INSERT OR UPDATE ON public.files
FOR EACH ROW EXECUTE FUNCTION public.files_fill_storage_path();
