"use client";

import type { AgentResult } from "@/lib/types";

const GROUPS = [
  { step: 1, title: "Analyst team", agents: ["Market Analyst", "Sentiment Analyst", "News Analyst", "Fundamentals Analyst"] },
  { step: 2, title: "Bull vs bear", agents: ["Bull Researcher", "Bear Researcher", "Research Manager"] },
  { step: 3, title: "Trader", agents: ["Trader"] },
  { step: 4, title: "Risk", agents: ["Aggressive Analyst", "Neutral Analyst", "Conservative Analyst"] },
  { step: 5, title: "Final decision", agents: ["Portfolio Manager"] },
];

function mark(status: string) {
  if (status === "completed") return { glyph: "✓", label: "COMPLETE", className: "text-gain" };
  if (status === "running") return { glyph: "●", label: "RUNNING", className: "text-gold animate-pulse" };
  if (status === "failed") return { glyph: "!", label: "FAILED", className: "text-loss" };
  return { glyph: "○", label: "WAITING", className: "text-mist" };
}

export function AgentRail({ agents }: { agents: AgentResult[] }) {
  const byName = Object.fromEntries(agents.map((a) => [a.agent_name, a]));
  return (
    <div className="space-y-4">
      {GROUPS.map((group) => (
        <section key={group.step}>
          <h3 className="mb-2 text-xs uppercase tracking-[0.16em] text-mist">
            Step {group.step} · {group.title}
          </h3>
          <ol className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {group.agents.map((name) => {
              const status = byName[name]?.status || "waiting";
              const meta = mark(status);
              return (
                <li key={name} className="flex items-center justify-between rounded-lg border border-line bg-ink-800 px-3 py-2">
                  <span className="text-sm">{name}</span>
                  <span className={`text-xs font-medium ${meta.className}`}>
                    {meta.glyph} {meta.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
