import { NextResponse } from 'next/server';
import { supabaseServiceRoleClient } from '@/lib/supabase-server';
import { decodeState, exchangeCodeForToken, storeTokenFromCode } from '@/lib/strava/strava-service';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code || !state) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  const userId = decodeState(state);
  if (!userId) {
    return NextResponse.json({ error: 'Unable to decode state' }, { status: 400 });
  }

  try {
    const token = await exchangeCodeForToken(code);
    await storeTokenFromCode(supabaseServiceRoleClient, userId, token);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
  const redirectUrl = new URL(siteUrl);
  redirectUrl.searchParams.set('source', 'strava');
  redirectUrl.pathname = '/';

  return NextResponse.redirect(redirectUrl);
}
