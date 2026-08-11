import { browserSessionPersistence, setPersistence, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';

const adminUsersCollection = 'adminUsers';

export type AdminAccess = {
  uid: string;
  displayName: string;
};

export const adminAccessDeniedMessage = '관리자 권한을 확인할 수 없습니다.';

export function hasAdminAccess(data: unknown): data is { role: 'admin'; active: true; displayName?: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'role' in data &&
    'active' in data &&
    data.role === 'admin' &&
    data.active === true
  );
}

export function isEligibleAdminUser(user: User | null): user is User {
  return Boolean(user && !user.isAnonymous);
}

export async function checkAdminAccess(uid: string): Promise<AdminAccess | null> {
  const snapshot = await getDoc(doc(db, adminUsersCollection, uid));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  if (!hasAdminAccess(data)) return null;

  return {
    uid,
    displayName: typeof data.displayName === 'string' && data.displayName.trim() ? data.displayName : '운영 관리자',
  };
}

export async function signInAdmin(email: string, password: string) {
  await setPersistence(auth, browserSessionPersistence);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const access = await checkAdminAccess(credential.user.uid);

  if (!access) {
    await signOut(auth);
    throw new Error(adminAccessDeniedMessage);
  }

  return access;
}

export function signOutAdmin() {
  return signOut(auth);
}
