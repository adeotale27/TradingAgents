"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import { broadcastOpen, onOpen } from "@/lib/dropdown-bus";
import { Dropdown } from "./Dropdown";

export function StockSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [universe, setUniverse] = useState("NIFTY500");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const universes = useQuerySafe();
  const stocks = useMemo(() => {
    const group = universes.find((item) => item.id === universe);
    return group?.stocks || [];
  }, [universes, universe]);
  const filtered = useMemo(() => {
    const needle = q.trim().toUpperCase();
    if (!needle) return [];
    return stocks.filter((row) => `${row.symbol} ${row.name}`.toUpperCase().includes(needle)).slice(0, 12);
  }, [q, stocks]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    return onOpen((other) => {
      if (other !== "stock-search") setOpen(false);
    });
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function go(symbol: string) {
    setOpen(false);
    setQ("");
    router.push(`/analyze/${encodeURIComponent(symbol)}`);
  }

  return (
    <div ref={root} className="flex min-w-0 flex-1 gap-2">
      <Dropdown
        className="hidden w-36 shrink-0 sm:block"
        value={universe}
        onChange={setUniverse}
        options={universes.map((item) => ({ id: item.id, label: item.label }))}
      />
      <div className="relative min-w-0 flex-1">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
            broadcastOpen("stock-search");
          }}
          onFocus={() => {
            if (q.trim()) {
              setOpen(true);
              broadcastOpen("stock-search");
            }
          }}
          onKeyDown={(e) => {
            if (!open || filtered.length === 0) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => (i + 1) % filtered.length);
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => (i - 1 + filtered.length) % filtered.length);
            }
            if (e.key === "Enter") {
              e.preventDefault();
              go(filtered[active].symbol);
            }
          }}
          placeholder="Search NSE/BSE stock…"
          className="w-full rounded-md border border-line bg-ink-800 px-3 py-2 text-sm outline-none ring-gold/40 placeholder:text-mist/60 focus:ring-2"
        />
        {open && q.trim() && (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-line bg-surface shadow-terminal">
            {filtered.length === 0 && <p className="px-3 py-2 text-sm text-mist">No matching stocks.</p>}
            {filtered.map((row, index) => (
              <button
                key={row.symbol}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-elevated ${index === active ? "bg-elevated" : ""}`}
                onClick={() => go(row.symbol)}
              >
                <span>
                  <span className="font-medium">{row.name}</span>
                  <span className="ml-2 text-xs text-mist">NSE</span>
                </span>
                <span className="text-mist">{row.symbol}</span>
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
