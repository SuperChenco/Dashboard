export interface SupabasePublicConfigInput {
  url?: string;
  publishableKey?: string;
}

export interface SupabasePublicConfig {
  url: string;
  publishableKey: string;
}

export function requireSupabaseConfig(
  input: SupabasePublicConfigInput,
): SupabasePublicConfig {
  const url = input.url?.trim();
  const publishableKey = input.publishableKey?.trim();

  if (!url || !publishableKey) {
    throw new Error(
      'Supabase is not configured. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  try {
    new URL(url);
  } catch {
    throw new Error('PUBLIC_SUPABASE_URL must be a valid absolute URL.');
  }

  return { url, publishableKey };
}
