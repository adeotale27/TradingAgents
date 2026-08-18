import type { Analysis, Quote, Settings, User } from "./types";

const TOKEN_KEY = "ta_token";
const USER_KEY = "ta_user";

export function apiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
}

export function apiUrl(path: string) {
  const prefix = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl()}${prefix}`;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

export function setSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(apiUrl(path), { ...init, headers });
  if (response.status === 401 && typeof window !== "undefined" && !path.includes("/auth/")) {
    clearSession();
    window.location.href = "/login";
  }
  if (!response.ok) {
    let detail: unknown = response.statusText;
    try {
      const body = await response.json();
      detail = body.detail ?? body;
    } catch {
      /* ignore */
    }
    const message =
      typeof detail === "string"
        ? detail
        : (detail as { message?: string })?.message || JSON.stringify(detail);
    const error = new Error(message) as Error & { status: number; detail: unknown };
    error.status = response.status;
    error.detail = detail;
    throw error;
  }
  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; user: User }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, name: string) =>
    request<{ access_token: string; user: User }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    }),
  health: () => request<{ status: string; version?: string; engine_version?: string }>("/api/v1/health"),
  market: () => request<{ indices: Quote[]; regime: string | null; error?: string }>("/api/v1/market/overview"),
  search: (q: string) =>
    request<{ results: { symbol: string; name: string; sector: string; exchange: string }[] }>(
      `/api/v1/stocks/search?q=${encodeURIComponent(q)}`,
    ),
  quote: (symbol: string) => request<Quote>(`/api/v1/stocks/${encodeURIComponent(symbol)}`),
  history: (symbol: string, range: string) =>
    request<{ time: string; open: number; high: number; low: number; close: number; volume: number }[]>(
      `/api/v1/stocks/${encodeURIComponent(symbol)}/history?range=${range}`,
    ),
  startAnalysis: (body: Record<string, unknown>) =>
    request<{ analysis_id: string; status: string }>("/api/v1/analysis", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getAnalysis: (id: string) => request<Analysis>(`/api/v1/analysis/${id}`),
  listAnalysis: (params = "") =>
    request<{ items: Analysis[]; total?: number; limit?: number; offset?: number }>(`/api/v1/analysis${params}`),
  scorecard: () =>
    request<{
      total_analyses: number;
      buy: number;
      hold: number;
      sell: number;
      completed: number;
      failed: number;
      cancelled: number;
      queued: number;
      running: number;
      average_confidence: number | null;
      average_duration_seconds: number | null;
    }>("/api/v1/scorecard"),
  cancelAnalysis: (id: string) =>
    request<Analysis>(`/api/v1/analysis/${id}/cancel`, { method: "POST" }),
  watchlist: () =>
    request<{ items: { id: string; symbol: string; quote: Quote | null; last_analysis: Analysis | null }[] }>(
      "/api/v1/watchlist",
    ),
  addWatch: (symbol: string) =>
    request<{ id: string; symbol: string }>("/api/v1/watchlist", {
      method: "POST",
      body: JSON.stringify({ symbol }),
    }),
  removeWatch: (id: string) => request<{ ok: boolean }>(`/api/v1/watchlist/${id}`, { method: "DELETE" }),
  settings: () => request<Settings>("/api/v1/settings"),
  saveSettings: (body: Partial<Settings>) =>
    request<Settings>("/api/v1/settings", { method: "PUT", body: JSON.stringify(body) }),
  llmCatalog: () => request<{ providers: import("./types").LlmProvider[] }>("/api/v1/llm/catalog"),
  universes: () =>
    request<{
      items: { id: string; label: string; stocks: { symbol: string; name: string; sector: string; label: string }[] }[];
    }>("/api/v1/stocks/universes"),
  backtest: (body: Record<string, unknown>) =>
    request<Record<string, unknown>>("/api/v1/backtests", { method: "POST", body: JSON.stringify(body) }),
  adminHealth: () => request<Record<string, unknown>>("/api/v1/admin/health"),
  adminUsers: () => request<{ items: User[] }>("/api/v1/admin/users"),
  adminLogs: () =>
    request<{
      events: unknown[];
      analyses: {
        id: string;
        symbol: string;
        company_name?: string;
        status: string;
        error?: string | null;
        error_category?: string | null;
        error_friendly?: string | null;
        created_at?: string;
      }[];
    }>("/api/v1/admin/logs"),
};
