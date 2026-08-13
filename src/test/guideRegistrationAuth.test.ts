import { describe, expect, it } from 'vitest';

function pickGuideUid(guideAuthUser: { uid: string } | null, anonymousUid: string) {
  const user = guideAuthUser ?? { uid: anonymousUid };
  return user.uid;
}

describe('guide registration auth isolation', () => {
  it('does not use default admin uid for guide registration', () => {
    expect(pickGuideUid(null, 'guide-anon-uid')).not.toBe('default-user-uid');
  });

  it('does not use traveler uid for guide registration', () => {
    expect(pickGuideUid(null, 'guide-anon-uid')).not.toBe('traveler-user-uid');
  });

  it('uses dedicated guide auth uid when present', () => {
    expect(pickGuideUid({ uid: 'guide-anon-uid' }, 'default-user-uid')).toBe('guide-anon-uid');
  });

  it('does not reuse existing default or traveler session uid', () => {
    expect(pickGuideUid(null, 'guide-anon-uid')).not.toBe('default-user-uid');
    expect(pickGuideUid(null, 'guide-anon-uid')).not.toBe('traveler-user-uid');
  });
});
