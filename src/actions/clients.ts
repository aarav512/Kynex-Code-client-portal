'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') throw new Error('Not authorized');
  return user;
}

export async function createClientAction(formData: FormData) {
  await requireAdmin();

  const companyName = String(formData.get('company_name'));
  const contactName = String(formData.get('contact_name'));
  const email = String(formData.get('email'));
  const password = String(formData.get('password'));
  const phone = String(formData.get('phone') || '');

  if (!companyName || !contactName || !email || password.length < 6) {
    return { error: 'All fields required, password must be 6+ characters.' };
  }

  const serviceClient = createServiceClient();

  // 1. Create the auth user
  const { data: authData, error: authError } =
    await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

  if (authError) {
    return { error: authError.message };
  }

  const userId = authData.user.id;

  // 2. Create the clients row
  const { data: client, error: clientError } = await serviceClient
    .from('clients')
    .insert({
      company_name: companyName,
      contact_name: contactName,
      email,
      phone: phone || null
    })
    .select()
    .single();

  if (clientError) {
    // Rollback auth user
    await serviceClient.auth.admin.deleteUser(userId);
    return { error: clientError.message };
  }

  // 3. Create the profile row
  const { error: profileError } = await serviceClient.from('profiles').insert({
    id: userId,
    role: 'client',
    client_id: client.id,
    full_name: contactName,
    email
  });

  if (profileError) {
    await serviceClient.from('clients').delete().eq('id', client.id);
    await serviceClient.auth.admin.deleteUser(userId);
    return { error: profileError.message };
  }

  revalidatePath('/admin/clients');
  revalidatePath('/admin/dashboard');
  return { success: true, clientId: client.id };
}

export async function updateClientAction(clientId: string, formData: FormData) {
  await requireAdmin();
  const supabase = createClient();

  const { error } = await supabase
    .from('clients')
    .update({
      company_name: String(formData.get('company_name')),
      contact_name: String(formData.get('contact_name')),
      email: String(formData.get('email')),
      phone: String(formData.get('phone') || null),
      status: String(formData.get('status'))
    })
    .eq('id', clientId);

  if (error) return { error: error.message };

  revalidatePath('/admin/clients');
  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true };
}

export async function deleteClientAction(clientId: string) {
  await requireAdmin();
  const supabase = createClient();

  const { error } = await supabase.from('clients').delete().eq('id', clientId);
  if (error) return { error: error.message };

  revalidatePath('/admin/clients');
  revalidatePath('/admin/dashboard');
  return { success: true };
}
