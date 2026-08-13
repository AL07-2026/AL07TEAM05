import { doc, getDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PreCheckResult } from './guideVerificationCore';
import {
  normalizePhone,
  normalizeCertificateNumber,
  evaluatePreCheck,
} from './guideVerificationCore';

export { type PreCheckResult };

export function humanizeFlag(flag: string): string {
  const map: Record<string, string> = {
    MISSING_REQUIRED_FIELD: '필수 정보가 누락되었습니다.',
    DUPLICATE_PHONE: '이미 등록된 연락처와 중복됩니다.',
    DUPLICATE_CERTIFICATE: '이미 등록된 자격증 번호와 중복됩니다.',
    PRE_CHECK_ERROR: '사전 점검 중 오류가 발생했습니다.',
    MISSING_REGISTRATION: '필수 등록 정보가 누락되었습니다.',
    OWNER_UID_MISMATCH: '프로필과 등록 정보의 소유자가 일치하지 않습니다.',
  };
  return map[flag] ?? '추가 확인이 필요한 항목이 있습니다.';
}

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
