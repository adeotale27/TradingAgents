"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { InfoTip } from "@/components/InfoTip";
import { StateBlock } from "@/components/StateBlock";
import { api } from "@/lib/api";
import { formatDuration } from "@/lib/jobs";
import { pct } from "@/lib/format";

export default function ScorecardPage() {
  const stats = useQuery({ queryKey: ["scorecard"], queryFn: api.scorecard });
  const [start, setStart] = useState("2025-01-01");
  const [end, setEnd] = useState(new Date().toISOString().slice(0, 10));
  const run = useMutation({
    mutationFn: () =>
      api.backtest({
        universe: "NIFTY50",
        start_date: start,
        end_date: end,
        research_depth: "medium",
        holding_days: 5,
      }),
  });
  const result = run.data as {
    initial_capital?: number;
    final_capital?: number;
    number_of_decisions?: number;
    ai_strategy?: { total_return?: number; win_rate?: number; max_drawdown?: number; sharpe?: number };
    buy_hold?: { total_return?: number | null };
    equity_curve?: number[];
    note?: string;
  } | undefined;
  const s = stats.data;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">
        Scorecard
        <InfoTip text="Counts come from stored analyses. Outcome metrics appear only after you run historical evaluation on saved decisions." />
      </h1>
      {stats.isError && <StateBlock title="Could not load scorecard" message={(stats.error as Error).message} onRetry={() => stats.refetch()} />}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total analyses" value={String(s?.total_analyses ?? 0)} />
        <Metric label="BUY" value={String(s?.buy ?? 0)} />
        <Metric label="HOLD" value={String(s?.hold ?? 0)} />
        <Metric label="SELL" value={String(s?.sell ?? 0)} />
        <Metric label="Completed" value={String(s?.completed ?? 0)} />
        <Metric label="Failed" value={String(s?.failed ?? 0)} />
        <Metric label="Average confidence" value={s?.average_confidence == null ? "—" : `${Math.round(s.average_confidence)}%`} />
        <Metric label="Average duration" value={formatDuration(s?.average_duration_seconds)} />
      </div>

      <h2 className="text-lg font-semibold">Historical evaluation</h2>
      <p className="text-sm text-mist">Uses saved decisions vs later prices. It does not invent win rate when you have not run it.</p>
      <div className="grid gap-3 rounded-md border border-line bg-surface p-4 md:grid-cols-4">
        <label className="text-sm text-mist">
          Universe
          <input disabled value="NIFTY 50" className="mt-1 w-full rounded-md border border-line bg-ink-800 px-2 py-2" />
        </label>
        <label className="text-sm text-mist">
          Start
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1 w-full rounded-md border border-line bg-ink-800 px-2 py-2" />
        </label>
        <label className="text-sm text-mist">
          End
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1 w-full rounded-md border border-line bg-ink-800 px-2 py-2" />
        </label>
        <button onClick={() => run.mutate()} className="self-end rounded-md bg-gold px-3 py-2 text-sm font-semibold text-primary-fg">
          RUN
        </button>
      </div>
      {run.isError && <StateBlock title="Evaluation failed" message={(run.error as Error).message} onRetry={() => run.mutate()} />}
      {result && (
        <div className="space-y-4">
          <p className="text-sm text-mist">{result.note}</p>
          <div className="grid gap-3 md:grid-cols-4">
            <Metric label="AI Return" value={pct((result.ai_strategy?.total_return || 0) * 100)} />
            <Metric label="Win Rate" value={result.ai_strategy?.win_rate == null ? "—" : pct((result.ai_strategy.win_rate || 0) * 100)} />
            <Metric label="Max Drawdown" value={result.ai_strategy?.max_drawdown == null ? "—" : pct((result.ai_strategy.max_drawdown || 0) * 100)} />
            <Metric label="Decisions scored" value={String(result.number_of_decisions ?? 0)} />
          </div>
          {result.equity_curve && (
            <div className="h-64 rounded-md border border-line bg-surface p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.equity_curve.map((value, i) => ({ i, value }))}>
                  <CartesianGrid stroke="var(--border)" />
                  <XAxis dataKey="i" hide />
                  <YAxis stroke="var(--text-secondary)" />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                  <Line dataKey="value" stroke="var(--primary)" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <p className="text-xs text-mist">{label}</p>
      <p className="mt-1 text-xl tabular">{value}</p>
    </div>
  );
}
