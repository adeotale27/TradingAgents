"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, clearSession, getToken, getUser } from "@/lib/api";
import { useTheme } from "@/lib/theme";
import { StockSearch } from "./StockSearch";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/market", label: "Market" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/jobs", label: "Jobs" },
  { href: "/scorecard", label: "Scorecard" },
  { href: "/setup", label: "Setup" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
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

  function active(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen bg-background text-[var(--text-primary)]">
      <header className="sticky top-0 z-40 border-b border-line bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/" className="shrink-0">
            <p className="text-sm font-semibold leading-tight">TradingAgents</p>
            <p className="text-[11px] tracking-[0.22em] text-brand">INDIA DESK</p>
          </Link>
          <StockSearch />
          <div className="ml-auto flex items-center gap-2 text-xs sm:gap-3">
            {market.data?.regime && (
              <span className="hidden rounded-md border border-line px-2 py-1 text-mist sm:inline">NSE {market.data.regime}</span>
            )}
            <button
              type="button"
              onClick={toggle}
              className="rounded-md border border-line px-2 py-1 text-mist hover:text-[var(--text-primary)]"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <span className="hidden text-mist md:inline">{user?.email}</span>
            <button className="text-mist hover:text-[var(--text-primary)]" onClick={() => { clearSession(); router.push("/login"); }}>
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1600px] gap-1 overflow-x-auto px-4 pb-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
                active(item.href) ? "bg-gold/15 text-gold" : "text-mist hover:text-[var(--text-primary)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user?.role === "admin" && (
            <Link href="/admin" className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${active("/admin") ? "bg-gold/15 text-gold" : "text-mist"}`}>
              Admin
            </Link>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-[1600px] px-4 pb-6 text-xs text-mist">
        Web v{(health.data as { version?: string } | undefined)?.version || "1.2.0"} · Engine v
        {(health.data as { engine_version?: string } | undefined)?.engine_version || "0.3.1"} · Research aid only, not a broker
      </footer>
    </div>
  );
}
