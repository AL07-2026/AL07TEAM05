import { describe, expect, it } from 'vitest';

function humanizeFlag(flag: string): string {
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

function canApprove(precheckStatus: 'ready' | 'blocked', reviewStatus: string) {
  if (reviewStatus === 'approved') return false;
  return precheckStatus === 'ready';
}

describe('admin guide publish safety', () => {
  it('maps known flags to Korean descriptions', () => {
    expect(humanizeFlag('MISSING_REQUIRED_FIELD')).toBe('필수 정보가 누락되었습니다.');
    expect(humanizeFlag('DUPLICATE_PHONE')).toBe('이미 등록된 연락처와 중복됩니다.');
    expect(humanizeFlag('DUPLICATE_CERTIFICATE')).toBe('이미 등록된 자격증 번호와 중복됩니다.');
    expect(humanizeFlag('PRE_CHECK_ERROR')).toBe('사전 점검 중 오류가 발생했습니다.');
    expect(humanizeFlag('MISSING_REGISTRATION')).toBe('필수 등록 정보가 누락되었습니다.');
    expect(humanizeFlag('OWNER_UID_MISMATCH')).toBe('프로필과 등록 정보의 소유자가 일치하지 않습니다.');
  });

  it('returns fallback for unknown flags', () => {
    expect(humanizeFlag('UNKNOWN_FLAG')).toBe('추가 확인이 필요한 항목이 있습니다.');
  });

  it('allows approve when ready and not approved', () => {
    expect(canApprove('ready', 'pending')).toBe(true);
    expect(canApprove('ready', 'reviewing')).toBe(true);
    expect(canApprove('ready', 'needs_info')).toBe(true);
  });

  it('blocks approve when precheck is blocked', () => {
    expect(canApprove('blocked', 'pending')).toBe(false);
    expect(canApprove('blocked', 'reviewing')).toBe(false);
    expect(canApprove('blocked', 'needs_info')).toBe(false);
  });

  it('blocks re-approve when already approved', () => {
    expect(canApprove('ready', 'approved')).toBe(false);
    expect(canApprove('blocked', 'approved')).toBe(false);
  });
});
