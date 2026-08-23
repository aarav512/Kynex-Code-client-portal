import { NextRequest, NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/supabase/assert-admin';
import { resolvePortalRole } from '@/lib/supabase/persist';
import { createClient } from '@supabase/supabase-js';
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl
} from '@/lib/supabase/env';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null;
  if (!token) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const admin = await requireAdminUser(token);
  if (admin.ok) {
    const { data: profile } = await admin.db
      .from('profiles')
      .select('role, client_id, full_name, email')
      .eq('id', admin.user.id)
      .maybeSingle();
    return NextResponse.json({ ok: true, role: 'admin' as const, profile });
  }

  const authed = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: userData } = await authed.auth.getUser(token);
  if (!userData.user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const serviceKey = getSupabaseServiceRoleKey();
  const db = serviceKey
    ? createClient(getSupabaseUrl(), serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : authed;
  const { data: profile } = await db
    .from('profiles')
    .select('role, client_id, full_name, email')
    .eq('id', userData.user.id)
    .maybeSingle();

  return NextResponse.json({ ok: true, role: resolvePortalRole(profile), profile });
}
