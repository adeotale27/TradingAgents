import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function inr(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: digits,
  }).format(value);
}

export function num(value: number | null | undefined, digits = 2) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

export function pct(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function signedClass(value: number | null | undefined) {
  if (value == null || value === 0) return "text-mist";
  return value > 0 ? "text-gain" : "text-loss";
}

export function decisionClass(action?: string | null) {
  const key = (action || "").toUpperCase();
  if (key === "BUY" || key === "OVERWEIGHT") return "text-gain border-gain/30 bg-gain/10";
  if (key === "SELL" || key === "UNDERWEIGHT") return "text-loss border-loss/30 bg-loss/10";
  if (key === "HOLD") return "text-warn border-warn/30 bg-warn/10";
  return "text-mist border-line bg-elevated";
}
