import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/nav/Sidebar';
import { Topbar } from '@/components/nav/Topbar';

export default async function ClientLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) redirect('/login');
  if (profile.role === 'admin') redirect('/admin/dashboard');

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role="client" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          userName={profile.full_name}
          userEmail={profile.email}
          role="client"
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
