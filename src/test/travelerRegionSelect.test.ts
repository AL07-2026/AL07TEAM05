import { describe, expect, it } from 'vitest';

function buildRegionState(region: string, customRegion: string) {
  return { region, customRegion };
}

function resolveRegion(form: { region: string; customRegion: string }) {
  return form.region === '기타' ? form.customRegion.trim() : form.region;
}

describe('traveler region selection', () => {
  it('resolves selected preset region', () => {
    const form = buildRegionState('부산', '');
    expect(resolveRegion(form)).toBe('부산');
  });

  it('resolves custom region when 기타 is selected', () => {
    const form = buildRegionState('기타', ' 경주 ');
    expect(resolveRegion(form)).toBe('경주');
  });

  it('returns empty string when nothing is selected', () => {
    const form = buildRegionState('', '');
    expect(resolveRegion(form)).toBe('');
  });

  it('returns empty string when 기타 is selected but custom region is blank', () => {
    const form = buildRegionState('기타', '   ');
    expect(resolveRegion(form)).toBe('');
  });
});
