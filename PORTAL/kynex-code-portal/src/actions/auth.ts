'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ActionState = { error?: string } | null;

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const redirectTo = String(formData.get('redirectTo') || '');

  if (!email || !password) return { error: 'Enter your email and password.' };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: 'Incorrect email or password.' };
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();

  revalidatePath('/', 'layout');

  if (redirectTo) redirect(redirectTo);
  redirect(profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') || '').trim();
  if (!email) return { error: 'Enter your email.' };

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
  });

  // Always report success, whether or not the email exists — avoids leaking
  // which addresses have accounts.
  if (error) {
    // eslint-disable-next-line no-console
    console.error('resetPasswordForEmail error', error.message);
  }
  return null;
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

  if (password.length < 8) return { error: 'Password must be at least 8 characters.' };
  if (password !== confirmPassword) return { error: 'Passwords do not match.' };

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect('/login');
}
