'use client';

import { formatDate, formatMoney } from '@/lib/utils';
import { KYNEX_BILLING, isInr, type PortalInvoice } from '@/lib/billing';

export function InvoiceSheet({ invoice }: { invoice: PortalInvoice }) {
  const paid = invoice.status === 'paid';
  const currency = isInr(invoice.currency) ? 'INR' : invoice.currency || 'INR';

  return (
    <div className="invoice-print relative overflow-hidden rounded-lg border border-line bg-white p-8 text-ink-900">
      <div
        className={`pointer-events-none absolute right-8 top-16 rotate-12 rounded border-2 px-4 py-1 text-sm font-semibold uppercase tracking-widest opacity-80 ${
          paid ? 'border-moss text-moss' : 'border-amber text-amber'
        }`}
      >
        {paid ? 'Paid' : 'Due'}
      </div>
      <div className="flex items-start justify-between gap-6 border-b border-line pb-6">
        <div>
          <p className="font-display text-2xl font-semibold tracking-tight">{KYNEX_BILLING.brand}</p>
          <p className="mt-1 text-sm text-ink-600">{KYNEX_BILLING.tagline}</p>
          <p className="text-xs text-ink-600">{KYNEX_BILLING.location}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-600">{invoice.kind}</p>
          <p className="mt-1 font-display text-xl font-semibold">{invoice.number}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-ink-600">Bill to</p>
          <p className="mt-1 font-medium">{invoice.billToName || 'Client'}</p>
          {invoice.billToEmail ? <p className="text-sm text-ink-600">{invoice.billToEmail}</p> : null}
        </div>
        <div className="sm:text-right">
          <p className="text-sm"><span className="text-ink-600">Issued</span> · {formatDate(invoice.issuedOn)}</p>
          <p className="text-sm"><span className="text-ink-600">Due</span> · {formatDate(invoice.dueOn)}</p>
          {invoice.paidOn ? <p className="text-sm"><span className="text-ink-600">Paid</span> · {formatDate(invoice.paidOn)}</p> : null}
          {invoice.periodLabel ? <p className="text-sm"><span className="text-ink-600">Period</span> · {invoice.periodLabel}</p> : null}
        </div>
      </div>
      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-600">
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-line">
            <td className="py-3">{invoice.description}</td>
            <td className="py-3 text-right font-medium">{formatMoney(invoice.amount, currency)}</td>
          </tr>
        </tbody>
      </table>
      <div className="mt-4 flex justify-end">
        <div className="min-w-[220px] rounded-md bg-paper px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-600">Total payable</span>
            <span className="font-display text-lg font-semibold">{formatMoney(invoice.amount, currency)}</span>
          </div>
          <p className="mt-1 text-xs text-ink-600">{currency === 'INR' ? 'Indian Rupees (INR)' : currency}</p>
        </div>
      </div>
      {currency === 'INR' ? (
        <div className="mt-8 border-t border-line pt-4 text-xs text-ink-600">
          <p className="font-medium text-ink-900">Pay in India (UPI)</p>
          <p className="mt-1">
            UPI ID: <span className="font-mono text-ink-900">{KYNEX_BILLING.upiId}</span>
            {' · '}Payee: {KYNEX_BILLING.payeeName}
          </p>
          <p className="mt-1">{KYNEX_BILLING.supportNote}</p>
        </div>
      ) : (
        <p className="mt-8 border-t border-line pt-4 text-xs text-ink-600">
          International settlement will be added once the overseas account is connected.
        </p>
      )}
      <p className="mt-6 text-[11px] text-ink-600">Issued by {KYNEX_BILLING.legalName}. Keep this invoice for your records.</p>
    </div>
  );
}
