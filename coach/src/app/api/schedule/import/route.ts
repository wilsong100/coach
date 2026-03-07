import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { importScheduleForUser } from '@/lib/parsers/schedule-parser';

interface ImportPayload {
  user_id?: string;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as ImportPayload;
  const userId = payload.user_id ?? request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY) {
    const message =
      'Supabase service role key is required to import the schedule. Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY before calling this route.';
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const result = await importScheduleForUser(supabase, userId);
    return NextResponse.json({ ...result, user_id: userId });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
