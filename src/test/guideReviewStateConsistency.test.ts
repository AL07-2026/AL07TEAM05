import { describe, expect, it } from 'vitest';

function nextProfileStatus(nextStatus: string) {
  if (nextStatus === 'approved') return 'verified';
  if (nextStatus === 'rejected') return 'rejected';
  return 'needs_info';
}

function shouldWrite(currentStatus: string | undefined, nextStatus: string) {
  return currentStatus !== nextStatus;
}

describe('guide review state consistency', () => {
  it('maps non-approved statuses to non-verified profile status', () => {
    expect(nextProfileStatus('needs_info')).toBe('needs_info');
    expect(nextProfileStatus('rejected')).toBe('rejected');
    expect(nextProfileStatus('pending')).toBe('needs_info');
  });

  it('skips same-state writes', () => {
    expect(shouldWrite('needs_info', 'needs_info')).toBe(false);
    expect(shouldWrite('approved', 'approved')).toBe(false);
    expect(shouldWrite('rejected', 'rejected')).toBe(false);
    expect(shouldWrite('pending', 'needs_info')).toBe(true);
  });

  it('blocks approve when precheck is blocked', () => {
    const blocked = 'blocked';
    const ready = 'ready';
    const canApprove = (status: 'ready' | 'blocked', reviewStatus: string) => !(status === 'blocked' || reviewStatus === 'approved');

    expect(canApprove(ready, 'pending')).toBe(true);
    expect(canApprove(ready, 'needs_info')).toBe(true);
    expect(canApprove(blocked, 'pending')).toBe(false);
    expect(canApprove(blocked, 'needs_info')).toBe(false);
    expect(canApprove(ready, 'approved')).toBe(false);
  });
});
