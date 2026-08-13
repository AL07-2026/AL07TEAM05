import { describe, expect, it } from 'vitest';

function hasAdminAccess(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    'role' in data &&
    'active' in data &&
    (data as Record<string, unknown>).role === 'admin' &&
    (data as Record<string, unknown>).active === true
  );
}

function isOperationsAdminRole(role: unknown): boolean {
  return role === 'admin';
}

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
