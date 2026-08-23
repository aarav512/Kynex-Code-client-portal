import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl
} from '@/lib/supabase/env';

type AdminOk = { ok: true; user: User; db: SupabaseClient };
type AdminErr = { ok: false; error: string; status: 401 | 403 | 500 };

function isAdminRole(role: string | null | undefined) {
  const value = String(role || '').toLowerCase().trim();
  return value === 'admin' || value === 'administrator';
}

export async function requireAdminUser(token: string | null): Promise<AdminOk | AdminErr> {
  if (!token) return { ok: false, error: 'Unauthorized', status: 401 };

  const url = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  const serviceKey = getSupabaseServiceRoleKey();
  if (!url || !anon) return { ok: false, error: 'Supabase is not configured', status: 500 };

  const authed = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: userData } = await authed.auth.getUser(token);
  if (!userData.user) return { ok: false, error: 'Unauthorized', status: 401 };

  const db = serviceKey
    ? createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : authed;

  const { data: profile } = await db
    .from('profiles')
    .select('id, role, client_id, full_name, email')
    .eq('id', userData.user.id)
    .maybeSingle();

  let isAdmin = isAdminRole(profile?.role);
  if (!isAdmin && profile && !profile.client_id && serviceKey) {
    const { count } = await db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');
    if (!count) isAdmin = true;
  }

  if (!isAdmin) return { ok: false, error: 'Not authorized', status: 403 };

  if (profile && !isAdminRole(profile.role) && serviceKey) {
    await db.from('profiles').update({ role: 'admin' }).eq('id', userData.user.id);
  }

  return { ok: true, user: userData.user, db };
}
