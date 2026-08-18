import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate } from '@/lib/utils';
import { updateProfileAction } from './updateProfileAction';

export default async function ClientProfilePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .maybeSingle();

  if (!profile) {
    return <p className="text-sm text-ink-600">Profile not found.</p>;
  }

  const { data: client } = await supabase
    .from('clients')
    .select('company_name, email, phone')
    .eq('id', profile.client_id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your account information." />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account info */}
        <div className="rounded-lg border border-line bg-paper p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Account</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">Name</dt>
              <dd className="font-medium text-ink-900">{profile.full_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Email</dt>
              <dd className="font-medium text-ink-900">{profile.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Role</dt>
              <dd className="font-medium text-ink-900 capitalize">{profile.role}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Joined</dt>
              <dd className="font-medium text-ink-900">{formatDate(profile.created_at)}</dd>
            </div>
          </dl>
        </div>

        {/* Company info */}
        <div className="rounded-lg border border-line bg-paper p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Company</h2>
          {client ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-600">Company</dt>
                <dd className="font-medium text-ink-900">{client.company_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-600">Email</dt>
                <dd className="font-medium text-ink-900">{client.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-600">Phone</dt>
                <dd className="font-medium text-ink-900">{client.phone || '—'}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-ink-600">No company linked.</p>
          )}
        </div>

        {/* Update name */}
        <div className="rounded-lg border border-line bg-paper p-6 md:col-span-2">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Update Name</h2>
          <form action={updateProfileAction} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-ink-600">Full Name</label>
              <input
                type="text"
                name="full_name"
                defaultValue={profile.full_name}
                required
                className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white transition-base hover:bg-signal-600"
            >
              Save
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
