import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import {
  ensureFreshStravaTokens,
  fetchStravaActivities,
  upsertStravaActivities,
  RateLimitInfo,
} from '@/lib/strava/strava-service';

interface SyncRequestBody {
  user_id?: string;
  after?: number;
}

interface SyncResult {
  synced: number;
  rateLimit?: RateLimitInfo | null;
  lastSynced?: string;
}

export async function POST(request: Request) {
  let payload: SyncRequestBody = {};

  try {
    payload = (await request.json()) as SyncRequestBody;
  } catch {
    // Ignore parse errors; we can still proceed if headers carry user_id
  }

  const userId = payload.user_id ?? request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { access_token: accessToken } = await ensureFreshStravaTokens(supabase, userId);

    let after = payload.after;

      if (!after) {
        const { data: latest } = await supabase
        .from('strava_activities')
        .select('start_time')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();

      if (latest?.start_time) {
        after = Math.floor(new Date(latest.start_time).getTime() / 1000);
      }
    }

    const { activities, rateLimit } = await fetchStravaActivities(accessToken, after);

    if (activities.length) {
      await upsertStravaActivities(supabase, userId, activities);
    }

    const result: SyncResult = {
      synced: activities.length,
      rateLimit,
      lastSynced: activities.at(0)?.start_date_local,
    };

    if (rateLimit && rateLimit.appUsage >= rateLimit.appLimit) {
      return NextResponse.json(result, { status: 429 });
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
