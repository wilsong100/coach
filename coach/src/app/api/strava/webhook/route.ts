import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import {
  ensureFreshStravaTokens,
  fetchStravaActivities,
  upsertStravaActivities,
  verifyWebhookSignature,
} from '@/lib/strava/strava-service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('hub.challenge');

  if (challenge) {
    return NextResponse.json({ 'hub.challenge': challenge });
  }

  return NextResponse.json({ status: 'waiting for challenge' });
}

export async function POST(request: Request) {
  const signature = request.headers.get('x-strava-signature');
  const rawBody = await request.text();

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const ownerId = Number(payload?.owner_id ?? payload?.ownerId);

  if (!ownerId || Number.isNaN(ownerId)) {
    return NextResponse.json({ received: true });
  }

  const supabase = getSupabaseServerClient();
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('athlete_profile->strava->>athlete_id', ownerId.toString())
    .maybeSingle();

  if (user?.id) {
    try {
      const { access_token: accessToken } = await ensureFreshStravaTokens(supabase, user.id);
      const { activities } = await fetchStravaActivities(accessToken);
      if (activities.length) {
        await upsertStravaActivities(supabase, user.id, activities);
      }
    } catch (error) {
      console.warn('Failed to sync Strava webhook event', error);
    }
  }

  return NextResponse.json({ received: true });
}
