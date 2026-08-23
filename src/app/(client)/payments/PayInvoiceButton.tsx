'use client';

import { useState } from 'react';
import { formatMoney } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { updateMatchingColumns } from '@/lib/supabase/insert-matching';

export function PayInvoiceButton({
  paymentId,
  amount
}: {
  paymentId: string;
  amount: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setError(null);
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const { error: updateError } = await updateMatchingColumns(
      createClient(),
      'payments',
      {
        status: 'paid',
        paid_date: today,
        paid_at: today
      },
      paymentId
    );
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handlePay}
        disabled={loading}
        className="rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-white transition-base hover:bg-signal-600 disabled:opacity-50"
      >
        {loading ? 'Recording…' : `Pay ${formatMoney(amount)}`}
      </button>
      {error && <p className="max-w-[220px] text-right text-xs text-rust">{error}</p>}
    </div>
  );
}
