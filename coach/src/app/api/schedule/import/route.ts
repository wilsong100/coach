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

  try {
    const supabase = getSupabaseServerClient();
    const result = await importScheduleForUser(supabase, userId);
    return NextResponse.json({ ...result, user_id: userId });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
