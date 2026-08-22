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
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ ok: false, error: 'Supabase is not configured.' }, { status: 500 });
    }

    let body: { email?: string; password?: string; redirect?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
    }

    const email = String(body.email || '');
    const password = String(body.password || '');
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: 'Email and password are required' }, { status: 400 });
    }

    const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session || !data.user) {
      return NextResponse.json({ ok: false, error: error?.message || 'Sign in failed' }, { status: 401 });
    }

    const authed = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });

    const { data: profile } = await authed
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    const role = profile?.role === 'admin' ? 'admin' : 'client';
    const response = NextResponse.json({ ok: true, role, next: safeNextPath(role, body.redirect) });
    appendSessionCookies(response.headers, data.session.access_token, data.session.refresh_token);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign in failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
