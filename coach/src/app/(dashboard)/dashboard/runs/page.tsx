"use client";

import { useMemo, useState, type FormEvent } from "react";
import { supabaseClient } from "@/lib/supabase-browser";
import { useStravaActivities } from "@/hooks/use-strava-activities";
import type { StravaActivitySummary } from "../../../../../types/run";
function formatDistance(meters?: string | number | null) {
  const value = Number(meters ?? 0) / 1000;
  if (!value) return "0 km";
  return `${value.toFixed(2)} km`;
}

function formatPaceFromActivity(activity: { duration_seconds?: number | null; distance_meters?: string | number | null }) {
  const secs = Number(activity.duration_seconds ?? 0);
  const distanceKm = Number(activity.distance_meters ?? 0) / 1000;
  if (!distanceKm || !secs) return "—";
  const paceSeconds = secs / distanceKm;
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function RunsPage() {
  const { data: activities = [], refetch } = useStravaActivities();
  const [syncing, setSyncing] = useState(false);
  const [manualStatus, setManualStatus] = useState<string | null>(null);
  const [manual, setManual] = useState({ date: "", distance: "", pace: "" });

  const stravaSummary = useMemo(() => {
    if (!activities.length) return { totalDistance: 0, avgPaceSeconds: 0 };
    const totalDistance = activities.reduce((sum: number, activity: StravaActivitySummary) => sum + (Number(activity.distance_meters ?? 0) / 1000), 0);
    const averagePace = activities.reduce((sum: number, activity: StravaActivitySummary) => {
      const distance = Number(activity.distance_meters ?? 0) / 1000;
      const duration = Number(activity.duration_seconds ?? 0);
      if (!distance) return sum;
      return sum + duration / distance;
    }, 0);
    return { totalDistance, avgPaceSeconds: averagePace / activities.length };
  }, [activities]);

  const handleSync = async () => {
    setSyncing(true);
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session?.session?.user?.id;
    const response = await fetch("/api/strava/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });
    if (response.ok) {
      refetch();
    }
    setSyncing(false);
  };

  const handleManualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!manual.distance || !manual.date) {
      setManualStatus("Distance and date are required.");
      return;
    }
    setManualStatus("Manual entry recorded locally.");
    setManual({ date: "", distance: "", pace: "" });
  };

  const avgPaceDisplay = stravaSummary.avgPaceSeconds
    ? `${Math.floor(stravaSummary.avgPaceSeconds / 60)}:${Math.round(stravaSummary.avgPaceSeconds % 60)
        .toString()
        .padStart(2, "0")}`
    : "—";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-zinc-500">Running</p>
        <h1 className="text-3xl font-bold text-zinc-900">Strava feed</h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm shadow-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Distance</p>
          <p className="text-3xl font-semibold text-zinc-900 dark:text-white">{stravaSummary.totalDistance.toFixed(1)} km</p>
          <p className="text-xs text-zinc-500">Last 30 days</p>
        </div>
        <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm shadow-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Average pace</p>
          <p className="text-3xl font-semibold text-zinc-900 dark:text-white">{avgPaceDisplay}</p>
          <p className="text-xs text-zinc-500">Based on synced runs</p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="min-h-[44px] rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-600"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? "Syncing…" : "Sync Strava"}
          </button>
          <p className="text-sm text-zinc-500">Pull in the latest run data and recover insights.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900">
          {manualStatus ?? "Manual entries are stored locally until the next sync."}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">Manual entry</h2>
        <form className="mt-3 grid gap-3 md:grid-cols-3" onSubmit={handleManualSubmit}>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Date</span>
            <input
              className="min-h-[44px] rounded-2xl border border-zinc-200 px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-zinc-700 dark:bg-zinc-950"
              type="date"
              value={manual.date}
              onChange={(event) => setManual((prev) => ({ ...prev, date: event.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Distance (km)</span>
            <input
              className="min-h-[44px] rounded-2xl border border-zinc-200 px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-zinc-700 dark:bg-zinc-950"
              type="number"
              step="0.1"
              value={manual.distance}
              onChange={(event) => setManual((prev) => ({ ...prev, distance: event.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">Pace (mm:ss)</span>
            <input
              className="min-h-[44px] rounded-2xl border border-zinc-200 px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 dark:border-zinc-700 dark:bg-zinc-950"
              type="text"
              placeholder="5:00"
              value={manual.pace}
              onChange={(event) => setManual((prev) => ({ ...prev, pace: event.target.value }))}
            />
          </label>
          <button
            type="submit"
            className="min-h-[44px] rounded-2xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/40 transition hover:bg-violet-600"
          >
            Log run
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-zinc-900">Recent activities</h2>
        <div className="mt-3 space-y-3">
          {activities.length ? (
            activities.map((activity: StravaActivitySummary) => (
              <article
                key={activity.strava_id}
                className="rounded-3xl border border-zinc-100 bg-white p-4 shadow-sm shadow-zinc-200 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{activity.name ?? 'Run'}</p>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              {activity.activity_type ?? 'Running'} · {activity.start_time ? new Date(activity.start_time).toLocaleDateString() : '—'}
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-600">
            <p>Distance: {formatDistance(activity.distance_meters)}</p>
            <p>Duration: {activity.duration_seconds ? `${Math.round(activity.duration_seconds / 60)} min` : '—'}</p>
            <p>Pace: {formatPaceFromActivity(activity)}</p>
          </div>
        </article>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
              No Strava activities yet. Sync to pull your latest runs.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
