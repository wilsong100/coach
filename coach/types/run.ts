import { Json } from './supabase';
import { Weekday } from './workout';

export interface PlannedRun {
  week: number | null;
  day: Weekday | null;
  run_type: string | null;
  scheduled_date: string | null;
  target_distance_km: string | null;
  target_pace: string | null;
  details: string | null;
  status: 'upcoming' | 'completed' | 'missed';
  metadata?: Json;
}

export interface RunningProgressionEntry {
  speed: string;
  tempo: string;
  long: string;
}

export interface StravaActivitySummary {
  strava_id: number;
  name: string | null;
  activity_type: string | null;
  distance_meters: string | null;
  duration_seconds: number | null;
  start_time: string | null;
  average_heartrate: string | null;
  max_heartrate: string | null;
  pace: Json;
  raw: Json;
  synced_at: string;
}
