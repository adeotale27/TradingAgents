const EVENT = "ta-dropdown-open";

export function broadcastOpen(id: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
}

export function onOpen(handler: (id: string) => void) {
  const fn = (e: Event) => handler((e as CustomEvent<string>).detail);
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}
