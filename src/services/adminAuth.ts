import { browserSessionPersistence, setPersistence, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import type { AdminRole, PlatformAuditLog } from '@/types';

const adminUsersCollection = 'adminUsers';
const auditLogsCollection = 'platformAuditLogs';

export type AdminAccess = {
  uid: string;
  displayName: string;
  role: AdminRole;
};

export const adminAccessDeniedMessage = '관리자 권한을 확인할 수 없습니다.';

export function hasAdminAccess(data: unknown): data is { role: AdminRole; active: true; displayName?: string } {
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

export function isOperationsAdminRole(role: unknown): role is AdminRole {
  return role === 'admin';
}

export async function checkAdminAccess(uid: string): Promise<AdminAccess | null> {
  const snapshot = await getDoc(doc(db, adminUsersCollection, uid));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  if (!hasAdminAccess(data)) return null;

  return {
    uid,
    displayName: typeof data.displayName === 'string' && data.displayName.trim() ? data.displayName : '운영 관리자',
    role: 'admin',
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

export async function getCurrentAdminAccess(): Promise<AdminAccess | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return checkAdminAccess(user.uid);
}

export async function getAdminUsers(): Promise<{ uid: string; email: string; displayName: string; role: AdminRole; active: boolean; createdAt: string }[]> {
  const snapshot = await getDocs(collection(db, adminUsersCollection));
  return snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return {
      uid: doc.id,
      email: typeof data.email === 'string' ? data.email : '',
      displayName: typeof data.displayName === 'string' && data.displayName.trim() ? data.displayName : '운영 관리자',
      role: 'admin',
      active: Boolean(data.active),
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    };
  });
}

export async function updateAdminUserRole(uid: string, role: AdminRole) {
  const reference = doc(db, adminUsersCollection, uid);
  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) {
    throw new Error('ADMIN_NOT_FOUND');
  }

  const updatedAt = new Date().toISOString();
  await updateDoc(reference, { role, updatedAt });
}

export async function updateAdminUserActive(uid: string, active: boolean) {
  const reference = doc(db, adminUsersCollection, uid);
  const snapshot = await getDoc(reference);
  if (!snapshot.exists()) {
    throw new Error('ADMIN_NOT_FOUND');
  }

  const data = snapshot.data() as Record<string, unknown>;
  const currentActive = Boolean(data.active);
  if (currentActive === active) return;

  const updatedAt = new Date().toISOString();
  await updateDoc(reference, { active, updatedAt });
}

export async function updateAdminRole(uid: string, role: AdminRole) {
  await updateAdminUserRole(uid, role);
}

export async function createAuditLog(log: PlatformAuditLog) {
  await addDoc(collection(db, auditLogsCollection), {
    ...log,
    createdAt: serverTimestamp(),
  });
}

function coerceString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export async function getAuditLogs(options?: { limitCount?: number }) {
  const limitCount = typeof options?.limitCount === 'number' ? options.limitCount : 50;
  const q = query(collection(db, auditLogsCollection), orderBy('createdAt', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    const actorRole = typeof data.actorRole === 'string' && data.actorRole === 'admin' ? 'admin' : 'admin';
    return {
      id: doc.id,
      actorUid: coerceString(data.actorUid),
      actorRole: actorRole,
      action: coerceString(data.action),
      targetType: coerceString(data.targetType),
      targetId: coerceString(data.targetId),
      before: typeof data.before === 'object' && data.before !== null ? (data.before as Record<string, unknown>) : undefined,
      after: typeof data.after === 'object' && data.after !== null ? (data.after as Record<string, unknown>) : undefined,
      createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    };
  });
}

export function listenAuditLogs(onUpdate: (logs: PlatformAuditLog[]) => void, limitCount = 50) {
  const q = query(collection(db, auditLogsCollection), orderBy('createdAt', 'desc'), limit(limitCount));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const actorRole = typeof data.actorRole === 'string' && data.actorRole === 'admin' ? 'admin' : 'admin';
      return {
        id: doc.id,
        actorUid: coerceString(data.actorUid),
        actorRole: actorRole,
        action: coerceString(data.action),
        targetType: coerceString(data.targetType),
        targetId: coerceString(data.targetId),
        before: typeof data.before === 'object' && data.before !== null ? (data.before as Record<string, unknown>) : undefined,
        after: typeof data.after === 'object' && data.after !== null ? (data.after as Record<string, unknown>) : undefined,
        createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
      };
    });
    onUpdate(logs as PlatformAuditLog[]);
  });
}

export async function countActiveAdmins(): Promise<number> {
  const q = query(collection(db, adminUsersCollection), where('active', '==', true), where('role', '==', 'admin'), limit(100));
  const snapshot = await getDocs(q);
  return snapshot.size;
}
