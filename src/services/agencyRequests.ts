import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import type { AgencyRequest } from '@/app/App';
import { db } from '@/lib/firebase';

const agencyRequestsCollection = 'agencyRequests';

export type AdminRequestStatus =
  | '신규'
  | '검토 중'
  | '정보 보완'
  | '가이드 탐색'
  | '제안 완료'
  | '매칭 확정';

export type AdminAgencyRequest = {
  id: string;
  company: string;
  manager: string;
  phone: string;
  email: string;
  event: string;
  region: string;
  date: string;
  startDate?: string;
  endDate?: string;
  languages: string[];
  guides: number;
  urgency: '긴급' | '보통';
  status: AdminRequestStatus;
  assignee: string;
  task: string;
  budget: string;
  createdAt: string;
};

function withoutUndefined(data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

export async function createAgencyRequest(request: AgencyRequest) {
  const document = await addDoc(
    collection(db, agencyRequestsCollection),
    withoutUndefined({
      ...request,
      status: 'submitted',
      assignee: null,
      createdAt: serverTimestamp(),
    }),
  );

  return document.id;
}

export function mapAgencyRequestStatus(status: unknown): AdminRequestStatus {
  if (status === 'submitted') return '신규';
  if (
    status === '신규' ||
    status === '검토 중' ||
    status === '정보 보완' ||
    status === '가이드 탐색' ||
    status === '제안 완료' ||
    status === '매칭 확정'
  ) {
    return status;
  }

  return '신규';
}

export function mapAgencyRequestUrgency(urgency: unknown): '긴급' | '보통' {
  return typeof urgency === 'string' && urgency.includes('오늘') ? '긴급' : '보통';
}

function readString(data: Record<string, unknown>, key: string, fallback = '정보 없음'): string {
  const value = data[key];
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '-' || trimmed === '---' || trimmed === '상세 업무 미입력') {
    return fallback;
  }
  return trimmed;
}

function readStringArray(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function formatDateRange(start: string | undefined, end: string | undefined): string {
  const safeStart = start?.trim();
  const safeEnd = end?.trim();

  if (!safeStart && !safeEnd) return '정보 없음';
  if (safeStart && safeEnd) return `${safeStart} - ${safeEnd}`;
  if (safeStart) return safeStart;
  return safeEnd || '정보 없음';
}

export function formatGuideRequirement(languages: string[], guides: number): string {
  const label = languages.join(' · ');
  if (!label && (!guides || guides <= 0)) return '정보 없음';
  if (!label) return `${guides}명`;
  if (!guides || guides <= 0) return label;
  return `${label} · ${guides}명`;
}

function readGuideCount(data: Record<string, unknown>) {
  const value = data.guideCount;
  const count = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : 1;
  return Number.isFinite(count) && count > 0 ? count : 1;
}

function formatCreatedAt(value: unknown) {
  const date = value instanceof Timestamp ? value.toDate() : null;
  return date ? date.toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : '-';
}

function toAdminAgencyRequest(id: string, data: Record<string, unknown>): AdminAgencyRequest {
  const startDate = readString(data, 'startDate', '');
  const endDate = readString(data, 'endDate', '');

  return {
    id,
    company: readString(data, 'companyName', '신규 여행사'),
    manager: readString(data, 'contactName'),
    phone: readString(data, 'contactPhone'),
    email: readString(data, 'contactEmail'),
    event: readString(data, 'eventName', '가이드 매칭 요청'),
    region: readString(data, 'region'),
    date: formatDateRange(startDate || undefined, endDate || undefined),
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    languages: readStringArray(data, 'languages'),
    guides: readGuideCount(data),
    urgency: mapAgencyRequestUrgency(data.urgency),
    status: mapAgencyRequestStatus(data.status),
    assignee: readString(data, 'assignee', '미지정'),
    task: readString(data, 'taskDescription', '상세 업무 미입력'),
    budget: readString(data, 'budget', '협의'),
    createdAt: formatCreatedAt(data.createdAt),
  };
}

export async function getAgencyRequests() {
  const snapshot = await getDocs(
    query(collection(db, agencyRequestsCollection), orderBy('createdAt', 'desc'), limit(50)),
  );

  return snapshot.docs.map((document) =>
    toAdminAgencyRequest(document.id, document.data() as Record<string, unknown>),
  );
}
