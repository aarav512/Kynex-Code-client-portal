'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatMoney } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import { PayInvoiceButton } from './PayInvoiceButton';
import { ViewInvoiceButton } from '@/components/billing/InvoiceDialog';
import { canPay, makeInvoiceNo, type PortalInvoice } from '@/lib/billing';

type PaymentItem = {
  id: string;
  description: string;
  amount: number;
  status: string;
  due_date: string | null;
  paid_date?: string | null;
  created_at?: string | null;
  invoice_number?: string | null;
  currency?: string | null;
};

function toInvoice(p: PaymentItem, billToName: string): PortalInvoice {
  return {
    id: p.id,
    kind: 'Tax Invoice',
    number: makeInvoiceNo('INV', p.id, p.invoice_number),
    description: p.description,
    amount: Number(p.amount),
    currency: p.currency || 'INR',
    status: p.status,
    issuedOn: p.created_at,
    dueOn: p.due_date,
    paidOn: p.paid_date,
    billToName
  };
}

export default function ClientPaymentsPage() {
  const { loading, error, data } = usePortalData(async (supabase, session) => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    const rec = profile as Record<string, unknown> | null;
    const clientId = String(rec?.client_id || rec?.client_id || '');
    if (!clientId) return { linked: false, company: '', rows: [] as PaymentItem[] };
    const [{ data: rows }, { data: client }] = await Promise.all([
      supabase.from('payments').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('clients').select('*').eq('id', clientId).maybeSingle()
    ]);
    const company = String((client as { company_name?: string; name?: string } | null)?.company_name || (client as { name?: string } | null)?.name || 'Client');
    return { linked: true, company, rows: (rows as PaymentItem[]) ?? [] };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data && !data.linked ? (
        <EmptyState title="No client account linked" />
      ) : data ? (
        <div className="space-y-6">
          <PageHeader title="Payments" description="Kynex Code invoices. Pay India invoices with UPI. Status updates after we confirm the transfer." />
          {data.rows.length ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-line bg-paper p-4">
                  <p className="text-xs text-ink-600">Pending</p>
                  <p className="mt-1 font-display text-2xl font-semibold text-amber">
                    {formatMoney(data.rows.filter((p) => canPay(p.status)).reduce((sum, p) => sum + Number(p.amount), 0))}
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-paper p-4">
                  <p className="text-xs text-ink-600">Paid</p>
                  <p className="mt-1 font-display text-2xl font-semibold text-moss">
                    {formatMoney(data.rows.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0))}
                  </p>
                </div>
              </div>
              {data.rows.map((p) => {
                const invoice = toInvoice(p, data.company);
                return (
                  <div key={p.id} className="flex items-center justify-between gap-4 rounded-lg border border-line bg-paper px-4 py-3">
                    <div>
                      <p className="font-medium">{p.description}</p>
                      <p className="text-xs text-ink-600">
                        {invoice.number} · {formatMoney(p.amount)} · due {formatDate(p.due_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={p.status} />
                      <ViewInvoiceButton invoice={invoice} allowPay={canPay(p.status)} />
                      {canPay(p.status) ? <PayInvoiceButton invoice={invoice} /> : null}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <EmptyState title="No invoices yet" />
          )}
        </div>
      ) : null}
    </PortalState>
  );
}
