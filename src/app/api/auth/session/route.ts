import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from '@/lib/supabase/env';
import { appendSessionCookies } from '@/lib/supabase/session';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function safeNextPath(role: 'admin' | 'client', redirectTo?: string) {
  if (role === 'admin') return '/admin/dashboard';
  if (redirectTo?.startsWith('/') && !redirectTo.startsWith('//') && !redirectTo.includes('\\')) {
    return redirectTo;
  }
  return '/dashboard';
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 500 });
  }

  let body: { access_token?: string; refresh_token?: string; redirect?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }

  const access_token = String(body.access_token || '');
  const refresh_token = String(body.refresh_token || '');
  if (!access_token || !refresh_token) {
    return NextResponse.json({ ok: false, error: 'Missing session' }, { status: 400 });
  }

  const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: { headers: { Authorization: `Bearer ${access_token}` } },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });

  const { data, error } = await supabase.auth.getUser(access_token);
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: error?.message || 'Invalid session' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  const role = profile?.role === 'admin' ? 'admin' : 'client';
  const response = NextResponse.json({ ok: true, role, next: safeNextPath(role, body.redirect) });
  appendSessionCookies(response.headers, access_token, refresh_token);
  return response;
}
