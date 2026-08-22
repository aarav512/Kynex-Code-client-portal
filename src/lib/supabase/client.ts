import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

export function getBrowserSupabase(): SupabaseClient {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (typeof window === 'undefined') {
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
  }

  const w = window as Window & { __kynexSupabase?: SupabaseClient };
  if (!w.__kynexSupabase) {
    w.__kynexSupabase = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    });
  }
  return w.__kynexSupabase;
}

export function createClient() {
  return getBrowserSupabase();
}
