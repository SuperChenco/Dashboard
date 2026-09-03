import type { APIRoute } from 'astro';

import { safeNextPath } from '@/lib/auth/redirect';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const nextPath = safeNextPath(form.get('next'));
  if (!email || !password) {
    return context.redirect('/login?error=请输入邮箱和密码。', 303);
  }
  const supabase = createServerSupabaseClient(context);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const login = new URL('/login', context.url);
    login.searchParams.set('error', '登录失败，请检查邮箱或密码。');
    login.searchParams.set('next', nextPath);
    return context.redirect(login.toString(), 303);
  }
  return context.redirect(nextPath, 303);
};
