"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DecisionBadge } from "@/components/DecisionBadge";
import { InfoTip } from "@/components/InfoTip";
import { StateBlock } from "@/components/StateBlock";
import { api } from "@/lib/api";
import { formatWhen, jobHref, startAnalysisJob, stockHref } from "@/lib/jobs";
import { inr, pct, signedClass } from "@/lib/format";

export default function WatchlistPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [symbol, setSymbol] = useState("");
  const list = useQuery({ queryKey: ["watchlist"], queryFn: api.watchlist });
  const settings = useQuery({ queryKey: ["settings"], queryFn: api.settings });
  const add = useMutation({
    mutationFn: () => api.addWatch(symbol),
    onSuccess: () => {
      setSymbol("");
      qc.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.removeWatch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });
  const analyze = useMutation({
    mutationFn: (sym: string) => startAnalysisJob(sym, settings.data),
    onSuccess: (res) => router.push(jobHref(res.analysis_id)),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        Watchlist
        <InfoTip text="Local list stored in the terminal database. AI signal is the latest completed run for that symbol." />
      </h1>
      <div className="flex gap-2">
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Add symbol, e.g. RELIANCE.NS"
          className="flex-1 rounded-md border border-line bg-ink-800 px-3 py-2 text-sm"
        />
        <button onClick={() => add.mutate()} disabled={!symbol.trim()} className="rounded-md bg-gold px-3 py-2 text-sm text-primary-fg">
          Add
        </button>
      </div>
      {list.isLoading && <div className="skeleton h-40" />}
      {list.data?.items.length === 0 && (
        <StateBlock title="Your watchlist is empty." message="Add a stock or search from the header, then pin it." />
      )}
      <div className="overflow-x-auto rounded-md border border-line">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-elevated text-mist">
            <tr>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Symbol</th>
              <th className="px-3 py-2">Current Price</th>
              <th className="px-3 py-2">Daily Change</th>
              <th className="px-3 py-2">AI Signal</th>
              <th className="px-3 py-2">Confidence</th>
              <th className="px-3 py-2">Last Analysis</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.data?.items.map((item) => {
              const last = item.last_analysis;
              return (
                <tr key={item.id} className="border-t border-line">
                  <td className="px-3 py-2">
                    <Link className="text-gold" href={stockHref(item.symbol)}>
                      {item.quote?.name || last?.company_name || item.symbol.replace(".NS", "")}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{item.symbol}</td>
                  <td className="px-3 py-2 tabular">{inr(item.quote?.price ?? null)}</td>
                  <td className={`px-3 py-2 tabular ${signedClass(item.quote?.change_percent)}`}>{pct(item.quote?.change_percent)}</td>
                  <td className="px-3 py-2">{last?.status === "completed" && last.final_decision ? <DecisionBadge action={last.final_decision} size="sm" /> : "—"}</td>
                  <td className="px-3 py-2 tabular">{last?.status === "completed" && last.confidence != null ? `${Math.round(last.confidence)}%` : "—"}</td>
                  <td className="px-3 py-2 text-mist">{last ? formatWhen(last.created_at) : "Never"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-3">
                      <button className="text-gold" onClick={() => analyze.mutate(item.symbol)} disabled={analyze.isPending}>
                        Analyze
                      </button>
                      {last ? (
                        <Link href={jobHref(last.analysis_id)} className="text-gold">
                          View Last Analysis
                        </Link>
                      ) : null}
                      <button className="text-loss" onClick={() => remove.mutate(item.id)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
