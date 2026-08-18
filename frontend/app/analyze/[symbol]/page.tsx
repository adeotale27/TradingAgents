"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AgentRail } from "@/components/AgentRail";
import { DecisionBadge } from "@/components/DecisionBadge";
import { Dropdown } from "@/components/Dropdown";
import { InfoTip } from "@/components/InfoTip";
import { StatusChip } from "@/components/JobQueue";
import { PriceChart } from "@/components/PriceChart";
import { StateBlock } from "@/components/StateBlock";
import { api } from "@/lib/api";
import { startAnalysisJob } from "@/lib/jobs";
import { inr, pct, signedClass } from "@/lib/format";

const TABS = ["Overview", "Technical", "Fundamental", "Sentiment", "News", "AI Debate", "Risk", "Decision", "History"];

export default function AnalyzePage() {
  return (
    <Suspense fallback={<p className="text-mist">Loading stock desk…</p>}>
      <AnalyzeInner />
    </Suspense>
  );
}

function AnalyzeInner() {
  const params = useParams<{ symbol: string }>();
  const symbol = decodeURIComponent(params.symbol);
  const router = useRouter();
  const search = useSearchParams();
  const tab = search.get("tab") || "Overview";
  const qc = useQueryClient();
  const [depth, setDepth] = useState("medium");
  const quote = useQuery({ queryKey: ["quote", symbol], queryFn: () => api.quote(symbol) });
  const settings = useQuery({ queryKey: ["settings"], queryFn: api.settings });
  const history = useQuery({
    queryKey: ["history", symbol],
    queryFn: () => api.listAnalysis(`?symbol=${encodeURIComponent(symbol)}`),
  });
  const latest = history.data?.items.find((item) => item.status === "completed") || history.data?.items[0];
  const active = history.data?.items.find((item) => item.status === "queued" || item.status === "running");
  const detail = useQuery({
    queryKey: ["analysis", latest?.analysis_id],
    queryFn: () => api.getAnalysis(latest!.analysis_id),
    enabled: Boolean(latest?.analysis_id),
  });
  const start = useMutation({
    mutationFn: () => startAnalysisJob(symbol, settings.data, { research_depth: depth }),
    onSuccess: (res) => router.push(`/jobs/${res.analysis_id}`),
  });
  const cancel = useMutation({
    mutationFn: () => api.cancelAnalysis(active!.analysis_id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["history", symbol] }),
  });
  const watch = useMutation({
    mutationFn: () => api.addWatch(symbol),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  const reports = (detail.data?.payload?.reports || {}) as Record<string, string>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-mist">{quote.data?.name || symbol} · {quote.data?.exchange || "NSE"}</p>
          <h1 className="text-3xl font-semibold">{symbol.replace(".NS", "")}</h1>
          <p className="mt-1 font-mono text-2xl tabular">
            {inr(quote.data?.price ?? null)}{" "}
            <span className={`text-base ${signedClass(quote.data?.change_percent)}`}>{pct(quote.data?.change_percent)}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-36">
            <Dropdown
              value={depth}
              onChange={setDepth}
              options={[
                { id: "shallow", label: "Shallow" },
                { id: "medium", label: "Medium" },
                { id: "deep", label: "Deep" },
              ]}
            />
          </div>
          <button
            onClick={() => start.mutate()}
            className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-primary-fg disabled:opacity-50"
            disabled={start.isPending || Boolean(active)}
          >
            {active ? `Already ${active.status}` : start.isPending ? "Queuing…" : "ANALYZE"}
          </button>
          {active && (
            <>
              <Link
                href={`/jobs/${active.analysis_id}`}
                className="rounded-md border border-gold/40 px-3 py-2 text-sm text-gold"
              >
                Open job
              </Link>
              <button onClick={() => cancel.mutate()} className="rounded-md border border-loss/40 px-3 py-2 text-sm text-loss">
                Cancel
              </button>
            </>
          )}
          <button onClick={() => watch.mutate()} className="rounded-md border border-line px-3 py-2 text-sm">
            Watch
          </button>
        </div>
      </div>

      {active && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm">
          <StatusChip status={active.status} />
          <span>
            {active.progress?.step
              ? `Step ${active.progress.step} of ${active.progress.total}: ${active.progress.title}`
              : "This name is already in the queue. Cancel it or wait — a second run is blocked until it finishes or fails."}
          </span>
        </div>
      )}
      {quote.isError && (
        <StateBlock title="Unable to retrieve market data." message={(quote.error as Error).message} onRetry={() => quote.refetch()} />
      )}
      {start.isError && (
        <StateBlock title="Could not start analysis." message={(start.error as Error).message} />
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <Stat label="AI DECISION" tip="Portfolio Manager rating, mapped to Buy / Hold / Sell for faster reading.">
          <DecisionBadge action={detail.data?.final_decision} />
        </Stat>
        <Stat label="CONFIDENCE" tip="Shown only when the engine reported a confidence band. Never invented.">
          <p className="text-3xl tabular">{detail.data?.confidence != null ? `${Math.round(detail.data.confidence)}%` : "—"}</p>
        </Stat>
        <Stat label="RISK" tip="Derived from the risk-team debate and final action. Not a VaR number.">
          <p className="text-3xl">{detail.data?.risk_level || "—"}</p>
        </Stat>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-line pb-2">
        {TABS.map((item) => (
          <Link
            key={item}
            href={`?tab=${encodeURIComponent(item)}`}
            className={`rounded-md px-3 py-1.5 text-sm ${tab === item ? "bg-ink-700" : "text-mist"}`}
          >
            {item}
          </Link>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="space-y-4">
          <PriceChart symbol={symbol} />
          <p className="rounded-xl border border-line bg-ink-800 p-4 text-sm leading-6 text-mist">
            {detail.data?.decision?.in_plain_language ||
              "Run Analyze to have the TradingAgents desk research this name. Until then this panel stays empty on purpose."}
          </p>
        </div>
      )}
      {tab === "Technical" && <Report title="Technical / Market Analyst" body={reports.market} />}
      {tab === "Fundamental" && <Report title="Fundamentals Analyst" body={reports.fundamentals} />}
      {tab === "Sentiment" && <Report title="Sentiment Analyst" body={reports.sentiment} />}
      {tab === "News" && <Report title="News Analyst" body={reports.news} />}
      {tab === "AI Debate" && (
        <div className="grid gap-3 md:grid-cols-2">
          <Report title="Bull Researcher" body={reports.bull} />
          <Report title="Bear Researcher" body={reports.bear} />
          <div className="md:col-span-2">
            <Report title="Research Manager" body={reports.research_manager} />
          </div>
        </div>
      )}
      {tab === "Risk" && (
        <div className="grid gap-3 md:grid-cols-3">
          <Report title="Aggressive" body={reports.risk_aggressive} />
          <Report title="Neutral" body={reports.risk_neutral} />
          <Report title="Conservative" body={reports.risk_conservative} />
        </div>
      )}
      {tab === "Decision" && latest && (
        <Link href={`/jobs/${latest.analysis_id}`} className="block rounded-md border border-gold/40 bg-surface p-6">
          <p className="text-xs text-mist">Open full decision desk</p>
          <div className="mt-3">
            <DecisionBadge action={detail.data?.final_decision} size="lg" />
          </div>
        </Link>
      )}
      {tab === "History" && (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-800 text-mist">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Decision</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {(history.data?.items || []).map((row) => (
                <tr key={row.analysis_id} className="border-t border-line">
                  <td className="px-3 py-2">{row.analysis_date}</td>
                  <td className="px-3 py-2">
                    <DecisionBadge action={row.final_decision} size="sm" />
                  </td>
                  <td className="px-3 py-2">
                    <Link href={`/jobs/${row.analysis_id}`} className="text-gold">
                      {row.status}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail.data && tab === "Overview" && <AgentRail agents={detail.data.agents} />}
    </div>
  );
}

function Stat({ label, tip, children }: { label: string; tip: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-ink-800 p-4">
      <p className="text-xs text-mist">
        {label}
        <InfoTip text={tip} />
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Report({ title, body }: { title: string; body?: string }) {
  return (
    <article className="rounded-xl border border-line bg-ink-800 p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="mt-3 whitespace-pre-wrap text-sm leading-6 text-mist">
        {body || "No report yet. Run analysis to fill this panel from the engine — nothing is fabricated."}
      </div>
    </article>
  );
}
