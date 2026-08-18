'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  MessageSquare,
  CreditCard,
  ShieldCheck,
  Users,
  Settings,
  User
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const clientNav: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/files', label: 'Files', icon: FileText },
  { href: '/requests', label: 'Requests', icon: MessageSquare },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/amc', label: 'AMC', icon: ShieldCheck },
  { href: '/profile', label: 'Profile', icon: User }
];

const adminNav: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { href: '/admin/files', label: 'Files', icon: FileText },
  { href: '/admin/requests', label: 'Requests', icon: MessageSquare },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/amc', label: 'AMC', icon: ShieldCheck },
  { href: '/admin/settings', label: 'Settings', icon: Settings }
];

export function Sidebar({ role }: { role: 'admin' | 'client' }) {
  const pathname = usePathname();
  const items = role === 'admin' ? adminNav : clientNav;

  return (
    <aside className="hidden w-60 flex-col border-r border-line bg-ink-950 lg:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-signal font-display text-sm font-bold text-white">
          K
        </div>
        <span className="font-display text-sm font-semibold text-white">
          Kynex Code
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/dashboard' &&
              item.href !== '/admin/dashboard' &&
              pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-base',
                active
                  ? 'bg-ink-800 font-medium text-white'
                  : 'text-ink-600 hover:bg-ink-900 hover:text-paper'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-ink-800 px-6 py-4">
        <p className="text-xs text-ink-600">
          {role === 'admin' ? 'Admin Portal' : 'Client Portal'}
        </p>
      </div>
    </aside>
  );
}
