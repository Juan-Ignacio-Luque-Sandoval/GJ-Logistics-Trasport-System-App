import * as React from "react";
import { createPortal } from "react-dom";

/** Join class names, skipping falsy values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Controlled / uncontrolled value helper. */
export function useControllable<T>(value: T | undefined, defaultValue: T, onChange?: (v: T) => void): [T, (v: T) => void] {
  const [inner, setInner] = React.useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? (value as T) : inner;
  const set = React.useCallback((v: T) => { if (!isControlled) setInner(v); onChange?.(v); }, [isControlled, onChange]);
  return [current, set];
}

/** Call `handler` on a pointer-down outside `ref`, and on Escape, while `open`. */
export function useDismiss(ref: React.RefObject<HTMLElement | null>, open: boolean, handler: () => void) {
  const h = React.useRef(handler);
  h.current = handler;
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) h.current(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") h.current(); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open, ref]);
}

/** Render children at the end of <body>, inside a `.zp` scope so tokens and component styles apply. */
export function Portal({ children, className }: { children: React.ReactNode; className?: string }) {
  const [el, setEl] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => setEl(document.body), []);
  return el ? createPortal(<div className={cx("zp", className)}>{children}</div>, el) : null;
}

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Trap Tab inside `ref` while active, focus the `initial` element (or the first focusable), restore focus on close. */
export function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active: boolean, initial?: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    if (!active || !ref.current) return;
    const prev = document.activeElement as HTMLElement | null;
    const root = ref.current;
    const first = initial?.current ?? root.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const a = items[0], b = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
      else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
    };
    root.addEventListener("keydown", onKey);
    return () => { root.removeEventListener("keydown", onKey); prev?.focus?.(); };
  }, [active, ref, initial]);
}

/** True below the 1100 px breakpoint, where menus, popovers and side panels become bottom sheets. */
export function useCompact(breakpoint = 1100): boolean {
  const q = `(max-width: ${breakpoint - 1}px)`;
  const [m, setM] = React.useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  React.useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [q]);
  return m;
}
