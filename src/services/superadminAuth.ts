import { browserSessionPersistence, setPersistence, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import { hasAdminAccess } from '@/services/adminAuth';
import type { AdminRole } from '@/types';

export const superAdminAccessDeniedMessage = 'Super Admin 권한이 없습니다.';

export function isSuperAdmin(data: unknown): data is { role: 'superadmin'; active: true; displayName?: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'role' in data &&
    'active' in data &&
    (data as Record<string, unknown>).role === 'superadmin' &&
    (data as Record<string, unknown>).active === true
  );
}

export function isOperationsAdmin(data: unknown): boolean {
  return hasAdminAccess(data) || isSuperAdmin(data);
}

export async function checkSuperAdminAccess(uid: string) {
  const snapshot = await getDoc(doc(db, 'adminUsers', uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  if (!isSuperAdmin(data)) return null;
  return {
    uid,
    displayName: typeof data.displayName === 'string' && data.displayName.trim() ? data.displayName : 'Super Admin',
    role: 'superadmin',
  };
}

export async function signInSuperAdmin(email: string, password: string) {
  await setPersistence(auth, browserSessionPersistence);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const access = await checkSuperAdminAccess(credential.user.uid);
  if (!access) {
    await signOut(auth);
    throw new Error(superAdminAccessDeniedMessage);
  }
  return access;
}

export async function getAdminUser(uid: string) {
  const snapshot = await getDoc(doc(db, 'adminUsers', uid));
  if (!snapshot.exists()) return null;
  return { uid, ...snapshot.data() };
}

export async function updateAdminUserRole(uid: string, role: AdminRole, active: boolean, actor: { uid: string; role: AdminRole }) {
  const snapshot = await getDoc(doc(db, 'adminUsers', uid));
  if (!snapshot.exists()) throw new Error('admin user not found');
  const current = snapshot.data();
  if (current.role === 'superadmin' && active === false) {
    throw new Error('superadmin을 비활성화할 수 없습니다.');
  }
  if (actor.uid === uid && role !== 'superadmin') {
    throw new Error('본인 권한은 변경할 수 없습니다.');
  }
  if (actor.uid === uid && active === false) {
    throw new Error('본인 계정은 비활성화할 수 없습니다.');
  }
  const superAdmins = await getDocs(query(collection(db, 'adminUsers'), where('role', '==', 'superadmin'), where('active', '==', true)));
  if (superAdmins.size <= 1 && role !== 'superadmin' && current.role === 'superadmin') {
    throw new Error('마지막 superadmin은 해제할 수 없습니다.');
  }
  await updateDoc(doc(db, 'adminUsers', uid), { role, active, updatedAt: serverTimestamp() });
}

export async function countActiveSuperAdmins() {
  const snapshot = await getDocs(query(collection(db, 'adminUsers'), where('role', '==', 'superadmin'), where('active', '==', true)));
  return snapshot.size;
}

export async function countActiveAdmins() {
  const snapshot = await getDocs(query(collection(db, 'adminUsers'), where('active', '==', true)));
  return snapshot.size;
}
