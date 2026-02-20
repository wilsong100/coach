import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { PostgrestError } from '@supabase/postgrest-js';
import { supabaseClient } from '@/lib/supabase-browser';
import { SupabaseWorkoutPlanRow } from '@/types/supabase';

const fetchWorkoutPlans = async () => {
  const { data, error } = await supabaseClient
    .from('workout_plans')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
};

export function useWorkoutPlans(
  config?: UseQueryOptions<SupabaseWorkoutPlanRow[], PostgrestError>,
) {
  const { queryKey, queryFn, ...rest } = config ?? {};

  return useQuery<SupabaseWorkoutPlanRow[], PostgrestError>({
    queryKey: ['workoutPlans'],
    queryFn: fetchWorkoutPlans,
    staleTime: 1000 * 60 * 5,
    ...rest,
  });
}
