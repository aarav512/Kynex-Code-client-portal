// Server-side Supabase client — used in Server Components, Server Actions,
// and Route Handlers. Reads/writes the auth cookie so the session persists
// across requests. Always created fresh per-request (cookies() is
// request-scoped in Next.js).
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render — middleware refreshes
            // the session on the next request, so this is safe to ignore.
          }
        }
      }
    }
  );
}

// Admin-only client using the service role key. Bypasses RLS entirely, so
// it is only ever used inside src/actions/clients.ts to provision new auth
// users, and only after the caller's own session has been verified as an
// admin. NEVER import this into anything that runs in the browser.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createServiceRoleClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
