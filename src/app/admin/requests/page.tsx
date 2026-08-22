import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

type RequestRow = {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  clients: { company_name: string };
};


export const runtime = 'edge';

export default async function AdminRequestsPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from('requests')
    .select('*, clients!inner(company_name)')
    .order('updated_at', { ascending: false });

  const rows = (requests as RequestRow[] | null) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Requests" description="Support requests from all clients." />
      {rows.length > 0 ? (
        <DataTable<RequestRow>
          columns={[
            {
              key: 'subject',
              label: 'Subject',
              render: (r) => (
                <Link href={`/admin/requests/${r.id}`} className="font-medium text-signal hover:text-signal-600">
                  {r.subject}
                </Link>
              )
            },
            { key: 'company', label: 'Client', render: (r) => r.clients.company_name },
            { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
            { key: 'created_at', label: 'Created', render: (r) => formatDate(r.created_at) },
            { key: 'updated_at', label: 'Last Activity', render: (r) => formatDate(r.updated_at) }
          ]}
          rows={rows}
        />
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No requests yet"
          description="Client support requests will appear here."
        />
      )}
    </div>
  );
}
