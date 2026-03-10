'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { supabaseClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.replace('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 rounded-3xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl shadow-emerald-500/20"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.5em] text-emerald-400">Welcome back</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Sign in</h1>
          <p className="text-sm text-zinc-400">Use your email and password to pick up where you left off.</p>
        </div>
        <div className="space-y-4">
          <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
            />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
            />
          </label>
        </div>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:pointer-events-none disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="text-center text-xs text-zinc-400">
          New here?{' '}
          <Link href="/register" className="font-semibold text-white underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
