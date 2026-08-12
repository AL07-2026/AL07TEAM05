import { type ReactNode, useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2, LogOut, Menu, Sparkles, X } from 'lucide-react';

import { auth } from '@/lib/firebase';
import {
  getTravelerProfile,
  isEligibleTravelerUser,
  signOutTraveler,
  type TravelerProfile,
} from '@/services/travelerAuth';

type GateState =
  | { status: 'checking' }
  | { status: 'unauthenticated' }
  | { status: 'authorized'; traveler: TravelerProfile | { ownerUid: string; displayName: string; email: string; createdAt: string } };

function NavLink({ children, to }: { children: ReactNode; to: string }) {

  const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
  return (
    <Link
      className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
        active ? 'bg-coral-soft text-coral' : 'text-muted-foreground hover:bg-muted hover:text-ink'
      }`}
      to={to}
    >
      {children}
    </Link>
  );
}

export function TravelerLayout() {
  const navigate = useNavigate();

  const [gate, setGate] = useState<GateState>({ status: 'checking' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isEligibleTravelerUser(user)) {
        if (!ignore) setGate({ status: 'unauthenticated' });
        return;
      }
      void getTravelerProfile(user.uid).then((profile) => {
        if (!ignore) {
          setGate({
            status: 'authorized',
            traveler: profile ?? { ownerUid: user.uid, displayName: '', email: user.email ?? '', createdAt: new Date().toISOString() },
          });
        }
      });
    });
    return () => { ignore = true; unsubscribe(); };
  }, []);

  const handleSignOut = () => {
    void signOutTraveler().then(() => navigate('/traveler/login')).catch(() => navigate('/traveler/login'));
  };

  if (gate.status === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-slate-500">
        <Loader2 className="mr-2 size-5 animate-spin" />
        여행자 로그인을 확인하는 중입니다.
      </main>
    );
  }

  if (gate.status === 'unauthenticated') {
    return <Outlet />;
  }

  const travelerName = gate.traveler.displayName?.trim() || gate.traveler.email.split('@')[0];

  return (
    <div className="min-h-screen bg-background text-ink">
      <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
          <Link className="flex items-center gap-2 text-base font-bold tracking-tight" to="/traveler">
            <span className="flex size-8 items-center justify-center rounded-xl bg-coral text-white">
              <Sparkles className="size-4" />
            </span>
            TourMatch <span className="text-xs font-semibold text-coral">여행자</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-muted-foreground">
            <NavLink to="/traveler">대시보드</NavLink>
            <NavLink to="/traveler/my-requests">내 요청</NavLink>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-semibold text-ink sm:inline">{travelerName}님</span>
            <button
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-muted"
              onClick={handleSignOut}
              type="button"
            >
              <LogOut className="size-3.5" />
              로그아웃
            </button>
            <button
              className="rounded-lg p-2 text-slate-600 md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              type="button"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <nav className="border-t border-border px-4 pb-3 md:hidden">
            <div className="flex flex-col gap-1 pt-2">
              <NavLink to="/traveler">대시보드</NavLink>
              <NavLink to="/traveler/my-requests">내 요청</NavLink>
              <button
                className="flex items-center gap-2 rounded-full px-3 py-2 text-left text-sm font-semibold text-muted-foreground transition hover:bg-muted"
                onClick={handleSignOut}
                type="button"
              >
                <LogOut className="size-4" />
                로그아웃
              </button>
            </div>
          </nav>
        )}
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>2026 TourMatch. 여행자와 검증된 가이드를 더 선명하게 연결합니다.</p>
          <Link className="w-fit font-bold text-slate-700 underline decoration-slate-400 underline-offset-4 hover:text-ink" to="/">
            메인 안내 페이지
          </Link>
        </div>
      </footer>
    </div>
  );
}
