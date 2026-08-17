export function PageHeader({
  eyebrow,
  title,
  action
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
      <div>
        <p className="kx-eyebrow mb-1.5">{eyebrow}</p>
        <h1 className="font-display text-2xl font-medium text-ink-950">{title}</h1>
      </div>
      {action}
    </div>
  );
}
