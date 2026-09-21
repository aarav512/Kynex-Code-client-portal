'use client';

import { useState } from 'react';
import { InvoiceDialog } from '@/components/billing/InvoiceDialog';
import { makeInvoiceNo, type PortalInvoice } from '@/lib/billing';

export function PayInvoiceButton({
  invoice
}: {
  invoice: PortalInvoice | (Omit<PortalInvoice, 'kind' | 'number'> & { invoiceNumber?: string | null });
}) {
  const [open, setOpen] = useState(false);
  const full: PortalInvoice =
    'kind' in invoice && invoice.kind && 'number' in invoice && invoice.number
      ? (invoice as PortalInvoice)
      : {
          ...(invoice as Omit<PortalInvoice, 'kind' | 'number'>),
          kind: 'Tax Invoice',
          number: makeInvoiceNo('INV', invoice.id, 'invoiceNumber' in invoice ? invoice.invoiceNumber : undefined)
        };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-signal px-3 py-1.5 text-sm font-medium text-white transition-base hover:bg-signal-600"
      >
        Pay
      </button>
      <InvoiceDialog invoice={full} open={open} onClose={() => setOpen(false)} allowPay />
    </>
  );
}
