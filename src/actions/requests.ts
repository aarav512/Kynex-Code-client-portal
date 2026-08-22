'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, client_id')
    .eq('id', user.id)
    .maybeSingle();

  return { supabase, user, profile };
}

export async function createRequestAction(formData: FormData) {
  const { supabase, profile } = await getProfile();
  if (!profile?.client_id) throw new Error('No client associated');

  const clientId = String(formData.get('client_id') || profile.client_id);
  const subject = String(formData.get('subject'));
  const body = String(formData.get('body'));
  const projectId = String(formData.get('project_id') || '') || null;

  if (!subject || !body) return { error: 'Subject and message are required.' };

  const { data: request, error } = await supabase
    .from('requests')
    .insert({
      client_id: clientId,
      project_id: projectId,
      subject,
      created_by: profile.id
    })
    .select()
    .single();

  if (error) return { error: error.message };

  const { error: msgError } = await supabase
    .from('request_messages')
    .insert({
      request_id: request.id,
      author_id: profile.id,
      body,
      is_staff: profile.role === 'admin'
    });

  if (msgError) return { error: msgError.message };

  revalidatePath('/admin/requests');
  revalidatePath('/requests');
  return { success: true, requestId: request.id };
}

export async function addRequestMessageAction(
  requestId: string,
  formData: FormData
) {
  const { supabase, profile } = await getProfile();
  const body = String(formData.get('body'));

  if (!body) return { error: 'Message cannot be empty.' };

  const { error } = await supabase.from('request_messages').insert({
    request_id: requestId,
    author_id: profile?.id,
    body,
    is_staff: profile?.role === 'admin'
  });

  if (error) return { error: error.message };

  // Update request updated_at and status
  const newStatus = profile?.role === 'admin' ? 'in_progress' : 'open';
  await supabase
    .from('requests')
    .update({ status: newStatus })
    .eq('id', requestId);

  revalidatePath(`/requests/${requestId}`);
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath('/requests');
  revalidatePath('/admin/requests');
  return { success: true };
}

export async function updateRequestStatusAction(
  requestId: string,
  status: string
) {
  const { supabase, profile } = await getProfile();

  const { error } = await supabase
    .from('requests')
    .update({ status })
    .eq('id', requestId);

  if (error) return { error: error.message };

  revalidatePath(`/requests/${requestId}`);
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath('/requests');
  revalidatePath('/admin/requests');
  return { success: true };
}
