import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, DataRow, DataCell } from '@/components/ui/DataTable';
import { StatusPill, REQUEST_STATUS_TONE } from '@/components/ui/StatusPill';
import { REQUEST_STATUS_LABEL, REQUEST_CATEGORY_LABEL, formatDate } from '@/lib/utils';

export default async function ClientRequestsPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user!.id).single();

  const { data: requests } = await supabase
    .from('requests')
    .select('*')
    .eq('client_id', profile!.client_id!)
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader
        eyebrow="Requests"
        title="Your requests"
        action={
          <Link href="/requests/new" className="kx-btn-primary">
            New request
          </Link>
        }
      />

      {requests && requests.length > 0 ? (
        <DataTable columns={['Title', 'Category', 'Priority', 'Status', 'Submitted']}>
          {requests.map((r) => (
            <DataRow key={r.id}>
              <DataCell>
                <Link href={`/requests/${r.id}`} className="font-medium hover:underline">
                  {r.title}
                </Link>
              </DataCell>
              <DataCell className="text-ink-600">{REQUEST_CATEGORY_LABEL[r.category]}</DataCell>
              <DataCell className="capitalize text-ink-600">{r.priority}</DataCell>
              <DataCell>
                <StatusPill label={REQUEST_STATUS_LABEL[r.status]} tone={REQUEST_STATUS_TONE[r.status]} />
              </DataCell>
              <DataCell className="font-mono text-xs text-ink-600">{formatDate(r.created_at)}</DataCell>
            </DataRow>
          ))}
        </DataTable>
      ) : (
        <EmptyState
          title="No requests yet"
          description="Need something changed or fixed? Submit a request and your Kynex Code team will pick it up."
          action={
            <Link href="/requests/new" className="kx-btn-primary">
              New request
            </Link>
          }
        />
      )}
    </div>
  );
}
