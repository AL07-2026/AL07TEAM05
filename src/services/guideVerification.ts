import { doc, getDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PublicGuideProfile, GuideVerificationReview } from '@/types';

export type PreCheckResult = {
  status: 'ready' | 'blocked';
  flags: string[];
};

function normalizePhone(phone: string) {
  return phone.replace(/[^0-9]/g, '');
}

function normalizeCertificateNumber(value: string) {
  return value.trim().toUpperCase();
}

export async function runPreCheck(uid: string): Promise<PreCheckResult> {
  const flags: string[] = [];
  const profileRef = doc(db, 'guideProfiles', uid);
  const registrationRef = doc(db, 'guideRegistrations', uid);

  const [profileSnap, registrationSnap] = await Promise.all([
    getDoc(profileRef),
    getDoc(registrationRef),
  ]);

  const profile = profileSnap.exists() ? profileSnap.data() : null;
  const registration = registrationSnap.exists() ? registrationSnap.data() : null;

  if (!profile || !registration) {
    flags.push('MISSING_REGISTRATION');
    return { status: 'blocked', flags };
  }

  if (profile.ownerUid !== uid || registration.ownerUid !== uid) {
    flags.push('OWNER_UID_MISMATCH');
  }

  const requiredValues: Record<string, unknown> = {
    name: profile.name,
    guideLanguages: profile.languages,
    regions: profile.regions,
    experience: profile.experienceRange,
    phone: registration.phone,
    certificateLanguage: registration.certificateLanguage,
    certificateNumber: registration.certificateNumber,
    privacyConsent: registration.privacyConsent,
  };

  for (const field of [
    'name',
    'guideLanguages',
    'regions',
    'experience',
    'phone',
    'certificateLanguage',
    'certificateNumber',
    'privacyConsent',
  ]) {
    const value = requiredValues[field];
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      value === false
    ) {
      flags.push('MISSING_REQUIRED_FIELD');
      break;
    }
  }

  const normalizedPhone = normalizePhone((registration.phone as string) || '');
  if (normalizedPhone) {
    const phoneQuery = query(collection(db, 'guideRegistrations'), where('phone', '==', normalizedPhone));
    const phoneSnapshot = await getDocs(phoneQuery);
    const duplicates = phoneSnapshot.docs.filter((item) => item.id !== uid);
    if (duplicates.length > 0) {
      flags.push('DUPLICATE_PHONE');
    }
  }

  const normalizedCertificate = normalizeCertificateNumber((registration.certificateNumber as string) || '');
  if (normalizedCertificate) {
    const certificateQuery = query(collection(db, 'guideRegistrations'), where('certificateNumber', '==', normalizedCertificate));
    const certificateSnapshot = await getDocs(certificateQuery);
    const duplicates = certificateSnapshot.docs.filter((item) => item.id !== uid);
    if (duplicates.length > 0) {
      flags.push('DUPLICATE_CERTIFICATE');
    }
  }

  return {
    status: flags.length > 0 ? 'blocked' : 'ready',
    flags,
  };
}

export function buildPublicProfile(uid: string, profile: Record<string, unknown>, review: GuideVerificationReview): PublicGuideProfile {
  const safeName = typeof profile.name === 'string' ? profile.name : '';
  const safeLanguages = Array.isArray(profile.languages) ? profile.languages.filter((item): item is string => typeof item === 'string') : [];
  const safeRegions = Array.isArray(profile.regions) ? profile.regions.filter((item): item is string => typeof item === 'string') : [];
  const safeExperience = typeof profile.experienceRange === 'string' ? profile.experienceRange : '';
  const safeIntroduction = typeof profile.introduction === 'string' ? profile.introduction : '';
  const safePhotoUrl = typeof profile.profilePhotoUrl === 'string' ? profile.profilePhotoUrl : undefined;

  return {
    id: uid,
    ownerUid: uid,
    name: safeName,
    languages: safeLanguages,
    regions: safeRegions,
    experienceRange: safeExperience,
    introduction: safeIntroduction,
    profilePhotoUrl: safePhotoUrl,
    verified: review.reviewStatus === 'approved',
    featured: false,
    displayOrder: null,
    publishedAt: review.reviewedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
