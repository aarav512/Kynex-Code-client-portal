'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signInAction(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const next = String(formData.get('redirect') || '');

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/', 'layout');

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?error=' + encodeURIComponent('Signed in, but the session cookie was not saved. Try again.'));
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role === 'admin') {
    redirect('/admin/dashboard');
  }

  if (next.startsWith('/') && !next.startsWith('//')) {
    redirect(next);
  }

  redirect('/dashboard');
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
