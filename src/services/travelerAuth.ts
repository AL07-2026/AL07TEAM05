import { browserSessionPersistence, setPersistence, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';

const travelerUsersCollection = 'travelerUsers';

export type TravelerProfile = {
  ownerUid: string;
  displayName: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
};

export async function signUpTraveler(displayName: string, email: string, password: string, phone?: string): Promise<TravelerProfile> {
  await setPersistence(auth, browserSessionPersistence);
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const profile: TravelerProfile = {
    ownerUid: userCredential.user.uid,
    displayName,
    email: userCredential.user.email ?? email,
    phone,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await setDoc(doc(db, travelerUsersCollection, userCredential.user.uid), profile);
  return profile;
}

export async function signInTraveler(email: string, password: string): Promise<TravelerProfile> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const snapshot = await getDoc(doc(db, travelerUsersCollection, credential.user.uid));
  const data = (snapshot.data() as TravelerProfile | undefined) ?? { displayName: '', email, phone: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  return {
    ownerUid: credential.user.uid,
    displayName: data.displayName,
    email: data.email,
    phone: data.phone ?? '',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function getTravelerProfile(uid: string): Promise<TravelerProfile | null> {
  const snapshot = await getDoc(doc(db, travelerUsersCollection, uid));
  if (!snapshot.exists()) return null;
  const data = snapshot.data() as TravelerProfile;
  return { ...data, ownerUid: uid };
}

export async function updateTravelerProfile(uid: string, patch: Partial<Pick<TravelerProfile, 'displayName' | 'phone' | 'updatedAt'>>): Promise<void> {
  await setDoc(doc(db, travelerUsersCollection, uid), { ...patch, updatedAt: new Date().toISOString() }, { merge: true });
}

export function isEligibleTravelerUser(user: User | null): user is User {
  return Boolean(user && !user.isAnonymous);
}

export function signOutTraveler() {
  return signOut(auth);
}
