'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatMoney } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import { PayInvoiceButton } from './PayInvoiceButton';

type PaymentItem = {
  id: string;
  description: string;
  amount: number;
  status: string;
  due_date: string | null;
  invoice_number?: string | null;
};

function canPay(status: string) {
  return status === 'pending' || status === 'unpaid' || status === 'overdue';
}

export default function ClientPaymentsPage() {
  const { loading, error, data } = usePortalData(async (supabase, session) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    const rec = profile as Record<string, unknown> | null;
    const clientId = String(rec?.client_id || rec?.client_id || '');
    if (!clientId) return { linked: false, rows: [] as PaymentItem[] };
    const { data: rows } = await supabase
      .from('payments')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    return { linked: true, rows: (rows as PaymentItem[]) ?? [] };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data && !data.linked ? (
        <EmptyState title="No client account linked" />
      ) : data ? (
        <div className="space-y-6">
          <PageHeader title="Payments" description="Invoices from Kynex Code. Pay pending ones here." />
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
              {data.rows.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-4 rounded-lg border border-line bg-paper px-4 py-3">
                  <div>
                    <p className="font-medium">{p.description}</p>
                    <p className="text-xs text-ink-600">
                      {p.invoice_number ? `${p.invoice_number} · ` : ''}
                      {formatMoney(p.amount)} · due {formatDate(p.due_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={p.status} />
                    {canPay(p.status) ? <PayInvoiceButton paymentId={p.id} amount={Number(p.amount)} /> : null}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <EmptyState title="No invoices yet" />
          )}
        </div>
      ) : null}
    </PortalState>
  );
}
