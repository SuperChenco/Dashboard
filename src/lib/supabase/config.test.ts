import { describe, expect, it } from 'vitest';

import { requireSupabaseConfig } from './config';

describe('requireSupabaseConfig', () => {
  it('returns normalized configuration when both public values exist', () => {
    expect(
      requireSupabaseConfig({
        url: ' https://example.supabase.co ',
        publishableKey: ' public-key ',
      }),
    ).toEqual({
      url: 'https://example.supabase.co',
      publishableKey: 'public-key',
    });
  });

  it('fails before creating a client when configuration is missing', () => {
    expect(() => requireSupabaseConfig({})).toThrow(
      'Supabase is not configured',
    );
  });

  it('rejects a malformed Supabase URL', () => {
    expect(() =>
      requireSupabaseConfig({
        url: 'not-a-url',
        publishableKey: 'public-key',
      }),
    ).toThrow('must be a valid absolute URL');
  });
});
