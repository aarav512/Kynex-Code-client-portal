export const KYNEX_BILLING = {
  brand: 'Kynex Code',
  legalName: 'Kynex Code',
  tagline: 'Software, websites and annual maintenance',
  location: 'India',
  upiId: '97119600093@ptyes',
  payeeName: 'Aarav Garg Minor',
  qrSrc: '/payments/upi-inr.jpg',
  supportNote: 'After you pay, this invoice stays pending until Kynex Code confirms the transfer.'
};

export type InvoiceKind = 'Tax Invoice' | 'AMC Invoice';

export type PortalInvoice = {
  id: string;
  kind: InvoiceKind;
  number: string;
  description: string;
  amount: number;
  currency?: string | null;
  status: string;
  issuedOn?: string | null;
  dueOn?: string | null;
  paidOn?: string | null;
  billToName: string;
  billToEmail?: string | null;
  periodLabel?: string | null;
};

export function isInr(currency?: string | null) {
  const value = (currency || 'INR').toUpperCase();
  return value === 'INR' || value === 'IN' || value === 'INDIA' || value === 'RS' || value === '₹';
}

export function canPay(status: string) {
  return status === 'pending' || status === 'unpaid' || status === 'overdue';
}

export function makeInvoiceNo(prefix: 'INV' | 'AMC', id: string, existing?: string | null) {
  if (existing) return existing;
  return `${prefix}-${id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export function upiLink(amount: number, note: string) {
  const tn = note.replace(/[^\w\s-]/g, '').slice(0, 40);
  return `upi://pay?pa=${encodeURIComponent(KYNEX_BILLING.upiId)}&pn=${encodeURIComponent(KYNEX_BILLING.payeeName)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(tn)}`;
}

export function upiQr(amount: number, note: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&ecc=M&data=${encodeURIComponent(upiLink(amount, note))}`;
}
