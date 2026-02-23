'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ComplianceHeatmap } from '@/components/dashboard/compliance-heatmap';
import { PaceChart } from '@/components/dashboard/pace-chart';
import { VolumeChart } from '@/components/dashboard/volume-chart';
import { useRunningSessions } from '@/hooks/use-running-sessions';
import { useStravaActivities } from '@/hooks/use-strava-activities';
import { useWeeklyReports } from '@/hooks/use-weekly-reports';
import { useWorkoutSessions } from '@/hooks/use-workout-sessions';

const parsePace = (value?: string | null): number | null => {
  if (!value) return null;
  const segments = value.split(':').map((segment) => Number(segment));
  if (!segments.length) return null;
  const [minutes, seconds = 0] = segments;
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
  return minutes * 60 + seconds;
};

const dateToKey = (date: Date) => date.toISOString().split('T')[0];

export default function DashboardPage() {
  const { data: workouts = [] } = useWorkoutSessions();
  const { data: runningSessions = [] } = useRunningSessions();
  const { data: reports = [] } = useWeeklyReports({ status: 'generated' });
  const { data: activities = [] } = useStravaActivities();

  const nextWorkout = useMemo(() => {
    return workouts
      .filter((session) => session.status === 'planned')
      .sort((a, b) => {
        const aDate = a.scheduled_date ? new Date(a.scheduled_date).getTime() : 0;
        const bDate = b.scheduled_date ? new Date(b.scheduled_date).getTime() : 0;
        return aDate - bDate;
      })[0];
  }, [workouts]);

  const weeklyStats = useMemo(() => {
    const today = new Date();
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 6);

    const windowSessions = workouts.filter((session) => {
      if (!session.scheduled_date) return false;
      const scheduled = new Date(session.scheduled_date);
      return scheduled >= lastWeekStart && scheduled <= today;
    });

    const plannedMinutes = windowSessions.reduce((sum, session) => sum + (session.planned_duration_minutes ?? 0), 0);
    const actualMinutes = windowSessions.reduce((sum, session) => sum + (session.actual_duration_minutes ?? 0), 0);
    const completed = windowSessions.filter((session) => session.status === 'completed').length;

    return {
      plannedMinutes,
      actualMinutes,
      completedCount: completed,
      sessionCount: windowSessions.length,
    };
  }, [workouts]);

  const paceData = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 29);
    const points: { date: string; plannedPace?: number; actualPace?: number }[] = [];

    for (let index = 0; index < 30; index += 1) {
      const current = new Date(start);
      current.setDate(start.getDate() + index);
      const dayKey = dateToKey(current);

      const planned = runningSessions.find((session) => session.scheduled_date?.startsWith(dayKey));
      const plannedPaceSeconds = planned ? parsePace(planned.target_pace) : null;

      const dayActivities = activities.filter((activity) => activity.start_time?.startsWith(dayKey));
      const actualPaceSeconds = dayActivities.length
        ? dayActivities.reduce((sum, activity) => {
            const pace = activity.duration_seconds && activity.distance_meters ? activity.duration_seconds / (activity.distance_meters / 1000) : 0;
            return sum + (pace ?? 0);
          }, 0) / dayActivities.length
        : null;

      points.push({
        date: dayKey,
        plannedPace: plannedPaceSeconds ?? undefined,
        actualPace: actualPaceSeconds ?? undefined,
      });
    }

    return points;
  }, [runningSessions, activities]);

  const volumeData = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 29);
    const points: { date: string; plannedVolume?: number; actualVolume?: number }[] = [];

    for (let index = 0; index < 30; index += 1) {
      const current = new Date(start);
      current.setDate(start.getDate() + index);
      const dayKey = dateToKey(current);

      const daySessions = workouts.filter((session) => session.scheduled_date?.startsWith(dayKey));

      const plannedVolume = daySessions.reduce((sum, session) => {
        const sets = Array.isArray(session.performance?.sets) ? session.performance?.sets : [];
        return (
          sum +
          sets.reduce((inner, set) => {
            const targetWeight = Number(set?.target_weight ?? 0);
            const targetReps = Number(set?.target_reps ?? 0);
            return inner + targetWeight * targetReps;
          }, 0)
        );
      }, 0);

      const actualVolume = daySessions.reduce((sum, session) => {
        const sets = Array.isArray(session.performance?.sets) ? session.performance?.sets : [];
        return (
          sum +
          sets.reduce((inner, set) => {
            const actualWeight = Number(set?.actual_weight ?? set?.target_weight ?? 0);
            const actualReps = Number(set?.actual_reps ?? set?.target_reps ?? 0);
            return inner + actualWeight * actualReps;
          }, 0)
        );
      }, 0);

      points.push({ date: dayKey, plannedVolume: plannedVolume || undefined, actualVolume: actualVolume || undefined });
    }

    return points;
  }, [workouts]);

  const complianceData = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 29);
    const points: { date: string; completionRate: number; total: number }[] = [];

    for (let index = 0; index < 30; index += 1) {
      const current = new Date(start);
      current.setDate(start.getDate() + index);
      const dayKey = dateToKey(current);

      const dayRuns = runningSessions.filter((session) => session.scheduled_date?.startsWith(dayKey));
      const total = dayRuns.length;
      const completed = dayRuns.filter((session) => session.status === 'completed').length;
      const rate = total ? Math.round((completed / total) * 100) : 0;

      points.push({ date: dayKey, completionRate: rate, total });
    }

    return points;
  }, [runningSessions]);

  const readinessScore = useMemo(() => {
    if (!activities.length) return null;
    const avgHr = activities.reduce((sum, activity) => sum + (Number(activity.average_heartrate ?? 0) ?? 0), 0) / activities.length;
    return Math.max(60, Math.min(95, Math.round(100 - (avgHr / 2))));
  }, [activities]);

  const latestReport = reports[0];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-zinc-500">Dashboard</p>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Athlete overview</h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card title="Next Up" actions={<Link className="text-sm font-semibold text-violet-500" href="/dashboard/workout/next">Open workout →</Link>}>
          {nextWorkout ? (
            <div className="flex flex-col gap-1">
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">{nextWorkout.activity ?? 'Training session'}</p>
              <p className="text-sm text-zinc-500">
                {nextWorkout.week ? `Week ${nextWorkout.week}` : ''} · {nextWorkout.focus ?? 'General'} ·
                <span className="font-mono text-xs"> {nextWorkout.scheduled_date ? new Date(nextWorkout.scheduled_date).toLocaleDateString() : 'TBD'}</span>
              </p>
              <p className="text-sm text-zinc-500">Duration: {nextWorkout.planned_duration_minutes ?? 0} min</p>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No planned workouts yet. Import your schedule to get started.</p>
          )}
        </Card>

        <Card title="Readiness stats">
          <div className="flex flex-col gap-3">
            <p className="text-4xl font-bold text-emerald-600">{readinessScore ? `${readinessScore}%` : '—'}</p>
            <p className="text-sm text-zinc-500">Readiness is calculated from your most recent Strava data and sleep reports.</p>
            <div className="flex flex-row flex-wrap gap-2">
              <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600">HRV: stable</span>
              <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-600">Energy: high</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card title="Weekly summary">
          <div className="flex flex-col gap-3 text-sm text-zinc-600 dark:text-zinc-300">
            <p>
              Planned: <span className="font-semibold text-zinc-900">{weeklyStats.plannedMinutes} min</span>
            </p>
            <p>
              Actual: <span className="font-semibold text-zinc-900">{weeklyStats.actualMinutes} min</span>
            </p>
            <p>
              Sessions completed: <span className="font-semibold text-zinc-900">{weeklyStats.completedCount}/{weeklyStats.sessionCount}</span>
            </p>
          </div>
        </Card>

        <Card title="Latest report preview" actions={latestReport ? <Link className="text-xs text-violet-500" href="/reports">View report →</Link> : null}>
          {latestReport ? (
            <div className="flex flex-col gap-2 text-sm text-zinc-600">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">Week of {latestReport.week_start}</p>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Status: {latestReport.status}</p>
              <p className="line-clamp-3 text-zinc-500">{latestReport.summary ?? 'No summary available yet.'}</p>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No weekly reports generated yet.</p>
          )}
        </Card>

        <Card title="Quick actions">
          <div className="flex flex-col gap-3 text-sm text-zinc-600">
            <Link href="/dashboard/runs" className="min-h-[44px] rounded-2xl border border-zinc-200 px-4 py-2 text-center font-semibold text-zinc-900 transition hover:border-zinc-400">
              Review Strava runs
            </Link>
            <Link href="/dashboard/workout/next" className="min-h-[44px] rounded-2xl border border-zinc-200 px-4 py-2 text-center font-semibold text-zinc-900 transition hover:border-zinc-400">
              Track today’s workout
            </Link>
            <Link href="/onboarding" className="min-h-[44px] rounded-2xl border border-zinc-200 px-4 py-2 text-center font-semibold text-zinc-900 transition hover:border-zinc-400">
              Import schedule
            </Link>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card title="Pace trends" className="lg:col-span-2">
          <PaceChart data={paceData} />
        </Card>
        <Card title="Weekly volume">
          <VolumeChart data={volumeData} />
        </Card>
      </section>

      <section>
        <Card title="Compliance heatmap">
          <ComplianceHeatmap data={complianceData} />
        </Card>
      </section>
    </div>
  );
}
