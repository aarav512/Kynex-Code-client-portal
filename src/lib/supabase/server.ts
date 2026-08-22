import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { authCookieOptions, type PendingCookie } from '@/lib/supabase/edge';
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl
} from '@/lib/supabase/env';
import { mergeCookiesForSupabase } from '@/lib/supabase/session';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookieOptions: authCookieOptions,
    cookieEncoding: 'raw',
    cookies: {
      getAll() {
        return mergeCookiesForSupabase(cookieStore.getAll());
      },
      setAll(_cookiesToSet: PendingCookie[]) {
        // Session cookies are written by /api/auth/session and middleware.
      }
    }
  });
}

export function createServiceClient() {
  return createServerClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    cookieEncoding: 'raw',
    cookies: {
      getAll() {
        return [];
      },
      setAll() {}
    }
  });
}
