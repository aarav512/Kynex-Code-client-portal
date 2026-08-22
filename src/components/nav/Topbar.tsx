'use client';

import { LogOut } from 'lucide-react';
import { getBrowserSupabase } from '@/lib/supabase/client';

export function Topbar({
  userName,
  userEmail,
  role
}: {
  userName: string;
  userEmail: string;
  role: 'admin' | 'client';
}) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-line bg-paper/80 px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        <div className="lg:hidden">
          <MobileNavButton />
        </div>
        <div>
          <p className="font-display text-sm font-semibold text-ink-900">
            {userName}
          </p>
          <p className="text-xs text-ink-600">{userEmail}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden rounded-md border border-line bg-paper-100 px-2 py-0.5 text-xs font-medium text-ink-600 sm:inline">
          {role === 'admin' ? 'Administrator' : 'Client'}
        </span>
        <button
          type="button"
          onClick={async () => {
            await getBrowserSupabase().auth.signOut();
            window.location.assign('/login');
          }}
          className="flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm text-ink-600 transition-base hover:bg-paper-100 hover:text-ink-900"
        >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
      </div>
    </header>
  );
}

function MobileNavButton() {
  return (
    <label className="flex cursor-pointer items-center">
      <input type="checkbox" className="peer sr-only" />
      <div className="flex h-8 w-8 items-center justify-center rounded-md border border-line">
        <svg className="h-4 w-4 text-ink-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </div>
      <div className="fixed inset-0 z-40 hidden bg-ink-950/80 peer-checked:block lg:hidden">
        <MobileNavContent />
      </div>
    </label>
  );
}

function MobileNavContent() {
  return (
    <div className="flex h-full w-60 flex-col border-r border-ink-800 bg-ink-950">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-signal font-display text-sm font-bold text-white">
          K
        </div>
        <span className="font-display text-sm font-semibold text-white">Kynex Code</span>
      </div>
    </div>
  );
}
