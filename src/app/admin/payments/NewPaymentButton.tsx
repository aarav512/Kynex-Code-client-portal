'use client';

import { useState, useEffect } from 'react';
import { createPaymentAction } from '@/actions/payments';
import { createClient } from '@/lib/supabase/client';
import { Plus, X } from 'lucide-react';

export function NewPaymentButton() {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<{ id: string; company_name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; title: string; client_id: string }[]>([]);
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('pending');
  const [dueDate, setDueDate] = useState('');
  const [paidDate, setPaidDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const supabase = createClient();
      supabase.from('clients').select('id, company_name').order('company_name').then(({ data }) => setClients(data ?? []));
      supabase.from('projects').select('id, title, client_id').order('title').then(({ data }) => setProjects(data ?? []));
    }
  }, [open]);

  const filteredProjects = projects.filter(p => !clientId || p.client_id === clientId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('client_id', clientId);
    formData.append('description', description);
    formData.append('amount', amount);
    formData.append('status', status);
    formData.append('due_date', dueDate);
    formData.append('paid_date', paidDate);
    formData.append('invoice_number', invoiceNumber);
    if (projectId) formData.append('project_id', projectId);

    const result = await createPaymentAction(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
      setClientId(''); setProjectId(''); setDescription(''); setAmount('');
      setStatus('pending'); setDueDate(''); setPaidDate(''); setInvoiceNumber('');
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-white transition-base hover:bg-signal-600"
      >
        <Plus className="h-4 w-4" /> Add Payment
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-lg border border-line bg-paper p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink-900">Add Payment</h2>
              <button onClick={() => setOpen(false)} className="text-ink-600 hover:text-ink-900"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Client</label>
                <select value={clientId} onChange={(e) => { setClientId(e.target.value); setProjectId(''); }} required className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none">
                  <option value="">Select a client…</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Project (optional)</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none">
                  <option value="">No specific project…</option>
                  {filteredProjects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
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
                {loading ? 'Adding…' : 'Add Payment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
