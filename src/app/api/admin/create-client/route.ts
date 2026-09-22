import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl
} from '@/lib/supabase/env';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function isAdminRole(role: string | null | undefined) {
  const value = String(role || '').toLowerCase().trim();
  return value === 'admin' || value === 'administrator';
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  const serviceKey = getSupabaseServiceRoleKey();
  if (!url || !anon) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }
  if (!serviceKey) {
    return NextResponse.json(
      {
        error:
          'Missing SUPABASE_SERVICE_ROLE_KEY. Add it as a GitHub Actions secret and a Cloudflare Pages environment variable, then redeploy.'
      },
      { status: 500 }
    );
  }

  const authed = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: userData } = await authed.auth.getUser(token);
  if (!userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: adminProfile } = await service
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (!isAdminRole(adminProfile?.role)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const body = await request.json();
  const companyName = String(body.company_name || '');
  const contactName = String(body.contact_name || '');
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const phone = String(body.phone || '') || null;
  if (!companyName || !contactName || !email || password.length < 6) {
    return NextResponse.json({ error: 'All fields required, password must be 6+ characters.' }, { status: 400 });
  }

  if (email === (userData.user.email || '').toLowerCase()) {
    return NextResponse.json(
      { error: 'That email is your admin login. Use the client’s own email address.' },
      { status: 400 }
    );
  }

  const created = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (created.error || !created.data.user) {
    return NextResponse.json(
      { error: created.error?.message || 'Could not create user' },
      { status: 400 }
    );
  }
  const userId = created.data.user.id;

  const { data: client, error: clientError } = await service
    .from('clients')
    .insert({
      name: companyName,
      contact_name: contactName,
      contact_email: email,
      contact_phone: phone,
      status: 'active'
    })
    .select('id')
    .single();

  if (clientError || !client) {
    await service.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: clientError?.message || 'Could not create client' }, { status: 400 });
  }

  const { error: profileError } = await service.from('profiles').upsert({
    id: userId,
    role: 'client',
    client_id: client.id,
    full_name: contactName,
    email
  });

  if (profileError) {
    await service.from('clients').delete().eq('id', client.id);
    await service.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, clientId: client.id });
}
