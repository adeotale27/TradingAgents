"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { InfoTip } from "@/components/InfoTip";
import { StateBlock } from "@/components/StateBlock";
import { api } from "@/lib/api";
import { formatWhen } from "@/lib/jobs";

const HEALTH_LABELS: Record<string, string> = {
  api: "API",
  database: "DATABASE",
  redis: "REDIS",
  tradingagents: "TRADINGAGENTS",
  market_data_provider: "MARKET DATA PROVIDER",
  users: "USERS",
  analyses: "ANALYSES",
};

export default function AdminPage() {
  const health = useQuery({ queryKey: ["admin-health"], queryFn: api.adminHealth });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: api.adminUsers });
  const logs = useQuery({ queryKey: ["admin-logs"], queryFn: api.adminLogs });
  const [open, setOpen] = useState<string | null>(null);

  if (health.isError) {
    return <StateBlock title="Admin only" message={(health.error as Error).message} />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">
        Admin
        <InfoTip text="Local operations view. Provider keys are never displayed." />
      </h1>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Object.entries(health.data || {}).map(([key, value]) => (
          <div key={key} className="rounded-md border border-line bg-surface p-4">
            <p className="text-xs uppercase text-mist">{HEALTH_LABELS[key] || key}</p>
            <p className="mt-1 text-lg">{String(value)}</p>
          </div>
        ))}
      </div>
      <section>
        <h2 className="mb-2 text-sm text-mist">Users</h2>
        <div className="rounded-md border border-line">
          {(users.data?.items || []).map((user) => (
            <div key={user.id} className="flex justify-between border-b border-line px-3 py-2 text-sm last:border-0">
              <span>{user.email}</span>
              <span className="text-mist">{user.role}</span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-sm text-mist">Analysis logs</h2>
        <div className="rounded-md border border-line text-sm">
          {((logs.data?.analyses || []) as {
            id: string;
            symbol: string;
            company_name?: string;
            status: string;
            error?: string | null;
            error_category?: string | null;
            error_friendly?: string | null;
            created_at?: string;
          }[]).map((row) => (
            <div key={row.id} className="border-b border-line last:border-0">
              <button type="button" className="flex w-full flex-wrap items-center gap-3 px-3 py-2 text-left" onClick={() => setOpen(open === row.id ? null : row.id)}>
                <span className="w-40 text-xs text-mist">{formatWhen(row.created_at)}</span>
                <span className="min-w-[140px]">{row.company_name || row.symbol}</span>
                <span className="uppercase">{row.status}</span>
                <span className="text-mist">{row.error_category || "—"}</span>
              </button>
              {open === row.id && (
                <div className="bg-elevated px-3 py-3 text-xs">
                  <p>{row.error_friendly || "No operator message."}</p>
                  {row.error && (
                    <>
                      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap">{row.error}</pre>
                      <button className="mt-2 text-gold" onClick={() => navigator.clipboard.writeText(row.error || "")}>
                        Copy error
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
