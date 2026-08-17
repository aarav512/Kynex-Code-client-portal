import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, DataRow, DataCell } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusPill, AMC_STATUS_TONE } from '@/components/ui/StatusPill';
import { AMC_STATUS_LABEL, formatDate, formatMoney } from '@/lib/utils';
import { AmcForm } from './AmcForm';

export default async function AdminAmcPage({ searchParams }: { searchParams: { client_id?: string } }) {
  const supabase = createClient();
  const [{ data: amcs }, { data: clients }] = await Promise.all([
    supabase.from('amc').select('*, clients(company_name)').order('renewal_date', { ascending: true }),
    supabase.from('clients').select('id, company_name').eq('is_active', true).order('company_name'),
  ]);

  const editAmc = searchParams.client_id
    ? (amcs as any[])?.find((a: any) => a.client_id === searchParams.client_id)
    : null;

  return (
    <div>
      <PageHeader eyebrow="AMC" title="Annual Maintenance Contracts" />
      <div className="mb-8 kx-panel p-6">
        <p className="kx-eyebrow mb-4">{editAmc ? 'Edit AMC' : 'Add / update AMC'}</p>
        <AmcForm clients={clients ?? []} amc={editAmc} defaultClientId={searchParams.client_id} />
      </div>
      {amcs && amcs.length > 0 ? (
        <DataTable columns={['Client', 'Plan', 'Amount', 'Renewal', 'Status', '']}>
          {(amcs as any[]).map((a: any) => (
            <DataRow key={a.id}>
              <DataCell className="font-medium">{a.clients?.company_name}</DataCell>
              <DataCell>{a.plan_name}</DataCell>
              <DataCell>{formatMoney(a.amount, a.currency)}/yr</DataCell>
              <DataCell className="font-mono text-xs text-ink-600">{formatDate(a.renewal_date)}</DataCell>
              <DataCell><StatusPill label={AMC_STATUS_LABEL[a.status]} tone={AMC_STATUS_TONE[a.status]} /></DataCell>
              <DataCell><Link href={`/admin/amc?client_id=${a.client_id}`} className="text-sm text-signal hover:underline">Edit →</Link></DataCell>
            </DataRow>
          ))}
        </DataTable>
      ) : <EmptyState title="No AMC records" description="Add an AMC contract above." />}
    </div>
  );
}
