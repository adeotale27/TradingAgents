"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api";
import { InfoTip } from "@/components/InfoTip";
import { StateBlock } from "@/components/StateBlock";
import { num, pct, signedClass } from "@/lib/format";

export default function MarketPage() {
  const market = useQuery({ queryKey: ["market"], queryFn: api.market, refetchInterval: 60_000 });
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">
        India market tape
        <InfoTip text="Index quotes via the market-data provider (Yahoo by default). Breadth/sector panels appear when quotes succeed." />
      </h1>
      {market.isLoading && <div className="skeleton h-40" />}
      {market.data?.error && (
        <StateBlock title="Unable to retrieve market data." message={market.data.error} onRetry={() => market.refetch()} />
      )}
      <p className="text-sm text-mist">
        Session read: <span>{market.data?.regime || "unavailable"}</span>
      </p>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(market.data?.indices || []).map((idx) => {
          const tone = (idx.change_percent || 0) > 0 ? "border-gain/30" : (idx.change_percent || 0) < 0 ? "border-loss/30" : "border-line";
          return (
            <Link key={idx.symbol} href="/" className={`rounded-md border bg-surface p-4 ${tone}`}>
              <p className="text-xs text-mist">{idx.symbol}</p>
              <h2 className="text-lg">{idx.name}</h2>
              <p className="mt-2 font-mono text-3xl tabular">{num(idx.price)}</p>
              <p className={`tabular ${signedClass(idx.change_percent)}`}>{pct(idx.change_percent)}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
