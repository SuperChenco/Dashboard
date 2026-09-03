import { describe, expect, it } from 'vitest';

import { safeNextPath } from '@/lib/auth/redirect';

describe('Owner Auth redirect boundary', () => {
  it('allows an internal return path', () => {
    expect(safeNextPath('/today?view=focus')).toBe('/today?view=focus');
  });

  it.each([
    'https://attacker.example',
    '//attacker.example',
    'javascript:alert(1)',
    undefined,
  ])('rejects an external or invalid return path: %s', (value) => {
    expect(safeNextPath(value)).toBe('/');
  });
});
