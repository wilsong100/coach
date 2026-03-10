'use client';

import { useMemo, useState } from 'react';
import { supabaseClient } from '@/lib/supabase-browser';
import type { SupabaseExerciseSetRow } from '@/types/supabase';

interface ExerciseCardProps {
  exerciseId: string;
  sets: SupabaseExerciseSetRow[];
}

interface EditableSet {
  id: string;
  actual_reps: string;
  actual_weight: string;
}

export function ExerciseCard({ exerciseId, sets }: ExerciseCardProps) {
  const initial = useMemo<EditableSet[]>(
    () =>
      sets.map((set) => ({
        id: set.id,
        actual_reps: set.actual_reps?.toString() ?? '',
        actual_weight: set.actual_weight ?? '',
      })),
    [sets],
  );

  const [editableSets, setEditableSets] = useState<EditableSet[]>(initial);
  const [savingSet, setSavingSet] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Record<string, string>>({});

  const handleInputChange = (id: string, field: keyof EditableSet, value: string) => {
    setEditableSets((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleBlur = async (setId: string) => {
    const setValues = editableSets.find((set) => set.id === setId);
    if (!setValues) return;

    setSavingSet(setId);
    try {
      await supabaseClient
        .from('exercise_sets')
        .update(
          {
            actual_reps: setValues.actual_reps ? Number(setValues.actual_reps) : null,
            actual_weight: setValues.actual_weight || null,
          },
        )
        .eq('id', setId);
      setLastSaved((prev) => ({ ...prev, [setId]: new Date().toLocaleTimeString() }));
    } catch (error) {
      console.error('Failed to save set', error);
    } finally {
      setSavingSet(null);
    }
  };

  if (!sets.length) {
    return (
      <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900">No plan data yet.</div>
    );
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-zinc-100 bg-gradient-to-b from-white to-zinc-50 p-5 shadow-sm shadow-zinc-200 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Exercise</p>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{exerciseId}</h3>
      </header>
      <div className="flex flex-col gap-3">
        {sets.map((set) => {
          const editable = editableSets.find((item) => item.id === set.id);
          return (
            <div key={set.id} className="grid grid-cols-1 gap-3 rounded-2xl border border-dashed border-zinc-200 p-3 dark:border-zinc-700 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Set {set.set_number}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  Target: {set.target_reps ?? '—'} reps @ {set.target_weight ?? '—'} kg
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500">Actual reps</label>
                <input
                  className="min-h-[44px] rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-zinc-700 dark:bg-zinc-950"
                  type="number"
                  value={editable?.actual_reps ?? ''}
                  onChange={(event) => handleInputChange(set.id, 'actual_reps', event.target.value)}
                  onBlur={() => handleBlur(set.id)}
                  min={0}
                />
                <label className="text-[0.65rem] uppercase tracking-[0.2em] text-zinc-500">Actual weight (kg)</label>
                <input
                  className="min-h-[44px] rounded-xl border border-zinc-200 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-zinc-700 dark:bg-zinc-950"
                  type="number"
                  value={editable?.actual_weight ?? ''}
                  onChange={(event) => handleInputChange(set.id, 'actual_weight', event.target.value)}
                  onBlur={() => handleBlur(set.id)}
                  min={0}
                  step={0.5}
                />
              </div>
              <div className="text-xs text-zinc-400 md:col-span-2">
                {savingSet === set.id ? 'Auto-saving…' : lastSaved[set.id] ? `Saved at ${lastSaved[set.id]}` : 'Changes save on blur'}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
