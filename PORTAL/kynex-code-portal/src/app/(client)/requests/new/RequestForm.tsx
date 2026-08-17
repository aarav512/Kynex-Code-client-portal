'use client';

import { useActionState } from 'react';
import { createRequest, type ActionState } from '@/actions/requests';

export function RequestForm({ projects }: { projects: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createRequest, null);

  return (
    <form action={formAction} className="kx-panel space-y-5 p-6">
      <div>
        <label className="kx-label" htmlFor="title">
          Request title
        </label>
        <input className="kx-input" id="title" name="title" required />
      </div>

      <div>
        <label className="kx-label" htmlFor="description">
          Description
        </label>
        <textarea className="kx-input" id="description" name="description" rows={5} required />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="kx-label" htmlFor="category">
            Category
          </label>
          <select className="kx-input" id="category" name="category" defaultValue="website_change">
            <option value="website_change">Website Change</option>
            <option value="bug_error">Bug / Error</option>
            <option value="content_update">Content Update</option>
            <option value="technical_support">Technical Support</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="kx-label" htmlFor="priority">
            Priority
          </label>
          <select className="kx-input" id="priority" name="priority" defaultValue="medium">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {projects.length > 0 && (
        <div>
          <label className="kx-label" htmlFor="project_id">
            Related project (optional)
          </label>
          <select className="kx-input" id="project_id" name="project_id" defaultValue="">
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="kx-label" htmlFor="attachment">
          Attachment (optional)
        </label>
        <input className="kx-input file:mr-3 file:rounded file:border-0 file:bg-ink-950 file:px-3 file:py-1.5 file:text-xs file:text-paper" id="attachment" name="attachment" type="file" />
      </div>

      {state?.error && <p className="text-sm text-rust">{state.error}</p>}

      <button type="submit" className="kx-btn-primary" disabled={pending}>
        {pending ? 'Submitting…' : 'Submit request'}
      </button>
    </form>
  );
}
