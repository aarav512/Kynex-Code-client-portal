'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatMoney } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import { NewPaymentButton } from './NewPaymentButton';

type PaymentRow = {
  id: string;
  description: string;
  invoice_number: string | null;
  amount: number;
  status: string;
  due_date: string | null;
  clients: { company_name: string };
};

export default function AdminPaymentsPage() {
  const { loading, error, data } = usePortalData(async (supabase) => {
    const { data: payments } = await supabase.from('payments').select('*, clients!inner(company_name)').order('created_at', { ascending: false });
    return { rows: (payments as PaymentRow[] | null) ?? [] };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data ? (
        <div className="space-y-6">
          <PageHeader title="Payments" description="Invoices across all clients." action={<NewPaymentButton />} />
          {data.rows.length ? (
            <DataTable<PaymentRow>
              columns={[
                { key: 'description', label: 'Description' },
                { key: 'client', label: 'Client', render: (p) => p.clients.company_name },
                { key: 'amount', label: 'Amount', render: (p) => formatMoney(p.amount) },
                { key: 'status', label: 'Status', render: (p) => <StatusPill status={p.status} /> },
                { key: 'due_date', label: 'Due', render: (p) => formatDate(p.due_date) }
              ]}
              rows={data.rows}
            />
          ) : <EmptyState title="No payments yet" action={<NewPaymentButton />} />}
        </div>
      ) : null}
    </PortalState>
  );
}
