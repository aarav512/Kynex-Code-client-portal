'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { RequestCategory, RequestPriority, RequestStatus } from '@/lib/database.types';

export type ActionState = { error?: string } | null;

// Client: submit a new request. client_id is taken from the caller's own
// profile — never from the form — so a client cannot submit a request
// against another client's account even by tampering with the form.
export async function createRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: profile } = await supabase.from('profiles').select('client_id, role').eq('id', user.id).single();
  if (!profile?.client_id) return { error: 'Only clients can submit requests.' };

  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const category = String(formData.get('category') || 'other') as RequestCategory;
  const priority = String(formData.get('priority') || 'medium') as RequestPriority;
  const projectId = String(formData.get('project_id') || '') || null;
  const attachment = formData.get('attachment') as File | null;

  if (!title || !description) return { error: 'Title and description are required.' };

  let attachmentPath: string | null = null;
  if (attachment && attachment.size > 0) {
    const safeName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    attachmentPath = `${profile.client_id}/requests/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from('files').upload(attachmentPath, attachment);
    if (uploadError) return { error: `Attachment upload failed: ${uploadError.message}` };
  }

  const { data: request, error } = await supabase
    .from('requests')
    .insert({
      client_id: profile.client_id,
      project_id: projectId,
      title,
      description,
      category,
      priority,
      attachment_path: attachmentPath,
      created_by: user.id
    })
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath('/requests');
  redirect(`/requests/${request.id}`);
}

// Shared: post a reply on a request thread. RLS scopes both requests and
// request_messages by client_id, so this works identically for admin and
// client callers without any manual "is this their request?" check here.
export async function postRequestMessage(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const requestId = String(formData.get('request_id') || '');
  const body = String(formData.get('body') || '').trim();
  if (!body) return { error: 'Message cannot be empty.' };

  const { data: req } = await supabase.from('requests').select('client_id').eq('id', requestId).single();
  if (!req) return { error: 'Request not found.' };

  const { data: authorProfile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  const { error } = await supabase.from('request_messages').insert({
    request_id: requestId,
    client_id: req.client_id,
    author_id: user.id,
    author_name: authorProfile?.role === 'admin' ? `${authorProfile.full_name} · Kynex Code` : authorProfile?.full_name ?? 'Unknown',
    author_role: authorProfile?.role ?? 'client',
    body
  });
  if (error) return { error: error.message };

  revalidatePath(`/requests/${requestId}`);
  revalidatePath(`/admin/requests/${requestId}`);
  return null;
}

// Admin-only: change a request's status.
export async function updateRequestStatus(requestId: string, status: RequestStatus) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Not authorized.' };

  const { error } = await supabase.from('requests').update({ status }).eq('id', requestId);
  if (error) return { error: error.message };

  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath('/admin/requests');
  return { success: true };
}
