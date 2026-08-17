'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { PaymentStatus } from '@/lib/database.types';
import type { ActionState } from './clients';

async function assertAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return p?.role === 'admin';
}

export async function createInvoice(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = createClient();
  if (!await assertAdmin(supabase)) return { error: 'Not authorized.' };

  const clientId = String(formData.get('client_id') || '');
  const invoiceNumber = String(formData.get('invoice_number') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const amount = parseFloat(String(formData.get('amount') || '0'));
  const dueDate = String(formData.get('due_date') || '');

  if (!clientId || !invoiceNumber || !description || !amount || !dueDate)
    return { error: 'All fields are required.' };

  const invoiceFile = formData.get('invoice_file') as File | null;
  let invoiceFilePath: string | null = null;
  if (invoiceFile && invoiceFile.size > 0) {
    const safeName = invoiceFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    invoiceFilePath = `${clientId}/invoices/${invoiceNumber}-${safeName}`;
    const { error: up } = await supabase.storage.from('files').upload(invoiceFilePath, invoiceFile);
    if (up) return { error: `File upload failed: ${up.message}` };
  }

  const projectId = String(formData.get('project_id') || '') || null;
  const { error } = await supabase.from('invoices').insert({
    client_id: clientId, invoice_number: invoiceNumber, description, amount,
    status: 'pending', due_date: dueDate, project_id: projectId,
    invoice_file_path: invoiceFilePath,
  });
  if (error) return { error: error.message };

  revalidatePath('/admin/payments');
  redirect('/admin/payments');
}

export async function updateInvoiceStatus(invoiceId: string, status: PaymentStatus, paymentDate?: string) {
  const supabase = createClient();
  if (!await assertAdmin(supabase)) return { error: 'Not authorized.' };
  const { error } = await supabase.from('invoices').update({
    status,
    payment_date: status === 'paid' ? (paymentDate || new Date().toISOString().slice(0, 10)) : null
  }).eq('id', invoiceId);
  if (error) return { error: error.message };
  revalidatePath('/admin/payments');
  return { success: true };
}
