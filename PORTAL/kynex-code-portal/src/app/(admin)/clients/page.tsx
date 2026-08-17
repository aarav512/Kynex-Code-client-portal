import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { DataTable, DataRow, DataCell } from '@/components/ui/DataTable';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDate } from '@/lib/utils';

export default async function AdminClientsPage() {
  const supabase = createClient();
  const { data: clients } = await supabase.from('clients').select('*').order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader eyebrow="Clients" title="All clients"
        action={<Link href="/admin/clients/new" className="kx-btn-primary">Add client</Link>} />
      {clients && clients.length > 0 ? (
        <DataTable columns={['Company', 'Contact', 'Email', 'Status', 'Added', '']}>
          {clients.map((c) => (
            <DataRow key={c.id}>
              <DataCell className="font-medium"><Link href={`/admin/clients/${c.id}`} className="hover:underline">{c.company_name}</Link></DataCell>
              <DataCell>{c.contact_name}</DataCell>
              <DataCell className="text-ink-600 text-sm">{c.contact_email}</DataCell>
              <DataCell><StatusPill label={c.is_active ? 'Active' : 'Disabled'} tone={c.is_active ? 'moss' : 'rust'} /></DataCell>
              <DataCell className="font-mono text-xs text-ink-600">{formatDate(c.created_at)}</DataCell>
              <DataCell><Link href={`/admin/clients/${c.id}`} className="text-sm text-signal hover:underline">View →</Link></DataCell>
            </DataRow>
          ))}
        </DataTable>
      ) : (
        <EmptyState title="No clients yet" description="Add your first client to get started."
          action={<Link href="/admin/clients/new" className="kx-btn-primary">Add client</Link>} />
      )}
    </div>
  );
}
