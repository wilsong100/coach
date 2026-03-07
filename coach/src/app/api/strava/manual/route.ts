import { NextResponse } from 'next/server';
import { supabaseServiceRoleClient } from '@/lib/supabase-server';
import { buildManualActivityRow } from '@/lib/strava/strava-service';

interface ManualRunPayload {
  user_id?: string;
  date: string;
  distance_km: number;
  pace?: string;
  notes?: string;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as ManualRunPayload;
  const userId = payload.user_id ?? request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
  }

  if (!payload.date || !payload.distance_km) {
    return NextResponse.json({ error: 'date and distance_km are required' }, { status: 400 });
  }

  try {
    const activity = buildManualActivityRow({
      userId,
      date: payload.date,
      distanceKm: payload.distance_km,
      pace: payload.pace,
      notes: payload.notes,
    });

    const { error: insertError } = await supabaseServiceRoleClient.from('strava_activities').upsert(activity, {
      onConflict: 'id',
    });

    if (insertError) {
      throw insertError;
    }

    const { data, error: fetchError } = await supabaseServiceRoleClient
      .from('strava_activities')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    return NextResponse.json({ activities: data ?? [] });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
