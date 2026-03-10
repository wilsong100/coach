import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

const SCHEDULE_PATH = path.join(process.cwd(), 'docs', 'schedule.json');

type WeeklyStructure = Record<
  string,
  {
    activity: string;
    focus: string;
  }
>;

interface RunningProgression {
  [week: string]: {
    speed?: string;
    tempo?: string;
    long?: string;
  };
}

export interface ScheduleDocument {
  program_name: string;
  athlete_profile: Record<string, unknown>;
  weekly_structure: WeeklyStructure;
  periodization_phases: Array<{
    phase: string;
    weeks: number[];
    running_progression: RunningProgression;
  }>;
  strength_progression_rules: Record<string, string>;
}

export interface ScheduleImportResult {
  programName: string;
  workoutsInserted: number;
  runsInserted: number;
  startDate: string;
  endDate: string;
}

function stableUuid(value: string) {
  const hash = createHash('sha256').update(value).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

async function loadSchedule(): Promise<ScheduleDocument> {
  const contents = await readFile(SCHEDULE_PATH, 'utf-8');
  return JSON.parse(contents) as ScheduleDocument;
}

export interface ImportScheduleOptions {
  startDate?: string;
}

export async function importScheduleForUser(
  client: SupabaseClient,
  userId: string,
  options?: ImportScheduleOptions,
): Promise<ScheduleImportResult> {
  if (!userId) {
    throw new Error('User ID is required to import the schedule');
  }

  const schedule = await loadSchedule();
  const programName = schedule.program_name;

  const start = options?.startDate ? new Date(options.startDate) : new Date();
  const safeStart = Number.isNaN(start.getTime()) ? new Date() : start;
  const end = new Date(safeStart);
  end.setUTCDate(end.getUTCDate() + 7 * 12 - 1);

  const workoutPlanRows = [
    {
      id: stableUuid(`schedule-plan-${userId}-${programName}`),
      user_id: userId,
      program_name: programName,
      phase: schedule.periodization_phases[0]?.phase ?? 'foundation',
      start_date: safeStart.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      schedule: schedule.weekly_structure,
      progress: {},
      metadata: {
        athlete_profile: schedule.athlete_profile,
        periodization_phases: schedule.periodization_phases,
        strength_progression_rules: schedule.strength_progression_rules,
      },
      is_active: true,
    },
  ];

  const runningRows: Array<Record<string, unknown>> = [];

  for (const phase of schedule.periodization_phases) {
    for (const weekNumber of phase.weeks) {
      const progression = phase.running_progression[`week_${weekNumber}`];
      if (!progression) {
        continue;
      }

      for (const [type, detail] of Object.entries(progression)) {
        if (!detail) {
          continue;
        }

        runningRows.push({
          id: stableUuid(`schedule-run-${userId}-${programName}-${phase.phase}-${weekNumber}-${type}`),
          user_id: userId,
          program_name: programName,
          phase: phase.phase,
          week: weekNumber,
          day: `Week ${weekNumber}`,
          run_type: type,
          scheduled_date: null,
          target_distance_km: null,
          target_pace: null,
          details: detail,
          status: 'upcoming',
          route: { source: 'schedule-json', phase: phase.phase, type },
        });
      }
    }
  }

  const { error: workoutError } = await client.from('workout_plans').upsert(workoutPlanRows, {
    onConflict: 'id',
  });

  if (workoutError) {
    throw workoutError;
  }

  const { error: runError } = await client.from('running_sessions').upsert(runningRows, {
    onConflict: 'id',
  });

  if (runError) {
    throw runError;
  }

  return {
    programName,
    workoutsInserted: workoutPlanRows.length,
    runsInserted: runningRows.length,
    startDate: safeStart.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

export async function loadProgramProfile() {
  const schedule = await loadSchedule();
  return {
    programName: schedule.program_name,
    athleteProfile: schedule.athlete_profile,
    strengthProgressionRules: schedule.strength_progression_rules,
  };
}
