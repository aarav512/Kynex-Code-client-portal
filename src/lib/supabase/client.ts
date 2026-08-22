import { createBrowserClient } from '@supabase/ssr';
import { authCookieOptions } from '@/lib/supabase/edge';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';
import { mergeCookiesForSupabase, writeBrowserSession } from '@/lib/supabase/session';

function parseDocumentCookies() {
  if (typeof document === 'undefined') return [];
  return document.cookie.split(';').flatMap((part) => {
    const trimmed = part.trim();
    if (!trimmed) return [];
    const eq = trimmed.indexOf('=');
    if (eq === -1) return [{ name: trimmed, value: '' }];
    return [{ name: trimmed.slice(0, eq), value: trimmed.slice(eq + 1) }];
  });
}

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookieOptions: authCookieOptions,
    cookieEncoding: 'raw',
    cookies: {
      getAll() {
        return mergeCookiesForSupabase(parseDocumentCookies());
      },
      setAll(cookiesToSet: { name: string; value: string }[]) {
        const authCookie = cookiesToSet.find((cookie) => cookie.name.includes('-auth-token') && cookie.value);
        if (!authCookie?.value) return;
        try {
          const parsed = JSON.parse(authCookie.value) as { access_token?: string; refresh_token?: string };
          if (parsed.access_token && parsed.refresh_token) {
            writeBrowserSession(parsed.access_token, parsed.refresh_token);
          }
        } catch {
          // ignore malformed cookie writes
        }
      }
    }
  });
}
