import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export const authCookieOptions = {
  path: '/',
  sameSite: 'lax' as const,
  secure: true
};

export type PendingCookie = {
  name: string;
  value: string;
  options?: CookieOptions;
};

export function applyCookies(response: NextResponse, cookiesToSet: PendingCookie[]) {
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, { ...authCookieOptions, ...options });
  });
  return response;
}

export function createEdgeClient(request: NextRequest, jar: PendingCookie[]) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach((cookie) => jar.push(cookie));
        }
      }
    }
  );
}
