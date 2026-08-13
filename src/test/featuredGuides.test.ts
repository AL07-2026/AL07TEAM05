import { describe, expect, it } from 'vitest';

import type { PublicGuideProfile } from '@/types';

function sortFeatured(profiles: PublicGuideProfile[]): PublicGuideProfile[] {
  const verified = profiles.filter((profile) => profile.verified);
  return verified
    .slice()
    .sort((a, b) => {
      const aFeatured = a.featured ? 1 : 0;
      const bFeatured = b.featured ? 1 : 0;
      if (bFeatured !== aFeatured) return bFeatured - aFeatured;
      const aOrder = typeof a.displayOrder === 'number' ? a.displayOrder : Number.POSITIVE_INFINITY;
      const bOrder = typeof b.displayOrder === 'number' ? b.displayOrder : Number.POSITIVE_INFINITY;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    })
    .slice(0, 3);
}

describe('featured guide selection', () => {
  const base: PublicGuideProfile = {
    id: 'guide-1',
    ownerUid: 'guide-1',
    name: '테스트',
    languages: ['영어'],
    regions: ['서울'],
    experienceRange: '1년 미만',
    introduction: '테스트 가이드',
    verified: true,
    featured: false,
    displayOrder: null,
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('includes only verified profiles', () => {
    const result = sortFeatured([base, { ...base, id: 'guide-2', verified: false }]);
    expect(result.map((item) => item.id)).toEqual(['guide-1']);
  });

  it('prioritizes featured true', () => {
    const result = sortFeatured([
      base,
      { ...base, id: 'guide-featured', featured: true, displayOrder: 2 },
    ]);
    expect(result[0]!.id).toBe('guide-featured');
  });

  it('uses displayOrder before updatedAt', () => {
    const result = sortFeatured([
      { ...base, id: 'guide-a', displayOrder: 2, updatedAt: '2026-01-02T00:00:00Z' },
      { ...base, id: 'guide-b', displayOrder: 1, updatedAt: '2026-01-01T00:00:00Z' },
    ]);
    expect(result.map((item) => item.id)).toEqual(['guide-b', 'guide-a']);
  });

  it('limits to 3 guides', () => {
    const guides = Array.from({ length: 5 }, (_, index) => ({ ...base, id: `guide-${index}` }));
    expect(sortFeatured(guides).length).toBe(3);
  });

  it('does not include unverified mock guides when verified real profiles exist', () => {
    const result = sortFeatured([
      base,
      { ...base, id: 'mock-1', name: '김민준', verified: false },
      { ...base, id: 'mock-2', name: '이서연', verified: false },
    ]);
    expect(result.some((item) => item.name === '김민준')).toBe(false);
    expect(result.map((item) => item.id)).toEqual(['guide-1']);
  });

  it('returns empty state when no verified profiles exist', () => {
    expect(sortFeatured([{ ...base, verified: false }]).length).toBe(0);
  });
});
