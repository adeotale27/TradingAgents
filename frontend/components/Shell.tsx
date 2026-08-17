"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, clearSession, getToken, getUser } from "@/lib/api";
import { StockSearch } from "./StockSearch";

const NAV = [
  { href: "/", label: "Home", hint: "Overview and live jobs" },
  { href: "/market", label: "Market", hint: "NIFTY, Bank Nifty, Sensex" },
  { href: "/watchlist", label: "Watchlist", hint: "Your saved names" },
  { href: "/history", label: "Jobs", hint: "Queue, cancel, past runs" },
  { href: "/backtest", label: "Scorecard", hint: "Check past AI calls" },
  { href: "/settings", label: "Setup", hint: "Provider, models, keys" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const user = useMemo(() => (ready ? getUser() : null), [ready, pathname]);
  const publicPage = pathname === "/login";

  useEffect(() => {
    setReady(true);
    if (!getToken() && !publicPage) router.replace("/login");
  }, [pathname, publicPage, router]);

  const market = useQuery({
    queryKey: ["market"],
    queryFn: api.market,
    enabled: ready && !publicPage,
    refetchInterval: 60_000,
  });
  const health = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
    enabled: ready && !publicPage,
  });

  if (publicPage) return <>{children}</>;
  if (!ready) return <div className="p-10 text-mist">Loading terminal…</div>;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-ink-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-3">
          <Link href="/" className="shrink-0">
            <p className="text-[11px] tracking-[0.28em] text-gold">INDIA DESK</p>
            <p className="text-sm font-semibold">TradingAgents</p>
          </Link>
          <StockSearch />
          <div className="ml-auto flex items-center gap-3 text-xs">
            {market.data?.regime && (
              <span className="rounded-full border border-line px-2 py-1 text-mist">NSE {market.data.regime}</span>
            )}
            <span className="hidden text-mist md:inline">{user?.email}</span>
            <button className="text-mist hover:text-white" onClick={() => { clearSession(); router.push("/login"); }}>
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1600px] gap-1 overflow-x-auto px-4 pb-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.hint}
              className={`rounded-md px-3 py-1.5 text-sm ${
                pathname === item.href ? "bg-gold/15 text-gold" : "text-mist hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link href="/admin" className={`rounded-md px-3 py-1.5 text-sm ${pathname === "/admin" ? "bg-gold/15 text-gold" : "text-mist"}`}>
              Admin
            </Link>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-[1600px] px-4 pb-6 text-xs text-mist">
        Web v{(health.data as { version?: string } | undefined)?.version || "1.1.0"} · Engine v
        {(health.data as { engine_version?: string } | undefined)?.engine_version || "0.3.1"} · Research aid only, not a broker
      </footer>
    </div>
  );
}
