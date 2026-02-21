import { PostgrestError } from '@supabase/postgrest-js';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase-browser';
import { SupabaseStravaActivityRow } from '@/types/supabase';

interface StravaActivityFilters {
  runningSessionId?: string;
}

const fetchStravaActivities = async (filters: StravaActivityFilters = {}) => {
  let query = supabaseClient
    .from('strava_activities')
    .select('*')
    .order('start_time', { ascending: false });

  if (filters.runningSessionId) {
    query = query.eq('running_session_id', filters.runningSessionId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
};

export function useStravaActivities(
  filters?: StravaActivityFilters,
  config?: UseQueryOptions<SupabaseStravaActivityRow[], PostgrestError>,
) {
  const { queryKey, queryFn, ...rest } = config ?? {};
  const defaultKey = ['stravaActivities', filters];
  const defaultFn = () => fetchStravaActivities(filters);

  return useQuery<SupabaseStravaActivityRow[], PostgrestError>({
    queryKey: queryKey ?? defaultKey,
    queryFn: queryFn ?? defaultFn,
    staleTime: 1000 * 60 * 2,
    ...rest,
  });
}
