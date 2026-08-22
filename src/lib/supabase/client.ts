import { createBrowserClient } from '@supabase/ssr';
import { authCookieOptions } from '@/lib/supabase/edge';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookieOptions: authCookieOptions
  });
}
