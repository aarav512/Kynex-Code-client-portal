import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { FILE_CATEGORY_LABEL, formatBytes, formatDate } from '@/lib/utils';
import type { FileCategory } from '@/lib/database.types';

const CATEGORY_ORDER: FileCategory[] = ['website_files', 'images_assets', 'documents', 'content', 'other'];

export default async function ClientFilesPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user!.id).single();

  const { data: files } = await supabase
    .from('files')
    .select('*')
    .eq('client_id', profile!.client_id!)
    .order('created_at', { ascending: false });

  return (
    <div>
      <PageHeader eyebrow="Files" title="Shared files" />

      {files && files.length > 0 ? (
        <div className="space-y-8">
          {CATEGORY_ORDER.filter((cat) => files.some((f) => f.category === cat)).map((cat) => (
            <section key={cat}>
              <p className="kx-eyebrow mb-3">{FILE_CATEGORY_LABEL[cat]}</p>
              <ul className="kx-panel divide-y divide-line">
                {files
                  .filter((f) => f.category === cat)
                  .map((f) => (
                    <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-ink-950">{f.file_name}</p>
                        <p className="mt-0.5 font-mono text-xs text-ink-600">
                          {formatBytes(f.file_size_bytes)} · uploaded {formatDate(f.created_at)}
                        </p>
                      </div>
                      <DownloadButton storagePath={f.storage_path} />
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState title="No files yet" description="Files your Kynex Code team shares with you will appear here." />
      )}
    </div>
  );
}
