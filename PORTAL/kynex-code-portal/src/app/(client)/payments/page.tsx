import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, DataRow, DataCell } from '@/components/ui/DataTable';
import { StatusPill, PAYMENT_STATUS_TONE } from '@/components/ui/StatusPill';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { PAYMENT_STATUS_LABEL, formatDate, formatMoney } from '@/lib/utils';

export default async function ClientPaymentsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user!.id).single();

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('client_id', profile!.client_id!)
    .order('due_date', { ascending: false });

  const total = (invoices ?? []).reduce((s, i) => s + i.amount, 0);
  const paid = (invoices ?? []).filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const outstanding = (invoices ?? []).filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <PageHeader eyebrow="Payments" title="Invoices & payments" />

      {invoices && invoices.length > 0 && (
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { label: 'Total invoiced', value: formatMoney(total) },
            { label: 'Paid', value: formatMoney(paid) },
            { label: 'Outstanding', value: formatMoney(outstanding) },
          ].map(({ label, value }) => (
            <div key={label} className="kx-panel p-5">
              <p className="kx-eyebrow mb-1.5">{label}</p>
              <p className="font-display text-xl font-medium">{value}</p>
            </div>
          ))}
        </div>
      )}

      {invoices && invoices.length > 0 ? (
        <DataTable columns={['Invoice', 'Description', 'Amount', 'Due', 'Paid on', 'Status', '']}>
          {invoices.map((inv) => (
            <DataRow key={inv.id}>
              <DataCell className="font-mono text-xs">{inv.invoice_number}</DataCell>
              <DataCell>{inv.description}</DataCell>
              <DataCell className="font-medium">{formatMoney(inv.amount, inv.currency)}</DataCell>
              <DataCell className="font-mono text-xs text-ink-600">{formatDate(inv.due_date)}</DataCell>
              <DataCell className="font-mono text-xs text-ink-600">{formatDate(inv.payment_date)}</DataCell>
              <DataCell>
                <StatusPill label={PAYMENT_STATUS_LABEL[inv.status]} tone={PAYMENT_STATUS_TONE[inv.status]} />
              </DataCell>
              <DataCell>
                {inv.invoice_file_path && <DownloadButton storagePath={inv.invoice_file_path} label="Invoice" />}
              </DataCell>
            </DataRow>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="No invoices yet" description="Invoices from Kynex Code will appear here." />
      )}
    </div>
  );
}
