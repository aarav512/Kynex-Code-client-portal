'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { createClientAccount, type ActionState } from '@/actions/clients';
import { PageHeader } from '@/components/ui/PageHeader';

export default function NewClientPage() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createClientAccount, null);
  return (
    <div className="max-w-lg">
      <PageHeader eyebrow="Clients" title="Add new client" />
      <form action={formAction} className="kx-panel space-y-5 p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kx-label" htmlFor="company_name">Company name</label>
            <input className="kx-input" id="company_name" name="company_name" required />
          </div>
          <div>
            <label className="kx-label" htmlFor="contact_name">Contact name</label>
            <input className="kx-input" id="contact_name" name="contact_name" required />
          </div>
        </div>
        <div>
          <label className="kx-label" htmlFor="contact_email">Email (used to log in)</label>
          <input className="kx-input" id="contact_email" name="contact_email" type="email" required />
        </div>
        <div>
          <label className="kx-label" htmlFor="contact_phone">Phone (optional)</label>
          <input className="kx-input" id="contact_phone" name="contact_phone" type="tel" />
        </div>
        <div>
          <label className="kx-label" htmlFor="password">Initial password</label>
          <input className="kx-input" id="password" name="password" type="password" minLength={8} required />
          <p className="mt-1 text-xs text-ink-600">The client can change this after first login.</p>
        </div>
        <div>
          <label className="kx-label" htmlFor="notes">Internal notes (optional)</label>
          <textarea className="kx-input" id="notes" name="notes" rows={3} />
        </div>
        {state?.error && <p className="text-sm text-rust">{state.error}</p>}
        <div className="flex gap-3">
          <button type="submit" className="kx-btn-primary" disabled={pending}>{pending ? 'Creating…' : 'Create client'}</button>
          <Link href="/admin/clients" className="kx-btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
