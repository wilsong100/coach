import { PostgrestError } from '@supabase/postgrest-js';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase-browser';
import { SupabaseExerciseSetRow } from '@/types/supabase';

interface ExerciseSetFilters {
  workoutSessionId?: string;
  exerciseId?: string;
}

const fetchExerciseSets = async (filters: ExerciseSetFilters = {}) => {
  let query = supabaseClient.from('exercise_sets').select('*').order('set_number');

  if (filters.workoutSessionId) {
    query = query.eq('workout_session_id', filters.workoutSessionId);
  }

  if (filters.exerciseId) {
    query = query.eq('exercise_id', filters.exerciseId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
};

export function useExerciseSets(
  filters?: ExerciseSetFilters,
  config?: UseQueryOptions<SupabaseExerciseSetRow[], PostgrestError>,
) {
  const { queryKey, queryFn, ...rest } = config ?? {};

  return useQuery<SupabaseExerciseSetRow[], PostgrestError>({
    queryKey: ['exerciseSets', filters],
    queryFn: () => fetchExerciseSets(filters),
    staleTime: 1000 * 60,
    ...rest,
  });
}
