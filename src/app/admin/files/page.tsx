'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatBytes } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import { FileText, Download } from 'lucide-react';
import { UploadFileButton } from './UploadFileButton';
import { getBrowserSupabase } from '@/lib/supabase/client';

type FileRow = {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  created_at: string;
  clients: { company_name: string };
};

async function downloadFile(path: string, name: string) {
  const { data, error } = await getBrowserSupabase().storage.from('files').download(path);
  if (error || !data) return;
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminFilesPage() {
  const { loading, error, data } = usePortalData(async (supabase) => {
    const { data: files } = await supabase.from('files').select('*, clients!inner(company_name)').order('created_at', { ascending: false });
    return { rows: (files as FileRow[] | null) ?? [] };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data ? (
        <div className="space-y-6">
          <PageHeader title="Files" description="Files shared with clients." action={<UploadFileButton />} />
          {data.rows.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.rows.map((f) => (
                <div key={f.id} className="rounded-lg border border-line bg-paper p-4">
                  <p className="truncate font-medium text-ink-900">{f.file_name}</p>
                  <p className="mt-1 text-xs text-ink-600">{f.clients.company_name} · {formatBytes(f.file_size)} · {formatDate(f.created_at)}</p>
                  <button type="button" onClick={() => downloadFile(f.file_path, f.file_name)} className="mt-3 flex items-center gap-1.5 text-sm text-signal">
                    <Download className="h-4 w-4" /> Download
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={FileText} title="No files yet" action={<UploadFileButton />} />
          )}
        </div>
      ) : null}
    </PortalState>
  );
}
