BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Timestamp trigger helper
CREATE OR REPLACE FUNCTION public.set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.ensure_user_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, display_name, email, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''), NEW.email),
    NEW.email,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_user_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.ensure_user_profile();

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  athlete_profile JSONB NOT NULL DEFAULT '{}'::JSONB,
  injury_concerns TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  current_goals JSONB DEFAULT '{}'::JSONB,
  profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.users (profile_completed);
CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();

-- Helper to resolve the active profile
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Workout plans
CREATE TABLE public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  phase TEXT,
  start_date DATE,
  end_date DATE,
  schedule JSONB NOT NULL DEFAULT '{}'::JSONB,
  progress JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.workout_plans (user_id);
CREATE INDEX ON public.workout_plans (user_id, is_active);
CREATE INDEX ON public.workout_plans (program_name);
CREATE TRIGGER set_timestamp_workout_plans
BEFORE UPDATE ON public.workout_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();

-- Workout sessions
CREATE TABLE public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  week INTEGER,
  day TEXT,
  scheduled_date DATE,
  activity TEXT,
  focus TEXT,
  notes TEXT,
  session_type TEXT NOT NULL DEFAULT 'strength',
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'skipped')),
  planned_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  performance JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.workout_sessions (user_id);
CREATE INDEX ON public.workout_sessions (scheduled_date);
CREATE INDEX ON public.workout_sessions (workout_plan_id);
CREATE TRIGGER set_timestamp_workout_sessions
BEFORE UPDATE ON public.workout_sessions
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();

-- Exercises
CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  primary_focus TEXT,
  movement_pattern TEXT,
  muscle_group TEXT,
  equipment TEXT,
  instructions TEXT,
  defaults JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.exercises (user_id);
CREATE INDEX ON public.exercises (name);
CREATE TRIGGER set_timestamp_exercises
BEFORE UPDATE ON public.exercises
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();

-- Exercise sets
CREATE TABLE public.exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  workout_session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  target_reps INTEGER,
  actual_reps INTEGER,
  target_weight NUMERIC(6,2),
  actual_weight NUMERIC(6,2),
  rest_seconds INTEGER,
  tempo TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.exercise_sets (user_id);
CREATE INDEX ON public.exercise_sets (workout_session_id);
CREATE INDEX ON public.exercise_sets (exercise_id);
CREATE TRIGGER set_timestamp_exercise_sets
BEFORE UPDATE ON public.exercise_sets
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();

-- Running sessions (planned)
CREATE TABLE public.running_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  week INTEGER,
  day TEXT,
  run_type TEXT,
  scheduled_date DATE,
  target_distance_km NUMERIC(5,2),
  target_pace TEXT,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'missed')),
  actual_distance_km NUMERIC(6,2),
  actual_duration_minutes NUMERIC(6,2),
  route JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.running_sessions (user_id);
CREATE INDEX ON public.running_sessions (scheduled_date);
CREATE INDEX ON public.running_sessions (workout_plan_id);
CREATE TRIGGER set_timestamp_running_sessions
BEFORE UPDATE ON public.running_sessions
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();

-- Strava activities
CREATE TABLE public.strava_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strava_id BIGINT NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  running_session_id UUID REFERENCES public.running_sessions(id) ON DELETE SET NULL,
  name TEXT,
  activity_type TEXT,
  distance_meters NUMERIC(10,2),
  duration_seconds INTEGER,
  start_time TIMESTAMPTZ,
  average_heartrate NUMERIC(5,2),
  max_heartrate NUMERIC(5,2),
  pace JSONB NOT NULL DEFAULT '{}'::JSONB,
  raw JSONB NOT NULL DEFAULT '{}'::JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON public.strava_activities (user_id, strava_id);
CREATE INDEX ON public.strava_activities (user_id);
CREATE INDEX ON public.strava_activities (start_time);
CREATE TRIGGER set_timestamp_strava_activities
BEFORE UPDATE ON public.strava_activities
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();

-- Weekly reports
CREATE TABLE public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'weekly',
  summary TEXT,
  content JSONB NOT NULL DEFAULT '{}'::JSONB,
  metrics JSONB NOT NULL DEFAULT '{}'::JSONB,
  generated_by TEXT,
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('draft', 'generated', 'sent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON public.weekly_reports (user_id, week_start);
CREATE INDEX ON public.weekly_reports (user_id);
CREATE TRIGGER set_timestamp_weekly_reports
BEFORE UPDATE ON public.weekly_reports
FOR EACH ROW
EXECUTE FUNCTION public.set_timestamp();

-- Enable RLS and policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their profile" ON public.users
  FOR ALL
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own plans" ON public.workout_plans
  FOR ALL
  USING (user_id = public.current_profile_id())
  WITH CHECK (user_id = public.current_profile_id());

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sessions" ON public.workout_sessions
  FOR ALL
  USING (user_id = public.current_profile_id())
  WITH CHECK (user_id = public.current_profile_id());

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own exercises" ON public.exercises
  FOR ALL
  USING (user_id = public.current_profile_id())
  WITH CHECK (user_id = public.current_profile_id());

ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sets" ON public.exercise_sets
  FOR ALL
  USING (user_id = public.current_profile_id())
  WITH CHECK (user_id = public.current_profile_id());

ALTER TABLE public.running_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own runs" ON public.running_sessions
  FOR ALL
  USING (user_id = public.current_profile_id())
  WITH CHECK (user_id = public.current_profile_id());

ALTER TABLE public.strava_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own Strava data" ON public.strava_activities
  FOR ALL
  USING (user_id = public.current_profile_id())
  WITH CHECK (user_id = public.current_profile_id());

ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their reports" ON public.weekly_reports
  FOR ALL
  USING (user_id = public.current_profile_id())
  WITH CHECK (user_id = public.current_profile_id());

COMMIT;
