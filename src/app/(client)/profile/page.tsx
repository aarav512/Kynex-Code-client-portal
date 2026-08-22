'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';
import { getBrowserSupabase } from '@/lib/supabase/client';

export default function ClientProfilePage() {
  const { loading, error, data } = usePortalData(async (supabase, session) => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    const { data: client } = profile?.client_id
      ? await supabase.from('clients').select('company_name, email, phone').eq('id', profile.client_id).maybeSingle()
      : { data: null };
    return { profile, client };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data?.profile ? <ProfileView profile={data.profile} client={data.client} /> : data ? <p className="text-sm text-ink-600">Profile not found.</p> : null}
    </PortalState>
  );
}

function ProfileView({
  profile,
  client
}: {
  profile: { id: string; full_name: string; email: string; role: string; created_at: string };
  client: { company_name: string; email: string; phone: string | null } | null;
}) {
  const [name, setName] = useState(profile.full_name);
  const [message, setMessage] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await getBrowserSupabase().from('profiles').update({ full_name: name }).eq('id', profile.id);
    setMessage(error ? error.message : 'Saved');
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your account information." />
      <div className="rounded-lg border border-line bg-paper p-6 text-sm space-y-2">
        <p><span className="text-ink-600">Email:</span> {profile.email}</p>
        <p><span className="text-ink-600">Role:</span> {profile.role}</p>
        <p><span className="text-ink-600">Joined:</span> {formatDate(profile.created_at)}</p>
        {client ? <p><span className="text-ink-600">Company:</span> {client.company_name}</p> : null}
      </div>
      <form onSubmit={save} className="flex items-end gap-3 rounded-lg border border-line bg-paper p-6">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="rounded-md bg-signal px-4 py-2 text-sm text-white">Save</button>
      </form>
      {message ? <p className="text-sm text-ink-600">{message}</p> : null}
    </div>
  );
}
