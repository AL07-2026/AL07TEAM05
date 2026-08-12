import { describe, it, expect } from 'vitest';
import { buildPublicProfile, evaluatePreCheck } from '@/services/guideVerificationCore';
import type { GuideVerificationReview } from '@/types';

const approvedReview: GuideVerificationReview = {
  guideUid: 'uid-1',
  reviewStatus: 'approved',
  autoCheckStatus: 'ready',
  flags: [],
  reviewedBy: 'admin',
  reviewedAt: '2026-08-12T00:00:00.000Z',
  updatedAt: '2026-08-12T00:00:00.000Z',
};

const blockedReview: GuideVerificationReview = {
  guideUid: 'uid-1',
  reviewStatus: 'needs_info',
  autoCheckStatus: 'blocked',
  flags: ['MISSING_REQUIRED_FIELD', 'DUPLICATE_PHONE'],
  reviewedBy: 'admin',
  reviewedAt: undefined,
  updatedAt: '2026-08-12T00:00:00.000Z',
};

describe('buildPublicProfile', () => {
  it('sanitizes public fields and excludes sensitive data', () => {
    const profile = {
      name: '김가이드',
      languages: ['영어', '일본어'],
      regions: ['서울', '부산'],
      experienceRange: '3~5년',
      introduction: '소개',
      profilePhotoUrl: 'https://example.com/photo.png',
      phone: '010-0000-0000',
      certificateNumber: 'CERT-1234',
      certificateLanguage: '영어',
      privacyConsent: true,
    };

    const publicProfile = buildPublicProfile('uid-1', profile, approvedReview);

    expect(publicProfile).toEqual({
      id: 'uid-1',
      ownerUid: 'uid-1',
      name: '김가이드',
      languages: ['영어', '일본어'],
      regions: ['서울', '부산'],
      experienceRange: '3~5년',
      introduction: '소개',
      profilePhotoUrl: 'https://example.com/photo.png',
      verified: true,
      featured: false,
      displayOrder: null,
      publishedAt: approvedReview.reviewedAt,
      updatedAt: publicProfile.updatedAt,
    });
  });

  it('does not expose phone, certificate, or admin notes', () => {
    const profile = {
      name: '김가이드',
      languages: [],
      regions: [],
      experienceRange: '',
      introduction: '',
      profilePhotoUrl: null,
      phone: '010-0000-0000',
      certificateNumber: 'CERT-1234',
      certificateLanguage: '영어',
      privacyConsent: false,
    };

    const publicProfile = buildPublicProfile('uid-1', profile, blockedReview);
    const publicRecord = publicProfile as unknown as Record<string, unknown>;

    expect(publicRecord.phone).toBeUndefined();
    expect(publicRecord.certificateNumber).toBeUndefined();
    expect(publicRecord.certificateLanguage).toBeUndefined();
    expect(publicRecord.privacyConsent).toBeUndefined();
    expect(publicRecord.adminNote).toBeUndefined();
    expect(publicProfile.verified).toBe(false);
  });

  it('falls back to safe defaults for missing profile fields', () => {
    const profile = {} as Record<string, unknown>;
    const publicProfile = buildPublicProfile('uid-1', profile, approvedReview);

    expect(publicProfile.name).toBe('');
    expect(publicProfile.languages).toEqual([]);
    expect(publicProfile.regions).toEqual([]);
    expect(publicProfile.experienceRange).toBe('');
    expect(publicProfile.introduction).toBe('');
    expect(publicProfile.profilePhotoUrl).toBeUndefined();
    expect(publicProfile.verified).toBe(true);
  });
});

describe('evaluatePreCheck', () => {
  it('returns blocked when profile or registration is missing', () => {
    expect(evaluatePreCheck(null, null)).toEqual({
      status: 'blocked',
      flags: ['MISSING_REGISTRATION'],
    });
  });

  it('flags missing required fields', () => {
    const profile = {
      ownerUid: 'uid-1',
      name: '',
      languages: [],
      regions: [],
      experienceRange: '',
    };

    const result = evaluatePreCheck(profile, {
      ownerUid: 'uid-1',
      phone: '',
      certificateLanguage: '',
      certificateNumber: '',
      privacyConsent: false,
    });

    expect(result.status).toBe('blocked');
    expect(result.flags).toContain('MISSING_REQUIRED_FIELD');
  });

  it('flags owner uid mismatch', () => {
    const profile = {
      ownerUid: 'uid-1',
      name: '김가이드',
      languages: ['영어'],
      regions: ['서울'],
      experienceRange: '1년',
    };

    const result = evaluatePreCheck(profile, {
      ownerUid: 'uid-other',
      phone: '010-0000-0000',
      certificateLanguage: '영어',
      certificateNumber: 'CERT-1',
      privacyConsent: true,
    });

    expect(result.status).toBe('blocked');
    expect(result.flags).toContain('OWNER_UID_MISMATCH');
  });

  it('returns ready when all checks pass', () => {
    const profile = {
      ownerUid: 'uid-1',
      name: '김가이드',
      languages: ['영어'],
      regions: ['서울'],
      experienceRange: '1년',
    };

    const result = evaluatePreCheck(profile, {
      ownerUid: 'uid-1',
      phone: '010-0000-0000',
      certificateLanguage: '영어',
      certificateNumber: 'CERT-1',
      privacyConsent: true,
    });

    expect(result.status).toBe('ready');
    expect(result.flags).toEqual([]);
  });
});
