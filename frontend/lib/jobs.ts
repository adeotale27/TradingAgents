import type { Analysis, Settings } from "./types";
import { api } from "./api";

export function jobHref(id: string) {
  return `/jobs/${id}`;
}

export function stockHref(symbol: string) {
  return `/analyze/${encodeURIComponent(symbol)}`;
}

export function shortJobId(id: string) {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function formatDuration(seconds?: number | null) {
  if (seconds == null || Number.isNaN(seconds)) return "—";
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}h ${m}m ${s}s`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatWhen(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export async function startAnalysisJob(symbol: string, settings?: Settings | null, extras: Record<string, unknown> = {}) {
  try {
    return await api.startAnalysis({
      symbol,
      research_depth: settings?.research_depth || "medium",
      llm_provider: settings?.llm_provider,
      model: settings?.model,
      quick_model: settings?.quick_model,
      selected_analysts: [
        settings?.enable_technical === false ? null : "market",
        settings?.enable_sentiment === false ? null : "social",
        settings?.enable_news === false ? null : "news",
        settings?.enable_fundamentals === false ? null : "fundamentals",
      ].filter(Boolean),
      ...extras,
    });
  } catch (err) {
    const detail = (err as { detail?: { analysis_id?: string; status?: string } }).detail;
    if (detail?.analysis_id) {
      return { analysis_id: detail.analysis_id, status: detail.status || "running", existing: true };
    }
    throw err;
  }
}

export function progressLabel(row: Analysis) {
  if (row.status === "failed") return row.error_friendly || row.error_message || "Failed";
  if (row.status === "cancelled") return "Cancelled";
  if (row.progress) {
    if (row.progress.step === 0) return "Queued";
    return `${row.progress.step}/${row.progress.total} ${row.progress.title}`;
  }
  return row.status;
}
