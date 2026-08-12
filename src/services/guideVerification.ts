import { doc, getDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PreCheckResult } from './guideVerificationCore';
import {
  normalizePhone,
  normalizeCertificateNumber,
  evaluatePreCheck,
} from './guideVerificationCore';

export { type PreCheckResult };

export async function runPreCheck(uid: string): Promise<PreCheckResult> {
  const profileRef = doc(db, 'guideProfiles', uid);
  const registrationRef = doc(db, 'guideRegistrations', uid);

  const [profileSnap, registrationSnap] = await Promise.all([
    getDoc(profileRef),
    getDoc(registrationRef),
  ]);

  const profile = profileSnap.exists() ? profileSnap.data() : null;
  const registration = registrationSnap.exists() ? registrationSnap.data() : null;

  const coreResult = evaluatePreCheck(profile, registration);
  if (coreResult.status === 'blocked') {
    return coreResult;
  }

  const flags = [...coreResult.flags];

  if (registration) {
    const normalizedPhone = normalizePhone((registration.phone as string) || '');
    if (normalizedPhone) {
      const phoneQuery = query(
        collection(db, 'guideRegistrations'),
        where('phone', '==', normalizedPhone)
      );
      const phoneSnapshot = await getDocs(phoneQuery);
      const duplicates = phoneSnapshot.docs.filter((item) => item.id !== uid);
      if (duplicates.length > 0) {
        flags.push('DUPLICATE_PHONE');
      }
    }

    const normalizedCertificate = normalizeCertificateNumber(
      (registration.certificateNumber as string) || ''
    );
    if (normalizedCertificate) {
      const certificateQuery = query(
        collection(db, 'guideRegistrations'),
        where('certificateNumber', '==', normalizedCertificate)
      );
      const certificateSnapshot = await getDocs(certificateQuery);
      const duplicates = certificateSnapshot.docs.filter(
        (item) => item.id !== uid
      );
      if (duplicates.length > 0) {
        flags.push('DUPLICATE_CERTIFICATE');
      }
    }
  }

  return {
    status: flags.length > 0 ? 'blocked' : 'ready',
    flags,
  };
}
