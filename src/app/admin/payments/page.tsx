'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatMoney } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import { NewPaymentButton } from './NewPaymentButton';
import { EditPaymentButton } from './EditPaymentButton';

type PaymentRow = {
  id: string;
  description: string;
  invoice_number: string | null;
  amount: number;
  status: string;
  due_date: string | null;
  paid_date?: string | null;
  clients: { company_name: string };
};

function isPaid(status: string) {
  return status === 'paid';
}

function isPending(status: string) {
  return status === 'pending' || status === 'unpaid' || status === 'overdue';
}

export default function AdminPaymentsPage() {
  const { loading, error, data } = usePortalData(async (supabase) => {
    const { data: payments } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    const { attachClientCompany } = await import('@/lib/clients-display');
    return { rows: await attachClientCompany(supabase, (payments as PaymentRow[]) ?? []) };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data ? (
        <div className="space-y-6">
          <PageHeader
            title="Payments"
            description="Add invoices here. Clients pay them from Payments in their portal. Received and pending totals show below and on the dashboard."
            action={<NewPaymentButton />}
          />
          {data.rows.length ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-line bg-paper p-4">
                  <p className="text-xs text-ink-600">Received (paid)</p>
                  <p className="mt-1 font-display text-2xl font-semibold text-moss">
                    {formatMoney(data.rows.filter((p) => isPaid(p.status)).reduce((sum, p) => sum + Number(p.amount), 0))}
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-paper p-4">
                  <p className="text-xs text-ink-600">Pending</p>
                  <p className="mt-1 font-display text-2xl font-semibold text-amber">
                    {formatMoney(data.rows.filter((p) => isPending(p.status)).reduce((sum, p) => sum + Number(p.amount), 0))}
                  </p>
                </div>
              </div>
              <DataTable<PaymentRow>
                columns={[
                  { key: 'invoice_number', label: 'Invoice #', render: (p) => p.invoice_number || '—' },
                  { key: 'description', label: 'Description' },
                  { key: 'client', label: 'Client', render: (p) => p.clients?.company_name || '—' },
                  { key: 'amount', label: 'Amount', render: (p) => formatMoney(p.amount) },
                  { key: 'status', label: 'Status', render: (p) => <StatusPill status={p.status} /> },
                  { key: 'due_date', label: 'Due', render: (p) => formatDate(p.due_date) },
                  { key: 'edit', label: '', render: (p) => <EditPaymentButton payment={p} /> }
                ]}
                rows={data.rows}
              />
            </>
          ) : (
            <EmptyState title="No invoices yet" action={<NewPaymentButton />} />
          )}
        </div>
      ) : null}
    </PortalState>
  );
}
