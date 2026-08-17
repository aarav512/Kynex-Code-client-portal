'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ClientProfilePage() {
  const [profile, setProfile] = useState<{ full_name: string; email: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
        .then(({ data }) => { if (data) setProfile(data); });
    });
  }, []);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setMsg(''); setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) setError(err.message);
    else { setMsg('Password updated.'); setPassword(''); setConfirmPassword(''); }
  }

  return (
    <div className="max-w-md">
      <PageHeader eyebrow="Profile" title="Your account" />
      <div className="kx-panel p-6 mb-6">
        <p className="kx-eyebrow mb-4">Account details</p>
        {profile ? (
          <div className="space-y-3">
            <div>
              <p className="kx-eyebrow mb-1">Name</p>
              <p className="text-sm text-ink-950">{profile.full_name}</p>
            </div>
            <div>
              <p className="kx-eyebrow mb-1">Email</p>
              <p className="text-sm text-ink-950">{profile.email}</p>
            </div>
          </div>
        ) : <p className="text-sm text-ink-600">Loading…</p>}
      </div>
      <div className="kx-panel p-6">
        <p className="kx-eyebrow mb-4">Change password</p>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="kx-label" htmlFor="pw">New password</label>
            <input className="kx-input" id="pw" type="password" minLength={8} value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="kx-label" htmlFor="pw2">Confirm new password</label>
            <input className="kx-input" id="pw2" type="password" minLength={8} value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-rust">{error}</p>}
          {msg && <p className="text-sm text-moss">{msg}</p>}
          <button type="submit" className="kx-btn-primary">Update password</button>
        </form>
      </div>
    </div>
  );
}
