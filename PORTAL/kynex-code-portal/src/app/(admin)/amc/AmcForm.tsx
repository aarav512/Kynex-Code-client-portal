'use client';
import { useActionState } from 'react';
import { upsertAmc, type ActionState } from '@/actions/amc';

export function AmcForm({ clients, amc, defaultClientId }: {
  clients: { id: string; company_name: string }[];
  amc?: any;
  defaultClientId?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(upsertAmc, null);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {amc && <input type="hidden" name="id" value={amc.id} />}
      <div className="sm:col-span-2">
        <label className="kx-label" htmlFor="amc_client">Client</label>
        <select className="kx-input" id="amc_client" name="client_id" defaultValue={amc?.client_id || defaultClientId || ''} required>
          <option value="">Select client…</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
        </select>
      </div>
      <div>
        <label className="kx-label" htmlFor="plan_name">Plan name</label>
        <input className="kx-input" id="plan_name" name="plan_name" defaultValue={amc?.plan_name || ''} placeholder="e.g. Standard AMC" required />
      </div>
      <div>
        <label className="kx-label" htmlFor="amc_amount">Amount / year (USD)</label>
        <input className="kx-input" id="amc_amount" name="amount" type="number" step="0.01" defaultValue={amc?.amount || ''} required />
      </div>
      <div>
        <label className="kx-label" htmlFor="amc_start">Start date</label>
        <input className="kx-input" id="amc_start" name="start_date" type="date" defaultValue={amc?.start_date || ''} required />
      </div>
      <div>
        <label className="kx-label" htmlFor="amc_renewal">Renewal date</label>
        <input className="kx-input" id="amc_renewal" name="renewal_date" type="date" defaultValue={amc?.renewal_date || ''} required />
      </div>
      <div>
        <label className="kx-label" htmlFor="amc_status">Status</label>
        <select className="kx-input" id="amc_status" name="status" defaultValue={amc?.status || 'active'}>
          <option value="active">Active</option>
          <option value="expiring_soon">Expiring Soon</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="kx-label" htmlFor="services_included">Services included (one per line)</label>
        <textarea className="kx-input" id="services_included" name="services_included" rows={4}
          defaultValue={(amc?.services_included ?? []).join('\n')}
          placeholder={"Uptime monitoring\nMonthly backups\nSecurity patches"} />
      </div>
      {state?.error && <p className="sm:col-span-2 text-sm text-rust">{state.error}</p>}
      <div className="sm:col-span-2">
        <button type="submit" className="kx-btn-primary" disabled={pending}>
          {pending ? 'Saving…' : amc ? 'Update AMC' : 'Create AMC'}
        </button>
      </div>
    </form>
  );
}
