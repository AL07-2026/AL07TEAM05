import { useState } from 'react';

import { signInAdmin, type AdminAccess } from '@/services/adminAuth';
import type { AdminRole } from '@/types';

type SuperadminAccess = AdminAccess & { role: AdminRole };

export function SuperadminLoginPage({ error, onSignedIn }: { error?: string; onSignedIn: (access: SuperadminAccess) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState(error ?? '');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError('');
    setIsSubmitting(true);
    try {
      const access = await signInAdmin(email, password);
      if (access.role !== 'superadmin') {
        throw new Error('Super Admin 권한이 없습니다.');
      }
      onSignedIn({ ...access, role: 'superadmin' });
    } catch (caughtError: unknown) {
      setLocalError(caughtError instanceof Error ? caughtError.message : '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,.08)] sm:p-8">
        <p className="text-sm font-bold text-coral">SUPERADMIN</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">Super Admin 로그인</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">플랫폼 관리 기능은 Super Admin만 사용할 수 있습니다.</p>
        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-bold">
            이메일
            <input className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm font-bold">
            비밀번호
            <input className="mt-2 h-12 w-full rounded-xl border border-border bg-white px-4 text-sm outline-none focus:border-coral focus:ring-2 focus:ring-coral/20" required type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {localError ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{localError}</p> : null}
          <button className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-coral text-sm font-bold text-coral-foreground transition hover:bg-coral/90 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
            {isSubmitting && <span className="inline-block size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            로그인
          </button>
        </form>
      </section>
    </main>
  );
}
