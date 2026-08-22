import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest } from 'next/server';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';
import { mergeCookiesForSupabase } from '@/lib/supabase/session';

export const authCookieOptions = {
  path: '/' as const,
  sameSite: 'lax' as const,
  secure: true
};

export type PendingCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export function createEdgeClient(request: NextRequest, jar: PendingCookie[]) {
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookieOptions: authCookieOptions,
    cookieEncoding: 'raw',
    cookies: {
      getAll() {
        return mergeCookiesForSupabase(request.cookies.getAll());
      },
      setAll(cookiesToSet: PendingCookie[]) {
        cookiesToSet.forEach((cookie) => jar.push(cookie));
      }
    }
  });
}
