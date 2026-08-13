import { describe, expect, it } from 'vitest';

type PreCheckResult = { status: 'ready' | 'blocked'; flags: string[] };
type GuideReviewStatus = 'pending' | 'reviewing' | 'needs_info' | 'approved' | 'rejected';
type AdminGuide = {
  uid: string;
  reviewStatus: GuideReviewStatus;
  autoCheck: PreCheckResult;
};

function computeGuideSummaryStats(guides: AdminGuide[]) {
  return {
    pending: guides.filter((g) => g.reviewStatus === 'pending').length,
    needsInfo: guides.filter((g) => g.reviewStatus === 'needs_info').length,
    approved: guides.filter((g) => g.reviewStatus === 'approved').length,
    ready: guides.filter((g) => g.autoCheck.status === 'ready').length,
    blocked: guides.filter((g) => g.autoCheck.status === 'blocked').length,
  };
}

describe('admin guide summary stats', () => {
  it('counts blocked precheck guides including all blocked reasons', () => {
    const guides: AdminGuide[] = [
      { uid: '1', reviewStatus: 'pending', autoCheck: { status: 'ready', flags: [] } },
      { uid: '2', reviewStatus: 'pending', autoCheck: { status: 'ready', flags: [] } },
      { uid: '3', reviewStatus: 'needs_info', autoCheck: { status: 'blocked', flags: ['MISSING_REQUIRED_FIELD'] } },
      { uid: '4', reviewStatus: 'pending', autoCheck: { status: 'blocked', flags: ['DUPLICATE_PHONE'] } },
      { uid: '5', reviewStatus: 'approved', autoCheck: { status: 'blocked', flags: ['DUPLICATE_CERTIFICATE'] } },
    ];

    const stats = computeGuideSummaryStats(guides);

    expect(stats).toEqual({
      pending: 3,
      needsInfo: 1,
      approved: 1,
      ready: 2,
      blocked: 3,
    });
  });
});
