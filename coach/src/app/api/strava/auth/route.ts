import { NextResponse } from 'next/server';
import { buildStravaAuthUrl } from '@/lib/strava/strava-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id query parameter' }, { status: 400 });
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
  const redirectUri = `${siteUrl}/api/strava/callback`;

  try {
    const authUrl = buildStravaAuthUrl({ userId, redirectUri });
    return NextResponse.redirect(authUrl);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
