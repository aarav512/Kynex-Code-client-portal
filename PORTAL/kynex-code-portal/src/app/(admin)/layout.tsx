import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar, type NavItem } from '@/components/nav/Sidebar';
import { MobileNav } from '@/components/nav/MobileNav';
import { Topbar } from '@/components/nav/Topbar';

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Clients', href: '/admin/clients' },
  { label: 'Projects', href: '/admin/projects' },
  { label: 'Files', href: '/admin/files' },
  { label: 'Requests', href: '/admin/requests' },
  { label: 'Payments', href: '/admin/payments' },
  { label: 'AMC', href: '/admin/amc' },
  { label: 'Settings', href: '/admin/settings' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') redirect('/dashboard');

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar items={NAV_ITEMS} roleLabel="Admin" identityLabel={profile.full_name} />
      <MobileNav items={NAV_ITEMS} />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-4 py-8 md:px-10 md:py-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
