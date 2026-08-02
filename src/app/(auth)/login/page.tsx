'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleCredentialsSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) setError('Invalid email or password.');
    else window.location.href = '/boards';
  }

  return (
    <main className="grid-paper flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-8">
        <h1 className="font-display text-xl text-ink">Sign in to Relay</h1>

        <button
          onClick={() => signIn('github', { callbackUrl: '/boards' })}
          className="mt-6 w-full rounded-card border border-line py-2.5 text-sm text-ink transition hover:border-teal/50"
        >
          Continue with GitHub
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="font-mono text-[10px] text-muted">OR</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={handleCredentialsSignIn} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-card border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="rounded-card border border-line bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted"
          />
          {error && <p className="text-xs text-urgent">{error}</p>}
          <button
            type="submit"
            className="mt-1 rounded-card bg-amber py-2.5 text-sm font-medium text-bg transition hover:bg-amber/90"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
