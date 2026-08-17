'use client';
import { useState } from 'react';
import { deleteFile } from '@/actions/files';

export function DeleteFileButton({ fileId, storagePath }: { fileId: string; storagePath: string }) {
  const [loading, setLoading] = useState(false);
  async function handle() {
    if (!confirm('Delete this file permanently?')) return;
    setLoading(true);
    await deleteFile(fileId, storagePath);
    setLoading(false);
  }
  return (
    <button onClick={handle} disabled={loading} className="kx-btn-ghost !px-2 text-rust text-sm">
      {loading ? '…' : 'Delete'}
    </button>
  );
}
