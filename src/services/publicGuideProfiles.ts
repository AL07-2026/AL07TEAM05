import { getDocs, query, collection, orderBy, limit } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { PublicGuideProfile } from '@/types';

const publicGuideProfilesCollection = 'publicGuideProfiles';

export function getPublicGuideProfiles(): Promise<PublicGuideProfile[]> {
  const q = query(collection(db, publicGuideProfilesCollection), orderBy('displayOrder', 'asc'), limit(50));
  return getDocs(q).then((snapshot) => snapshot.docs.map((doc) => mapPublicGuideProfile(doc.id, doc.data() as Record<string, unknown>)));
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
