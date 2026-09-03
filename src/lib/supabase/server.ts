import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import type { AstroCookies } from 'astro';
import {
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  PUBLIC_SUPABASE_URL,
} from 'astro:env/client';

import { requireSupabaseConfig } from './config';

interface ServerClientContext {
  request: Request;
  cookies: AstroCookies;
}

export function createServerSupabaseClient({
  request,
  cookies,
}: ServerClientContext) {
  const config = requireSupabaseConfig({
    url: PUBLIC_SUPABASE_URL,
    publishableKey: PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('Cookie') ?? '');
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options);
        });
      },
    },
  });
}
