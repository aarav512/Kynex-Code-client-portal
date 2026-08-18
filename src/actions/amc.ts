'use server';

import { createClient } from '@/lib/supabase/server';
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
  return { supabase, user };
}

export async function createAmcAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  const clientId = String(formData.get('client_id'));
  const planName = String(formData.get('plan_name'));
  const amount = parseFloat(String(formData.get('amount')));
  const status = String(formData.get('status') || 'active');
  const startDate = String(formData.get('start_date') || '');
  const endDate = String(formData.get('end_date') || '');
  const notes = String(formData.get('notes') || '') || null;

  if (!clientId || !planName || isNaN(amount) || !startDate || !endDate) {
    return { error: 'All required fields must be filled.' };
  }

  const { error } = await supabase.from('amc_contracts').insert({
    client_id: clientId,
    plan_name: planName,
    amount,
    status,
    start_date: startDate,
    end_date: endDate,
    notes
  });

  if (error) return { error: error.message };

  revalidatePath('/admin/amc');
  revalidatePath('/amc');
  revalidatePath('/admin/dashboard');
  return { success: true };
}

export async function updateAmcAction(amcId: string, formData: FormData) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('amc_contracts')
    .update({
      plan_name: String(formData.get('plan_name')),
      amount: parseFloat(String(formData.get('amount'))),
      status: String(formData.get('status')),
      start_date: String(formData.get('start_date')),
      end_date: String(formData.get('end_date')),
      notes: String(formData.get('notes') || '') || null
    })
    .eq('id', amcId);

  if (error) return { error: error.message };

  revalidatePath('/admin/amc');
  revalidatePath('/amc');
  return { success: true };
}

export async function deleteAmcAction(amcId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from('amc_contracts').delete().eq('id', amcId);
  if (error) return { error: error.message };

  revalidatePath('/admin/amc');
  revalidatePath('/amc');
  return { success: true };
}
