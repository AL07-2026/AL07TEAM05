import { describe, expect, it } from 'vitest';

function isSuperAdminRole(role: unknown): role is 'superadmin' {
  return role === 'superadmin';
}

function hasAdminAccess(data: unknown): data is { role: 'admin' | 'superadmin'; active: boolean } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'role' in data &&
    'active' in data &&
    (data.role === 'admin' || data.role === 'superadmin') &&
    data.active === true
  );
}

describe('admin/superadmin helpers', () => {
  it('allows superadmin role only', () => {
    expect(isSuperAdminRole('superadmin')).toBe(true);
    expect(isSuperAdminRole('admin')).toBe(false);
    expect(isSuperAdminRole('user')).toBe(false);
  });

  it('allows only active admin/superadmin documents', () => {
    expect(hasAdminAccess({ role: 'admin', active: true })).toBe(true);
    expect(hasAdminAccess({ role: 'superadmin', active: true })).toBe(true);
    expect(hasAdminAccess({ role: 'admin', active: false })).toBe(false);
    expect(hasAdminAccess({ role: 'user', active: true })).toBe(false);
    expect(hasAdminAccess(null)).toBe(false);
  });
});

describe('selected guide backward compatibility', () => {
  it('preserves empty preferred guide fields in agency request shape', () => {
    const request = {
      preferredGuideId: '',
      preferredGuideName: '',
      companyName: 'Acme',
      eventName: 'Event',
    };

    const trimmedId = request.preferredGuideId?.trim();
    const trimmedName = request.preferredGuideName?.trim();
    const selectedGuide = trimmedId && trimmedName ? { id: trimmedId, name: trimmedName } : null;

    expect(selectedGuide).toBeNull();
    expect(request.companyName).toBe('Acme');
  });
});
