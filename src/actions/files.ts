'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function getProfile() {
  const supabase = createClient();
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

export async function uploadFileAction(formData: FormData) {
  const { supabase, profile } = await getProfile();
  if (!profile?.client_id) throw new Error('No client associated');

  const file = formData.get('file') as File;
  const clientId = String(formData.get('client_id') || profile.client_id);
  const projectId = String(formData.get('project_id') || '') || null;

  if (!file || file.size === 0) {
    return { error: 'No file provided.' };
  }

  const filePath = `${clientId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('files')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) return { error: uploadError.message };

  const { error: dbError } = await supabase.from('files').insert({
    client_id: clientId,
    project_id: projectId,
    file_name: file.name,
    file_path: filePath,
    file_size: file.size,
    mime_type: file.type || 'application/octet-stream',
    uploaded_by: profile.id
  });

  if (dbError) {
    // Clean up uploaded file
    await supabase.storage.from('files').remove([filePath]);
    return { error: dbError.message };
  }

  revalidatePath('/admin/files');
  revalidatePath('/files');
  return { success: true };
}

export async function deleteFileAction(fileId: string, filePath: string) {
  const { supabase, profile } = await getProfile();
  if (profile?.role !== 'admin') throw new Error('Not authorized');

  const { error: dbError } = await supabase.from('files').delete().eq('id', fileId);
  if (dbError) return { error: dbError.message };

  const { error: storageError } = await supabase.storage
    .from('files')
    .remove([filePath]);
  if (storageError) return { error: storageError.message };

  revalidatePath('/admin/files');
  revalidatePath('/files');
  return { success: true };
}
