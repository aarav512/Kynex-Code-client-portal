import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, DataRow, DataCell } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatusPill, REQUEST_STATUS_TONE } from '@/components/ui/StatusPill';
import { REQUEST_STATUS_LABEL, REQUEST_CATEGORY_LABEL, formatDate } from '@/lib/utils';

export default async function AdminRequestsPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = createClient();
  let q = supabase.from('requests').select('*, clients(company_name)').order('created_at', { ascending: false });
  if (searchParams.status) q = q.eq('status', searchParams.status);

  const { data: requests } = await q;
  const statuses = ['submitted', 'in_progress', 'waiting_for_client', 'completed'];

  return (
    <div>
      <PageHeader eyebrow="Requests" title="All requests" />
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin/requests" className={`kx-btn-ghost text-xs ${!searchParams.status ? 'bg-ink-950/5 font-medium' : ''}`}>All</Link>
        {statuses.map(s => (
          <Link key={s} href={`/admin/requests?status=${s}`}
            className={`kx-btn-ghost text-xs ${searchParams.status === s ? 'bg-ink-950/5 font-medium' : ''}`}>
            {REQUEST_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>
      {requests && requests.length > 0 ? (
        <DataTable columns={['Title', 'Client', 'Category', 'Priority', 'Status', 'Date', '']}>
          {requests.map((r: any) => (
            <DataRow key={r.id}>
              <DataCell className="font-medium max-w-[180px] truncate">
                <Link href={`/admin/requests/${r.id}`} className="hover:underline">{r.title}</Link>
              </DataCell>
              <DataCell className="text-sm text-ink-600">{r.clients?.company_name}</DataCell>
              <DataCell className="text-sm text-ink-600">{REQUEST_CATEGORY_LABEL[r.category]}</DataCell>
              <DataCell className="text-sm capitalize text-ink-600">{r.priority}</DataCell>
              <DataCell><StatusPill label={REQUEST_STATUS_LABEL[r.status]} tone={REQUEST_STATUS_TONE[r.status]} /></DataCell>
              <DataCell className="font-mono text-xs text-ink-600">{formatDate(r.created_at)}</DataCell>
              <DataCell><Link href={`/admin/requests/${r.id}`} className="text-sm text-signal hover:underline">View →</Link></DataCell>
            </DataRow>
          ))}
        </DataTable>
      ) : <EmptyState title="No requests" description="Requests from clients will appear here." />}
    </div>
  );
}
