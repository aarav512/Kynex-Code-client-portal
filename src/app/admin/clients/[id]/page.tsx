import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDate, formatMoney } from '@/lib/utils';
import { ArrowLeft, FolderKanban, FileText, CreditCard } from 'lucide-react';


export const runtime = 'edge';

export default async function AdminClientDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!client) notFound();

  const [projects, files, payments] = await Promise.all([
    supabase.from('projects').select('*').eq('client_id', id).order('updated_at', { ascending: false }),
    supabase.from('files').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('payments').select('*').eq('client_id', id).order('created_at', { ascending: false })
  ]);

  return (
    <div className="space-y-6">
      <Link href="/admin/clients" className="flex items-center gap-1 text-sm text-ink-600 transition-base hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Back to clients
      </Link>
      <PageHeader
        title={client.company_name}
        description={`${client.contact_name} · ${client.email}`}
        action={<StatusPill status={client.status} />}
      />

      <div className="rounded-lg border border-line bg-paper p-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-ink-600">Phone</dt>
            <dd className="font-medium text-ink-900">{client.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-600">Added</dt>
            <dd className="font-medium text-ink-900">{formatDate(client.created_at)}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
          <FolderKanban className="h-5 w-5" /> Projects
        </h2>
        {projects.data && projects.data.length > 0 ? (
          <div className="space-y-2">
            {projects.data.map((p) => (
              <Link
                key={p.id}
                href={`/admin/projects/${p.id}`}
                className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3 transition-base hover:bg-paper-100"
              >
                <p className="font-medium text-ink-900">{p.title}</p>
                <StatusPill status={p.status} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-line bg-paper px-4 py-8 text-center text-sm text-ink-600">No projects for this client.</p>
        )}
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
          <FileText className="h-5 w-5" /> Files
        </h2>
        {files.data && files.data.length > 0 ? (
          <div className="space-y-2">
            {files.data.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3">
                <p className="font-medium text-ink-900">{f.file_name}</p>
                <span className="text-xs text-ink-600">{formatDate(f.created_at)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-line bg-paper px-4 py-8 text-center text-sm text-ink-600">No files for this client.</p>
        )}
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
          <CreditCard className="h-5 w-5" /> Payments
        </h2>
        {payments.data && payments.data.length > 0 ? (
          <div className="space-y-2">
            {payments.data.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3">
                <div>
                  <p className="font-medium text-ink-900">{p.description}</p>
                  <p className="text-xs text-ink-600">{formatMoney(p.amount)}</p>
                </div>
                <StatusPill status={p.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-line bg-paper px-4 py-8 text-center text-sm text-ink-600">No payments for this client.</p>
        )}
      </div>
    </div>
  );
}
