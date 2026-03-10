"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ExerciseCard } from "@/components/workout/exercise-card";
import { SessionTimer } from "@/components/workout/session-timer";
import { useExerciseSets } from "@/hooks/use-exercise-sets";
import { useWorkoutSessions } from "@/hooks/use-workout-sessions";
import type { SupabaseExerciseSetRow } from "../../../../../../types/supabase";

interface WorkoutSessionPageProps {
  params: {
    sessionId: string;
  };
}

export default function WorkoutSessionPage({ params }: WorkoutSessionPageProps) {
  const { sessionId } = params;
  const { data: sessions = [] } = useWorkoutSessions();
  const fetchId = sessionId === "next" ? undefined : sessionId;
  const { data: sets = [] } = useExerciseSets({ workoutSessionId: fetchId });

  const session = useMemo(() => {
    if (sessionId === "next") {
      return sessions.find((sessionItem) => sessionItem.status === "planned");
    }
    return sessions.find((sessionItem) => sessionItem.id === sessionId);
  }, [sessionId, sessions]);

  const groupedSets = useMemo(() => {
    if (!sets.length) return [];
    const bucket: Record<string, SupabaseExerciseSetRow[]> = {};
    sets.forEach((set) => {
      const key = set.exercise_id ?? "exercise";
      bucket[key] = bucket[key] ?? [];
      bucket[key].push(set);
    });
    return Object.entries(bucket).map(([exerciseId, exerciseSets]) => ({ exerciseId, sets: exerciseSets }));
  }, [sets]);

  if (!session) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-10 text-center">
        <h1 className="text-2xl font-semibold">Workout not found</h1>
        <p className="text-sm text-zinc-500">Pick another workout from your dashboard.</p>
        <Link href="/dashboard" className="rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-900">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Workout</p>
        <h1 className="text-3xl font-bold text-zinc-900">{session.activity ?? "Training session"}</h1>
        <p className="text-sm text-zinc-500">
          Week {session.week ?? "—"} · {session.focus ?? "General focus"} · {session.session_type ?? "strength"}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Timer">
          <SessionTimer plannedMinutes={session.planned_duration_minutes} />
        </Card>
        <Card title="Session summary" className="lg:col-span-2">
          <div className="grid gap-3 text-sm text-zinc-600 dark:text-zinc-300">
            <p>
              Duration planned: <span className="font-semibold text-zinc-900">{session.planned_duration_minutes ?? "—"} min</span>
            </p>
            <p>
              Status: <span className="font-semibold text-zinc-900">{session.status}</span>
            </p>
            <p>Notes: {session.notes ?? "No notes yet"}</p>
          </div>
        </Card>
      </div>

      <section className="flex flex-col gap-4">
        {groupedSets.length ? (
          groupedSets.map(({ exerciseId, sets: exerciseSets }) => (
            <ExerciseCard key={exerciseId} exerciseId={exerciseId} sets={exerciseSets} />
          ))
        ) : (
          <Card>
            <p className="text-sm text-zinc-500">No exercise sets have been logged yet.</p>
          </Card>
        )}
      </section>
    </div>
  );
}
