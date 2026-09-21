'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatMoney } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import { ViewInvoiceButton } from '@/components/billing/InvoiceDialog';
import { canPay, makeInvoiceNo, type PortalInvoice } from '@/lib/billing';
import { PayInvoiceButton } from '../payments/PayInvoiceButton';

type AmcItem = {
  id: string;
  plan_name: string;
  amount: number;
  status: string;
  start_date?: string | null;
  end_date: string | null;
  created_at?: string | null;
  currency?: string | null;
};

export default function ClientAmcPage() {
  const { loading, error, data } = usePortalData(async (supabase, session) => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    const rec = profile as Record<string, unknown> | null;
    const clientId = String(rec?.client_id || rec?.client_id || '');
    if (!clientId) return { linked: false, company: '', rows: [] as AmcItem[] };
    const [{ data: rows }, { data: client }] = await Promise.all([
      supabase.from('amc_contracts').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('clients').select('*').eq('id', clientId).maybeSingle()
    ]);
    const company = String((client as { company_name?: string; name?: string } | null)?.company_name || (client as { name?: string } | null)?.name || 'Client');
    return { linked: true, company, rows: (rows as AmcItem[]) ?? [] };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data && !data.linked ? <EmptyState title="No client account linked" /> : data ? (
        <div className="space-y-6">
          <PageHeader title="AMC" description="Your maintenance contracts and invoices from Kynex Code." />
          {data.rows.length ? data.rows.map((c) => {
            const invoice: PortalInvoice = {
              id: c.id,
              kind: 'AMC Invoice',
              number: makeInvoiceNo('AMC', c.id),
              description: `${c.plan_name} — annual maintenance`,
              amount: Number(c.amount),
              currency: c.currency || 'INR',
              status: c.status === 'cancelled' ? 'cancelled' : 'pending',
              issuedOn: c.created_at || c.start_date,
              dueOn: c.end_date,
              billToName: data.company,
              periodLabel: [c.start_date, c.end_date].filter(Boolean).join(' → ') || null
            };
            return (
              <div key={c.id} className="rounded-lg border border-line bg-paper p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-display font-semibold">{c.plan_name}</p>
                  <StatusPill status={c.status} />
                </div>
                <p className="mt-2 text-sm text-ink-600">{formatMoney(c.amount)} · ends {formatDate(c.end_date)}</p>
                <div className="mt-3 flex justify-end gap-2">
                  <ViewInvoiceButton invoice={invoice} allowPay={canPay(invoice.status)} />
                  {canPay(invoice.status) ? <PayInvoiceButton invoice={invoice} /> : null}
                </div>
              </div>
            );
          }) : <EmptyState title="No AMC contracts" />}
        </div>
      ) : null}
    </PortalState>
  );
}
