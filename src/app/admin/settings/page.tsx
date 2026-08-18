import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate } from '@/lib/utils';

export default async function AdminSettingsPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your admin account settings." />

      <div className="rounded-lg border border-line bg-paper p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Admin Account</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-600">Name</dt>
            <dd className="font-medium text-ink-900">{profile?.full_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-600">Email</dt>
            <dd className="font-medium text-ink-900">{profile?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-600">Role</dt>
            <dd className="font-medium text-ink-900 capitalize">{profile?.role}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-600">Joined</dt>
            <dd className="font-medium text-ink-900">{formatDate(profile?.created_at)}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-lg border border-line bg-paper p-6">
        <h2 className="mb-2 font-display text-lg font-semibold text-ink-900">Portal Information</h2>
        <p className="text-sm text-ink-600">
          This is the Kynex Code Client Portal. Clients log in at the same URL as admins
          and see only their own data, enforced by database-level Row Level Security.
        </p>
      </div>
    </div>
  );
}
