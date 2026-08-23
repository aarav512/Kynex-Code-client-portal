import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl
} from '@/lib/supabase/env';
import { resolvePortalRole } from '@/lib/supabase/persist';

type AdminOk = { ok: true; user: User; db: SupabaseClient };
type AdminErr = { ok: false; error: string; status: 401 | 403 | 500 };

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

  let isAdmin = resolvePortalRole(profile) === 'admin';
  if (!isAdmin && serviceKey) {
    const { count } = await db
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin');
    if (!count) isAdmin = true;
  }

  if (!isAdmin) return { ok: false, error: 'Not authorized', status: 403 };

  if (profile?.role !== 'admin' && serviceKey) {
    if (profile) {
      await db.from('profiles').update({ role: 'admin' }).eq('id', userData.user.id);
    } else {
      await db.from('profiles').insert({
        id: userData.user.id,
        role: 'admin',
        client_id: null,
        full_name: userData.user.user_metadata?.full_name || userData.user.email || 'Admin',
        email: userData.user.email || ''
      });
    }
  }

  return { ok: true, user: userData.user, db };
}
