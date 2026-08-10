import { collection, getDocs } from 'firebase/firestore';

import { db } from '@/lib/firebase';

export type JobPosting = {
  id: string;
  title: string;
  company: string;
  category: string | null;
  career: string | null;
  education: string | null;
  employmentType: string | null;
  salary: string | null;
  deadline: string | null;
  postedAt: string | null;
  source: string | null;
  sourceUrl: string | null;
  matchedKeyword: string | null;
};

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export async function getJobPostings(): Promise<JobPosting[]> {
  const snapshot = await getDocs(collection(db, 'jobs'));

  return snapshot.docs
    .map((document) => {
      const data = document.data();
      return {
        id: document.id,
        title: optionalString(data.title) ?? '제목 없음',
        company: optionalString(data.company) ?? '회사 정보 없음',
        category: optionalString(data.category),
        career: optionalString(data.career),
        education: optionalString(data.education),
        employmentType: optionalString(data.employmentType),
        salary: optionalString(data.salary),
        deadline: optionalString(data.deadline),
        postedAt: optionalString(data.postedAt),
        source: optionalString(data.source),
        sourceUrl: optionalString(data.sourceUrl),
        matchedKeyword: optionalString(data.matchedKeyword),
      };
    })
    .sort((a, b) => (b.postedAt ?? '').localeCompare(a.postedAt ?? ''));
}
