import { describe, expect, it } from 'vitest';

import { hasAdminAccess, isOperationsAdminRole } from '@/services/adminAuth';

describe('admin helpers', () => {
  it('allows only active admin documents', () => {
    expect(hasAdminAccess({ role: 'admin', active: true })).toBe(true);
    expect(hasAdminAccess({ role: 'admin', active: false })).toBe(false);
    expect(hasAdminAccess({ role: 'superadmin', active: true })).toBe(false);
    expect(hasAdminAccess({ role: 'user', active: true })).toBe(false);
  });

  it('recognizes only admin operations role', () => {
    expect(isOperationsAdminRole('admin')).toBe(true);
    expect(isOperationsAdminRole('superadmin')).toBe(false);
    expect(isOperationsAdminRole('user')).toBe(false);
  });
});
