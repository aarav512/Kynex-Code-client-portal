import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';


export const runtime = 'edge';

export default async function RootPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.role === 'admin') {
      redirect('/admin/dashboard');
    } else {
      redirect('/dashboard');
    }
  } catch {
    redirect('/login');
  }
}
