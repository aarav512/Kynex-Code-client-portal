'use client';
import { useState } from 'react';
import { updateInvoiceStatus } from '@/actions/payments';
import type { PaymentStatus } from '@/lib/database.types';
import { PAYMENT_STATUS_LABEL } from '@/lib/utils';

const ALL: PaymentStatus[] = ['pending', 'paid', 'overdue'];

export function InvoiceStatusButton({ invoiceId, currentStatus }: { invoiceId: string; currentStatus: PaymentStatus }) {
  const [status, setStatus] = useState<PaymentStatus>(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handle(newStatus: PaymentStatus) {
    setLoading(true);
    await updateInvoiceStatus(invoiceId, newStatus);
    setStatus(newStatus);
    setLoading(false);
  }

  return (
    <select className="kx-input !py-1 !w-auto text-xs" value={status} disabled={loading}
      onChange={e => handle(e.target.value as PaymentStatus)}>
      {ALL.map(s => <option key={s} value={s}>{PAYMENT_STATUS_LABEL[s]}</option>)}
    </select>
  );
}
