export const runtime = 'edge';
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

export async function createPaymentAction(formData: FormData) {
  const { supabase } = await requireAdmin();

  const clientId = String(formData.get('client_id'));
  const description = String(formData.get('description'));
  const amount = parseFloat(String(formData.get('amount')));
  const status = String(formData.get('status') || 'pending');
  const dueDate = String(formData.get('due_date') || '') || null;
  const paidDate = String(formData.get('paid_date') || '') || null;
  const invoiceNumber = String(formData.get('invoice_number') || '') || null;
  const projectId = String(formData.get('project_id') || '') || null;

  if (!clientId || !description || isNaN(amount)) {
    return { error: 'Client, description, and amount are required.' };
  }

  const { error } = await supabase.from('payments').insert({
    client_id: clientId,
    project_id: projectId,
    description,
    amount,
    status,
    due_date: dueDate,
    paid_date: paidDate,
    invoice_number: invoiceNumber
  });

  if (error) return { error: error.message };

  revalidatePath('/admin/payments');
  revalidatePath('/payments');
  revalidatePath('/admin/dashboard');
  return { success: true };
}

export async function updatePaymentAction(
  paymentId: string,
  formData: FormData
) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from('payments')
    .update({
      description: String(formData.get('description')),
      amount: parseFloat(String(formData.get('amount'))),
      status: String(formData.get('status')),
      due_date: String(formData.get('due_date') || '') || null,
      paid_date: String(formData.get('paid_date') || '') || null,
      invoice_number: String(formData.get('invoice_number') || '') || null
    })
    .eq('id', paymentId);

  if (error) return { error: error.message };

  revalidatePath('/admin/payments');
  revalidatePath('/payments');
  return { success: true };
}

export async function deletePaymentAction(paymentId: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from('payments').delete().eq('id', paymentId);
  if (error) return { error: error.message };

  revalidatePath('/admin/payments');
  revalidatePath('/payments');
  return { success: true };
}
