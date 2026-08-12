import { describe, expect, it } from 'vitest';

function buildPayload(request: {
  ownerUid: string;
  travelerName: string;
  contactPhone: string;
  selectedGuideId?: string;
  selectedGuideName?: string;
  region: string;
  startDate: string;
  endDate: string;
  partySize: string;
  language: string;
  requestDetails: string;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    ownerUid: request.ownerUid,
    travelerName: request.travelerName,
    contactPhone: request.contactPhone,
    region: request.region,
    startDate: request.startDate,
    endDate: request.endDate,
    partySize: request.partySize,
    language: request.language,
    requestDetails: request.requestDetails,
    status: 'submitted',
    assignee: null,
    createdAt: 'serverTimestamp()',
    updatedAt: 'serverTimestamp()',
  };

  const selectedGuideId = typeof request.selectedGuideId === 'string' && request.selectedGuideId.trim() ? request.selectedGuideId.trim() : '';
  const selectedGuideName = typeof request.selectedGuideName === 'string' && request.selectedGuideName.trim() ? request.selectedGuideName.trim() : '';

  if (selectedGuideId) {
    payload.selectedGuideId = selectedGuideId;
  }
  if (selectedGuideName) {
    payload.selectedGuideName = selectedGuideName;
  }

  return payload;
}

describe('traveler request payload', () => {
  it('omits undefined guide fields when no guide is selected', () => {
    const payload = buildPayload({
      ownerUid: 'uid-1',
      travelerName: '여행자',
      contactPhone: '010-0000-0000',
      region: '서울',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      partySize: '2',
      language: '영어',
      requestDetails: '상세',
    });

    expect(payload.status).toBe('submitted');
    expect(payload.assignee).toBeNull();
    expect('selectedGuideId' in payload).toBe(false);
    expect('selectedGuideName' in payload).toBe(false);
  });

  it('includes guide fields when a guide is selected', () => {
    const payload = buildPayload({
      ownerUid: 'uid-1',
      travelerName: '여행자',
      contactPhone: '010-0000-0000',
      selectedGuideId: ' guide-1 ',
      selectedGuideName: ' 가이드 이름 ',
      region: '서울',
      startDate: '2026-01-01',
      endDate: '2026-01-02',
      partySize: '2',
      language: '영어',
      requestDetails: '상세',
    });

    expect(payload.selectedGuideId).toBe('guide-1');
    expect(payload.selectedGuideName).toBe('가이드 이름');
  });
});
