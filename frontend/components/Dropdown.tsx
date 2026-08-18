"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { broadcastOpen, onOpen } from "@/lib/dropdown-bus";

type Option = { id: string; label: string };

export function Dropdown({
  value,
  options,
  onChange,
  label,
  className = "",
}: {
  value: string;
  options: Option[];
  onChange: (id: string) => void;
  label?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const selected = options.find((item) => item.id === value);

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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    return onOpen((other) => {
      if (other !== id) setOpen(false);
    });
  }, [id]);

  return (
    <div ref={root} className={`relative ${className}`}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm text-mist">
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-md border border-line bg-ink-800 px-3 py-2 text-left text-sm"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) broadcastOpen(id);
        }}
      >
        <span>{selected?.label || "Select"}</span>
        <span className="text-mist">▾</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-line bg-surface shadow-terminal"
        >
          {options.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={item.id === value}
                className={`flex w-full px-3 py-2 text-left text-sm hover:bg-elevated ${item.id === value ? "text-gold" : ""}`}
                onClick={() => {
                  onChange(item.id);
                  setOpen(false);
                }}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
