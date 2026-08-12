import { addDoc, collection, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, Timestamp, where } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { PublicGuideProfile, TravelerRequest } from '@/types';

const publicGuideProfilesCollection = 'publicGuideProfiles';
const travelerRequestsCollection = 'travelerRequests';

export function getPublicGuideProfiles() {
  return getDocs(query(collection(db, publicGuideProfilesCollection), orderBy('displayOrder', 'asc'), limit(50))).then((snapshot) =>
    snapshot.docs.map((doc) => mapPublicGuideProfile(doc.id, doc.data() as Record<string, unknown>)),
  );
}

export function subscribePublicGuideProfiles(onUpdate: (guides: PublicGuideProfile[]) => void) {
  const q = query(collection(db, publicGuideProfilesCollection), orderBy('displayOrder', 'asc'), limit(50));
  return onSnapshot(q, (snapshot) => {
    const guides = snapshot.docs.map((doc) => mapPublicGuideProfile(doc.id, doc.data() as Record<string, unknown>));
    onUpdate(guides);
  });
}

export async function getTravelerRequest(requestId: string): Promise<TravelerRequest | null> {
  const snapshot = await getDocs(query(collection(db, travelerRequestsCollection), where('__name__', '==', requestId), limit(1)));
  const doc = snapshot.docs[0];
  if (!doc) return null;
  return mapTravelerRequest(doc.id, doc.data());
}

export async function createTravelerRequest(request: TravelerRequest) {
  const document = await addDoc(collection(db, travelerRequestsCollection), {
    ...request,
    status: request.status || 'submitted',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return document.id;
}

export function listenTravelerRequests(ownerUid: string, onUpdate: (requests: TravelerRequest[]) => void) {
  const q = query(collection(db, travelerRequestsCollection), where('ownerUid', '==', ownerUid), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((doc) => mapTravelerRequest(doc.id, doc.data() as Record<string, unknown>));
    onUpdate(requests);
  });
}

export function mapTravelerRequestStatus(status: unknown): string {
  if (status === 'submitted') return '접수';
  if (typeof status === 'string' && status.trim()) return status;
  return '접수';
}

function mapPublicGuideProfile(id: string, data: Record<string, unknown>): PublicGuideProfile {
  const coerce = (value: unknown) => (typeof value === 'string' ? value : '');
  return {
    id,
    ownerUid: coerce(data.ownerUid),
    name: coerce(data.name),
    languages: Array.isArray(data.languages) ? data.languages.filter((item): item is string => typeof item === 'string') : [],
    regions: Array.isArray(data.regions) ? data.regions.filter((item): item is string => typeof item === 'string') : [],
    experienceRange: coerce(data.experienceRange),
    introduction: coerce(data.introduction),
    profilePhotoUrl: typeof data.profilePhotoUrl === 'string' ? data.profilePhotoUrl : undefined,
    verified: Boolean(data.verified),
    featured: Boolean(data.featured),
    displayOrder: typeof data.displayOrder === 'number' ? data.displayOrder : null,
    publishedAt: typeof data.publishedAt === 'string' ? data.publishedAt : undefined,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
  };
}

function mapTravelerRequest(id: string, data: Record<string, unknown>): TravelerRequest {
  const formatDate = (value: unknown) => {
    if (value instanceof Timestamp) return value.toDate().toISOString().slice(0, 10);
    if (typeof value === 'string') return value.slice(0, 10);
    return '';
  };

  const coerce = (value: unknown) => (typeof value === 'string' ? value : '');

  return {
    id,
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
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
  };
}
