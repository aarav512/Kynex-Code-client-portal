import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

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

export function cookieInit(options?: CookieOptions) {
  const maxAge = typeof options?.maxAge === 'number' ? options.maxAge : undefined;
  return {
    path: '/',
    sameSite: 'lax' as const,
    secure: true,
    httpOnly: options?.httpOnly,
    maxAge,
    expires: options?.expires
  };
}

export function applyCookies(response: NextResponse, cookiesToSet: PendingCookie[]) {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, cookieInit(options));
  });
  return response;
}

export function createEdgeClient(request: NextRequest, jar: PendingCookie[]) {
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookieOptions: authCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: PendingCookie[]) {
        cookiesToSet.forEach((cookie) => jar.push(cookie));
      }
    }
  });
}
