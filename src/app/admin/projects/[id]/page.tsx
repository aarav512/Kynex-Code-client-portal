import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDate, formatMoney } from '@/lib/utils';
import { ArrowLeft, Calendar, DollarSign, FileText, MessageSquare } from 'lucide-react';
import { EditProjectButton } from './EditProjectButton';


export default async function AdminProjectDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from('projects')
    .select('*, clients!inner(company_name)')
    .eq('id', id)
    .maybeSingle();

  if (!project) notFound();

  const proj = project as typeof project & { clients: { company_name: string } };

  const { data: files } = await supabase
    .from('files')
    .select('*')
    .eq('project_id', proj.id)
    .order('created_at', { ascending: false });

  const { data: requests } = await supabase
    .from('requests')
    .select('*')
    .eq('project_id', proj.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <Link href="/admin/projects" className="flex items-center gap-1 text-sm text-ink-600 transition-base hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>
      <PageHeader
        title={proj.title}
        description={`${proj.clients.company_name}${proj.description ? ` · ${proj.description}` : ''}`}
        action={
          <div className="flex items-center gap-2">
            <StatusPill status={proj.status} />
            <EditProjectButton project={proj} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-paper p-4">
          <div className="flex items-center gap-2 text-ink-600"><Calendar className="h-4 w-4" /></div>
          <p className="mt-2 text-xs text-ink-600">Start date</p>
          <p className="font-medium text-ink-900">{formatDate(proj.start_date)}</p>
        </div>
        <div className="rounded-lg border border-line bg-paper p-4">
          <div className="flex items-center gap-2 text-ink-600"><Calendar className="h-4 w-4" /></div>
          <p className="mt-2 text-xs text-ink-600">Due date</p>
          <p className="font-medium text-ink-900">{formatDate(proj.due_date)}</p>
        </div>
        <div className="rounded-lg border border-line bg-paper p-4">
          <div className="flex items-center gap-2 text-ink-600"><DollarSign className="h-4 w-4" /></div>
          <p className="mt-2 text-xs text-ink-600">Budget</p>
          <p className="font-medium text-ink-900">{formatMoney(proj.budget)}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
          <FileText className="h-5 w-5" /> Project Files
        </h2>
        {files && files.length > 0 ? (
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3">
                <div>
                  <p className="font-medium text-ink-900">{f.file_name}</p>
                  <p className="text-xs text-ink-600">{formatDate(f.created_at)}</p>
                </div>
                <a
                  href={`/api/download?path=${encodeURIComponent(f.file_path)}&name=${encodeURIComponent(f.file_name)}`}
                  className="rounded-md border border-line px-3 py-1 text-xs font-medium text-ink-600 transition-base hover:bg-paper-100 hover:text-ink-900"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-line bg-paper px-4 py-8 text-center text-sm text-ink-600">No files for this project yet.</p>
        )}
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
          <MessageSquare className="h-5 w-5" /> Project Requests
        </h2>
        {requests && requests.length > 0 ? (
          <div className="space-y-2">
            {requests.map((r) => (
              <Link
                key={r.id}
                href={`/admin/requests/${r.id}`}
                className="flex items-center justify-between rounded-lg border border-line bg-paper px-4 py-3 transition-base hover:bg-paper-100"
              >
                <p className="font-medium text-ink-900">{r.subject}</p>
                <StatusPill status={r.status} />
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-line bg-paper px-4 py-8 text-center text-sm text-ink-600">No requests for this project.</p>
        )}
      </div>
    </div>
  );
}
