import type { APIRoute } from 'astro';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export const POST: APIRoute = async (context) => {
  const supabase = createServerSupabaseClient(context);
  await supabase.auth.signOut();
  return context.redirect('/login', 303);
};
