'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { createProject, updateProject, type ActionState } from '@/actions/projects';

type Project = { id: string; client_id: string; name: string; project_type: string; description: string | null; status: string; start_date: string | null; expected_completion_date: string | null; live_url: string | null };

export function ProjectForm({ clients, project, defaultClientId }: { clients: { id: string; company_name: string }[]; project?: Project; defaultClientId?: string }) {
  const action = project ? updateProject : createProject;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className="kx-panel space-y-5 p-6">
      {project && <input type="hidden" name="id" value={project.id} />}
      <div>
        <label className="kx-label" htmlFor="client_id">Client</label>
        <select className="kx-input" id="client_id" name="client_id" defaultValue={project?.client_id || defaultClientId || ''} required>
          <option value="">Select client…</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="kx-label" htmlFor="name">Project name</label>
          <input className="kx-input" id="name" name="name" defaultValue={project?.name} required />
        </div>
        <div>
          <label className="kx-label" htmlFor="project_type">Project type</label>
          <input className="kx-input" id="project_type" name="project_type" defaultValue={project?.project_type} placeholder="e.g. Website Redesign" required />
        </div>
      </div>
      <div>
        <label className="kx-label" htmlFor="description">Description</label>
        <textarea className="kx-input" id="description" name="description" rows={3} defaultValue={project?.description ?? ''} />
      </div>
      <div>
        <label className="kx-label" htmlFor="status">Status</label>
        <select className="kx-input" id="status" name="status" defaultValue={project?.status || 'not_started'}>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="client_review">Client Review</option>
          <option value="completed">Completed</option>
          <option value="live">Live</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="kx-label" htmlFor="start_date">Start date</label>
          <input className="kx-input" id="start_date" name="start_date" type="date" defaultValue={project?.start_date ?? ''} />
        </div>
        <div>
          <label className="kx-label" htmlFor="expected_completion_date">Target completion</label>
          <input className="kx-input" id="expected_completion_date" name="expected_completion_date" type="date" defaultValue={project?.expected_completion_date ?? ''} />
        </div>
      </div>
      <div>
        <label className="kx-label" htmlFor="live_url">Live URL</label>
        <input className="kx-input" id="live_url" name="live_url" type="url" defaultValue={project?.live_url ?? ''} placeholder="https://" />
      </div>
      {state?.error && <p className="text-sm text-rust">{state.error}</p>}
      <div className="flex gap-3">
        <button type="submit" className="kx-btn-primary" disabled={pending}>{pending ? 'Saving…' : project ? 'Save changes' : 'Create project'}</button>
        <Link href="/admin/projects" className="kx-btn-secondary">Cancel</Link>
      </div>
    </form>
  );
}
