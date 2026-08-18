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

export async function createProjectAction(formData: FormData) {
  const { supabase, profile } = await getProfile();
  if (!profile?.client_id) throw new Error('No client associated');

  const clientId = String(formData.get('client_id') || profile.client_id);
  const title = String(formData.get('title'));
  const description = String(formData.get('description') || '');
  const status = String(formData.get('status') || 'planning');
  const startDate = String(formData.get('start_date') || '') || null;
  const dueDate = String(formData.get('due_date') || '') || null;
  const budget = formData.get('budget')
    ? parseFloat(String(formData.get('budget')))
    : null;

  const { error } = await supabase.from('projects').insert({
    client_id: clientId,
    title,
    description: description || null,
    status,
    start_date: startDate,
    due_date: dueDate,
    budget
  });

  if (error) return { error: error.message };

  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  revalidatePath('/admin/dashboard');
  return { success: true };
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  const { supabase } = await getProfile();

  const { error } = await supabase
    .from('projects')
    .update({
      title: String(formData.get('title')),
      description: String(formData.get('description') || '') || null,
      status: String(formData.get('status')),
      start_date: String(formData.get('start_date') || '') || null,
      due_date: String(formData.get('due_date') || '') || null,
      budget: formData.get('budget')
        ? parseFloat(String(formData.get('budget')))
        : null
    })
    .eq('id', projectId);

  if (error) return { error: error.message };

  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}`);
  return { success: true };
}

export async function deleteProjectAction(projectId: string) {
  const { supabase, profile } = await getProfile();
  if (profile?.role !== 'admin') throw new Error('Not authorized');

  const { error } = await supabase.from('projects').delete().eq('id', projectId);
  if (error) return { error: error.message };

  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  return { success: true };
}
