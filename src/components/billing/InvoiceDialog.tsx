'use client';

import { useState } from 'react';
import { Printer, X, Copy, Check, ExternalLink } from 'lucide-react';
import { formatMoney } from '@/lib/utils';
import { KYNEX_BILLING, canPay, isInr, upiLink, upiQr, type PortalInvoice } from '@/lib/billing';
import { InvoiceSheet } from './InvoiceSheet';

export function InvoiceDialog({
  invoice,
  open,
  onClose,
  allowPay
}: {
  invoice: PortalInvoice;
  open: boolean;
  onClose: () => void;
  allowPay?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  const showUpi = Boolean(allowPay) && canPay(invoice.status) && isInr(invoice.currency);
  const note = `${invoice.number} ${invoice.description}`.trim();
  const payLink = upiLink(invoice.amount, note);

  async function copyUpi() {
    try {
      await navigator.clipboard.writeText(KYNEX_BILLING.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 animate-fade-in no-print" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-line bg-paper p-4 animate-fade-in-up sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3 no-print">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            {invoice.kind} · {invoice.number}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-paper-100"
            >
              <Printer className="h-3.5 w-3.5" /> Print / PDF
            </button>
            <button type="button" onClick={onClose} className="text-ink-600 hover:text-ink-900">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <InvoiceSheet invoice={invoice} />
        {showUpi ? (
          <div className="mt-4 grid gap-4 rounded-lg border border-line bg-paper-100 p-4 no-print sm:grid-cols-[160px_1fr]">
            <img
              src={KYNEX_BILLING.qrSrc || upiQr(invoice.amount, note)}
              alt="UPI QR for Kynex Code"
              className="mx-auto h-40 w-40 rounded-md border border-line bg-white object-contain p-1"
            />
            <div>
              <p className="font-display font-semibold text-ink-900">
                Pay {formatMoney(invoice.amount, 'INR')} with any UPI app
              </p>
              <p className="mt-1 text-sm text-ink-600">
                Scan the QR or pay {KYNEX_BILLING.payeeName} at{' '}
                <span className="font-mono text-ink-900">{KYNEX_BILLING.upiId}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={copyUpi}
                  className="flex items-center gap-1 rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy UPI ID'}
                </button>
                <a
                  href={payLink}
                  className="flex items-center gap-1 rounded-md bg-signal px-3 py-1.5 text-xs font-medium text-white hover:bg-signal-600"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open UPI app
                </a>
              </div>
              <p className="mt-3 text-xs text-ink-600">{KYNEX_BILLING.supportNote}</p>
            </div>
          </div>
        ) : allowPay && canPay(invoice.status) && !isInr(invoice.currency) ? (
          <p className="mt-4 rounded-md border border-line bg-paper-100 px-3 py-2 text-sm text-ink-600 no-print">
            This invoice is not INR. International payment details will be added when that account is ready.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ViewInvoiceButton({
  invoice,
  allowPay,
  label = 'Invoice'
}: {
  invoice: PortalInvoice;
  allowPay?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="rounded-md border border-line px-2 py-1 text-xs font-medium text-ink-600 transition-base hover:bg-paper-100"
      >
        {label}
      </button>
      <InvoiceDialog invoice={invoice} open={open} onClose={() => setOpen(false)} allowPay={allowPay} />
    </>
  );
}
