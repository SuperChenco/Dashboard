import { defineMiddleware } from 'astro:middleware';
import {
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  PUBLIC_SUPABASE_URL,
} from 'astro:env/client';

import { hasSupabaseConfig } from '@/lib/supabase/config';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const PUBLIC_ROUTES = new Set([
  '/login',
  '/configuration-required',
  '/api/auth/sign-in',
]);

function isPublicAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/_astro/') ||
    pathname.startsWith('/icons/') ||
    ['/favicon.ico', '/favicon.svg', '/manifest.webmanifest'].includes(pathname)
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  const configured = hasSupabaseConfig({
    url: PUBLIC_SUPABASE_URL,
    publishableKey: PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  const path = context.url.pathname;

  if (!configured) {
    context.locals.user = null;
    context.locals.authMode = import.meta.env.DEV
      ? 'local-development'
      : 'unconfigured';
    if (
      import.meta.env.PROD &&
      path !== '/configuration-required' &&
      !isPublicAsset(path)
    ) {
      return context.redirect('/configuration-required');
    }
    return next();
  }

  const supabase = createServerSupabaseClient(context);
  const { data, error } = await supabase.auth.getUser();
  context.locals.user =
    !error && data.user ? { id: data.user.id, email: data.user.email } : null;
  context.locals.authMode = 'supabase';

  if (isPublicAsset(path) || path === '/api/auth/sign-out') return next();
  if (PUBLIC_ROUTES.has(path)) {
    if (path === '/login' && context.locals.user) return context.redirect('/');
    return next();
  }
  if (!context.locals.user) {
    const login = new URL('/login', context.url);
    login.searchParams.set('next', `${path}${context.url.search}`);
    return context.redirect(login.toString());
  }
  return next();
});
