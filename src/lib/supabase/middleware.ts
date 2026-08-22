import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { authCookieOptions, type PendingCookie } from '@/lib/supabase/edge';
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from '@/lib/supabase/env';
import {
  appendSessionCookies,
  jwtExp,
  jwtSub,
  mergeCookiesForSupabase,
  readSession
} from '@/lib/supabase/session';

export function copySetCookies(from: NextResponse, to: NextResponse) {
  const cookies = from.headers.getSetCookie?.() ?? [];
  cookies.forEach((cookie) => to.headers.append('Set-Cookie', cookie));
  return to;
}

export async function updateSession(request: NextRequest) {
  const passthrough = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return { supabase: null, user: null, response: passthrough };
  }

  let supabaseResponse = NextResponse.next({ request });
  const incoming = request.cookies.getAll();
  const session = readSession(incoming);

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookieOptions: authCookieOptions,
    cookieEncoding: 'raw',
    cookies: {
      getAll() {
        return mergeCookiesForSupabase(incoming);
      },
      setAll(cookiesToSet: PendingCookie[]) {
        supabaseResponse = NextResponse.next({ request });
        const authCookie = cookiesToSet.find((cookie) => cookie.name.includes('-auth-token') && cookie.value);
        if (authCookie?.value) {
          try {
            const parsed = JSON.parse(authCookie.value) as { access_token?: string; refresh_token?: string };
            if (parsed.access_token && parsed.refresh_token) {
              appendSessionCookies(supabaseResponse.headers, parsed.access_token, parsed.refresh_token);
            }
          } catch {
            // keep existing kynex cookies
          }
        }
      }
    }
  });

  let user = null as Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'];

  if (session?.access_token) {
    try {
      const { data } = await supabase.auth.getUser(session.access_token);
      user = data.user;
    } catch {
      user = null;
    }
  }

  if (!user && session?.access_token) {
    const exp = jwtExp(session.access_token);
    const id = jwtSub(session.access_token);
    if (id && exp > Math.floor(Date.now() / 1000)) {
      user = { id } as NonNullable<typeof user>;
    }
  }

  return { supabase, user, response: supabaseResponse };
}
