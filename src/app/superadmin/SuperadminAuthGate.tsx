import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { auth } from '@/lib/firebase';
import { adminAccessDeniedMessage, checkAdminAccess, isEligibleAdminUser, signOutAdmin, type AdminAccess } from '@/services/adminAuth';
import { SuperadminDashboardPage } from '@/app/superadmin/SuperadminPage';
import { SuperadminLoginPage } from '@/app/superadmin/SuperadminLoginPage';
import type { AdminRole } from '@/types';

type GateState =
  | { status: 'checking' }
  | { status: 'unauthenticated'; error?: string }
  | { status: 'authorized'; admin: AdminAccess & { role: AdminRole } };

export function SuperadminAuthGate() {
  const [gate, setGate] = useState<GateState>({ status: 'checking' });

  useEffect(() => {
    let ignore = false;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!isEligibleAdminUser(user)) {
        setGate({ status: 'unauthenticated' });
        return;
      }

      setGate({ status: 'checking' });
      void checkAdminAccess(user.uid)
        .then((access) => {
          if (ignore) return;
          if (!access) {
            void signOutAdmin();
            setGate({ status: 'unauthenticated', error: adminAccessDeniedMessage });
            return;
          }

          if (access.role !== 'superadmin') {
            void signOutAdmin();
            setGate({ status: 'unauthenticated', error: 'Super Admin 권한이 없습니다.' });
            return;
          }

          setGate({ status: 'authorized', admin: access });
        })
        .catch(() => {
          if (ignore) return;
          void signOutAdmin();
          setGate({ status: 'unauthenticated', error: adminAccessDeniedMessage });
        });
    });

    return () => {
      ignore = true;
      unsubscribe();
    };
  }, []);

  if (gate.status === 'checking') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] text-slate-500">
        <Loader2 className="mr-2 size-5 animate-spin" />
        관리자 권한을 확인하는 중입니다.
      </main>
    );
  }

  if (gate.status === 'unauthenticated') {
    return <SuperadminLoginPage error={gate.error} onSignedIn={(access) => setGate({ status: 'authorized', admin: access })} />;
  }

  return <SuperadminDashboardPage onSignOut={signOutAdmin} />;
}
