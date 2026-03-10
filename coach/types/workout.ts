import { Json } from './supabase';

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface WeeklyStructureNode {
  activity: string;
  focus: string;
}

export interface WorkoutSet {
  set_number?: number | null;
  target_reps?: number | string | null;
  actual_reps?: number | string | null;
  target_weight?: number | string | null;
  actual_weight?: number | string | null;
  rest_seconds?: number | null;
  tempo?: string | null;
  notes?: string | null;
}

export interface RunningProgressionDay {
  speed: string;
  tempo: string;
  long: string;
}

export interface PeriodizationPhase {
  phase: string;
  weeks: number[];
  running_progression: Record<string, RunningProgressionDay>;
}

export interface StrengthProgressionRules {
  upper_body: string;
  lower_body: string;
  core: string;
}

export interface AthleteProfile {
  current_5k_baseline: string;
  target_5k_pace: string;
  injury_concerns: string[];
}

export interface TrainingSchedule {
  program_name: string;
  athlete_profile: AthleteProfile;
  weekly_structure: Record<Weekday, WeeklyStructureNode>;
  periodization_phases: PeriodizationPhase[];
  strength_progression_rules: StrengthProgressionRules;
}

export interface WorkoutPlanPayload {
  template: TrainingSchedule;
  start_date: string;
  end_date: string;
  notes?: string;
  metadata?: Json;
}
