// Browser-side Supabase client — used in Client Components.
// Auth is cookie-based (via @supabase/ssr) so this stays in sync with the
// server client and middleware automatically.
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
