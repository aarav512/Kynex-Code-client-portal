import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar, type NavItem } from '@/components/nav/Sidebar';
import { MobileNav } from '@/components/nav/MobileNav';
import { Topbar } from '@/components/nav/Topbar';

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Projects', href: '/projects' },
  { label: 'Files', href: '/files' },
  { label: 'Requests', href: '/requests' },
  { label: 'Payments', href: '/payments' },
  { label: 'AMC', href: '/amc' },
  { label: 'Profile', href: '/profile' }
];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email, client_id')
    .eq('id', user.id)
    .single();

  // Defense in depth: even though middleware also redirects on role
  // mismatch, this Server Component checks again before rendering anything —
  // route protection should never rely on a single layer.
  if (!profile || profile.role !== 'client') redirect('/admin/dashboard');

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar items={NAV_ITEMS} roleLabel="Client Workspace" identityLabel={profile.full_name} />
      <MobileNav items={NAV_ITEMS} />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-8 md:px-10 md:py-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
