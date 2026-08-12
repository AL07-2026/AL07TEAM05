import type { TravelerRequest } from '@/types';
import type { AdminAgencyRequest } from '@/services/agencyRequests';

export type RequestTypeFilter = 'all' | 'agency' | 'traveler';

export type AdminUnifiedRequest =
  | ({ requestType: 'agency' } & AdminAgencyRequest)
  | ({ requestType: 'traveler' } & Omit<TravelerRequest, 'id' | 'createdAt' | 'updatedAt'> & { id: string; createdAt: string; updatedAt: string });

export function isAgencyRequest(request: AdminUnifiedRequest): request is AdminUnifiedRequest & { requestType: 'agency' } {
  return request.requestType === 'agency';
}

export function toAgencyUnified(request: AdminAgencyRequest): AdminUnifiedRequest & { requestType: 'agency' } {
  return { ...request, requestType: 'agency' };
}

export function toTravelerUnified(request: TravelerRequest): AdminUnifiedRequest & { requestType: 'traveler' } {
  return {
    ...request,
    requestType: 'traveler',
    createdAt: request.createdAt || '-',
    updatedAt: request.updatedAt || '-',
  } as AdminUnifiedRequest & { requestType: 'traveler' };
}

export function emptyValueFallback(value: string | null | undefined): string {
  if (value === null || value === undefined) return '정보 없음';
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-' || trimmed === '---' || trimmed === '상세 업무 미입력') {
    return '정보 없음';
  }
  return trimmed;
}

export function buildUnifiedRequests(agencyRequests: AdminAgencyRequest[], travelerRequests: TravelerRequest[], filterType: RequestTypeFilter) {
  const combined: AdminUnifiedRequest[] = filterType === 'agency'
    ? agencyRequests.map(toAgencyUnified)
    : filterType === 'traveler'
      ? travelerRequests.map(toTravelerUnified)
      : [...agencyRequests.map(toAgencyUnified), ...travelerRequests.map(toTravelerUnified)];

  return combined.sort((a, b) => {
    const aTime = a.createdAt || '';
    const bTime = b.createdAt || '';
    if (aTime < bTime) return 1;
    if (aTime > bTime) return -1;
    return 0;
  });
}

export function filterUnifiedRequests(requests: AdminUnifiedRequest[], query: string, status: string) {
  const normalizedQuery = query.trim().toLowerCase();
  return requests.filter((request) => {
    const matchesStatus = status === '전체' || request.status === status;
    const matchesQuery =
      !normalizedQuery ||
      (isAgencyRequest(request)
        ? [request.id, request.company, request.event, request.region]
        : [request.id, request.travelerName, request.region, request.requestDetails || ''])
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    return matchesStatus && matchesQuery;
  });
}
