export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-ink-950 p-12 text-paper md:flex">
        <div className="flex items-center gap-2.5">
          <svg width="24" height="24" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M2 2L11 11L2 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
            <path d="M11 2L20 11L11 20" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" opacity="0.35" />
          </svg>
          <p className="font-display text-base font-medium">Kynex Code</p>
        </div>
        <div className="max-w-sm">
          <p className="font-display text-3xl font-medium leading-tight">
            One workspace for your project, files, and everything in between.
          </p>
          <p className="mt-4 text-sm text-paper/55">
            Sign in to see project status, download files, raise a request, and check your invoices — all in one
            place.
          </p>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-paper/35">Client Portal</p>
      </div>
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
