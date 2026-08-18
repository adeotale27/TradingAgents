"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { DecisionBadge } from "@/components/DecisionBadge";
import { InfoTip } from "@/components/InfoTip";
import { JobQueue, StatusChip } from "@/components/JobQueue";
import { StateBlock } from "@/components/StateBlock";
import { api } from "@/lib/api";
import { formatWhen, jobHref } from "@/lib/jobs";
import { num, pct, signedClass } from "@/lib/format";

export default function DashboardPage() {
  const market = useQuery({ queryKey: ["market"], queryFn: api.market, refetchInterval: 60_000 });
  const watch = useQuery({ queryKey: ["watchlist"], queryFn: api.watchlist });
  const history = useQuery({ queryKey: ["history"], queryFn: () => api.listAnalysis("?limit=8") });
  const [guide, setGuide] = useState(true);
  useEffect(() => {
    setGuide(localStorage.getItem("ta_howto") !== "hidden");
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold">Search a company, then Analyze</h1>
        <p className="mt-1 text-sm text-mist">Use the header search. Analyze opens a persistent job you can reopen from Jobs.</p>
      </section>

      {guide && (
        <section className="rounded-md border border-line bg-surface p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-brand">How to use this desk</p>
              <ol className="mt-3 grid gap-2 text-sm text-mist md:grid-cols-4">
                <li><span className="text-gold">1.</span> Setup → pick Google or OpenAI and a matching model, then Save.</li>
                <li><span className="text-gold">2.</span> Search by company name (Reliance Industries, ITC).</li>
                <li><span className="text-gold">3.</span> Click Analyze. Watch the live job at /jobs/…</li>
                <li><span className="text-gold">4.</span> Reopen any run from Jobs. History is never a dead end.</li>
              </ol>
            </div>
            <button
              className="text-xs text-mist"
              onClick={() => {
                localStorage.setItem("ta_howto", "hidden");
                setGuide(false);
              }}
            >
              Dismiss
            </button>
          </div>
        </section>
      )}

      <JobQueue />

      <section>
        <h2 className="mb-3 text-sm font-medium tracking-wide text-mist">
          MARKET OVERVIEW
          <InfoTip text="Live NSE index quotes from Yahoo Finance. Regime is a simple NIFTY day-change classifier, not a forecast." />
        </h2>
        {market.isLoading && <div className="skeleton h-24" />}
        {market.isError && (
          <StateBlock title="Unable to retrieve market data." message={(market.error as Error).message} onRetry={() => market.refetch()} />
        )}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(market.data?.indices || []).map((idx) => (
            <Link
              key={idx.symbol}
              href="/market"
              className={`rounded-md border bg-surface px-4 py-3 ${
                (idx.change_percent || 0) > 0 ? "border-gain/30" : (idx.change_percent || 0) < 0 ? "border-loss/30" : "border-line"
              }`}
            >
              <p className="text-xs text-mist">{idx.name}</p>
              <p className="mt-1 font-mono text-2xl tabular">{num(idx.price, 2)}</p>
              <p className={`text-sm tabular ${signedClass(idx.change_percent)}`}>{pct(idx.change_percent)}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium tracking-wide text-mist">MY WATCHLIST</h2>
          <Link href="/watchlist" className="text-xs text-gold">Manage</Link>
        </div>
        {watch.data?.items.length === 0 && (
          <StateBlock title="Your watchlist is empty." message="Search a company, open it, then pin with Watch." />
        )}
        <div className="grid gap-2">
          {watch.data?.items.map((item) => (
            <Link
              key={item.id}
              href={`/analyze/${item.symbol}`}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-md border border-line bg-surface px-4 py-3"
            >
              <div>
                <p className="font-medium">{item.quote?.name || item.symbol.replace(".NS", "")}</p>
                <p className="text-xs text-mist">{item.symbol}</p>
              </div>
              <DecisionBadge action={item.last_analysis?.final_decision} size="sm" />
              <span className="text-sm text-mist tabular">
                {item.last_analysis?.confidence != null ? `${Math.round(item.last_analysis.confidence)}%` : "No run"}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium tracking-wide text-mist">RECENT AI ANALYSIS</h2>
          <Link href="/jobs" className="text-xs text-gold">View all →</Link>
        </div>
        {(history.data?.items || []).length === 0 && (
          <StateBlock title="No AI analyses yet." message="Search a company and run Analyze to start." />
        )}
        <div className="grid gap-2">
          {(history.data?.items || []).map((row) => (
            <Link
              key={row.analysis_id}
              href={jobHref(row.analysis_id)}
              className="grid gap-2 rounded-md border border-line bg-surface px-4 py-3 md:grid-cols-[1fr_auto_auto_auto]"
            >
              <div>
                <p className="font-medium uppercase">{row.company_name || row.symbol.replace(".NS", "")}</p>
                <p className="text-xs text-mist">{formatWhen(row.created_at)}</p>
              </div>
              <DecisionBadge action={row.final_decision} size="sm" />
              <span className="text-sm text-mist">{row.confidence != null ? `${Math.round(row.confidence)}% confidence` : "—"}</span>
              <StatusChip status={row.status} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
