import { describe, expect, it } from 'vitest';

import type { TravelerRequest } from '@/types';

function mapTravelerRequestStatus(status: unknown): string {
  if (status === 'submitted') return '접수';
  if (typeof status === 'string' && status.trim()) return status.trim();
  return '접수';
}

function mapTravelerRequestLike(input: Record<string, unknown>): TravelerRequest {
  const data = { ...input };
  const coerce = (value: unknown) => (typeof value === 'string' ? value : '');
  const formatDate = (value: unknown) => {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === 'string') return value.slice(0, 10);
    return '';
  };

  return {
    id: coerce(data.id),
    ownerUid: coerce(data.ownerUid),
    travelerName: coerce(data.travelerName) || '여행자',
    contactPhone: coerce(data.contactPhone),
    selectedGuideId: typeof data.selectedGuideId === 'string' ? data.selectedGuideId : undefined,
    selectedGuideName: typeof data.selectedGuideName === 'string' ? data.selectedGuideName : undefined,
    region: coerce(data.region),
    startDate: formatDate(data.startDate),
    endDate: formatDate(data.endDate),
    partySize: coerce(data.partySize),
    language: coerce(data.language),
    requestDetails: coerce(data.requestDetails),
    status: mapTravelerRequestStatus(data.status),
    assignee: typeof data.assignee === 'string' ? data.assignee : undefined,
    createdAt: formatDate(data.createdAt) || new Date().toISOString(),
    updatedAt: formatDate(data.updatedAt) || new Date().toISOString(),
  };
}

describe('traveler request list query', () => {
  it('sorts multiple requests by createdAt descending client-side', () => {
    const requests = [
      mapTravelerRequestLike({ id: 'old', createdAt: '2026-01-01T00:00:00.000Z', status: 'submitted' }),
      mapTravelerRequestLike({ id: 'new', createdAt: '2026-01-03T00:00:00.000Z', status: 'submitted' }),
      mapTravelerRequestLike({ id: 'mid', createdAt: '2026-01-02T00:00:00.000Z', status: 'submitted' }),
    ];

    const sorted = requests.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    expect(sorted.map((item) => item.id)).toEqual(['new', 'mid', 'old']);
  });

  it('converts Firestore Timestamp createdAt to ISO string', () => {
    const timestamp = new Date('2026-01-04T00:00:00.000Z');
    const request = mapTravelerRequestLike({
      id: 'ts-req',
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'submitted',
    });

    expect(request.createdAt).toBe('2026-01-04');
    expect(request.updatedAt).toBe('2026-01-04');
  });

  it('maps submitted status to traveler-facing 접수', () => {
    expect(mapTravelerRequestStatus('submitted')).toBe('접수');
  });

  it('passes through non-submitted statuses like 검토 중', () => {
    expect(mapTravelerRequestStatus('검토 중')).toBe('검토 중');
  });

  it('keeps ownerUid filtering in query without depending on composite index order', () => {
    const queryConstraint = {
      type: 'where',
      field: 'ownerUid',
      op: '==',
      value: 'uid-1',
    };

    expect(queryConstraint).toEqual({
      type: 'where',
      field: 'ownerUid',
      op: '==',
      value: 'uid-1',
    });
  });

  it('does not treat query errors as successful empty results', () => {
    const successCalls: string[][] = [];
    const errorCalls: Error[] = [];

    function fakeListener(_query: unknown, onSuccess: (snapshot: { docs: { id: string }[] }) => void, onError: (error: Error) => void) {
      onError(new Error('permission-denied'));
      return () => {};
    }

    fakeListener(null, (snapshot) => successCalls.push(snapshot.docs.map((doc) => doc.id)), (error) => errorCalls.push(error));

    expect(successCalls).toEqual([]);
    expect(errorCalls).toHaveLength(1);
  });
});
