import { NextRequest, NextResponse } from 'next/server';
import { applyCookies, createEdgeClient, type PendingCookie } from '@/lib/supabase/edge';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
  const nextPath =
    role === 'admin'
      ? '/admin/dashboard'
      : body.redirect?.startsWith('/') && !body.redirect.startsWith('//')
        ? body.redirect
        : '/dashboard';

  const response = NextResponse.json({ ok: true, role, next: nextPath });
  applyCookies(response, jar);
  return response;
}
