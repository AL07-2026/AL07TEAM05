import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { AdminPage } from '@/app/AdminPage';
import { AdminLoginPage } from '@/app/admin/AdminLoginPage';
import { auth } from '@/lib/firebase';
import { adminAccessDeniedMessage, checkAdminAccess, isEligibleAdminUser, signOutAdmin, type AdminAccess } from '@/services/adminAuth';

type GateState =
  | { status: 'checking' }
  | { status: 'unauthenticated'; error?: string }
  | { status: 'authorized'; admin: AdminAccess };

export function AdminAuthGate() {
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
          if (access) {
            setGate({ status: 'authorized', admin: access });
            return;
          }

          void signOutAdmin();
          setGate({ status: 'unauthenticated', error: adminAccessDeniedMessage });
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
    return <AdminLoginPage error={gate.error} onSignedIn={(admin) => setGate({ status: 'authorized', admin })} />;
  }

  return <AdminPage adminDisplayName={gate.admin.displayName} onSignOut={signOutAdmin} />;
}
