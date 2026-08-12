import { addDoc, collection, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, Timestamp, updateDoc, where } from 'firebase/firestore';

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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const selectedGuideId = typeof request.selectedGuideId === 'string' && request.selectedGuideId.trim() ? request.selectedGuideId.trim() : '';
  const selectedGuideName = typeof request.selectedGuideName === 'string' && request.selectedGuideName.trim() ? request.selectedGuideName.trim() : '';

  if (selectedGuideId) {
    payload.selectedGuideId = selectedGuideId;
  }
  if (selectedGuideName) {
    payload.selectedGuideName = selectedGuideName;
  }

  const document = await addDoc(collection(db, travelerRequestsCollection), payload);
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

export async function getTravelerRequests(): Promise<TravelerRequest[]> {
  const snapshot = await getDocs(query(collection(db, travelerRequestsCollection), orderBy('createdAt', 'desc'), limit(200)));
  return snapshot.docs.map((doc) => mapTravelerRequest(doc.id, doc.data() as Record<string, unknown>));
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

const TRAVELER_ALLOWED_OPERATIONS_FIELDS = new Set(['status', 'assignee', 'updatedAt']);

export async function updateTravelerRequestOperations({ requestId, status, assignee }: { requestId: string; status?: string; assignee?: string | null }) {
  const reference = doc(db, travelerRequestsCollection, requestId);
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };

  if (typeof status === 'string' && status.trim()) payload.status = status.trim();
  if (assignee !== undefined) payload.assignee = assignee;

  const allowedKeys = Object.keys(payload).filter((key) => TRAVELER_ALLOWED_OPERATIONS_FIELDS.has(key));
  if (!allowedKeys.length) return;

  const updatePayload = Object.fromEntries(allowedKeys.map((key) => [key, payload[key]])) as Record<string, unknown>;
  await updateDoc(reference, updatePayload);
}
