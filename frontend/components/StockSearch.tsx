"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

export function StockSearch() {
  const router = useRouter();
  const [universe, setUniverse] = useState("NIFTY50");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const universes = useQuerySafe();
  const stocks = useMemo(() => {
    const group = universes.find((item) => item.id === universe);
    return group?.stocks || [];
  }, [universes, universe]);
  const filtered = useMemo(() => {
    const needle = q.trim().toUpperCase();
    if (!needle) return stocks.slice(0, 12);
    return stocks.filter((row) => `${row.symbol} ${row.name}`.toUpperCase().includes(needle)).slice(0, 12);
  }, [q, stocks]);

  return (
    <div className="flex min-w-[320px] flex-1 gap-2">
      <select
        value={universe}
        onChange={(e) => setUniverse(e.target.value)}
        className="rounded-md border border-line bg-ink-800 px-2 py-2 text-sm"
      >
        {universes.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <div className="relative flex-1">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Company or symbol — Reliance Industries"
          className="w-full rounded-md border border-line bg-ink-800 px-3 py-2 text-sm outline-none ring-gold/40 placeholder:text-mist/60 focus:ring-2"
        />
        {open && filtered.length > 0 && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-line bg-ink-800 shadow-terminal">
            {filtered.map((row) => (
              <button
                key={row.symbol}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-ink-700"
                onClick={() => {
                  setOpen(false);
                  setQ("");
                  router.push(`/analyze/${row.symbol}`);
                }}
              >
                <span className="font-medium">{row.name}</span>
                <span className="text-mist">{row.symbol.replace(".NS", "")}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function useQuerySafe() {
  const [items, setItems] = useState<{ id: string; label: string; stocks: { symbol: string; name: string; sector: string; label: string }[] }[]>([]);
  useEffect(() => {
    api.universes().then((res) => setItems(res.items)).catch(() => setItems([]));
  }, []);
  return items;
}
