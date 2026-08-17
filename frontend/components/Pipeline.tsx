"use client";

import type { Analysis } from "@/lib/types";

export function Pipeline({ analysis }: { analysis: Analysis }) {
  const progress = analysis.progress;
  if (!progress) return null;
  const current = progress.step;
  return (
    <section className="rounded-xl border border-line bg-ink-800 p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-mist">Engine progress</p>
          <h2 className="text-lg font-semibold">
            {analysis.status === "queued"
              ? "Queued — not started yet"
              : analysis.status === "failed"
                ? "Stopped"
                : `Step ${Math.max(current, 1)} of ${progress.total}`}
          </h2>
          <p className="text-sm text-mist">{progress.title}. {progress.detail}</p>
        </div>
        {analysis.status === "failed" && (
          <p className="max-w-md rounded-md border border-loss/40 bg-loss/10 px-3 py-2 text-sm text-loss">
            {analysis.error_message || "The engine could not finish. Check Setup keys, model, and that the ticker uses .NS."}
          </p>
        )}
      </div>
      <ol className="grid gap-2 md:grid-cols-5">
        {progress.steps.map((step) => {
          const done = current > step.index || analysis.status === "completed";
          const active = current === step.index && analysis.status === "running";
          return (
            <li
              key={step.index}
              className={`rounded-lg border px-3 py-3 ${
                active ? "border-gold bg-gold/10" : done ? "border-gain/30 bg-gain/5" : "border-line"
              }`}
            >
              <p className="text-[11px] uppercase tracking-wide text-mist">Step {step.index}</p>
              <p className="mt-1 text-sm font-medium">{step.title}</p>
              <p className="mt-1 text-xs text-mist">{step.detail}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
