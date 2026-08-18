"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { jobHref, progressLabel } from "@/lib/jobs";
import type { Analysis } from "@/lib/types";

export function JobQueue() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["history"],
    queryFn: () => api.listAnalysis("?limit=50"),
    refetchInterval: 2000,
  });
  const jobs = (list.data?.items || []).filter((row) => ["queued", "running", "failed"].includes(row.status));
  const cancel = useMutation({
    mutationFn: (id: string) => api.cancelAnalysis(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["history"] }),
  });

  if (jobs.length === 0) return null;

  return (
    <section className="rounded-md border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide">Live jobs</h2>
        <Link href="/jobs" className="text-xs text-gold">
          View all →
        </Link>
      </div>
      <div className="space-y-2">
        {jobs.map((row) => (
          <JobRow key={row.analysis_id} row={row} onCancel={() => cancel.mutate(row.analysis_id)} />
        ))}
      </div>
    </section>
  );
}

function JobRow({ row, onCancel }: { row: Analysis; onCancel: () => void }) {
  const live = row.status === "queued" || row.status === "running";
  const href = jobHref(row.analysis_id);
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-elevated px-3 py-2">
      <Link href={href} className="min-w-[140px] font-medium text-gold">
        {row.company_name || row.symbol.replace(".NS", "")}
      </Link>
      <StatusChip status={row.status} />
      <p className="flex-1 text-sm text-mist">{progressLabel(row)}</p>
      {live && (
        <button type="button" onClick={onCancel} className="rounded-md border border-loss/40 px-3 py-1 text-xs text-loss">
          Cancel
        </button>
      )}
      <Link href={href} className="text-xs text-mist hover:text-[var(--text-primary)]">
        Open
      </Link>
    </div>
  );
}

export function StatusChip({ status }: { status?: string | null }) {
  const map: Record<string, string> = {
    queued: "bg-warn/15 text-warn border-warn/30",
    running: "bg-gold/15 text-gold border-gold/30",
    completed: "bg-gain/15 text-gain border-gain/30",
    failed: "bg-loss/15 text-loss border-loss/30",
    cancelled: "bg-elevated text-mist border-line",
  };
  return (
    <span className={`rounded-md border px-2 py-0.5 text-[11px] uppercase tracking-wide ${map[status || ""] || "border-line text-mist"}`}>
      {status || "unknown"}
    </span>
  );
}
