'use client';
import { useActionState, useState, useEffect } from 'react';
import Link from 'next/link';
import { createInvoice, type ActionState } from '@/actions/payments';
import { createClient as createBrowserClient } from '@/lib/supabase/client';

export function InvoiceForm({ clients, defaultClientId }: { clients: { id: string; company_name: string }[]; defaultClientId?: string }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createInvoice, null);
  const [selectedClient, setSelectedClient] = useState(defaultClientId || '');
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const supabase = createBrowserClient();

  useEffect(() => {
    if (!selectedClient) { setProjects([]); return; }
    supabase.from('projects').select('id, name').eq('client_id', selectedClient)
      .then(({ data }) => setProjects(data ?? []));
  }, [selectedClient]);

  return (
    <form action={formAction} className="kx-panel space-y-5 p-6">
      <div>
        <label className="kx-label" htmlFor="client_id">Client</label>
        <select className="kx-input" id="client_id" name="client_id" required value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
          <option value="">Select client…</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
        </select>
      </div>
      {projects.length > 0 && (
        <div>
          <label className="kx-label" htmlFor="project_id">Project (optional)</label>
          <select className="kx-input" id="project_id" name="project_id">
            <option value="">None</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="kx-label" htmlFor="invoice_number">Invoice number</label>
          <input className="kx-input" id="invoice_number" name="invoice_number" placeholder="INV-2026-0001" required />
        </div>
        <div>
          <label className="kx-label" htmlFor="amount">Amount (USD)</label>
          <input className="kx-input" id="amount" name="amount" type="number" step="0.01" min="0" required />
        </div>
      </div>
      <div>
        <label className="kx-label" htmlFor="description">Description</label>
        <input className="kx-input" id="description" name="description" placeholder="e.g. Website Redesign — Milestone 1" required />
      </div>
      <div>
        <label className="kx-label" htmlFor="due_date">Due date</label>
        <input className="kx-input" id="due_date" name="due_date" type="date" required />
      </div>
      <div>
        <label className="kx-label" htmlFor="invoice_file">Invoice PDF (optional)</label>
        <input className="kx-input file:mr-2 file:rounded file:border-0 file:bg-ink-950 file:px-2.5 file:py-1 file:text-xs file:text-paper" id="invoice_file" name="invoice_file" type="file" accept=".pdf" />
      </div>
      {state?.error && <p className="text-sm text-rust">{state.error}</p>}
      <div className="flex gap-3">
        <button type="submit" className="kx-btn-primary" disabled={pending}>{pending ? 'Saving…' : 'Add invoice'}</button>
        <Link href="/admin/payments" className="kx-btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
