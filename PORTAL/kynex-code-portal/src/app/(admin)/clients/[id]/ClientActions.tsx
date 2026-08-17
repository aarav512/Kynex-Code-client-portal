'use client';
import { useState } from 'react';
import { toggleClientAccess } from '@/actions/clients';

export function ClientActions({ clientId, isActive }: { clientId: string; isActive: boolean }) {
  const [active, setActive] = useState(isActive);
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await toggleClientAccess(clientId, !active);
    setActive(v => !v);
    setLoading(false);
  }

  return (
    <button onClick={handle} disabled={loading}
      className={active ? 'kx-btn-secondary !border-rust !text-rust' : 'kx-btn-secondary !border-moss !text-moss'}>
      {loading ? '…' : active ? 'Disable access' : 'Enable access'}
    </button>
  );
}
