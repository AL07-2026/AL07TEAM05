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
  companyDescription: string;
  manager: string;
  phone: string;
  email: string;
  preferredContactMethod: string;
  event: string;
  eventType: string;
  region: string;
  date: string;
  startDate: string;
  endDate: string;
  participantCount: string;
  languages: string[];
  guides: number;
  urgency: '긴급' | '보통';
  status: AdminRequestStatus;
  assignee: string;
  task: string;
  budget: string;
  certificatePriority: string;
  sourcingExperience: string;
  preferredExperience: string;
  similarEventExperience: string;
  drivingRequired: string;
  additionalNotes: string;
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

function readString(data: Record<string, unknown>, key: string, fallback = '-') {
  const value = data[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function readStringArray(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
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
  return {
    id,
    company: readString(data, 'companyName', '신규 여행사'),
    companyDescription: readString(data, 'companyDescription'),
    manager: readString(data, 'contactName'),
    phone: readString(data, 'contactPhone'),
    email: readString(data, 'contactEmail'),
    preferredContactMethod: readString(data, 'preferredContactMethod'),
    event: readString(data, 'eventName', '가이드 매칭 요청'),
    eventType: readString(data, 'eventType'),
    region: readString(data, 'region'),
    startDate: readString(data, 'startDate'),
    endDate: readString(data, 'endDate'),
    date: `${readString(data, 'startDate')} - ${readString(data, 'endDate')}`,
    participantCount: readString(data, 'participantCount'),
    languages: readStringArray(data, 'languages'),
    guides: readGuideCount(data),
    urgency: mapAgencyRequestUrgency(data.urgency),
    status: mapAgencyRequestStatus(data.status),
    assignee: readString(data, 'assignee', '미지정'),
    task: readString(data, 'taskDescription', '상세 업무 미입력'),
    budget: readString(data, 'budget', '협의'),
    certificatePriority: readString(data, 'certificatePriority'),
    sourcingExperience: readString(data, 'sourcingExperience'),
    preferredExperience: readString(data, 'preferredExperience'),
    similarEventExperience: readString(data, 'similarEventExperience'),
    drivingRequired: readString(data, 'drivingRequired'),
    additionalNotes: readString(data, 'additionalNotes'),
    createdAt: formatCreatedAt(data.createdAt),
  };
}

/** A stable, URL-safe identifier for a travel agency name. */
export function agencyPathId(company: string) {
  return encodeURIComponent(company.trim());
}

export async function getAgencyRequests() {
  const snapshot = await getDocs(
    query(collection(db, agencyRequestsCollection), orderBy('createdAt', 'desc'), limit(50)),
  );

  return snapshot.docs.map((document) =>
    toAdminAgencyRequest(document.id, document.data() as Record<string, unknown>),
  );
}
