'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { ProjectStatus } from '@/lib/database.types';
import type { ActionState } from './clients';

async function assertAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return p?.role === 'admin';
}

export async function createProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();
  if (!await assertAdmin(supabase)) return { error: 'Not authorized.' };

  const clientId = String(formData.get('client_id') || '');
  const name = String(formData.get('name') || '').trim();
  const projectType = String(formData.get('project_type') || '').trim();
  if (!clientId || !name || !projectType) return { error: 'Client, name, and type are required.' };

  const { data, error } = await supabase.from('projects').insert({
    client_id: clientId,
    name,
    project_type: projectType,
    description: String(formData.get('description') || '').trim() || null,
    status: (String(formData.get('status') || 'not_started')) as ProjectStatus,
    start_date: String(formData.get('start_date') || '') || null,
    expected_completion_date: String(formData.get('expected_completion_date') || '') || null,
    live_url: String(formData.get('live_url') || '').trim() || null,
  }).select('id').single();

  if (error) return { error: error.message };
  revalidatePath('/admin/projects');
  revalidatePath(`/admin/clients/${clientId}`);
  redirect(`/admin/projects/${data.id}`);
}

export async function updateProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();
  if (!await assertAdmin(supabase)) return { error: 'Not authorized.' };

  const id = String(formData.get('id') || '');
  const { error } = await supabase.from('projects').update({
    name: String(formData.get('name') || '').trim(),
    project_type: String(formData.get('project_type') || '').trim(),
    description: String(formData.get('description') || '').trim() || null,
    status: (String(formData.get('status') || 'not_started')) as ProjectStatus,
    start_date: String(formData.get('start_date') || '') || null,
    expected_completion_date: String(formData.get('expected_completion_date') || '') || null,
    live_url: String(formData.get('live_url') || '').trim() || null,
  }).eq('id', id);

  if (error) return { error: error.message };
  revalidatePath(`/admin/projects/${id}`);
  revalidatePath('/admin/projects');
  return null;
}
