'use client';

import { useActionState } from 'react';
import { postRequestMessage, type ActionState } from '@/actions/requests';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  author_name: string;
  author_role: 'admin' | 'client';
  body: string;
  created_at: string;
};

export function RequestThread({ requestId, messages }: { requestId: string; messages: Message[] }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(postRequestMessage, null);

  return (
    <div>
      <div className="kx-panel divide-y divide-line">
        {messages.length === 0 && <p className="px-4 py-6 text-sm text-ink-600">No replies yet.</p>}
        {messages.map((m) => (
          <div key={m.id} className="px-4 py-4">
            <div className="mb-1.5 flex items-center justify-between">
              <p
                className={cn(
                  'text-xs font-medium',
                  m.author_role === 'admin' ? 'text-signal' : 'text-ink-950'
                )}
              >
                {m.author_name}
              </p>
              <p className="font-mono text-[11px] text-ink-600">{formatDate(m.created_at)}</p>
            </div>
            <p className="whitespace-pre-wrap text-sm text-ink-950">{m.body}</p>
          </div>
        ))}
      </div>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="request_id" value={requestId} />
        <textarea className="kx-input" name="body" rows={3} placeholder="Write a reply…" required />
        {state?.error && <p className="text-sm text-rust">{state.error}</p>}
        <button type="submit" className="kx-btn-secondary" disabled={pending}>
          {pending ? 'Sending…' : 'Send reply'}
        </button>
      </form>
    </div>
  );
}
