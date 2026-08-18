"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DecisionBadge } from "@/components/DecisionBadge";
import { Dropdown } from "@/components/Dropdown";
import { StatusChip } from "@/components/JobQueue";
import { StateBlock } from "@/components/StateBlock";
import { api } from "@/lib/api";
import { formatDuration, formatWhen, jobHref, progressLabel } from "@/lib/jobs";

const FILTERS = [
  { id: "ALL", label: "ALL" },
  { id: "RUNNING", label: "RUNNING" },
  { id: "COMPLETED", label: "COMPLETED" },
  { id: "FAILED", label: "FAILED" },
  { id: "BUY", label: "BUY" },
  { id: "HOLD", label: "HOLD" },
  { id: "SELL", label: "SELL" },
];

export default function JobsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("ALL");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const limit = 25;
  const params = useMemo(() => {
    const sp = new URLSearchParams();
    sp.set("limit", String(limit));
    sp.set("offset", String(page * limit));
    if (q.trim()) sp.set("q", q.trim());
    if (["RUNNING", "COMPLETED", "FAILED"].includes(filter)) sp.set("status", filter.toLowerCase());
    if (["BUY", "HOLD", "SELL"].includes(filter)) sp.set("decision", filter);
    return `?${sp.toString()}`;
  }, [filter, q, page]);
  const list = useQuery({ queryKey: ["history", params], queryFn: () => api.listAnalysis(params), refetchInterval: 2500 });
  const rows = list.data?.items || [];
  const total = list.data?.total || 0;
  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="text-sm text-mist">Every analysis run is stored here and can be reopened.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Search company / symbol"
          className="min-w-[200px] flex-1 rounded-md border border-line bg-ink-800 px-3 py-2 text-sm"
        />
        <div className="w-44">
          <Dropdown
            value={filter}
            onChange={(id) => {
              setFilter(id);
              setPage(0);
            }}
            options={FILTERS}
          />
        </div>
      </div>
      {list.isError && (
        <StateBlock title="Could not load jobs." message={(list.error as Error).message} onRetry={() => list.refetch()} />
      )}
      {!list.isLoading && rows.length === 0 && (
        <StateBlock title="No analyses yet." message="Search a company and run Analyze to start." />
      )}
      {list.isLoading && <div className="skeleton h-48" />}
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-md border border-line">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-elevated text-mist">
              <tr>
                <th className="px-3 py-2">Date & Time</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Symbol</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Decision</th>
                <th className="px-3 py-2">Progress</th>
                <th className="px-3 py-2">Duration</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.analysis_id}
                  className="cursor-pointer border-t border-line hover:bg-elevated"
                  onClick={() => router.push(jobHref(row.analysis_id))}
                >
                  <td className="px-3 py-2 text-mist">{formatWhen(row.created_at || row.started_at)}</td>
                  <td className="px-3 py-2">{row.company_name || row.symbol.replace(".NS", "")}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.symbol}</td>
                  <td className="px-3 py-2">
                    <StatusChip status={row.status} />
                  </td>
                  <td className="px-3 py-2">
                    <DecisionBadge action={row.final_decision || "N/A"} size="sm" />
                  </td>
                  <td className="px-3 py-2 text-mist">
                    {row.status === "completed" ? "100%" : progressLabel(row)}
                  </td>
                  <td className="px-3 py-2 text-mist">{formatDuration(row.duration_seconds)}</td>
                  <td className="px-3 py-2">
                    <Link href={jobHref(row.analysis_id)} className="text-gold" onClick={(e) => e.stopPropagation()}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {total > limit && (
        <div className="flex items-center justify-end gap-2 text-sm">
          <button className="rounded-md border border-line px-3 py-1 disabled:opacity-40" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="text-mist">
            {page + 1} / {pages}
          </span>
          <button className="rounded-md border border-line px-3 py-1 disabled:opacity-40" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
