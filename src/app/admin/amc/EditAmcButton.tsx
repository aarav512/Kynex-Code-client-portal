'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { updateMatchingColumns } from '@/lib/supabase/insert-matching';
import { Pencil, X } from 'lucide-react';

export type AmcRecord = {
  id: string;
  plan_name: string;
  amount: number;
  status: string;
  start_date?: string | null;
  end_date: string | null;
  renewal_date?: string | null;
  notes?: string | null;
  currency?: string | null;
};

export function EditAmcButton({ contract }: { contract: AmcRecord }) {
  const [open, setOpen] = useState(false);
  const [planName, setPlanName] = useState(contract.plan_name || '');
  const [amount, setAmount] = useState(String(contract.amount ?? ''));
  const [status, setStatus] = useState(contract.status || 'active');
  const [startDate, setStartDate] = useState(contract.start_date || '');
  const [endDate, setEndDate] = useState(contract.end_date || '');
  const [notes, setNotes] = useState(contract.notes || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const end = endDate || startDate;
    const { error: updateError } = await updateMatchingColumns(
      createClient(),
      'amc_contracts',
      {
        plan_name: planName,
        amount: parseFloat(amount),
        status,
        start_date: startDate || null,
        end_date: end || null,
        renewal_date: end || startDate || null,
        notes: notes || null,
        currency: contract.currency || 'INR'
      },
      contract.id
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
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-line bg-paper p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink-900">Edit AMC</h2>
              <button onClick={() => setOpen(false)} className="text-ink-600 hover:text-ink-900"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Plan name</label>
                <input type="text" value={planName} onChange={(e) => setPlanName(e.target.value)} required className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Amount (₹)</label>
                  <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none">
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Start date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">End / renewal</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
              </div>
              {error && <p className="rounded-md border border-rust-100 bg-rust-100/20 px-3 py-2 text-sm text-rust">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-md bg-signal px-4 py-2 text-sm font-medium text-white transition-base hover:bg-signal-600 disabled:opacity-50">
                {loading ? 'Saving…' : 'Save AMC'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
