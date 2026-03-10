"use client";

import { useMemo, useState } from "react";
import { supabaseClient } from "@/lib/supabase-browser";

const STEPS = [
  {
    title: "Personalize your plan",
    description: "Confirm your goals, training split, and targets so the dashboard stays focused on what matters.",
  },
  {
    title: "Connect Strava",
    description: "Let us pull activity files and automatically map them to planned runs and readiness metrics.",
  },
  {
    title: "Import program",
    description: "Load the curated schedule.json so workouts, runs, and cards are pre-populated for the next 12 weeks.",
  },
];

export default function OnboardingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [scheduleStatus, setScheduleStatus] = useState<string | null>(null);
  const [stravaUrl, setStravaUrl] = useState<string | null>(null);

  const stepProgress = useMemo(() => ((activeStep + 1) / STEPS.length) * 100, [activeStep]);

  const buildStravaLink = async () => {
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) return null;
    return `/api/strava/auth?user_id=${encodeURIComponent(userId)}`;
  };

  const handleStravaConnect = async () => {
    const url = await buildStravaLink();
    if (url) {
      setStravaUrl(url);
      window.location.href = url;
    }
  };

  const handleScheduleImport = async () => {
    const { data: session } = await supabaseClient.auth.getSession();
    const userId = session?.session?.user?.id;
    if (!userId) {
      setScheduleStatus("Sign in to import the schedule.");
      return;
    }
    setScheduleStatus("Importing schedule…");
    const response = await fetch("/api/schedule/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    if (!response.ok) {
      setScheduleStatus("Import failed. Try again in a moment.");
      return;
    }
    setScheduleStatus("Schedule imported successfully.");
    setActiveStep(2);
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-10 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-zinc-500">Welcome</p>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">Set up your coach</h1>
          <p className="text-sm text-zinc-500">We’ll walk you through connecting Strava, importing the training plan, and landing on the dashboard.</p>
        </header>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-lg shadow-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div className="h-2 rounded-full bg-violet-500 transition" style={{ width: `${stepProgress}%` }} />
          </div>
          <div className="space-y-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="flex flex-col gap-1">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.5em] text-zinc-400">Step {index + 1}</p>
                <div className="flex flex-row items-center gap-3">
                  <div
                    className={`h-10 w-10 flex-shrink-0 rounded-2xl border ${index === activeStep ? "border-violet-500" : "border-zinc-200"} flex items-center justify-center text-sm font-semibold text-zinc-700 dark:text-zinc-200`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{step.title}</h3>
                    <p className="text-sm text-zinc-500">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <button
              className="min-h-[44px] rounded-2xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:border-zinc-400"
              type="button"
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
              disabled={activeStep === 0}
            >
              Previous
            </button>
            <button
              className="min-h-[44px] rounded-2xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/40 transition hover:bg-violet-600"
              type="button"
              onClick={() => setActiveStep((prev) => Math.min(STEPS.length - 1, prev + 1))}
            >
              Next
            </button>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Connect</p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900">Strava</h2>
            <p className="text-sm text-zinc-500">Authorize Strava so runs show up automatically in the dashboard.</p>
            <button
              className="mt-4 min-h-[44px] w-full rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-600"
              onClick={handleStravaConnect}
            >
              Connect Strava
            </button>
            {stravaUrl && <p className="mt-3 text-xs text-zinc-500">Redirecting…</p>}
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm shadow-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs uppercase tracking-[0.4em] text-zinc-500">Program</p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900">Import schedule</h2>
            <p className="text-sm text-zinc-500">Load the canonical schedule so workouts, runs, and weekly summaries appear automatically.</p>
            <button
              className="mt-4 min-h-[44px] w-full rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-600"
              onClick={handleScheduleImport}
            >
              Import schedule
            </button>
            {scheduleStatus && <p className="mt-3 text-xs text-zinc-500">{scheduleStatus}</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
