import { cn } from '@/lib/utils';

// Minimal hand-rolled table shell — hairline rows, mono headers, no zebra
// striping or shadow. Reused across every admin/client list view so the
// data vocabulary of the app stays consistent.
export function DataTable({
  columns,
  children
}: {
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="kx-panel overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line">
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left font-mono text-[11px] font-medium uppercase tracking-wide text-ink-600"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function DataRow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tr className={cn('border-b border-line last:border-0 hover:bg-ink-950/[0.02]', className)}>{children}</tr>;
}

export function DataCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3.5 align-middle text-ink-950', className)}>{children}</td>;
}
