import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

function createSupabaseServerClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!supabaseKey) {
    const message =
      'Missing Supabase service role key (required for schedule imports, Strava sync, and report generation). Set SUPABASE_SERVICE_ROLE_KEY or NEXT_PRIVATE_SUPABASE_SERVICE_ROLE_KEY in your environment.';
    console.error(message);
    throw new Error(message);
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    global: { headers: { 'x-requested-with': 'supabase-js' } },
  });
}

export function getSupabaseServerClient(): SupabaseClient {
  if (!cachedClient) {
    cachedClient = createSupabaseServerClient();
  }
  return cachedClient;
}

export const supabaseServiceRoleClient = getSupabaseServerClient();
