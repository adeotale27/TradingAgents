"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Dropdown } from "@/components/Dropdown";
import { InfoTip } from "@/components/InfoTip";
import { api } from "@/lib/api";
import type { LlmProvider, Settings } from "@/lib/types";

export default function SetupPage() {
  const query = useQuery({ queryKey: ["settings"], queryFn: api.settings });
  const catalog = useQuery({ queryKey: ["llm-catalog"], queryFn: api.llmCatalog });
  const [form, setForm] = useState<Settings | null>(null);
  useEffect(() => {
    if (query.data) setForm(query.data);
  }, [query.data]);
  const save = useMutation({ mutationFn: () => api.saveSettings(form || {}) });
  const providers = catalog.data?.providers || [];
  const current = useMemo(
    () => providers.find((item) => item.id === form?.llm_provider) || providers[0],
    [providers, form?.llm_provider],
  );
  if (!form) return <div className="skeleton h-64" />;

  function applyProvider(next: LlmProvider) {
    setForm((prev) => {
      if (!prev) return prev;
      const deepOk = next.deep.some((item) => item.id === prev.model);
      const quickOk = next.quick.some((item) => item.id === prev.quick_model);
      return {
        ...prev,
        llm_provider: next.id,
        model: deepOk ? prev.model : next.deep[0]?.id || "",
        quick_model: quickOk ? prev.quick_model : next.quick[0]?.id || "",
        google_thinking_level: next.id === "google" ? prev.google_thinking_level || "minimal" : prev.google_thinking_level,
        openai_reasoning_effort: next.id === "openai" ? prev.openai_reasoning_effort || "medium" : prev.openai_reasoning_effort,
        anthropic_effort: next.id === "anthropic" ? prev.anthropic_effort || "high" : prev.anthropic_effort,
      };
    });
  }

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  const thinkingKey =
    form.llm_provider === "google"
      ? "google_thinking_level"
      : form.llm_provider === "openai"
        ? "openai_reasoning_effort"
        : form.llm_provider === "anthropic"
          ? "anthropic_effort"
          : null;

  const deepOk = (current?.deep || []).some((item) => item.id === form.model);
  const quickOk = (current?.quick || []).some((item) => item.id === form.quick_model);
  const ready = Boolean(form.llm_provider && form.model && deepOk && quickOk);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Setup</h1>
        <p className={`rounded-md border px-3 py-1 text-xs ${ready ? "border-gain/40 text-gain" : "border-loss/40 text-loss"}`}>
          Configuration status: {ready ? "READY" : "ERROR"}
        </p>
      </div>
      {!ready && (
        <p className="text-sm text-loss">Provider and models must match. Google never accepts OpenAI model IDs.</p>
      )}
      <section className="space-y-3 rounded-md border border-line bg-surface p-4">
        <h2 className="text-sm text-mist">
          LLM
          <InfoTip text="Models are filtered by provider. Google never accepts gpt-* IDs. Keys stay in .env." />
        </h2>
        <Dropdown
          label="Provider"
          value={form.llm_provider || ""}
          options={providers.map((item) => ({ id: item.id, label: item.label }))}
          onChange={(id) => {
            const next = providers.find((item) => item.id === id);
            if (next) applyProvider(next);
          }}
        />
        <Dropdown
          label="Deep model"
          value={form.model || ""}
          options={current?.deep || []}
          onChange={(id) => set("model", id)}
        />
        <Dropdown
          label="Quick model"
          value={form.quick_model || ""}
          options={current?.quick || []}
          onChange={(id) => set("quick_model", id)}
        />
        {thinkingKey && (current?.thinking_modes || []).length > 0 && (
          <Dropdown
            label="Thinking mode"
            value={(form[thinkingKey] as string) || ""}
            options={current.thinking_modes}
            onChange={(id) => set(thinkingKey, id)}
          />
        )}
        <Field label="Temperature">
          <input type="number" step="0.1" value={form.temperature ?? ""} onChange={(e) => set("temperature", e.target.value === "" ? null : Number(e.target.value))} className="w-full rounded-md border border-line bg-ink-800 px-2 py-2" />
        </Field>
        <Dropdown
          label="Research depth"
          value={form.research_depth || "medium"}
          options={[
            { id: "shallow", label: "shallow" },
            { id: "medium", label: "medium" },
            { id: "deep", label: "deep" },
          ]}
          onChange={(id) => set("research_depth", id)}
        />
        <Field label="Debate rounds">
          <input type="number" min={1} max={5} value={form.debate_rounds ?? 1} onChange={(e) => set("debate_rounds", Number(e.target.value))} className="w-full rounded-md border border-line bg-ink-800 px-2 py-2" />
        </Field>
      </section>
      <section className="space-y-3 rounded-md border border-line bg-surface p-4">
        <h2 className="text-sm text-mist">Market data</h2>
        <Dropdown
          label="Market data provider"
          value={form.market_data_provider || "yahoo"}
          options={[
            { id: "yahoo", label: "yahoo" },
            { id: "nse", label: "nse (via yahoo until a broker feed is configured)" },
          ]}
          onChange={(id) => set("market_data_provider", id)}
        />
        <Field label="Refresh interval (seconds)">
          <input type="number" value={form.refresh_interval_seconds} onChange={(e) => set("refresh_interval_seconds", Number(e.target.value))} className="w-full rounded-md border border-line bg-ink-800 px-2 py-2" />
        </Field>
      </section>
      <section className="space-y-2 rounded-md border border-line bg-surface p-4">
        <h2 className="text-sm text-mist">Analysts</h2>
        <Toggle label="Technical" checked={form.enable_technical} onChange={(v) => set("enable_technical", v)} />
        <Toggle label="Fundamentals" checked={form.enable_fundamentals} onChange={(v) => set("enable_fundamentals", v)} />
        <Toggle label="Sentiment" checked={form.enable_sentiment} onChange={(v) => set("enable_sentiment", v)} />
        <Toggle label="News" checked={form.enable_news} onChange={(v) => set("enable_news", v)} />
      </section>
      {save.isError && <p className="text-sm text-loss">{(save.error as Error).message}</p>}
      <button onClick={() => save.mutate()} className="rounded-md bg-gold px-4 py-2 text-sm font-semibold text-primary-fg">
        {save.isSuccess ? "Saved" : "Save setup"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-mist">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: boolean extends never ? never : string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between text-sm">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
