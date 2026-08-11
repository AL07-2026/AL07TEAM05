import type { PublicGuideProfile } from '@/types';

export type FeaturedGuidesSource =
  | {
      kind: 'mock';
      guides: readonly PublicGuideProfile[];
    }
  | {
      kind: 'firestore';
      collection: 'publicGuideProfiles';
    };

function buildFeaturedSource(): FeaturedGuidesSource {
  // 나중에 실제 Firestore 연동으로 바꿀 때 이 반환값만 교체하면 됩니다.
  // 예: return { kind: 'firestore', collection: 'publicGuideProfiles' };
  return {
    kind: 'mock',
    guides: mockFeaturedGuides,
  };
}

export function getFeaturedGuides(): Promise<readonly PublicGuideProfile[]> {
  const source = buildFeaturedSource();

  if (source.kind === 'firestore') {
    // 이 블록에서 publicGuideProfiles 컬렉션에서
    // verified == true, featured == true, displayOrder 순 3개를 조회하도록 구현하면 됩니다.
    // 지금은 실제 Firestore 읽기를 실행하지 않습니다.
    return Promise.resolve([]);
  }

  return Promise.resolve(source.guides);
}

const mockFeaturedGuides: readonly PublicGuideProfile[] = [
  {
    id: 'example-guide-1',
    name: '김민준',
    languages: ['영어'],
    regions: ['서울', '경기'],
    experienceRange: '5년 이상',
    introduction: '기업 행사와 VIP 투어 경험이 많은 영어 가이드입니다.',
    verified: true,
    featured: true,
    displayOrder: 1,
  },
  {
    id: 'example-guide-2',
    name: '이서연',
    languages: ['일본어'],
    regions: ['서울', '부산'],
    experienceRange: '3~5년',
    introduction: '문화·관광 일정 진행에 강한 일본어 가이드입니다.',
    verified: true,
    featured: true,
    displayOrder: 2,
  },
  {
    id: 'example-guide-3',
    name: '박지훈',
    languages: ['중국어'],
    regions: ['서울', '제주'],
    experienceRange: '1~3년',
    introduction: '자유여행과 소규모 단체 안내에 익숙한 중국어 가이드입니다.',
    verified: true,
    featured: true,
    displayOrder: 3,
  },
];
