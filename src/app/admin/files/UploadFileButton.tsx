'use client';

import { useState, useEffect } from 'react';
import { uploadFileAction } from '@/actions/files';
import { createClient } from '@/lib/supabase/client';
import { Upload, X } from 'lucide-react';

export function UploadFileButton() {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<{ id: string; company_name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; title: string; client_id: string }[]>([]);
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      const supabase = createClient();
      supabase.from('clients').select('id, company_name').order('company_name').then(({ data }) => {
        setClients(data ?? []);
      });
      supabase.from('projects').select('id, title, client_id').order('title').then(({ data }) => {
        setProjects(data ?? []);
      });
    }
  }, [open]);

  const filteredProjects = projects.filter(p => !clientId || p.client_id === clientId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !clientId) {
      setError('Please select a client and file.');
      return;
    }
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('client_id', clientId);
    if (projectId) formData.append('project_id', projectId);

    const result = await uploadFileAction(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
      setFile(null); setClientId(''); setProjectId('');
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-white transition-base hover:bg-signal-600"
      >
        <Upload className="h-4 w-4" /> Upload File
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-lg border border-line bg-paper p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink-900">Upload File</h2>
              <button onClick={() => setOpen(false)} className="text-ink-600 hover:text-ink-900"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Client</label>
                <select value={clientId} onChange={(e) => { setClientId(e.target.value); setProjectId(''); }} required className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none">
                  <option value="">Select a client…</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Project (optional)</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none">
                  <option value="">No specific project…</option>
                  {filteredProjects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">File</label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  required
                  className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none"
                />
                {file && <p className="mt-1 text-xs text-ink-600">{file.name} ({Math.round(file.size / 1024)} KB)</p>}
              </div>
              {error && <p className="rounded-md border border-rust-100 bg-rust-100/20 px-3 py-2 text-sm text-rust">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-md bg-signal px-4 py-2 text-sm font-medium text-white transition-base hover:bg-signal-600 disabled:opacity-50">
                {loading ? 'Uploading…' : 'Upload'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
