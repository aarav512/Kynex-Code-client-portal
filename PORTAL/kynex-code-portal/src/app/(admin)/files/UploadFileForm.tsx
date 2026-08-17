'use client';
import { useActionState, useState, useEffect } from 'react';
import { uploadFile, type ActionState } from '@/actions/files';
import { createClient } from '@/lib/supabase/client';

export function UploadFileForm({ clients }: { clients: { id: string; company_name: string }[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(uploadFile, null);
  const [selectedClient, setSelectedClient] = useState('');
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (!selectedClient) { setProjects([]); return; }
    supabase.from('projects').select('id, name').eq('client_id', selectedClient)
      .then(({ data }) => setProjects(data ?? []));
  }, [selectedClient]);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="kx-label" htmlFor="f_client">Client</label>
        <select className="kx-input" id="f_client" name="client_id" required value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
          <option value="">Select…</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
        </select>
      </div>
      <div>
        <label className="kx-label" htmlFor="f_project">Project (optional)</label>
        <select className="kx-input" id="f_project" name="project_id" disabled={!projects.length}>
          <option value="">None</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label className="kx-label" htmlFor="f_category">Category</label>
        <select className="kx-input" id="f_category" name="category" defaultValue="other">
          <option value="website_files">Website Files</option>
          <option value="images_assets">Images & Assets</option>
          <option value="documents">Documents</option>
          <option value="content">Content</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div>
        <label className="kx-label" htmlFor="f_file">File</label>
        <input className="kx-input file:mr-2 file:rounded file:border-0 file:bg-ink-950 file:px-2.5 file:py-1 file:text-xs file:text-paper" id="f_file" name="file" type="file" required />
      </div>
      {state?.error && <p className="sm:col-span-2 lg:col-span-4 text-sm text-rust">{state.error}</p>}
      {state?.success && <p className="sm:col-span-2 lg:col-span-4 text-sm text-moss">{state.success}</p>}
      <div className="sm:col-span-2 lg:col-span-4">
        <button type="submit" className="kx-btn-primary" disabled={pending}>{pending ? 'Uploading…' : 'Upload file'}</button>
      </div>
    </form>
  );
}
