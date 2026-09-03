import { createBrowserClient } from '@supabase/ssr';
import {
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  PUBLIC_SUPABASE_URL,
} from 'astro:env/client';

import { requireSupabaseConfig } from './config';

type BrowserClient = ReturnType<typeof createBrowserClient>;

let browserClient: BrowserClient | undefined;

export function createBrowserSupabaseClient(): BrowserClient {
  if (browserClient) {
    return browserClient;
  }

  const config = requireSupabaseConfig({
    url: PUBLIC_SUPABASE_URL,
    publishableKey: PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  browserClient = createBrowserClient(config.url, config.publishableKey);
  return browserClient;
}
