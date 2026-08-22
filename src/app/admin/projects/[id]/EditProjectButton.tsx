'use client';

import { useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import { Pencil, X } from 'lucide-react';

type ProjectData = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  start_date: string | null;
  due_date: string | null;
  budget: number | null;
};

export function EditProjectButton({ project }: { project: ProjectData }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description || '');
  const [status, setStatus] = useState(project.status);
  const [startDate, setStartDate] = useState(project.start_date || '');
  const [dueDate, setDueDate] = useState(project.due_date || '');
  const [budget, setBudget] = useState(project.budget?.toString() || '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: updateError } = await getBrowserSupabase()
      .from('projects')
      .update({
        title,
        description: description || null,
        status,
        start_date: startDate || null,
        due_date: dueDate || null,
        budget: budget ? parseFloat(budget) : null
      })
      .eq('id', project.id);
    if (updateError) {
      setError(updateError.message);
    } else {
      setOpen(false);
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm text-ink-600 transition-base hover:bg-paper-100 hover:text-ink-900"
      >
        <Pencil className="h-4 w-4" /> Edit
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-lg border border-line bg-paper p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink-900">Edit Project</h2>
              <button onClick={() => setOpen(false)} className="text-ink-600 hover:text-ink-900"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none">
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">In Review</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Due Date</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Budget ($)</label>
                <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none" />
              </div>
              {error && <p className="rounded-md border border-rust-100 bg-rust-100/20 px-3 py-2 text-sm text-rust">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded-md bg-signal px-4 py-2 text-sm font-medium text-white transition-base hover:bg-signal-600 disabled:opacity-50">
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
