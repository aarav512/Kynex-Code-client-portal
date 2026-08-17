'use client';

import { useState } from 'react';
import { getFileDownloadUrl } from '@/actions/files';

export function DownloadButton({ storagePath, label = 'Download' }: { storagePath: string; label?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const { url, error } = await getFileDownloadUrl(storagePath);
    setLoading(false);
    if (url) window.open(url, '_blank', 'noopener');
    else if (error) alert(error);
  }

  return (
    <button onClick={handleClick} disabled={loading} className="kx-btn-ghost !px-2 text-signal">
      {loading ? 'Preparing…' : label}
    </button>
  );
}
