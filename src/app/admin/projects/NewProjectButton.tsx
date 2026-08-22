'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, X } from 'lucide-react';

export function NewProjectButton() {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<{ id: string; company_name: string }[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [status, setStatus] = useState('planning');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const supabase = createClient();
      supabase.from('clients').select('id, company_name').order('company_name').then(({ data }) => {
        setClients(data ?? []);
      });
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: insertError } = await supabase.from('projects').insert({
      client_id: clientId,
      title,
      description: description || null,
      status,
      start_date: startDate || null,
      due_date: dueDate || null,
      budget: budget ? parseFloat(budget) : null
    });
    if (insertError) {
      setError(insertError.message);
    } else {
      setOpen(false);
      setTitle(''); setDescription(''); setClientId(''); setStatus('planning');
      setStartDate(''); setDueDate(''); setBudget('');
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
        <Plus className="h-4 w-4" /> New Project
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-lg border border-line bg-paper p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink-900">New Project</h2>
              <button onClick={() => setOpen(false)} className="text-ink-600 hover:text-ink-900"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Client</label>
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} required className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none">
                  <option value="">Select a client…</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none">
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Due Date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Budget ($)</label>
                <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
              </div>
              {error && <p className="rounded-md border border-rust-100 bg-rust-100/20 px-3 py-2 text-sm text-rust">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-md bg-signal px-4 py-2 text-sm font-medium text-white transition-base hover:bg-signal-600 disabled:opacity-50">
                {loading ? 'Creating…' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
