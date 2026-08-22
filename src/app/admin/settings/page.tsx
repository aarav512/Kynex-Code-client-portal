'use client';

import { PageHeader } from '@/components/ui/PageHeader';
import { formatDate } from '@/lib/utils';
import { PortalState, usePortalData } from '@/components/auth/usePortalData';

export default function AdminSettingsPage() {
  const { loading, error, data } = usePortalData(async (supabase, session) => {
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
    return { profile };
  });

  return (
    <PortalState loading={loading} error={error}>
      {data ? (
        <div className="space-y-6">
          <PageHeader title="Settings" description="Your admin account settings." />
          <div className="rounded-lg border border-line bg-paper p-6">
            <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">Admin Account</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-600">Name</dt><dd className="font-medium text-ink-900">{data.profile?.full_name}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-600">Email</dt><dd className="font-medium text-ink-900">{data.profile?.email}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-600">Role</dt><dd className="font-medium text-ink-900 capitalize">{data.profile?.role}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-600">Joined</dt><dd className="font-medium text-ink-900">{formatDate(data.profile?.created_at)}</dd></div>
            </dl>
          </div>
        </div>
      ) : null}
    </PortalState>
  );
}
