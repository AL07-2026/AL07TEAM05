import { useState, type FormEvent } from 'react';
import { Loader2, LockKeyhole, Sparkles } from 'lucide-react';

import { adminAccessDeniedMessage, signInAdmin, type AdminAccess } from '@/services/adminAuth';

type AdminLoginPageProps = {
  error?: string;
  onSignedIn: (access: AdminAccess) => void;
};

const loginErrorMessage = '관리자 계정 정보를 확인해 주세요.';

export function AdminLoginPage({ error, onSignedIn }: AdminLoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    void signInAdmin(email, password)
      .then(onSignedIn)
      .catch((caughtError) => {
        setSubmitError(caughtError instanceof Error && caughtError.message === adminAccessDeniedMessage ? adminAccessDeniedMessage : loginErrorMessage);
      })
      .finally(() => setIsSubmitting(false));
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-4 py-12 text-slate-900">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,.08)] sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-rose-500 text-white">
            <Sparkles className="size-5" />
          </span>
          <div>
            <p className="text-lg font-bold tracking-tight">TourMatch Admin</p>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-slate-400">Secure Access</p>
          </div>
        </div>
        <div className="mt-8">
          <h1 className="text-2xl font-bold tracking-tight">관리자 로그인</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">승인된 관리자 계정으로만 매칭 요청을 확인할 수 있습니다.</p>
        </div>
        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-700">
            이메일
            <input
              autoComplete="email"
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-50"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            비밀번호
            <input
              autoComplete="current-password"
              className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-50"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {(submitError || error) && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{submitError || error}</p>}
          <button
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
            로그인
          </button>
        </form>
      </section>
    </main>
  );
}
