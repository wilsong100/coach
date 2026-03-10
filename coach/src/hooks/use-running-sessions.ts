import type { PostgrestError } from '@supabase/supabase-js';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase-browser';
import { SupabaseRunningSessionRow } from '@/types/supabase';

interface RunningSessionFilters {
  workoutPlanId?: string;
  status?: 'upcoming' | 'completed' | 'missed';
  week?: number;
}

const fetchRunningSessions = async (filters: RunningSessionFilters = {}) => {
  let query = supabaseClient.from('running_sessions').select('*').order('scheduled_date', { ascending: true });

  if (filters.workoutPlanId) {
    query = query.eq('workout_plan_id', filters.workoutPlanId);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (typeof filters.week === 'number') {
    query = query.eq('week', filters.week);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
};

export function useRunningSessions(
  filters?: RunningSessionFilters,
  config?: UseQueryOptions<SupabaseRunningSessionRow[], PostgrestError>,
) {
  const { queryKey, queryFn, ...rest } = config ?? {};
  const defaultKey = ['runningSessions', filters];
  const defaultFn = () => fetchRunningSessions(filters);

  return useQuery<SupabaseRunningSessionRow[], PostgrestError>({
    queryKey: queryKey ?? defaultKey,
    queryFn: queryFn ?? defaultFn,
    staleTime: 1000 * 60 * 2,
    ...rest,
  });
}
