import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceRoleKey } from '@/lib/supabase/env';
import { requireAdminUser } from '@/lib/supabase/assert-admin';
import { findAuthUserByEmail, insertMatchingColumns } from '@/lib/supabase/insert-matching';

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
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const phone = String(body.phone || '');
  if (!companyName || !contactName || !email || password.length < 6) {
    return NextResponse.json({ error: 'All fields required, password must be 6+ characters.' }, { status: 400 });
  }

  const service = admin.db;
  let createdAuthUser = false;
  let userId: string | null = null;

  const created = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (created.data.user && !created.error) {
    userId = created.data.user.id;
    createdAuthUser = true;
  } else {
    const already =
      /already/i.test(created.error?.message || '') ||
      /registered/i.test(created.error?.message || '') ||
      created.error?.status === 422;
    if (!already) {
      return NextResponse.json({ error: created.error?.message || 'Could not create user' }, { status: 400 });
    }

    const existing = await findAuthUserByEmail(service, email);
    if (existing.error || !existing.user) {
      return NextResponse.json(
        { error: created.error?.message || 'A login with this email already exists, but it could not be linked.' },
        { status: 400 }
      );
    }
    if (existing.user.id === admin.user.id) {
      return NextResponse.json(
        { error: 'That email is your admin login. Use the client’s own email address.' },
        { status: 400 }
      );
    }

    userId = existing.user.id;
    const { error: passwordError } = await service.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true
    });
    if (passwordError) {
      return NextResponse.json({ error: passwordError.message }, { status: 400 });
    }
  }

  if (!userId) return NextResponse.json({ error: 'Could not create user' }, { status: 400 });

  const { data: existingProfile } = await service
    .from('profiles')
    .select('id, role, client_id')
    .eq('id', userId)
    .maybeSingle();

  if (existingProfile?.role === 'admin') {
    if (createdAuthUser) await service.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: 'That email belongs to an admin account.' }, { status: 400 });
  }
  if (existingProfile?.client_id) {
    return NextResponse.json(
      { error: 'This email already has a client login. Open that client in the portal, or use a different email.' },
      { status: 400 }
    );
  }

  const { data: client, error: clientError } = await insertMatchingColumns(service, 'clients', {
    company_name: companyName,
    contact_name: contactName,
    email,
    phone: phone || null
  });

  if (clientError || !client) {
    if (createdAuthUser) await service.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: clientError?.message || 'Could not create client' }, { status: 400 });
  }

  const clientId = String((client as { id: string }).id);
  const profilePayload = {
    id: userId,
    role: 'client',
    client_id: clientId,
    full_name: contactName,
    email
  };

  const profileResult = existingProfile
    ? await service.from('profiles').update({ role: 'client', client_id: clientId, full_name: contactName, email }).eq('id', userId)
    : await insertMatchingColumns(service, 'profiles', profilePayload);

  const profileError = 'error' in profileResult ? profileResult.error : null;
  if (profileError) {
    await service.from('clients').delete().eq('id', clientId);
    if (createdAuthUser) await service.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, clientId });
}
