import { NextRequest, NextResponse } from 'next/server';
import { applyCookies, createEdgeClient, type PendingCookie } from '@/lib/supabase/edge';
import { getSupabaseUrl, isSupabaseConfigured } from '@/lib/supabase/env';

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
      return NextResponse.json(
        { ok: false, error: 'Supabase is not configured on this deployment.' },
        { status: 500 }
      );
    }

    const supabaseOrigin = getSupabaseUrl();
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseOrigin)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Supabase URL is invalid (${supabaseOrigin || 'empty'}). Use https://<project-ref>.supabase.co with no trailing slash.`
        },
        { status: 500 }
      );
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

    const jar: PendingCookie[] = [];
    const supabase = createEdgeClient(request, jar);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return NextResponse.json(
        { ok: false, error: error?.message || 'Sign in failed' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    const role = profile?.role === 'admin' ? 'admin' : 'client';
    const response = NextResponse.json({ ok: true, role, next: safeNextPath(role, body.redirect) });
    applyCookies(response, jar);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sign in failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
