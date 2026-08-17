'use client';
import { useState } from 'react';
import { updateRequestStatus } from '@/actions/requests';
import type { RequestStatus } from '@/lib/database.types';
import { REQUEST_STATUS_LABEL } from '@/lib/utils';

const ALL_STATUSES: RequestStatus[] = ['submitted', 'in_progress', 'waiting_for_client', 'completed'];

export function AdminRequestControls({ requestId, currentStatus }: { requestId: string; currentStatus: RequestStatus }) {
  const [status, setStatus] = useState<RequestStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handle(newStatus: RequestStatus) {
    setLoading(true);
    await updateRequestStatus(requestId, newStatus);
    setStatus(newStatus);
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="kx-eyebrow mr-1">Status:</span>
      <select className="kx-input !py-1 !w-auto text-sm" value={status} disabled={loading}
        onChange={e => handle(e.target.value as RequestStatus)}>
        {ALL_STATUSES.map(s => <option key={s} value={s}>{REQUEST_STATUS_LABEL[s]}</option>)}
      </select>
    </div>
  );
}
