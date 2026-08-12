import type { PublicGuideProfile, GuideVerificationReview } from '@/types';

export type PreCheckResult = {
  status: 'ready' | 'blocked';
  flags: string[];
};

export function normalizePhone(phone: string) {
  return phone.replace(/[^0-9]/g, '');
}

export function normalizeCertificateNumber(value: string) {
  return value.trim().toUpperCase();
}

export function evaluatePreCheck(
  profile: Record<string, unknown> | null,
  registration: Record<string, unknown> | null
): PreCheckResult {
  const flags: string[] = [];

  if (!profile || !registration) {
    flags.push('MISSING_REGISTRATION');
    return { status: 'blocked', flags };
  }

  if (profile.ownerUid !== registration.ownerUid) {
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

  return {
    status: flags.length > 0 ? 'blocked' : 'ready',
    flags,
  };
}

export function buildPublicProfile(
  uid: string,
  profile: Record<string, unknown>,
  review: GuideVerificationReview
): PublicGuideProfile {
  const safeName = typeof profile.name === 'string' ? profile.name : '';
  const safeLanguages = Array.isArray(profile.languages)
    ? profile.languages.filter((item): item is string => typeof item === 'string')
    : [];
  const safeRegions = Array.isArray(profile.regions)
    ? profile.regions.filter((item): item is string => typeof item === 'string')
    : [];
  const safeExperience =
    typeof profile.experienceRange === 'string' ? profile.experienceRange : '';
  const safeIntroduction =
    typeof profile.introduction === 'string' ? profile.introduction : '';
  const safePhotoUrl =
    typeof profile.profilePhotoUrl === 'string' ? profile.profilePhotoUrl : undefined;

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
