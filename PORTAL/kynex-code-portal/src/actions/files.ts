'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { FileCategory } from '@/lib/database.types';

export type ActionState = { error?: string; success?: string } | null;

// Returns a short-lived signed URL for downloading a file. RLS on
// storage.objects (see supabase/schema.sql) already guarantees the caller
// can only reach files under their own client_id folder or, if admin,
// anything — this action just wraps that check in a friendly server call.
export async function getFileDownloadUrl(storagePath: string): Promise<{ url?: string; error?: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from('files').createSignedUrl(storagePath, 60);
  if (error || !data) return { error: 'Could not generate a download link.' };
  return { url: data.signedUrl };
}

// Admin-only: upload a file for a client/project.
export async function uploadFile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Not authorized.' };

  const clientId = String(formData.get('client_id') || '');
  const projectId = String(formData.get('project_id') || '') || null;
  const category = String(formData.get('category') || 'other') as FileCategory;
  const file = formData.get('file') as File | null;

  if (!clientId || !file || file.size === 0) return { error: 'Choose a client and a file.' };

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${clientId}/${projectId ?? 'general'}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from('files').upload(path, file, {
    contentType: file.type || 'application/octet-stream'
  });
  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from('files').insert({
    client_id: clientId,
    project_id: projectId,
    category,
    file_name: file.name,
    storage_path: path,
    file_type: file.type || 'application/octet-stream',
    file_size_bytes: file.size,
    uploaded_by: user.id
  });
  if (insertError) return { error: insertError.message };

  revalidatePath('/admin/files');
  revalidatePath('/files');
  return { success: 'File uploaded.' };
}

// Admin-only: delete a file (removes both the storage object and the row).
export async function deleteFile(fileId: string, storagePath: string) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated.' };

  await supabase.storage.from('files').remove([storagePath]);
  const { error } = await supabase.from('files').delete().eq('id', fileId);
  if (error) return { error: error.message };

  revalidatePath('/admin/files');
  revalidatePath('/files');
  return { success: 'File deleted.' };
}
