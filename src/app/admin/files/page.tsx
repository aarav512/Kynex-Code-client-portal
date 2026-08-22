import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatBytes } from '@/lib/utils';
import { FileText, Download } from 'lucide-react';
import { UploadFileButton } from './UploadFileButton';

type FileRow = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
  clients: { company_name: string };
};


export default async function AdminFilesPage() {
  const supabase = await createClient();
  const { data: files } = await supabase
    .from('files')
    .select('*, clients!inner(company_name)')
    .order('created_at', { ascending: false });

  const rows = (files as FileRow[] | null) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Files"
        description="Files shared with clients."
        action={<UploadFileButton />}
      />
      {rows.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((f) => (
            <div
              key={f.id}
              className="group rounded-lg border border-line bg-paper p-4 transition-base hover:border-ink-600"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-paper-100">
                <FileText className="h-5 w-5 text-ink-600" />
              </div>
              <p className="truncate font-medium text-ink-900">{f.file_name}</p>
              <p className="mt-1 text-xs text-ink-600">{f.clients.company_name}</p>
              <p className="mt-1 text-xs text-ink-600">
                {formatBytes(f.file_size)} · {formatDate(f.created_at)}
              </p>
              <a
                href={`/api/download?path=${encodeURIComponent(f.file_path)}&name=${encodeURIComponent(f.file_name)}`}
                className="mt-3 flex items-center gap-1.5 text-sm text-signal transition-base hover:text-signal-600"
              >
                <Download className="h-4 w-4" /> Download
              </a>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="No files yet"
          description="Upload a file and share it with a client."
          action={<UploadFileButton />}
        />
      )}
    </div>
  );
}
