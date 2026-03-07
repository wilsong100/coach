import type { PostgrestError } from '@supabase/supabase-js';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase-browser';
import { SupabaseWorkoutSessionRow } from '@/types/supabase';

interface WorkoutSessionFilters {
  workoutPlanId?: string;
  week?: number;
  status?: 'planned' | 'completed' | 'skipped';
}

const fetchWorkoutSessions = async (filters: WorkoutSessionFilters = {}) => {
  let query = supabaseClient.from('workout_sessions').select('*').order('scheduled_date', { ascending: true });

  if (filters.workoutPlanId) {
    query = query.eq('workout_plan_id', filters.workoutPlanId);
  }

  if (typeof filters.week === 'number') {
    query = query.eq('week', filters.week);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
};

export function useWorkoutSessions(
  filters?: WorkoutSessionFilters,
  config?: UseQueryOptions<SupabaseWorkoutSessionRow[], PostgrestError>,
) {
  const { queryKey, queryFn, ...rest } = config ?? {};
  const defaultKey = ['workoutSessions', filters];
  const defaultFn = () => fetchWorkoutSessions(filters);

  return useQuery<SupabaseWorkoutSessionRow[], PostgrestError>({
    queryKey: queryKey ?? defaultKey,
    queryFn: queryFn ?? defaultFn,
    staleTime: 1000 * 60 * 3,
    ...rest,
  });
}
