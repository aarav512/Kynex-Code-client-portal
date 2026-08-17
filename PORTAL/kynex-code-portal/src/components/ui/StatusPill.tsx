import { cn } from '@/lib/utils';

// One consistent status-pill treatment used everywhere in the app —
// project status, request status, payment status, AMC status. Color is the
// only thing that changes; shape and type stay identical, so the eye learns
// the vocabulary once. Mono type reinforces "this is data," not prose.
type Tone = 'neutral' | 'signal' | 'moss' | 'rust' | 'amber';

const TONE_CLASSES: Record<Tone, string> = {
  neutral: 'bg-ink-950/5 text-ink-700 border-ink-950/10',
  signal: 'bg-signal-100 text-signal-600 border-signal/20',
  moss: 'bg-moss-100 text-moss border-moss/20',
  rust: 'bg-rust-100 text-rust border-rust/20',
  amber: 'bg-amber-100 text-amber border-amber/20'
};

export function StatusPill({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium tracking-wide',
        TONE_CLASSES[tone]
      )}
    >
      {label}
    </span>
  );
}

export const PROJECT_STATUS_TONE: Record<string, Tone> = {
  not_started: 'neutral',
  in_progress: 'signal',
  client_review: 'amber',
  completed: 'moss',
  live: 'moss'
};

export const REQUEST_STATUS_TONE: Record<string, Tone> = {
  submitted: 'neutral',
  in_progress: 'signal',
  waiting_for_client: 'amber',
  completed: 'moss'
};

export const PAYMENT_STATUS_TONE: Record<string, Tone> = {
  paid: 'moss',
  pending: 'amber',
  overdue: 'rust'
};

export const AMC_STATUS_TONE: Record<string, Tone> = {
  active: 'moss',
  expiring_soon: 'amber',
  expired: 'rust',
  cancelled: 'neutral'
};
