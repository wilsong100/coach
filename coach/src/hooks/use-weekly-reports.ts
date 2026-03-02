import type { PostgrestError } from '@supabase/supabase-js';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabaseClient } from '@/lib/supabase-browser';
import { SupabaseWeeklyReportRow } from '@/types/supabase';

interface WeeklyReportFilters {
  weekStart?: string;
  status?: 'draft' | 'generated' | 'sent';
}

const fetchWeeklyReports = async (filters: WeeklyReportFilters = {}) => {
  let query = supabaseClient
    .from('weekly_reports')
    .select('*')
    .order('week_start', { ascending: false });

  if (filters.weekStart) {
    query = query.eq('week_start', filters.weekStart);
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

export function useWeeklyReports(
  filters?: WeeklyReportFilters,
  config?: UseQueryOptions<SupabaseWeeklyReportRow[], PostgrestError>,
) {
  const { queryKey, queryFn, ...rest } = config ?? {};
  const defaultKey = ['weeklyReports', filters];
  const defaultFn = () => fetchWeeklyReports(filters);

  return useQuery<SupabaseWeeklyReportRow[], PostgrestError>({
    queryKey: queryKey ?? defaultKey,
    queryFn: queryFn ?? defaultFn,
    staleTime: 1000 * 60 * 5,
    ...rest,
  });
}
