'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export type ActionState = { error?: string } | null;

async function assertAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.', supabase, user: null };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Not authorized.', supabase, user: null };
  return { error: null, supabase, user };
}

export async function createClientAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { error: authErr } = await assertAdmin();
  if (authErr) return { error: authErr };

  const companyName = String(formData.get('company_name') || '').trim();
  const contactName = String(formData.get('contact_name') || '').trim();
  const contactEmail = String(formData.get('contact_email') || '').trim();
  const contactPhone = String(formData.get('contact_phone') || '').trim() || null;
  const password = String(formData.get('password') || '');
  const notes = String(formData.get('notes') || '').trim() || null;

  if (!companyName || !contactName || !contactEmail || !password) {
    return { error: 'Company name, contact name, email, and password are required.' };
  }
  if (password.length < 8) return { error: 'Password must be at least 8 characters.' };

  const serviceSupabase = createServiceRoleClient();

  // 1. Create the client record
  const { data: clientRow, error: clientErr } = await serviceSupabase
    .from('clients')
    .insert({ company_name: companyName, contact_name: contactName, contact_email: contactEmail, contact_phone: contactPhone, notes })
    .select('id').single();
  if (clientErr) return { error: clientErr.message };

  // 2. Create the Supabase Auth user
  const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
    email: contactEmail, password, email_confirm: true
  });
  if (authError) {
    await serviceSupabase.from('clients').delete().eq('id', clientRow.id);
    return { error: authError.message };
  }

  // 3. Create the profile row linking auth user -> client
  const { error: profileErr } = await serviceSupabase.from('profiles').insert({
    id: authData.user.id, role: 'client', client_id: clientRow.id,
    full_name: contactName, email: contactEmail
  });
  if (profileErr) {
    await serviceSupabase.auth.admin.deleteUser(authData.user.id);
    await serviceSupabase.from('clients').delete().eq('id', clientRow.id);
    return { error: profileErr.message };
  }

  revalidatePath('/admin/clients');
  redirect(`/admin/clients/${clientRow.id}`);
}

export async function updateClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { error: authErr, supabase } = await assertAdmin();
  if (authErr) return { error: authErr };

  const id = String(formData.get('id') || '');
  const { error } = await supabase!.from('clients').update({
    company_name: String(formData.get('company_name') || '').trim(),
    contact_name: String(formData.get('contact_name') || '').trim(),
    contact_phone: String(formData.get('contact_phone') || '').trim() || null,
    notes: String(formData.get('notes') || '').trim() || null,
  }).eq('id', id);

  if (error) return { error: error.message };
  revalidatePath(`/admin/clients/${id}`);
  revalidatePath('/admin/clients');
  return null;
}

export async function toggleClientAccess(clientId: string, isActive: boolean) {
  const { error: authErr, supabase } = await assertAdmin();
  if (authErr) return { error: authErr };
  const { error } = await supabase!.from('clients').update({ is_active: isActive }).eq('id', clientId);
  if (error) return { error: error.message };
  revalidatePath('/admin/clients');
  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true };
}
