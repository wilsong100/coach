'use client';

import { useEffect, useMemo, useState } from 'react';

interface SessionTimerProps {
  plannedMinutes?: number | null;
}

const padTime = (value: number) => value.toString().padStart(2, '0');

export function SessionTimer({ plannedMinutes }: SessionTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRunning) {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning]);

  const formattedTime = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    if (hours) {
      return `${padTime(hours)}:${padTime(minutes)}:${padTime(seconds)}`;
    }
    return `${padTime(minutes)}:${padTime(seconds)}`;
  }, [elapsedSeconds]);

  const minutesLeftLabel = useMemo(() => {
    if (!plannedMinutes) return null;
    const plannedSeconds = plannedMinutes * 60;
    const diff = plannedSeconds - elapsedSeconds;
    const prefix = diff >= 0 ? 'left' : 'over';
    const mins = Math.abs(Math.floor(diff / 60));
    return `${mins} min ${prefix}`;
  }, [plannedMinutes, elapsedSeconds]);

  return (
    <div className="rounded-3xl border border-zinc-100 bg-gradient-to-br from-white to-zinc-50 p-4 shadow-inner shadow-zinc-100 dark:border-zinc-800 dark:from-zinc-900">
      <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Session timer</p>
      <p className="text-4xl font-semibold text-zinc-900 dark:text-zinc-50">{formattedTime}</p>
      {minutesLeftLabel && <p className="text-sm text-zinc-500">{minutesLeftLabel}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="min-h-[44px] rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          onClick={() => setIsRunning(true)}
        >
          Start
        </button>
        <button
          className="min-h-[44px] rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-black/30 transition hover:bg-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          onClick={() => setIsRunning(false)}
        >
          Pause
        </button>
        <button
          className="min-h-[44px] rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 dark:border-zinc-700 dark:text-zinc-100"
          onClick={() => setElapsedSeconds(0)}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
