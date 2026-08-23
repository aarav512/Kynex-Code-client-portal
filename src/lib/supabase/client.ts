import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

export function getBrowserSupabase(): SupabaseClient {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (typeof window === 'undefined') {
    return createSupabaseClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
  }

  const w = window as Window & { __kynexSupabase?: SupabaseClient };
  if (!w.__kynexSupabase) {
    try {
      window.localStorage.removeItem('kynex-auth');
      window.localStorage.removeItem('kynex-session');
    } catch {
      /* ignore */
    }
    w.__kynexSupabase = createSupabaseClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage: window.sessionStorage,
        storageKey: 'kynex-auth'
      }
    });
  }
  return w.__kynexSupabase;
}

export function createClient() {
  return getBrowserSupabase();
}
