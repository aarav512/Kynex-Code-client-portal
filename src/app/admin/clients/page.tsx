import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Users } from 'lucide-react';
import type { Client } from '@/lib/database.types';
import { AddClientButton } from './AddClientButton';


export const runtime = 'edge';

export default async function AdminClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="All client companies in the portal."
        action={<AddClientButton />}
      />
      {clients && clients.length > 0 ? (
        <DataTable<Client>
          columns={[
            {
              key: 'company_name',
              label: 'Company',
              render: (c) => (
                <Link href={`/admin/clients/${c.id}`} className="font-medium text-signal hover:text-signal-600">
                  {c.company_name}
                </Link>
              )
            },
            { key: 'contact_name', label: 'Contact' },
            { key: 'email', label: 'Email' },
            { key: 'status', label: 'Status', render: (c) => <StatusPill status={c.status} /> },
            { key: 'created_at', label: 'Added', render: (c) => formatDate(c.created_at) }
          ]}
          rows={clients as Client[]}
        />
      ) : (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start managing projects and files."
          action={<AddClientButton />}
        />
      )}
    </div>
  );
}
