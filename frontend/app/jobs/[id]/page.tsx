"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AgentRail } from "@/components/AgentRail";
import { DecisionBadge } from "@/components/DecisionBadge";
import { Pipeline } from "@/components/Pipeline";
import { StatusChip } from "@/components/JobQueue";
import { StateBlock } from "@/components/StateBlock";
import { api, apiUrl } from "@/lib/api";
import { formatWhen, shortJobId, startAnalysisJob, stockHref } from "@/lib/jobs";
import { inr, pct, signedClass } from "@/lib/format";

const PIPELINE_NAMES = [
  "Market Analyst",
  "Sentiment Analyst",
  "News Analyst",
  "Fundamentals Analyst",
  "Bull Researcher",
  "Bear Researcher",
  "Research Manager",
  "Trader",
  "Aggressive Analyst",
  "Neutral Analyst",
  "Conservative Analyst",
  "Portfolio Manager",
];

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => api.getAnalysis(id),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "running" || status === "queued" ? 1500 : false;
    },
  });
  const row = query.data;
  const quote = useQuery({
    queryKey: ["quote", row?.symbol],
    queryFn: () => api.quote(row!.symbol),
    enabled: Boolean(row?.symbol),
  });
  const settings = useQuery({ queryKey: ["settings"], queryFn: api.settings });
  const cancel = useMutation({
    mutationFn: () => api.cancelAnalysis(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["analysis", id] });
      qc.invalidateQueries({ queryKey: ["history"] });
    },
  });
  const retry = useMutation({
    mutationFn: () => startAnalysisJob(row!.symbol, settings.data),
    onSuccess: (res) => router.push(`/jobs/${res.analysis_id}`),
  });
  const [techOpen, setTechOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const source = new EventSource(apiUrl(`/api/v1/analysis/${id}/events`));
    const refresh = () => query.refetch();
    source.onmessage = refresh;
    source.addEventListener("agent_completed", refresh);
    source.addEventListener("agent_started", refresh);
    source.addEventListener("analysis_completed", () => {
      refresh();
      source.close();
    });
    source.addEventListener("analysis_failed", () => {
      refresh();
      source.close();
    });
    return () => source.close();
  }, [id]);

  const live = row?.status === "queued" || row?.status === "running";
  const reports = (row?.payload?.reports || {}) as Record<string, string>;
  const currentAgent = useMemo(() => row?.agents.find((a) => a.status === "running")?.agent_name, [row]);
  const evidence = [
    ["Market", reports.market],
    ["Fundamentals", reports.fundamentals],
    ["News", reports.news],
    ["Sentiment", reports.sentiment],
    ["Bull Case", reports.bull],
    ["Bear Case", reports.bear],
    ["Risk", reports.risk_aggressive || reports.risk_neutral || reports.risk_conservative],
  ] as const;

  if (query.isError) {
    return <StateBlock title="Could not load analysis" message={(query.error as Error).message} onRetry={() => query.refetch()} />;
  }
  if (!row) return <div className="skeleton h-64" />;

  const d = row.decision;
  const levels = [
    ["Entry", d?.entry_price],
    ["Target", d?.price_target],
    ["Stop", d?.stop_loss],
  ] as const;
  const hasLevels = levels.some(([, value]) => value != null);

  return (
    <div className="space-y-5">
      <p className="text-sm text-mist">
        <Link href="/jobs" className="text-gold">Jobs</Link>
        {" / "}
        {row.symbol}
        {" / "}
        Analysis #{shortJobId(row.analysis_id)}
      </p>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{row.company_name || quote.data?.name || row.symbol.replace(".NS", "")}</h1>
          <p className="text-sm text-mist">{row.symbol}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StatusChip status={row.status} />
            {row.started_at && <span className="text-sm text-mist">Started {formatWhen(row.started_at)}</span>}
            {quote.data?.price != null && (
              <span className="font-mono tabular">
                {inr(quote.data.price)} <span className={signedClass(quote.data.change_percent)}>{pct(quote.data.change_percent)}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/jobs" className="rounded-md border border-line px-3 py-2 text-sm">
            ← Back to Jobs
          </Link>
          <Link href={stockHref(row.symbol)} className="rounded-md border border-line px-3 py-2 text-sm">
            View Stock
          </Link>
          {live && (
            <button className="rounded-md border border-loss/40 px-3 py-2 text-sm text-loss" onClick={() => cancel.mutate()}>
              Cancel
            </button>
          )}
          {row.status === "failed" && (
            <button className="rounded-md bg-gold px-3 py-2 text-sm text-primary-fg" onClick={() => retry.mutate()}>
              Retry
            </button>
          )}
          {row.status === "completed" && (
            <a href="#decision" className="rounded-md bg-gold px-3 py-2 text-sm text-primary-fg">
              View Decision →
            </a>
          )}
        </div>
      </header>

      {row.status === "failed" && (
        <section className="rounded-md border border-loss/40 bg-loss/10 p-5">
          <h2 className="text-lg font-semibold">ANALYSIS FAILED</h2>
          <p className="mt-2 text-sm">{row.error_friendly || "Analysis could not be completed."}</p>
          <button className="mt-4 rounded-md bg-gold px-3 py-2 text-sm text-primary-fg" onClick={() => retry.mutate()} disabled={retry.isPending}>
            Retry
          </button>
          <details className="mt-4" open={techOpen} onToggle={(e) => setTechOpen((e.target as HTMLDetailsElement).open)}>
            <summary className="cursor-pointer text-sm text-mist">Technical details</summary>
            <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded-md border border-line bg-elevated p-3 text-xs">{row.error_message}</pre>
            <button
              type="button"
              className="mt-2 text-xs text-gold"
              onClick={() => navigator.clipboard.writeText(row.error_message || "")}
            >
              Copy error
            </button>
          </details>
        </section>
      )}

      {live && (
        <>
          <section className="rounded-md border border-line bg-surface p-4">
            <h2 className="mb-3 text-sm font-semibold tracking-wide">AGENT PIPELINE</h2>
            <ol className="space-y-1">
              {PIPELINE_NAMES.map((name) => {
                const status = row.agents.find((a) => a.agent_name === name)?.status || "waiting";
                const mark = status === "completed" ? "✓ COMPLETE" : status === "running" ? "● RUNNING" : status === "failed" ? "! FAILED" : "○ WAITING";
                return (
                  <li key={name} className="flex justify-between border-b border-line/60 py-1.5 text-sm last:border-0">
                    <span>{name}</span>
                    <span className={status === "completed" ? "text-gain" : status === "running" ? "text-gold" : "text-mist"}>{mark}</span>
                  </li>
                );
              })}
            </ol>
          </section>
          <section className="rounded-md border border-line bg-surface p-4">
            <h2 className="text-sm font-semibold tracking-wide">CURRENT ACTIVITY</h2>
            <p className="mt-2 text-sm text-mist">
              {currentAgent
                ? `${currentAgent} is working…`
                : row.progress?.detail || (row.status === "queued" ? "Waiting in queue." : "Connecting…")}
            </p>
          </section>
          <Pipeline analysis={row} />
        </>
      )}

      {row.status === "completed" && (
        <>
          <section id="decision" className="rounded-md border border-line bg-surface p-6">
            <p className="text-xs tracking-[0.2em] text-mist">FINAL DECISION</p>
            <div className="mt-3">
              <DecisionBadge action={row.final_decision} size="lg" />
            </div>
            <p className="mt-4 text-sm text-mist">
              Confidence: {row.confidence != null ? `${Math.round(row.confidence)}%` : "not reported"}
            </p>
            {hasLevels && (
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                {levels.map(([label, value]) =>
                  value == null ? null : (
                    <div key={label} className="rounded-md border border-line px-3 py-2">
                      <p className="text-xs text-mist">{label}</p>
                      <p className="tabular">{inr(value as number)}</p>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>
          <section className="rounded-md border border-line bg-surface p-5">
            <h2 className="text-sm font-semibold">WHY?</h2>
            <p className="mt-2 text-sm leading-6 text-mist">
              {d?.in_plain_language || d?.reason || "The engine did not return a plain-language summary for this run."}
            </p>
          </section>
          <section className="rounded-md border border-line bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold">EVIDENCE</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {evidence.map(([title, body]) => (
                <article key={title} className="rounded-md border border-line p-3">
                  <h3 className="text-sm font-medium">{title}</h3>
                  <p className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-sm text-mist">
                    {body || "Not provided by the engine for this run."}
                  </p>
                </article>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold">AGENT CONCLUSIONS</h2>
            <AgentRail agents={row.agents} />
            <div className="mt-3 space-y-2">
              {row.agents.filter((a) => a.summary).map((agent) => (
                <details key={agent.agent_name} className="rounded-md border border-line bg-surface p-3">
                  <summary className="cursor-pointer text-sm font-medium">{agent.agent_name}</summary>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-mist">{agent.summary}</p>
                </details>
              ))}
            </div>
          </section>
        </>
      )}

      {(row.status === "cancelled" || (!live && row.status !== "completed" && row.status !== "failed")) && (
        <StateBlock title={row.status} message="This run did not produce a decision." />
      )}

      <details className="rounded-md border border-line bg-surface p-4">
        <summary className="cursor-pointer text-sm text-mist">Technical details</summary>
        <p className="mt-2 text-xs text-mist">
          Provider {row.provider} · Model {row.model} · Depth {row.research_depth}
        </p>
        {row.payload && (
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(row.payload, null, 2)}</pre>
        )}
      </details>

      <div className="flex flex-wrap gap-2">
        <Link href="/jobs" className="rounded-md border border-line px-3 py-2 text-sm">
          Back to Jobs
        </Link>
        <Link href={stockHref(row.symbol)} className="rounded-md border border-line px-3 py-2 text-sm">
          View Company
        </Link>
        <button className="rounded-md bg-gold px-3 py-2 text-sm text-primary-fg" onClick={() => retry.mutate()} disabled={live || retry.isPending}>
          Run Again
        </button>
      </div>
    </div>
  );
}
