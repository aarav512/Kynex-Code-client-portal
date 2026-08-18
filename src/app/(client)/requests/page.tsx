import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { MessageSquare, Plus } from 'lucide-react';
import type { Request } from '@/lib/database.types';
import { NewRequestButton } from './NewRequestButton';

export default async function ClientRequestsPage() {
  const supabase = createClient();
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

  const { data: requests } = await supabase
    .from('requests')
    .select('*')
    .eq('client_id', profile.client_id)
    .order('updated_at', { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requests"
        description="Submit and track your support requests."
        action={<NewRequestButton />}
      />
      {requests && requests.length > 0 ? (
        <DataTable<Request>
          columns={[
            { key: 'subject', label: 'Subject', render: (r) => (
              <Link href={`/requests/${r.id}`} className="font-medium text-signal hover:text-signal-600">
                {r.subject}
              </Link>
            )},
            { key: 'status', label: 'Status', render: (r) => <StatusPill status={r.status} /> },
            { key: 'created_at', label: 'Created', render: (r) => formatDate(r.created_at) },
            { key: 'updated_at', label: 'Last Activity', render: (r) => formatDate(r.updated_at) }
          ]}
          rows={requests as Request[]}
        />
      ) : (
        <EmptyState
          icon={MessageSquare}
          title="No requests yet"
          description="Submit a new request to get help from the Kynex Code team."
          action={<NewRequestButton />}
        />
      )}
    </div>
  );
}
