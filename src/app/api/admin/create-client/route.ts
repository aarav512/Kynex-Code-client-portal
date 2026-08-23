import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceRoleKey } from '@/lib/supabase/env';
import { requireAdminUser } from '@/lib/supabase/assert-admin';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || null;
  const admin = await requireAdminUser(token);
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  if (!getSupabaseServiceRoleKey()) {
    return NextResponse.json(
      { error: 'Missing SUPABASE_SERVICE_ROLE_KEY. Add it as a GitHub Actions secret and a Cloudflare Pages environment variable, then redeploy.' },
      { status: 500 }
    );
  }

  const body = await request.json();
  const companyName = String(body.company_name || '');
  const contactName = String(body.contact_name || '');
  const email = String(body.email || '');
  const password = String(body.password || '');
  const phone = String(body.phone || '');
  if (!companyName || !contactName || !email || password.length < 6) {
    return NextResponse.json({ error: 'All fields required, password must be 6+ characters.' }, { status: 400 });
  }

  const service = admin.db;

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
