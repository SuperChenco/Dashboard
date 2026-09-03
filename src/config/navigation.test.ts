import { describe, expect, it } from 'vitest';

import { isNavigationItemActive } from './navigation';

describe('isNavigationItemActive', () => {
  it('treats the dashboard and today route as the Today area', () => {
    expect(isNavigationItemActive('/', '/today')).toBe(true);
    expect(isNavigationItemActive('/today', '/')).toBe(true);
  });

  it('matches module detail routes without matching sibling modules', () => {
    expect(isNavigationItemActive('/projects/example', '/projects')).toBe(true);
    expect(isNavigationItemActive('/people', '/projects')).toBe(false);
  });
});
