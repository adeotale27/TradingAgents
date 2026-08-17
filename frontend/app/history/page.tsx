"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { DecisionBadge } from "@/components/DecisionBadge";
import { InfoTip } from "@/components/InfoTip";
import { JobQueue, StatusChip } from "@/components/JobQueue";
import { api } from "@/lib/api";

export default function HistoryPage() {
  const list = useQuery({ queryKey: ["history"], queryFn: () => api.listAnalysis(), refetchInterval: 2500 });
  const [decision, setDecision] = useState("ALL");
  const [band, setBand] = useState("ALL");
  const rows = useMemo(() => {
    return (list.data?.items || []).filter((item) => {
      if (decision !== "ALL" && (item.final_decision || "").toUpperCase() !== decision) return false;
      if (band === "HIGH" && (item.confidence || 0) < 75) return false;
      if (band === "MEDIUM" && ((item.confidence || 0) < 50 || (item.confidence || 0) >= 75)) return false;
      if (band === "LOW" && (item.confidence || 0) >= 50) return false;
      return true;
    });
  }, [list.data, decision, band]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        Jobs & history
        <InfoTip text="Cancel queued or running jobs here. Failed rows show the engine error so you can fix Setup and retry." />
      </h1>
      <JobQueue />
      <div className="flex flex-wrap gap-2">
        {["ALL", "BUY", "SELL", "HOLD"].map((item) => (
          <button key={item} onClick={() => setDecision(item)} className={`rounded-md border px-3 py-1 text-sm ${decision === item ? "border-gold text-gold" : "border-line text-mist"}`}>
            {item}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-800 text-mist">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Decision</th>
              <th className="px-3 py-2">Progress / reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.analysis_id} className="border-t border-line">
                <td className="px-3 py-2">{row.analysis_date}</td>
                <td className="px-3 py-2">
                  <Link className="text-gold" href={row.status === "queued" || row.status === "running" ? `/analyze/${row.symbol}/running?id=${row.analysis_id}` : `/runs/${row.analysis_id}`}>
                    {row.symbol.replace(".NS", "")}
                  </Link>
                </td>
                <td className="px-3 py-2"><StatusChip status={row.status} /></td>
                <td className="px-3 py-2"><DecisionBadge action={row.final_decision} size="sm" /></td>
                <td className="px-3 py-2 text-mist">
                  {row.status === "failed" || row.status === "cancelled"
                    ? row.error_message || row.status
                    : row.progress
                      ? `${row.progress.step}/${row.progress.total} ${row.progress.title}`
                      : row.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
