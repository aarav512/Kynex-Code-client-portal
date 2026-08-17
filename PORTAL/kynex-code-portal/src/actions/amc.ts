'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { AmcStatus } from '@/lib/database.types';
import type { ActionState } from './clients';

async function assertAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return p?.role === 'admin';
}

export async function upsertAmc(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();
  if (!await assertAdmin(supabase)) return { error: 'Not authorized.' };

  const clientId = String(formData.get('client_id') || '');
  const id = String(formData.get('id') || '') || null;
  const planName = String(formData.get('plan_name') || '').trim();
  const amount = parseFloat(String(formData.get('amount') || '0'));
  const startDate = String(formData.get('start_date') || '');
  const renewalDate = String(formData.get('renewal_date') || '');
  const status = String(formData.get('status') || 'active') as AmcStatus;
  const raw = String(formData.get('services_included') || '');
  const services = raw.split('\n').map(s => s.trim()).filter(Boolean);

  if (!clientId || !planName || !amount || !startDate || !renewalDate)
    return { error: 'All fields are required.' };

  const payload = { client_id: clientId, plan_name: planName, amount, start_date: startDate, renewal_date: renewalDate, status, services_included: services };

  if (id) {
    const { error } = await supabase.from('amc').update(payload).eq('id', id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from('amc').insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath('/admin/amc');
  redirect('/admin/amc');
}
