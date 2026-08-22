import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from '@/lib/supabase/env';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const authed = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: userData } = await authed.auth.getUser(token);
  if (!userData.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await authed.from('profiles').select('role').eq('id', userData.user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const body = await request.json();
  const companyName = String(body.company_name || '');
  const contactName = String(body.contact_name || '');
  const email = String(body.email || '');
  const password = String(body.password || '');
  const phone = String(body.phone || '');
  if (!companyName || !contactName || !email || password.length < 6) {
    return NextResponse.json({ error: 'All fields required, password must be 6+ characters.' }, { status: 400 });
  }

  const service = createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  if (authError || !authData.user) return NextResponse.json({ error: authError?.message || 'Could not create user' }, { status: 400 });

  const userId = authData.user.id;
  const { data: client, error: clientError } = await service
    .from('clients')
    .insert({ company_name: companyName, contact_name: contactName, email, phone: phone || null })
    .select()
    .single();

  if (clientError) {
    await service.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: clientError.message }, { status: 400 });
  }

  const { error: profileError } = await service.from('profiles').insert({
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
