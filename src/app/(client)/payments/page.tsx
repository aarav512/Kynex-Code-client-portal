import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatMoney } from '@/lib/utils';
import { CreditCard } from 'lucide-react';
import type { Payment } from '@/lib/database.types';


export const runtime = 'edge';

export default async function ClientPaymentsPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('client_id')
    .eq('id', user!.id)
    .maybeSingle();

  if (!profile?.client_id) {
    return <EmptyState title="No client account linked" />;
  }

  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('client_id', profile.client_id)
    .order('created_at', { ascending: false });

  const totalPaid = payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
  const totalPending = payments?.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Your payment history and upcoming invoices." />

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-line bg-paper p-4">
          <p className="text-xs text-ink-600">Total Paid</p>
          <p className="mt-1 font-display text-2xl font-semibold text-moss">{formatMoney(totalPaid)}</p>
        </div>
        <div className="rounded-lg border border-line bg-paper p-4">
          <p className="text-xs text-ink-600">Outstanding</p>
          <p className="mt-1 font-display text-2xl font-semibold text-amber">{formatMoney(totalPending)}</p>
        </div>
      </div>

      {payments && payments.length > 0 ? (
        <DataTable<Payment>
          columns={[
            { key: 'description', label: 'Description' },
            { key: 'invoice_number', label: 'Invoice', render: (p) => p.invoice_number || '—' },
            { key: 'amount', label: 'Amount', render: (p) => formatMoney(p.amount) },
            { key: 'status', label: 'Status', render: (p) => <StatusPill status={p.status} /> },
            { key: 'due_date', label: 'Due', render: (p) => formatDate(p.due_date) },
            { key: 'paid_date', label: 'Paid', render: (p) => formatDate(p.paid_date) }
          ]}
          rows={payments as Payment[]}
        />
      ) : (
        <EmptyState icon={CreditCard} title="No payments yet" description="Your payment history will appear here." />
      )}
    </div>
  );
}
