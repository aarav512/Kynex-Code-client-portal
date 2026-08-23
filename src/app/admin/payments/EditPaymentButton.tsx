'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { updateMatchingColumns } from '@/lib/supabase/insert-matching';
import { Pencil, X } from 'lucide-react';

export type PaymentRecord = {
  id: string;
  description: string;
  amount: number;
  status: string;
  due_date: string | null;
  paid_date?: string | null;
  invoice_number: string | null;
};

export function EditPaymentButton({ payment }: { payment: PaymentRecord }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(payment.description || '');
  const [amount, setAmount] = useState(String(payment.amount ?? ''));
  const [status, setStatus] = useState(payment.status || 'pending');
  const [dueDate, setDueDate] = useState(payment.due_date || '');
  const [paidDate, setPaidDate] = useState(payment.paid_date || '');
  const [invoiceNumber, setInvoiceNumber] = useState(payment.invoice_number || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const paid = status === 'paid';
    const { error: updateError } = await updateMatchingColumns(
      createClient(),
      'payments',
      {
        description,
        amount: parseFloat(amount),
        status,
        due_date: dueDate || null,
        paid_date: paid ? paidDate || new Date().toISOString().slice(0, 10) : paidDate || null,
        invoice_number: invoiceNumber || payment.invoice_number
      },
      payment.id
    );
    if (updateError) {
      setError(updateError.message);
    } else {
      setOpen(false);
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-ink-600 transition-base hover:bg-paper-100 hover:text-ink-900"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-lg border border-line bg-paper p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink-900">Edit Invoice</h2>
              <button onClick={() => setOpen(false)} className="text-ink-600 hover:text-ink-900"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Amount ($)</label>
                  <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none">
                    <option value="pending">Pending</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Due Date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Paid Date</label>
                  <input type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Invoice #</label>
                <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
              </div>
              {error && <p className="rounded-md border border-rust-100 bg-rust-100/20 px-3 py-2 text-sm text-rust">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-md bg-signal px-4 py-2 text-sm font-medium text-white transition-base hover:bg-signal-600 disabled:opacity-50">
                {loading ? 'Saving…' : 'Save Invoice'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
