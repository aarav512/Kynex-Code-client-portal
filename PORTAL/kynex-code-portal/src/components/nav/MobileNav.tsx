'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavItem } from './Sidebar';

export function MobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="border-b border-line bg-ink-950 text-paper md:hidden">
      <div className="flex items-center justify-between px-4 py-3.5">
        <p className="font-display text-sm font-medium">Kynex Code</p>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded px-2 py-1 text-xs font-mono uppercase tracking-wide text-paper/70"
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
      {open && (
        <nav className="space-y-0.5 border-t border-white/10 px-3 pb-3 pt-2">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'block rounded px-3 py-2 text-sm',
                  active ? 'bg-white/10 font-medium text-paper' : 'text-paper/60'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
