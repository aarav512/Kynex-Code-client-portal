import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, DataRow, DataCell } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { DeleteFileButton } from './DeleteFileButton';
import { UploadFileForm } from './UploadFileForm';
import { FILE_CATEGORY_LABEL, formatBytes, formatDate } from '@/lib/utils';

export default async function AdminFilesPage() {
  const supabase = createClient();
  const [{ data: files }, { data: clients }] = await Promise.all([
    supabase.from('files').select('*, clients(company_name), projects(name)').order('created_at', { ascending: false }),
    supabase.from('clients').select('id, company_name').eq('is_active', true).order('company_name'),
  ]);

  return (
    <div>
      <PageHeader eyebrow="Files" title="File management" />
      <div className="mb-8 kx-panel p-6">
        <p className="kx-eyebrow mb-4">Upload file</p>
        <UploadFileForm clients={clients ?? []} />
      </div>
      {files && files.length > 0 ? (
        <DataTable columns={['File', 'Client', 'Project', 'Category', 'Size', 'Uploaded', '']}>
          {files.map((f: any) => (
            <DataRow key={f.id}>
              <DataCell className="font-medium max-w-[200px] truncate">{f.file_name}</DataCell>
              <DataCell className="text-sm text-ink-600">{f.clients?.company_name}</DataCell>
              <DataCell className="text-sm text-ink-600">{f.projects?.name || '—'}</DataCell>
              <DataCell className="text-sm text-ink-600">{FILE_CATEGORY_LABEL[f.category]}</DataCell>
              <DataCell className="font-mono text-xs text-ink-600">{formatBytes(f.file_size_bytes)}</DataCell>
              <DataCell className="font-mono text-xs text-ink-600">{formatDate(f.created_at)}</DataCell>
              <DataCell className="flex gap-2">
                <DownloadButton storagePath={f.storage_path} />
                <DeleteFileButton fileId={f.id} storagePath={f.storage_path} />
              </DataCell>
            </DataRow>
          ))}
        </DataTable>
      ) : <EmptyState title="No files yet" description="Upload a file above to get started." />}
    </div>
  );
}
