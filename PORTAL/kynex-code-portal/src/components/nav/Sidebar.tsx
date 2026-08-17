'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export type NavItem = { label: string; href: string };

const KYNEX_MARK = (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M2 2L11 11L2 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
    <path d="M11 2L20 11L11 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" opacity="0.35" />
  </svg>
);

export function Sidebar({
  items,
  roleLabel,
  identityLabel
}: {
  items: NavItem[];
  roleLabel: string;
  identityLabel: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-ink-950 text-paper md:flex">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-6 py-6">
        <span className="text-paper">{KYNEX_MARK}</span>
        <div>
          <p className="font-display text-sm font-medium leading-none text-paper">Kynex Code</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-paper/45">{roleLabel}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded px-3 py-2 text-sm transition-colors',
                active ? 'bg-white/10 text-paper font-medium' : 'text-paper/60 hover:bg-white/5 hover:text-paper'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="truncate text-xs text-paper/45">{identityLabel}</p>
      </div>
    </aside>
  );
}
