import { signOut } from '@/actions/auth';

export function Topbar({ heading }: { heading?: string }) {
  return (
    <header className="flex items-center justify-end border-b border-line bg-paper px-6 py-3 md:px-10">
      {heading && <p className="mr-auto font-mono text-xs uppercase tracking-wide text-ink-600">{heading}</p>}
      <form action={signOut}>
        <button type="submit" className="kx-btn-ghost">
          Sign out
        </button>
      </form>
    </header>
  );
}
