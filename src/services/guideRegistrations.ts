import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const guideRegistrationsCollection = 'guideRegistrations';

export type AdminGuideRegistration = {
  id: string;
  name: string;
  phone: string;
  languages: string[];
  regions: string[];
  experience: string;
  certificateLanguage: string;
  certificateNumber: string;
  introduction: string;
  status: '검토 대기' | '승인' | '보완 요청';
  submittedAt: string;
};

function readString(data: Record<string, unknown>, key: string, fallback = '-') {
  const value = data[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function readStringArray(data: Record<string, unknown>, key: string) {
  const value = data[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
}

function formatTimestamp(value: unknown) {
  return value instanceof Timestamp ? value.toDate().toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' }) : '-';
}

function toAdminGuideRegistration(id: string, data: Record<string, unknown>): AdminGuideRegistration {
  const languages = readStringArray(data, 'languages');
  const customLanguage = readString(data, 'customLanguage', '');
  const mergedLanguages = customLanguage && !languages.includes(customLanguage) ? [...languages, customLanguage] : languages;

  return {
    id,
    name: readString(data, 'name', '이름 미입력'),
    phone: readString(data, 'phone'),
    languages: mergedLanguages,
    regions: readStringArray(data, 'regions'),
    experience: readString(data, 'experienceRange'),
    certificateLanguage: readString(data, 'certificateLanguage'),
    certificateNumber: readString(data, 'certificateNumber'),
    introduction: readString(data, 'introduction'),
    status: data.profileStatus === 'approved' ? '승인' : data.profileStatus === 'needs_revision' ? '보완 요청' : '검토 대기',
    submittedAt: formatTimestamp(data.submittedAt ?? data.createdAt),
  };
}

export async function getGuideRegistrations() {
  const snapshot = await getDocs(query(collection(db, guideRegistrationsCollection), orderBy('submittedAt', 'desc')));
  return snapshot.docs.map((document) => toAdminGuideRegistration(document.id, document.data() as Record<string, unknown>));
}
