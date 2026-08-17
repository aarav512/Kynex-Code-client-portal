import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, DataRow, DataCell } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusPill, PAYMENT_STATUS_TONE } from '@/components/ui/StatusPill';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { InvoiceStatusButton } from './InvoiceStatusButton';
import { PAYMENT_STATUS_LABEL, formatDate, formatMoney } from '@/lib/utils';

export default async function AdminPaymentsPage() {
  const supabase = createClient();
  const { data: invoices } = await supabase.from('invoices')
    .select('*, clients(company_name)').order('due_date', { ascending: false });

  return (
    <div>
      <PageHeader eyebrow="Payments" title="All invoices"
        action={<Link href="/admin/payments/new" className="kx-btn-primary">Add invoice</Link>} />
      {invoices && invoices.length > 0 ? (
        <DataTable columns={['Invoice', 'Client', 'Description', 'Amount', 'Due', 'Status', 'Paid on', '']}>
          {invoices.map((inv: any) => (
            <DataRow key={inv.id}>
              <DataCell className="font-mono text-xs">{inv.invoice_number}</DataCell>
              <DataCell className="text-sm text-ink-600">{inv.clients?.company_name}</DataCell>
              <DataCell className="max-w-[160px] truncate text-sm">{inv.description}</DataCell>
              <DataCell className="font-medium">{formatMoney(inv.amount, inv.currency)}</DataCell>
              <DataCell className="font-mono text-xs text-ink-600">{formatDate(inv.due_date)}</DataCell>
              <DataCell><StatusPill label={PAYMENT_STATUS_LABEL[inv.status]} tone={PAYMENT_STATUS_TONE[inv.status]} /></DataCell>
              <DataCell className="font-mono text-xs text-ink-600">{formatDate(inv.payment_date)}</DataCell>
              <DataCell className="flex gap-2">
                <InvoiceStatusButton invoiceId={inv.id} currentStatus={inv.status} />
                {inv.invoice_file_path && <DownloadButton storagePath={inv.invoice_file_path} label="PDF" />}
              </DataCell>
            </DataRow>
          ))}
        </DataTable>
      ) : <EmptyState title="No invoices yet" description="Add your first invoice above."
          action={<Link href="/admin/payments/new" className="kx-btn-primary">Add invoice</Link>} />}
    </div>
  );
}
