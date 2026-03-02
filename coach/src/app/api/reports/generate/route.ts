import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { supabaseServiceRoleClient } from '@/lib/supabase-server';
import { generateGeminiText } from '@/lib/ai/gemini-client';
import { loadProgramProfile } from '@/lib/parsers/schedule-parser';

interface WorkoutSessionRow {
  id: string;
  scheduled_date: string | null;
  status: string | null;
  session_type: string | null;
  planned_duration_minutes: number | null;
  actual_duration_minutes: number | null;
  performance: Record<string, unknown> | null;
}

interface RunningSessionRow {
  id: string;
  week: number | null;
  day: string | null;
  run_type: string | null;
  target_distance_km: number | null;
  target_pace: string | null;
  status: string | null;
  details: string | null;
  scheduled_date: string | null;
}

interface StravaActivityRow {
  id: string;
  distance_meters: number | null;
  duration_seconds: number | null;
  start_time: string | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
}

function formatDateString(date: Date) {
  return date.toISOString().split('T')[0];
}

function formatPace(secondsPerKm: number) {
  if (!Number.isFinite(secondsPerKm) || secondsPerKm <= 0) {
    return 'N/A';
  }

  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  const paddedSeconds = seconds.toString().padStart(2, '0');
  return `${minutes}:${paddedSeconds} /km`;
}

function getWeekRange(reference = new Date()) {
  const end = new Date(reference);
  end.setUTCHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - 6);
  start.setUTCHours(0, 0, 0, 0);
  return { start, end };
}

function buildReportId(userId: string, periodStart: string) {
  const hash = createHash('sha256').update(`${userId}-${periodStart}`).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const userId = (body.user_id as string) ?? request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
  }

  const { start, end } = getWeekRange();
  const startIso = formatDateString(start);
  const endIso = formatDateString(end);

  const [workoutRes, runningRes, stravaRes] = await Promise.all([
    supabaseServiceRoleClient
      .from('workout_sessions')
      .select('id,scheduled_date,status,session_type,planned_duration_minutes,actual_duration_minutes,performance')
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: false })
      .limit(100),
    supabaseServiceRoleClient
      .from('running_sessions')
      .select('id,week,day,run_type,target_distance_km,target_pace,status,details,scheduled_date')
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: false })
      .limit(100),
    supabaseServiceRoleClient
      .from('strava_activities')
      .select('id,distance_meters,duration_seconds,start_time,average_heartrate,max_heartrate')
      .eq('user_id', userId)
      .gte('start_time', start.toISOString())
      .lte('start_time', end.toISOString()),
  ]);

  if (workoutRes.error || runningRes.error || stravaRes.error) {
    const error = workoutRes.error ?? runningRes.error ?? stravaRes.error;
    return NextResponse.json({ error: error?.message ?? 'Failed to load activity data' }, { status: 500 });
  }

  const workouts = workoutRes.data ?? [];
  const recentWorkouts = workouts.filter((session) => {
    if (!session.scheduled_date) {
      return true;
    }
    const scheduled = new Date(session.scheduled_date);
    return scheduled >= start && scheduled <= end;
  });
  const runningSessions = runningRes.data ?? [];
  const stravaActivities = stravaRes.data ?? [];

  const gymStats = recentWorkouts.reduce(
    (acc, session) => {
      const planned = Number(session.planned_duration_minutes ?? 0);
      const actual = Number(session.actual_duration_minutes ?? 0);
      const rawSets = session.performance?.['sets'];
      const sets = Array.isArray(rawSets) ? (rawSets as Array<Record<string, unknown>>) : [];
      const { volume, setsCount, reps } = sets.reduce<{ volume: number; setsCount: number; reps: number }>(
        (innerAcc, set) => {
          const targetReps = Number(set['target_reps'] ?? set['actual_reps'] ?? 0);
          const actualReps = Number(set['actual_reps'] ?? set['target_reps'] ?? 0);
          const weight = Number(set['actual_weight'] ?? set['target_weight'] ?? 0);
          return {
            volume: innerAcc.volume + weight * (actualReps || targetReps || 0),
            setsCount: innerAcc.setsCount + 1,
            reps: innerAcc.reps + actualReps,
          };
        },
        { volume: 0, setsCount: 0, reps: 0 },
      );

      return {
        sessionCount: acc.sessionCount + 1,
        plannedMinutes: acc.plannedMinutes + planned,
        actualMinutes: acc.actualMinutes + actual,
        volume: acc.volume + volume,
        totalSets: acc.totalSets + setsCount,
        totalReps: acc.totalReps + reps,
      };
    },
    { sessionCount: 0, plannedMinutes: 0, actualMinutes: 0, volume: 0, totalSets: 0, totalReps: 0 },
  );

  const scheduledRuns = runningSessions.filter((session) => {
    if (!session.scheduled_date) {
      return true;
    }
    const scheduled = new Date(session.scheduled_date);
    return scheduled >= start && scheduled <= end;
  });

  const plannedDistance = scheduledRuns.reduce((sum, session) => sum + Number(session.target_distance_km ?? 0), 0);
  const plannedRunCount = scheduledRuns.length;
  const completedRunCount = scheduledRuns.filter((session) => session.status === 'completed').length;
  const complianceRate = plannedRunCount ? (completedRunCount / plannedRunCount) * 100 : 0;

  const totalStravaDistanceKm = stravaActivities.reduce((sum, activity) => sum + (Number(activity.distance_meters ?? 0) / 1000), 0);
  const totalDurationSeconds = stravaActivities.reduce((sum, activity) => sum + Number(activity.duration_seconds ?? 0), 0);
  const avgPaceSecondsPerKm = totalStravaDistanceKm ? totalDurationSeconds / totalStravaDistanceKm : 0;
  const avgHeartrate = stravaActivities.length
    ? stravaActivities.reduce((sum, activity) => sum + (Number(activity.average_heartrate ?? 0)), 0) / stravaActivities.length
    : 0;

  const profile = await loadProgramProfile();
  const athleteProfile = profile.athleteProfile as Record<string, unknown>;
  const baseline = athleteProfile['current_5k_baseline'] ?? 'unknown';
  const targetPace = athleteProfile['target_5k_pace'] ?? 'unknown';
  const injuryConcerns = Array.isArray(athleteProfile['injury_concerns'])
    ? (athleteProfile['injury_concerns'] as string[]).join(', ')
    : 'none provided';

  const prompt = [
    `You are a thoughtful coach analyzing seven days of data for ${profile.programName}.`,
    `Goal: baseline ${baseline}, target pace ${targetPace}.`,
    `Injury context: ${injuryConcerns}.`,
    `Reporting window: ${startIso} through ${endIso}.`,
    `Gym summary: ${gymStats.sessionCount} planned sessions with ${gymStats.actualMinutes} actual minutes vs ${gymStats.plannedMinutes} planned, ${gymStats.totalSets} sets, ${gymStats.totalReps} reps, ${Math.round(gymStats.volume)} total volume units.`,
    `Running summary: ${totalStravaDistanceKm.toFixed(2)} km tracked by Strava (${stravaActivities.length} activities) with ${formatPace(avgPaceSecondsPerKm)} average pace and ~${Math.round(avgHeartrate)} bpm average heart rate`,
    `Planned running: ${plannedDistance.toFixed(2)} km over ${plannedRunCount} sessions (${completedRunCount} completed, ${complianceRate.toFixed(0)}% compliance).`,
    `Give me a weekly report with sections for (1) Strength training insights, (2) Running insights, (3) Plan vs actual comparisons, (4) Next priorities / adjustments. Mention injuries and how they affect the plan.`,
  ].join('\n\n');

  let generatedText: string;

  try {
    generatedText = await generateGeminiText(prompt, { maxOutputTokens: 512 });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  const reportId = buildReportId(userId, startIso);
  const reportPayload = {
    id: reportId,
    user_id: userId,
    week_start: startIso,
    week_end: endIso,
    report_type: 'weekly',
    summary: generatedText.split('\n').slice(0, 5).join(' '),
    content: {
      promptSummary: prompt,
      gym: {
        sessionCount: gymStats.sessionCount,
        plannedMinutes: gymStats.plannedMinutes,
        actualMinutes: gymStats.actualMinutes,
        totalSets: gymStats.totalSets,
        totalReps: gymStats.totalReps,
        volume: Math.round(gymStats.volume),
      },
      runningGoals: {
        plannedDistance,
        plannedRunCount,
        complianceRate: Number(complianceRate.toFixed(1)),
      },
      strava: {
        activities: stravaActivities.map((activity) => ({
          id: activity.id,
          distanceMeters: activity.distance_meters,
          durationSeconds: activity.duration_seconds,
          startTime: activity.start_time,
        })),
      },
    },
    metrics: {
      gym: gymStats,
      runs: {
        plannedDistanceKm: Number(plannedDistance.toFixed(2)),
        stravaDistanceKm: Number(totalStravaDistanceKm.toFixed(2)),
        avgPaceSecondsPerKm: Number(avgPaceSecondsPerKm.toFixed(1)),
        avgHeartRate: Number(avgHeartrate.toFixed(1)),
        complianceRate: Number(complianceRate.toFixed(1)),
        plannedRunCount,
        completedRunCount,
        stravaActivityCount: stravaActivities.length,
      },
      range: { start: startIso, end: endIso },
    },
    generated_by: 'gemini-1.0',
    status: 'generated',
  };

  const { error: reportError } = await supabaseServiceRoleClient.from('weekly_reports').upsert(reportPayload, {
    onConflict: 'id',
  });

  if (reportError) {
    return NextResponse.json({ error: reportError.message }, { status: 500 });
  }

  return NextResponse.json({ report: reportPayload, text: generatedText });
}
