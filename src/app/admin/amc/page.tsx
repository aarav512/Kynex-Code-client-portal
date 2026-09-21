'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatMoney } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import { NewAmcButton } from './NewAmcButton';
import { EditAmcButton } from './EditAmcButton';
import { ViewInvoiceButton } from '@/components/billing/InvoiceDialog';
import { makeInvoiceNo, type PortalInvoice } from '@/lib/billing';

type AmcRow = {
  id: string;
  client_id?: string;
  plan_name?: string;
  name?: string;
  title?: string;
  amount: number;
  status: string;
  start_date?: string | null;
  end_date: string | null;
  renewal_date?: string | null;
  notes?: string | null;
  currency?: string | null;
  created_at?: string | null;
  clients: { company_name: string; email?: string };
};

function toInvoice(c: AmcRow): PortalInvoice {
  const plan = c.plan_name || c.name || c.title || 'AMC';
  return {
    id: c.id,
    kind: 'AMC Invoice',
    number: makeInvoiceNo('AMC', c.id),
    description: `${plan} — annual maintenance`,
    amount: Number(c.amount),
    currency: c.currency || 'INR',
    status: c.status === 'cancelled' ? 'cancelled' : 'pending',
    issuedOn: c.created_at || c.start_date,
    dueOn: c.end_date,
    billToName: c.clients?.company_name || 'Client',
    billToEmail: c.clients?.email,
    periodLabel: [c.start_date, c.end_date].filter(Boolean).join(' → ') || null
  };
}

export default function AdminAmcPage() {
  const { loading, error, data } = usePortalData(async (supabase) => {
    const { data: contracts } = await supabase.from('amc_contracts').select('*').order('created_at', { ascending: false });
    const { attachClientCompany } = await import('@/lib/clients-display');
    const rows = await attachClientCompany(supabase, (contracts as AmcRow[]) ?? []);
    return {
      rows: rows.map((row) => ({
        ...row,
        plan_name: row.plan_name || row.name || row.title || 'AMC',
        clients: row.clients
      }))
    };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data ? (
        <div className="space-y-6">
          <PageHeader title="AMC Contracts" description="Edit contracts here. Each AMC has a professional Kynex Code invoice in INR." action={<NewAmcButton />} />
          {data.rows.length ? data.rows.map((c) => (
            <div key={c.id} className="rounded-lg border border-line bg-paper p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display font-semibold">{c.plan_name}</p>
                  <p className="text-xs text-ink-600">{c.clients.company_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={c.status} />
                  <ViewInvoiceButton invoice={toInvoice(c)} allowPay />
                  <EditAmcButton contract={c} />
                </div>
              </div>
              <p className="mt-2 text-sm text-ink-600">{formatMoney(c.amount)} · ends {formatDate(c.end_date)}</p>
            </div>
          )) : <EmptyState title="No AMC contracts" action={<NewAmcButton />} />}
        </div>
      ) : null}
    </PortalState>
  );
}
