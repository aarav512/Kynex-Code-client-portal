import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDate, formatMoney } from '@/lib/utils';
import { ArrowLeft, Calendar, DollarSign, FileText, MessageSquare } from 'lucide-react';


export const runtime = 'edge';

export default async function ClientProjectDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('client_id')
    .eq('id', user!.id)
    .maybeSingle();

  if (!profile?.client_id) notFound();

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('client_id', profile.client_id)
    .maybeSingle();

  if (!project) notFound();

  const { data: files } = await supabase
    .from('files')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  const { data: requests } = await supabase
    .from('requests')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <Link href="/projects" className="flex items-center gap-1 text-sm text-ink-600 transition-base hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>
      <PageHeader title={project.title} description={project.description || undefined} action={<StatusPill status={project.status} />} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-line bg-paper p-4">
          <div className="flex items-center gap-2 text-ink-600"><Calendar className="h-4 w-4" /></div>
          <p className="mt-2 text-xs text-ink-600">Start date</p>
          <p className="font-medium text-ink-900">{formatDate(project.start_date)}</p>
        </div>
        <div className="rounded-lg border border-line bg-paper p-4">
          <div className="flex items-center gap-2 text-ink-600"><Calendar className="h-4 w-4" /></div>
          <p className="mt-2 text-xs text-ink-600">Due date</p>
          <p className="font-medium text-ink-900">{formatDate(project.due_date)}</p>
        </div>
        <div className="rounded-lg border border-line bg-paper p-4">
          <div className="flex items-center gap-2 text-ink-600"><DollarSign className="h-4 w-4" /></div>
          <p className="mt-2 text-xs text-ink-600">Budget</p>
          <p className="font-medium text-ink-900">{formatMoney(project.budget)}</p>
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
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-ink-600" />
                  <div>
                    <p className="font-medium text-ink-900">{f.file_name}</p>
                    <p className="text-xs text-ink-600">{formatDate(f.created_at)}</p>
                  </div>
                </div>
                <DownloadButton filePath={f.file_path} fileName={f.file_name} />
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
                href={`/requests/${r.id}`}
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

function DownloadButton({ filePath, fileName }: { filePath: string; fileName: string }) {
  return (
    <a
      href={`/api/download?path=${encodeURIComponent(filePath)}&name=${encodeURIComponent(fileName)}`}
      className="rounded-md border border-line px-3 py-1 text-xs font-medium text-ink-600 transition-base hover:bg-paper-100 hover:text-ink-900"
    >
      Download
    </a>
  );
}
