import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  try {
    return format(new Date(value), 'MMM d, yyyy');
  } catch {
    return value;
  }
}

export function formatMoney(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatBytes(bytes: number) {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let value = bytes;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  client_review: 'Client Review',
  completed: 'Completed',
  live: 'Live'
};

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  submitted: 'Submitted',
  in_progress: 'In Progress',
  waiting_for_client: 'Waiting for Client',
  completed: 'Completed'
};

export const REQUEST_CATEGORY_LABEL: Record<string, string> = {
  website_change: 'Website Change',
  bug_error: 'Bug / Error',
  content_update: 'Content Update',
  technical_support: 'Technical Support',
  other: 'Other'
};

export const FILE_CATEGORY_LABEL: Record<string, string> = {
  website_files: 'Website Files',
  images_assets: 'Images & Assets',
  documents: 'Documents',
  content: 'Content',
  other: 'Other'
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  paid: 'Paid',
  pending: 'Pending',
  overdue: 'Overdue'
};

export const AMC_STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  expiring_soon: 'Expiring Soon',
  expired: 'Expired',
  cancelled: 'Cancelled'
};
