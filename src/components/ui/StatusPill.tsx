import { cn } from '@/lib/utils';

const styles: Record<string, string> = {
  // Project
  planning: 'bg-paper-100 text-ink-600 border-line',
  in_progress: 'bg-signal-100 text-signal-600 border-signal-100',
  review: 'bg-amber-100 text-amber border-amber-100',
  completed: 'bg-moss-100 text-moss border-moss-100',
  on_hold: 'bg-paper-200 text-ink-600 border-line',
  // Request
  open: 'bg-signal-100 text-signal-600 border-signal-100',
  in_progress: 'bg-amber-100 text-amber border-amber-100',
  resolved: 'bg-moss-100 text-moss border-moss-100',
  closed: 'bg-paper-200 text-ink-600 border-line',
  // Payment
  pending: 'bg-amber-100 text-amber border-amber-100',
  paid: 'bg-moss-100 text-moss border-moss-100',
  overdue: 'bg-rust-100 text-rust border-rust-100',
  cancelled: 'bg-paper-200 text-ink-600 border-line',
  // AMC
  active: 'bg-moss-100 text-moss border-moss-100',
  expired: 'bg-rust-100 text-rust border-rust-100',
  cancelled: 'bg-paper-200 text-ink-600 border-line',
  // Client
  active: 'bg-moss-100 text-moss border-moss-100',
  inactive: 'bg-paper-200 text-ink-600 border-line',
  suspended: 'bg-rust-100 text-rust border-rust-100'
};

const labels: Record<string, string> = {
  planning: 'Planning',
  in_progress: 'In Progress',
  review: 'In Review',
  completed: 'Completed',
  on_hold: 'On Hold',
  open: 'Open',
  resolved: 'Resolved',
  closed: 'Closed',
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
  active: 'Active',
  inactive: 'Inactive',
  expired: 'Expired',
  suspended: 'Suspended'
};

export function StatusPill({ status }: { status: string }) {
  const style = styles[status] ?? 'bg-paper-100 text-ink-600 border-line';
  const label = labels[status] ?? status;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize',
        style
      )}
    >
      {label}
    </span>
  );
}
