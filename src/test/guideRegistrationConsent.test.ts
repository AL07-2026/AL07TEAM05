import { describe, expect, it } from 'vitest';
import { evaluatePreCheck } from '@/services/guideVerificationCore';

function buildRegistrationPayload(consent: boolean) {
  return {
    phone: '010-1234-5678',
    certificateLanguage: '영어',
    certificateNumber: 'CERT-1',
    privacyConsent: consent,
  };
}

describe('guide registration consent payload', () => {
  it('includes privacyConsent in registration payload', () => {
    const payload = buildRegistrationPayload(true);
    expect(payload.privacyConsent).toBe(true);
  });

  it('blocks precheck when privacyConsent is missing', () => {
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
    });

    expect(result.status).toBe('blocked');
    expect(result.flags).toContain('MISSING_REQUIRED_FIELD');
  });

  it('blocks precheck when privacyConsent is false', () => {
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
      privacyConsent: false,
    });

    expect(result.status).toBe('blocked');
    expect(result.flags).toContain('MISSING_REQUIRED_FIELD');
  });

  it('passes precheck when privacyConsent is true', () => {
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
