import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatusPill, PROJECT_STATUS_TONE, PAYMENT_STATUS_TONE } from '@/components/ui/StatusPill';
import { DataTable, DataRow, DataCell } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { ClientActions } from './ClientActions';
import { PROJECT_STATUS_LABEL, PAYMENT_STATUS_LABEL, formatDate, formatMoney } from '@/lib/utils';

export default async function AdminClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: client } = await supabase.from('clients').select('*').eq('id', params.id).single();
  if (!client) notFound();

  const [{ data: projects }, { data: invoices }, { data: requests }, { data: amc }] = await Promise.all([
    supabase.from('projects').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
    supabase.from('invoices').select('*').eq('client_id', params.id).order('due_date', { ascending: false }),
    supabase.from('requests').select('id, title, status, created_at').eq('client_id', params.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('amc').select('*').eq('client_id', params.id).maybeSingle(),
  ]);

  return (
    <div>
      <PageHeader eyebrow="Clients" title={client.company_name}
        action={<ClientActions clientId={client.id} isActive={client.is_active} />} />

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <div className="kx-panel p-5 md:col-span-2">
          <p className="kx-eyebrow mb-4">Contact info</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: 'Contact name', value: client.contact_name },
              { label: 'Email', value: client.contact_email },
              { label: 'Phone', value: client.contact_phone || '—' },
              { label: 'Status', value: client.is_active ? 'Active' : 'Disabled' },
              { label: 'Client since', value: formatDate(client.created_at) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="kx-eyebrow mb-1">{label}</p>
                <p className="text-ink-950">{value}</p>
              </div>
            ))}
            {client.notes && <div className="col-span-2"><p className="kx-eyebrow mb-1">Notes</p><p className="text-ink-700">{client.notes}</p></div>}
          </div>
        </div>
        <div className="kx-panel p-5">
          <p className="kx-eyebrow mb-4">Quick actions</p>
          <div className="space-y-2">
            <Link href={`/admin/projects/new?client_id=${client.id}`} className="kx-btn-secondary w-full text-center block">Add project</Link>
            <Link href={`/admin/payments/new?client_id=${client.id}`} className="kx-btn-secondary w-full text-center block">Add invoice</Link>
            <Link href={`/admin/amc?client_id=${client.id}`} className="kx-btn-secondary w-full text-center block">Manage AMC</Link>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="kx-eyebrow">Projects</p>
            <Link href={`/admin/projects/new?client_id=${client.id}`} className="text-xs text-signal hover:underline">+ New</Link>
          </div>
          {projects && projects.length > 0 ? (
            <DataTable columns={['Name', 'Type', 'Status', 'Target date', '']}>
              {projects.map(p => (
                <DataRow key={p.id}>
                  <DataCell className="font-medium">{p.name}</DataCell>
                  <DataCell className="text-ink-600 text-sm">{p.project_type}</DataCell>
                  <DataCell><StatusPill label={PROJECT_STATUS_LABEL[p.status]} tone={PROJECT_STATUS_TONE[p.status]} /></DataCell>
                  <DataCell className="font-mono text-xs text-ink-600">{formatDate(p.expected_completion_date)}</DataCell>
                  <DataCell><Link href={`/admin/projects/${p.id}`} className="text-sm text-signal hover:underline">Edit →</Link></DataCell>
                </DataRow>
              ))}
            </DataTable>
          ) : <div className="kx-panel px-4 py-6 text-sm text-ink-600">No projects yet.</div>}
        </section>

        <section>
          <p className="kx-eyebrow mb-3">Recent requests</p>
          {requests && requests.length > 0 ? (
            <DataTable columns={['Title', 'Status', 'Date']}>
              {requests.map(r => (
                <DataRow key={r.id}>
                  <DataCell><Link href={`/admin/requests/${r.id}`} className="hover:underline">{r.title}</Link></DataCell>
                  <DataCell><StatusPill label={r.status} tone="neutral" /></DataCell>
                  <DataCell className="font-mono text-xs text-ink-600">{formatDate(r.created_at)}</DataCell>
                </DataRow>
              ))}
            </DataTable>
          ) : <div className="kx-panel px-4 py-6 text-sm text-ink-600">No requests.</div>}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <p className="kx-eyebrow">Invoices</p>
            <Link href={`/admin/payments/new?client_id=${client.id}`} className="text-xs text-signal hover:underline">+ New</Link>
          </div>
          {invoices && invoices.length > 0 ? (
            <DataTable columns={['Invoice #', 'Description', 'Amount', 'Due', 'Status']}>
              {invoices.map(inv => (
                <DataRow key={inv.id}>
                  <DataCell className="font-mono text-xs">{inv.invoice_number}</DataCell>
                  <DataCell>{inv.description}</DataCell>
                  <DataCell className="font-medium">{formatMoney(inv.amount, inv.currency)}</DataCell>
                  <DataCell className="font-mono text-xs text-ink-600">{formatDate(inv.due_date)}</DataCell>
                  <DataCell><StatusPill label={PAYMENT_STATUS_LABEL[inv.status]} tone={PAYMENT_STATUS_TONE[inv.status]} /></DataCell>
                </DataRow>
              ))}
            </DataTable>
          ) : <div className="kx-panel px-4 py-6 text-sm text-ink-600">No invoices.</div>}
        </section>

        {amc && (
          <section>
            <p className="kx-eyebrow mb-3">AMC</p>
            <div className="kx-panel p-5">
              <p className="font-display text-base font-medium mb-1">{amc.plan_name}</p>
              <p className="text-sm text-ink-600">Renewal: {formatDate(amc.renewal_date)} · {formatMoney(amc.amount, amc.currency)}</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
