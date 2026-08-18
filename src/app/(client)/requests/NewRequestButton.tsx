'use client';

import { useState } from 'react';
import { createRequestAction } from '@/actions/requests';
import { Plus, X } from 'lucide-react';

export function NewRequestButton() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('subject', subject);
    formData.append('body', body);

    const result = await createRequestAction(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setOpen(false);
      setSubject('');
      setBody('');
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
        <Plus className="h-4 w-4" /> New Request
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-lg border border-line bg-paper p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink-900">New Request</h2>
              <button onClick={() => setOpen(false)} className="text-ink-600 hover:text-ink-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none"
                  placeholder="Brief description of your request"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                  rows={4}
                  className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none"
                  placeholder="Describe your request in detail…"
                />
              </div>
              {error && (
                <p className="rounded-md border border-rust-100 bg-rust-100/20 px-3 py-2 text-sm text-rust">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-signal px-4 py-2 text-sm font-medium text-white transition-base hover:bg-signal-600 disabled:opacity-50"
              >
                {loading ? 'Submitting…' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
