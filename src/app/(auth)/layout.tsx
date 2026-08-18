import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign in — Kynex Code'
};

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-signal font-display text-xl font-bold text-white">
            K
          </div>
          <h1 className="font-display text-xl font-semibold text-white">
            Kynex Code
          </h1>
          <p className="mt-1 text-sm text-ink-600">Client Portal</p>
        </div>
        <div className="rounded-lg border border-ink-800 bg-ink-900 p-6 animate-fade-in-up">
          {children}
        </div>
      </div>
    </div>
  );
}
