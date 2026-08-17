"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AgentRail } from "@/components/AgentRail";
import { InfoTip } from "@/components/InfoTip";
import { Pipeline } from "@/components/Pipeline";
import { StatusChip } from "@/components/JobQueue";
import { StateBlock } from "@/components/StateBlock";
import { api, apiUrl } from "@/lib/api";

export default function RunningPage() {
  const params = useParams<{ symbol: string }>();
  const symbol = decodeURIComponent(params.symbol);
  const id = useSearchParams().get("id");
  const router = useRouter();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => api.getAnalysis(id!),
    enabled: Boolean(id),
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "running" || status === "queued" ? 1500 : false;
    },
  });
  const cancel = useMutation({
    mutationFn: () => api.cancelAnalysis(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["analysis", id] });
      qc.invalidateQueries({ queryKey: ["history"] });
    },
  });

  useEffect(() => {
    if (!id) return;
    const source = new EventSource(apiUrl(`/api/v1/analysis/${id}/events`));
    source.onmessage = () => query.refetch();
    source.addEventListener("agent_completed", () => query.refetch());
    source.addEventListener("agent_started", () => query.refetch());
    source.addEventListener("analysis_completed", () => {
      query.refetch();
      source.close();
      router.push(`/runs/${id}/decision`);
    });
    source.addEventListener("analysis_failed", () => {
      query.refetch();
      source.close();
    });
    return () => source.close();
  }, [id]);

  if (!id) return <StateBlock title="Missing run" message="Start analysis from the stock page, or open the job from Home." />;
  const live = query.data?.status === "queued" || query.data?.status === "running";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-mist">LIVE DESK</p>
          <h1 className="text-2xl font-semibold">{symbol.replace(".NS", "")}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-mist">
            <StatusChip status={query.data?.status} />
            {query.data?.progress?.step
              ? `Step ${query.data.progress.step} of ${query.data.progress.total}: ${query.data.progress.title}`
              : query.data?.status === "queued"
                ? "Waiting in queue — cancel below if you started this by mistake."
                : "Connecting…"}
            <InfoTip text="These five steps are the real TradingAgents graph: analysts, debate, trader, risk, portfolio manager." />
          </p>
        </div>
        <div className="flex gap-2">
          {live && (
            <button className="rounded-md border border-loss/40 px-3 py-2 text-sm text-loss" onClick={() => cancel.mutate()} disabled={cancel.isPending}>
              {cancel.isPending ? "Cancelling…" : "Cancel this job"}
            </button>
          )}
          <Link href={`/analyze/${encodeURIComponent(symbol)}`} className="rounded-md border border-line px-3 py-2 text-sm">
            Stock
          </Link>
        </div>
      </div>
      {query.data?.status === "failed" && (
        <StateBlock
          title="Analysis failed."
          message={query.data.error_message || "The engine could not complete this run. Typical causes: wrong model for the provider, missing API key, or a ticker Yahoo does not list."}
          onRetry={() => router.push(`/analyze/${encodeURIComponent(symbol)}`)}
        />
      )}
      {query.data?.status === "cancelled" && (
        <StateBlock title="Cancelled" message="This job was stopped before a decision. You can run Analyze again." />
      )}
      {query.data && <Pipeline analysis={query.data} />}
      <AgentRail agents={query.data?.agents || []} />
    </div>
  );
}
