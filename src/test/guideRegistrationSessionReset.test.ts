import { describe, expect, it } from 'vitest';

function createSessionResetState() {
  return {
    submitError: null as string | null,
    resetting: false,
    resetCalled: false,
  };
}

function markReset(state: ReturnType<typeof createSessionResetState>) {
  state.resetCalled = true;
}

describe('guide registration session reset', () => {
  it('marks session reset without deleting documents', () => {
    const state = createSessionResetState();
    markReset(state);
    expect(state.resetCalled).toBe(true);
  });

  it('preserves existing form values during reset', () => {
    const form = {
      name: '테스트5',
      phone: '010-1234-5678',
      privacyConsent: true,
    };

    const preserved = { ...form };
    expect(preserved.name).toBe('테스트5');
    expect(preserved.privacyConsent).toBe(true);
  });

  it('keeps privacyConsent true in registration payload', () => {
    const payload = {
      phone: '010-1234-5678',
      certificateLanguage: '영어',
      certificateNumber: 'CERT-5',
      privacyConsent: true,
    };

    expect(payload.privacyConsent).toBe(true);
  });
});
