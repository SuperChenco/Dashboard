import type { APIRoute } from 'astro';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export const GET: APIRoute = async (context) => {
  if (!context.locals.user)
    return new Response('Unauthorized', { status: 401 });
  const supabase = createServerSupabaseClient(context);
  const { data, error } = await supabase.rpc('load_workflow_state');
  if (error) return new Response('Export failed', { status: 500 });
  const timestamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="p-ceo-os-${timestamp}.json"`,
      'Cache-Control': 'private, no-store',
    },
  });
};
