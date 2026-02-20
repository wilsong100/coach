import { Json } from './supabase';

export interface WeeklyReportSummary {
  running: string;
  strength: string;
  general: string;
  highlights?: string[];
  notes?: string;
}

export interface WeeklyReportMetrics {
  total_volume?: number;
  average_pace?: string;
  consistency_rating?: number;
  [key: string]: number | string | undefined;
}

export interface WeeklyReportPayload {
  week_start: string;
  week_end: string;
  report_type?: string;
  summary: WeeklyReportSummary;
  content: Json;
  metrics: WeeklyReportMetrics;
  generated_by?: string;
  status?: 'draft' | 'generated' | 'sent';
}
