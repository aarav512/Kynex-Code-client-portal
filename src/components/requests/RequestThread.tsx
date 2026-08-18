'use client';

import { useState, useTransition } from 'react';
import { addRequestMessageAction, updateRequestStatusAction } from '@/actions/requests';
import type { RequestMessage } from '@/lib/database.types';
import { formatRelative } from '@/lib/utils';
import { Send, CircleCheck as CheckCircle2 } from 'lucide-react';

export function RequestThread({
  requestId,
  messages,
  isAdmin,
  currentStatus
}: {
  requestId: string;
  messages: RequestMessage[];
  isAdmin: boolean;
  currentStatus: string;
}) {
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setError(null);

    const formData = new FormData();
    formData.append('body', body);

    const result = await addRequestMessageAction(requestId, formData);
    if (result?.error) {
      setError(result.error);
    } else {
      setBody('');
    }
  }

  async function handleStatusChange(status: string) {
    startTransition(async () => {
      await updateRequestStatusAction(requestId, status);
    });
  }

  return (
    <div className="space-y-6">
      {/* Status controls */}
      <div className="flex items-center gap-2 rounded-lg border border-line bg-paper px-4 py-3">
        <span className="text-sm font-medium text-ink-600">Status:</span>
        <select
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isPending}
          className="rounded-md border border-line bg-paper-100 px-2 py-1 text-sm text-ink-900 transition-base focus:border-signal focus:outline-none"
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        {currentStatus === 'resolved' && (
          <CheckCircle2 className="ml-auto h-5 w-5 text-moss" />
        )}
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.is_staff ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[75%] rounded-lg px-4 py-3 ${
                msg.is_staff
                  ? 'bg-ink-900 text-paper'
                  : 'bg-signal-100 text-ink-900'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm">{msg.body}</p>
              <p
                className={`mt-1 text-xs ${
                  msg.is_staff ? 'text-ink-600' : 'text-ink-600'
                }`}
              >
                {msg.is_staff ? 'Kynex Staff' : 'You'} · {formatRelative(msg.created_at)}
              </p>
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-ink-600">
            No messages yet. Start the conversation below.
          </p>
        )}
      </div>

      {/* Reply box */}
      <form onSubmit={handleSend} className="space-y-3">
        {error && (
          <p className="rounded-md border border-rust-100 bg-rust-100/20 px-3 py-2 text-sm text-rust">
            {error}
          </p>
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Type your reply…"
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink-900 placeholder-ink-600 transition-base focus:border-signal focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="flex items-center gap-2 rounded-md bg-signal px-4 py-2 text-sm font-medium text-white transition-base hover:bg-signal-600 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {isPending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
