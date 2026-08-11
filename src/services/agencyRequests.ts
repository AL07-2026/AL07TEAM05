import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

import type { AgencyRequest } from '@/app/App';
import { db } from '@/lib/firebase';

const agencyRequestsCollection = 'agencyRequests';

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
