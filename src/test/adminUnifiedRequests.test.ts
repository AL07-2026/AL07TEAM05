import { describe, expect, it } from 'vitest';
import type { TravelerRequest } from '@/types';
import type { AdminAgencyRequest } from '@/services/agencyRequests';
import { adminStatusTone, buildUnifiedRequests, filterUnifiedRequests, normalizeAdminStatus, toTravelerUnified } from '@/app/admin/adminUnifiedRequests';

const agencyRequest: AdminAgencyRequest = {
  id: 'agency-1',
  company: '모자이크여행사',
  companyDescription: '',
  manager: '김기획',
  phone: '010-1111-2222',
  email: 'agency@example.com',
  preferredContactMethod: '전화',
  event: '한국 공연 투어',
  eventType: '공연',
  region: '스페인',
  date: '2026-01-01 - 2026-01-05',
  startDate: '2026-01-01',
  endDate: '2026-01-05',
  participantCount: '10',
  languages: ['영어', '스페인어'],
  guides: 2,
  urgency: '보통',
  status: '신규',
  assignee: '미지정',
  task: '공연 이동',
  budget: '협의',
  certificatePriority: '필요',
  sourcingExperience: '있음',
  preferredExperience: '국제 행사',
  similarEventExperience: '없음',
  drivingRequired: '필요',
  additionalNotes: '',
  createdAt: '2026-01-01T10:00:00Z',
  preferredGuideId: undefined,
  preferredGuideName: undefined,
};

const travelerRequest: TravelerRequest = {
  id: 'traveler-1',
  ownerUid: 'traveler-1-uid',
  travelerName: '테스트',
  contactPhone: '010-3333-4444',
  selectedGuideId: undefined,
  selectedGuideName: undefined,
  region: '서울',
  startDate: '2026-01-02',
  endDate: '2026-01-04',
  partySize: '2',
  language: '영어',
  requestDetails: '가이드 요청',
  status: '검토 중',
  assignee: undefined,
  createdAt: '2026-01-02T09:00:00Z',
  updatedAt: '2026-01-02T09:00:00Z',
};

describe('admin unified requests', () => {
  it('merges agency and traveler requests', () => {
    const result = buildUnifiedRequests([agencyRequest], [travelerRequest], 'all');
    expect(result.map((item) => item.id)).toEqual(['traveler-1', 'agency-1']);
  });

  it('sorts by createdAt newest first', () => {
    const olderTraveler: TravelerRequest = {
      ...travelerRequest,
      id: 'traveler-old',
      createdAt: '2026-01-01T08:00:00Z',
    };
    const result = buildUnifiedRequests([agencyRequest], [olderTraveler], 'all');
    expect(result.map((item) => item.id)).toEqual(['agency-1', 'traveler-old']);
  });

  it('filters by request type', () => {
    const result = buildUnifiedRequests([agencyRequest], [travelerRequest], 'traveler');
    expect(result.map((item) => item.id)).toEqual(['traveler-1']);
  });

  it('filters by query and status', () => {
    const result = buildUnifiedRequests([agencyRequest], [travelerRequest], 'all');
    const filtered = filterUnifiedRequests(result, '서울', '전체');
    expect(filtered.map((item) => item.id)).toEqual(['traveler-1']);
  });

  it('computes dashboard total count from both collections', () => {
    expect([agencyRequest, travelerRequest].length).toBe(2);
  });

  it('normalizes traveler submitted/접수 to admin label 신규', () => {
    expect(normalizeAdminStatus('submitted')).toBe('신규');
    expect(normalizeAdminStatus('접수')).toBe('신규');
    expect(normalizeAdminStatus('신규')).toBe('신규');
  });

  it('uses identical tone for agency 신규 and traveler submitted', () => {
    expect(adminStatusTone('신규')).toBe(adminStatusTone('submitted'));
    expect(adminStatusTone('접수')).toBe(adminStatusTone('submitted'));
  });

  it('includes both agency 신규 and traveler submitted in admin 신규 filter', () => {
    const result = buildUnifiedRequests(
      [{ ...agencyRequest, status: '신규' }],
      [{ ...travelerRequest, id: 'traveler-new', status: 'submitted' }],
      'all',
    );
    const filtered = filterUnifiedRequests(result, '', '신규');
    expect(filtered.map((item) => item.id).sort()).toEqual(['agency-1', 'traveler-new']);
  });

  it('directly filters traveler submitted as 신규', () => {
    const unified = toTravelerUnified({ ...travelerRequest, id: 'traveler-new', status: 'submitted' });
    const filtered = filterUnifiedRequests([unified], '', '신규');
    expect(filtered.map((item) => item.id)).toEqual(['traveler-new']);
  });

  it('counts both initial statuses as 신규 in dashboard aggregation', () => {
    const requests = [
      { ...agencyRequest, status: '신규' },
      { ...travelerRequest, status: 'submitted' },
    ] as Array<AdminAgencyRequest | TravelerRequest>;
    expect(requests.filter((request) => normalizeAdminStatus(request.status) === '신규').length).toBe(2);
  });
});
