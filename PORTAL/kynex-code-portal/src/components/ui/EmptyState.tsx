export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="kx-panel flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="font-display text-base font-medium text-ink-950">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-600">{description}</p>}
      {action}
    </div>
  );
}
