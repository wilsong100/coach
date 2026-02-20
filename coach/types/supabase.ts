export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Database {
  public: {
    users: {
      Row: {
        id: string;
        display_name: string | null;
        email: string | null;
        athlete_profile: Json;
        injury_concerns: string[];
        current_goals: Json | null;
        profile_completed: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        display_name?: string | null;
        email?: string | null;
        athlete_profile?: Json;
        injury_concerns?: string[];
        current_goals?: Json | null;
        profile_completed?: boolean;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        display_name?: string | null;
        email?: string | null;
        athlete_profile?: Json;
        injury_concerns?: string[];
        current_goals?: Json | null;
        profile_completed?: boolean;
        created_at?: string;
        updated_at?: string;
      };
    };
    workout_plans: {
      Row: {
        id: string;
        user_id: string;
        program_name: string;
        phase: string | null;
        start_date: string | null;
        end_date: string | null;
        schedule: Json;
        progress: Json;
        is_active: boolean;
        metadata: Json;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        user_id: string;
        program_name: string;
        phase?: string | null;
        start_date?: string | null;
        end_date?: string | null;
        schedule?: Json;
        progress?: Json;
        is_active?: boolean;
        metadata?: Json;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string;
        program_name?: string;
        phase?: string | null;
        start_date?: string | null;
        end_date?: string | null;
        schedule?: Json;
        progress?: Json;
        is_active?: boolean;
        metadata?: Json;
        created_at?: string;
        updated_at?: string;
      };
    };
    workout_sessions: {
      Row: {
        id: string;
        user_id: string;
        workout_plan_id: string | null;
        week: number | null;
        day: string | null;
        scheduled_date: string | null;
        activity: string | null;
        focus: string | null;
        notes: string | null;
        session_type: string;
        status: 'planned' | 'completed' | 'skipped';
        planned_duration_minutes: number | null;
        actual_duration_minutes: number | null;
        performance: Json;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        user_id: string;
        workout_plan_id?: string | null;
        week?: number | null;
        day?: string | null;
        scheduled_date?: string | null;
        activity?: string | null;
        focus?: string | null;
        notes?: string | null;
        session_type?: string;
        status?: 'planned' | 'completed' | 'skipped';
        planned_duration_minutes?: number | null;
        actual_duration_minutes?: number | null;
        performance?: Json;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string;
        workout_plan_id?: string | null;
        week?: number | null;
        day?: string | null;
        scheduled_date?: string | null;
        activity?: string | null;
        focus?: string | null;
        notes?: string | null;
        session_type?: string;
        status?: 'planned' | 'completed' | 'skipped';
        planned_duration_minutes?: number | null;
        actual_duration_minutes?: number | null;
        performance?: Json;
        created_at?: string;
        updated_at?: string;
      };
    };
    exercises: {
      Row: {
        id: string;
        user_id: string;
        name: string;
        primary_focus: string | null;
        movement_pattern: string | null;
        muscle_group: string | null;
        equipment: string | null;
        instructions: string | null;
        defaults: Json;
        is_active: boolean;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        user_id: string;
        name: string;
        primary_focus?: string | null;
        movement_pattern?: string | null;
        muscle_group?: string | null;
        equipment?: string | null;
        instructions?: string | null;
        defaults?: Json;
        is_active?: boolean;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string;
        name?: string;
        primary_focus?: string | null;
        movement_pattern?: string | null;
        muscle_group?: string | null;
        equipment?: string | null;
        instructions?: string | null;
        defaults?: Json;
        is_active?: boolean;
        created_at?: string;
        updated_at?: string;
      };
    };
    exercise_sets: {
      Row: {
        id: string;
        exercise_id: string;
        workout_session_id: string;
        user_id: string;
        set_number: number;
        target_reps: number | null;
        actual_reps: number | null;
        target_weight: string | null;
        actual_weight: string | null;
        rest_seconds: number | null;
        tempo: string | null;
        notes: string | null;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        exercise_id: string;
        workout_session_id: string;
        user_id: string;
        set_number: number;
        target_reps?: number | null;
        actual_reps?: number | null;
        target_weight?: string | null;
        actual_weight?: string | null;
        rest_seconds?: number | null;
        tempo?: string | null;
        notes?: string | null;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        exercise_id?: string;
        workout_session_id?: string;
        user_id?: string;
        set_number?: number;
        target_reps?: number | null;
        actual_reps?: number | null;
        target_weight?: string | null;
        actual_weight?: string | null;
        rest_seconds?: number | null;
        tempo?: string | null;
        notes?: string | null;
        created_at?: string;
        updated_at?: string;
      };
    };
    running_sessions: {
      Row: {
        id: string;
        user_id: string;
        workout_plan_id: string | null;
        week: number | null;
        day: string | null;
        run_type: string | null;
        scheduled_date: string | null;
        target_distance_km: string | null;
        target_pace: string | null;
        details: string | null;
        status: 'upcoming' | 'completed' | 'missed';
        actual_distance_km: string | null;
        actual_duration_minutes: string | null;
        route: Json;
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        user_id: string;
        workout_plan_id?: string | null;
        week?: number | null;
        day?: string | null;
        run_type?: string | null;
        scheduled_date?: string | null;
        target_distance_km?: string | null;
        target_pace?: string | null;
        details?: string | null;
        status?: 'upcoming' | 'completed' | 'missed';
        actual_distance_km?: string | null;
        actual_duration_minutes?: string | null;
        route?: Json;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string;
        workout_plan_id?: string | null;
        week?: number | null;
        day?: string | null;
        run_type?: string | null;
        scheduled_date?: string | null;
        target_distance_km?: string | null;
        target_pace?: string | null;
        details?: string | null;
        status?: 'upcoming' | 'completed' | 'missed';
        actual_distance_km?: string | null;
        actual_duration_minutes?: string | null;
        route?: Json;
        created_at?: string;
        updated_at?: string;
      };
    };
    strava_activities: {
      Row: {
        id: string;
        strava_id: number;
        user_id: string;
        running_session_id: string | null;
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
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        strava_id: number;
        user_id: string;
        running_session_id?: string | null;
        name?: string | null;
        activity_type?: string | null;
        distance_meters?: string | null;
        duration_seconds?: number | null;
        start_time?: string | null;
        average_heartrate?: string | null;
        max_heartrate?: string | null;
        pace?: Json;
        raw?: Json;
        synced_at?: string;
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        strava_id?: number;
        user_id?: string;
        running_session_id?: string | null;
        name?: string | null;
        activity_type?: string | null;
        distance_meters?: string | null;
        duration_seconds?: number | null;
        start_time?: string | null;
        average_heartrate?: string | null;
        max_heartrate?: string | null;
        pace?: Json;
        raw?: Json;
        synced_at?: string;
        created_at?: string;
        updated_at?: string;
      };
    };
    weekly_reports: {
      Row: {
        id: string;
        user_id: string;
        workout_plan_id: string | null;
        week_start: string;
        week_end: string;
        report_type: string;
        summary: string | null;
        content: Json;
        metrics: Json;
        generated_by: string | null;
        status: 'draft' | 'generated' | 'sent';
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        user_id: string;
        workout_plan_id?: string | null;
        week_start: string;
        week_end: string;
        report_type?: string;
        summary?: string | null;
        content?: Json;
        metrics?: Json;
        generated_by?: string | null;
        status?: 'draft' | 'generated' | 'sent';
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        user_id?: string;
        workout_plan_id?: string | null;
        week_start?: string;
        week_end?: string;
        report_type?: string;
        summary?: string | null;
        content?: Json;
        metrics?: Json;
        generated_by?: string | null;
        status?: 'draft' | 'generated' | 'sent';
        created_at?: string;
        updated_at?: string;
      };
    };
  };
}

export type SupabaseWorkoutPlanRow = Database['public']['workout_plans']['Row'];
export type SupabaseWorkoutSessionRow = Database['public']['workout_sessions']['Row'];
export type SupabaseExerciseSetRow = Database['public']['exercise_sets']['Row'];
export type SupabaseRunningSessionRow = Database['public']['running_sessions']['Row'];
export type SupabaseStravaActivityRow = Database['public']['strava_activities']['Row'];
export type SupabaseWeeklyReportRow = Database['public']['weekly_reports']['Row'];
