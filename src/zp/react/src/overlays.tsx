import * as React from "react";
import { Button, Icon, IconButton, type ButtonVariant } from "./primitives";
import type { IconName } from "./icons";
import { cx, Portal, useCompact, useDismiss, useFocusTrap } from "./utils";

/* ---------------- Tooltip ---------------- */
/** Wraps one focusable child; shows on hover and keyboard focus, hides on Escape. Fill ink, text surface. */
export function Tooltip({ content, children, placement = "top" }: { content: React.ReactNode; children: React.ReactElement<Record<string, unknown>>; placement?: "top" | "bottom" }) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();
  const timer = React.useRef<number | undefined>(undefined);
  const show = () => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setOpen(true), 300); };
  const hide = () => { window.clearTimeout(timer.current); setOpen(false); };
  React.useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <span className="zp-anchor" onMouseEnter={show} onMouseLeave={hide} onFocus={() => setOpen(true)} onBlur={hide}
      onKeyDown={(e) => e.key === "Escape" && hide()}>
      {React.cloneElement(children, { "aria-describedby": open ? id : undefined, title: undefined })}
      {open && <div id={id} role="tooltip" className={cx("tip zp-float", placement === "top" ? "above" : "up")} style={{ whiteSpace: "nowrap" }}>{content}</div>}
    </span>
  );
}

/* ---------------- Popover ---------------- */
export interface PopoverProps {
  /** The trigger. Receives aria-expanded / onClick. */
  trigger: React.ReactElement<Record<string, unknown>>;
  title?: string;
  children: React.ReactNode;
  width?: number;
  align?: "start" | "end";
  /** "top" opens above the trigger (near the bottom of the screen, e.g. the account menu). */
  placement?: "bottom" | "top";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
/** Non-modal floating panel (no backdrop). Below 1100 px it becomes a bottom sheet. */
export function Popover({ trigger, title, children, width = 360, align = "start", placement = "bottom", open: openProp, onOpenChange }: PopoverProps) {
  const [inner, setInner] = React.useState(false);
  const open = openProp ?? inner;
  const set = React.useCallback((v: boolean) => { setInner(v); onOpenChange?.(v); }, [onOpenChange]);
  const root = React.useRef<HTMLSpanElement>(null);
  const compact = useCompact();
  const close = React.useCallback(() => set(false), [set]);
  useDismiss(root, open && !compact, close);
  const t = React.cloneElement(trigger, { "aria-expanded": open, "aria-haspopup": "dialog", onClick: () => set(!open) });
  if (compact) return <>{t}<Sheet open={open} onClose={close} title={title} placement="bottom">{children}</Sheet></>;
  return (
    <span ref={root} className="zp-anchor">
      {t}
      {open && (
        <div className={cx("pop zp-float", align === "end" && "end", placement === "top" && "above")} role="dialog" aria-label={title} style={{ width, maxHeight: "70vh", overflow: "auto" }}>
          {title && <div className="row" style={{ marginBottom: 12 }}><span className="lbl grow" style={{ fontSize: 15 }}>{title}</span><IconButton icon="x" label="Close" size="sm" onClick={close} /></div>}
          {children}
        </div>
      )}
    </span>
  );
}

/* ---------------- Dropdown menu ---------------- */
export type MenuEntry =
  | { type?: "item"; label: string; icon?: IconName; onSelect: () => void; danger?: boolean; shortcut?: string; description?: string; disabledReason?: string; checked?: boolean }
  | { type: "separator" }
  | { type: "label"; label: string };

/** Destructive items go last, after a separator. Items the user has no right to are not passed at all. */
export function DropdownMenu({ trigger, items, align = "start", placement = "bottom", width = 240 }:
  { trigger: React.ReactElement<Record<string, unknown>>; items: MenuEntry[]; align?: "start" | "end"; placement?: "bottom" | "top"; width?: number }) {
  const [open, setOpen] = React.useState(false);
  const root = React.useRef<HTMLSpanElement>(null);
  const list = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setOpen(false), []);
  const compact = useCompact();
  useDismiss(root, open && !compact, close);
  React.useEffect(() => { if (open) list.current?.querySelector<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])')?.focus(); }, [open]);
  const onKey = (e: React.KeyboardEvent) => {
    const els = Array.from(list.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const i = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") { e.preventDefault(); els[(i + 1) % els.length]?.focus(); }
    if (e.key === "ArrowUp") { e.preventDefault(); els[(i - 1 + els.length) % els.length]?.focus(); }
  };
  const body = (
    <div ref={list} className={cx(!compact && "menu zp-float", !compact && align === "end" && "end", !compact && placement === "top" && "above")} role="menu"
      style={compact ? { padding: 8 } : { width }} onKeyDown={onKey}>
      {items.map((it, i) => {
        if (it.type === "separator") return <div key={i} className="mi-sep" role="separator" />;
        if (it.type === "label") return <div key={i} className="mi-label">{it.label}</div>;
        const dis = !!it.disabledReason;
        return (
          <button key={i} type="button" role="menuitem" aria-disabled={dis || undefined} className={cx("mi", it.danger && "danger")} style={dis ? { opacity: 0.5 } : undefined}
            onClick={() => { if (dis) return; close(); it.onSelect(); }}>
            {it.icon && <Icon name={it.icon} size={16} />}
            <span>{it.label}{it.description && <span className="sub">{it.description}</span>}{it.disabledReason && <span className="reason">{it.disabledReason}</span>}</span>
            {it.shortcut && <span className="kbd">{it.shortcut}</span>}
            {it.checked && <span className="chk"><Icon name="check" size={16} /></span>}
          </button>
        );
      })}
    </div>
  );
  const t = React.cloneElement(trigger, { "aria-expanded": open, "aria-haspopup": "menu", onClick: () => setOpen(!open) });
  if (compact) return <>{t}<Sheet open={open} onClose={close} placement="bottom">{body}</Sheet></>;
  return <span ref={root} className="zp-anchor">{t}{open && body}</span>;
}

/* ---------------- Dialog / AlertDialog ---------------- */
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  role?: "dialog" | "alertdialog";
  icon?: React.ReactNode;
  initialFocus?: React.RefObject<HTMLElement | null>;
  /** Alert dialogs do not close on backdrop click. */
  dismissible?: boolean;
}
export function Dialog({ open, onClose, title, children, footer, width = 400, role = "dialog", icon, initialFocus, dismissible = true }: DialogProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const tid = React.useId();
  useFocusTrap(ref, open, initialFocus);
  React.useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    const o = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = o; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <Portal className="zp-overlay">
      <div className="backdrop" onClick={dismissible ? onClose : undefined} />
      <div ref={ref} className="dlg" role={role} aria-modal="true" aria-labelledby={tid} style={{ width }}>
        <div className="dlg-h" style={icon ? { alignItems: "flex-start" } : undefined}>
          {icon}
          <h3 className="dlg-t" id={tid}>{title}</h3>
          {role === "dialog" && <IconButton icon="x" label="Close" onClick={onClose} />}
        </div>
        <div className="dlg-b" style={{ overflow: "auto" }}>{children}</div>
        {footer && <div className="dlg-f">{footer}</div>}
      </div>
    </Portal>
  );
}

export interface AlertDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary" | "warning";
  confirming?: boolean;
  /** Server refusal: shown in a danger alert, the dialog stays open. */
  error?: string;
}
/** Asks before something irreversible. Focus starts on the safe action. */
export function AlertDialog({ open, onCancel, onConfirm, title, children, confirmLabel, cancelLabel = "Cancel", tone = "danger", confirming, error }: AlertDialogProps) {
  const safe = React.useRef<HTMLButtonElement>(null);
  const icon: IconName = tone === "danger" ? "trash" : tone === "warning" ? "alert" : "arrow-right";
  const variant: ButtonVariant = tone === "danger" ? "danger" : "primary";
  return (
    <Dialog open={open} onClose={onCancel} title={title} role="alertdialog" width={420} initialFocus={safe} dismissible={false}
      icon={<span className={`bdg t-${tone}`} style={{ width: 36, height: 36, padding: 0, justifyContent: "center", flexShrink: 0 }}><Icon name={icon} size={18} /></span>}
      footer={<><Button ref={safe} variant="secondary" onClick={onCancel} softDisabled={confirming}>{cancelLabel}</Button><Button variant={variant} loading={confirming} onClick={onConfirm}>{confirmLabel}</Button></>}>
      {error && <div className="alert t-danger"><Icon name="err" size={16} /><span>{error}</span></div>}
      {typeof children === "string" ? <p style={{ margin: 0 }}>{children}</p> : children}
    </Dialog>
  );
}

/* ---------------- Sheet ---------------- */
export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** "side": non-modal panel — render it inside your layout, the page narrows beside it. "bottom": modal bottom sheet. Below 1100 px both are bottom sheets. */
  placement?: "side" | "bottom";
  width?: number;
}
export function Sheet({ open, onClose, title, subtitle, children, footer, placement = "side", width = 360 }: SheetProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const compact = useCompact();
  const bottom = placement === "bottom" || compact;
  useFocusTrap(ref, open && bottom);
  React.useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  const head = title && <div className="sheet-h"><span className="sheet-t">{title}</span>{subtitle && <span className="sm faint">{subtitle}</span>}<IconButton icon="x" label={bottom ? "Close" : "Close panel"} size="sm" onClick={onClose} /></div>;
  if (!bottom) {
    return (
      <aside className="sheet" role="complementary" aria-label={title} style={{ width, borderRadius: "12px 0 0 12px", borderRight: 0, boxShadow: "var(--shadow-sm)", flexShrink: 0 }}>
        {head}<div className="sheet-b" style={{ overflow: "auto", flexGrow: 1 }}>{children}</div>{footer && <div className="sheet-f">{footer}</div>}
      </aside>
    );
  }
  return (
    <Portal className="zp-overlay bottom">
      <div className="backdrop" onClick={onClose} />
      <div ref={ref} className="sheet" role="dialog" aria-modal="true" aria-label={title} style={{ width: "min(560px, 100%)", maxHeight: "90vh", borderRadius: "12px 12px 0 0", boxShadow: "var(--shadow-lg)" }}>
        <div className="handle" />{head}<div className="sheet-b" style={{ overflow: "auto" }}>{children}</div>{footer && <div className="sheet-f">{footer}</div>}
      </div>
    </Portal>
  );
}

/* ---------------- Toast ---------------- */
type ToastKind = "success" | "error" | "info";
interface ToastItem { id: number; kind: ToastKind; message: React.ReactNode; action?: { label: string; onClick: () => void } }
const ToastContext = React.createContext<((t: Omit<ToastItem, "id">) => void) | null>(null);

/** Bottom-right stack. Success and info leave after 5 s (hover pauses); errors stay until closed. Past tense, the object named. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const n = React.useRef(0);
  const remove = React.useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const push = React.useCallback((t: Omit<ToastItem, "id">) => setItems((l) => [...l, { ...t, id: ++n.current }]), []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <Portal className="zp-toasts">{items.map((t) => <ToastView key={t.id} item={t} onClose={remove} />)}</Portal>
    </ToastContext.Provider>
  );
}
function ToastView({ item, onClose }: { item: ToastItem; onClose: (id: number) => void }) {
  const [paused, setPaused] = React.useState(false);
  React.useEffect(() => {
    if (item.kind === "error" || paused) return;
    const t = window.setTimeout(() => onClose(item.id), 5000);
    return () => window.clearTimeout(t);
  }, [item.kind, item.id, paused, onClose]);
  const icon: IconName = item.kind === "success" ? "ok" : item.kind === "error" ? "err" : "info";
  return (
    <div className={cx("toast", item.kind)} role={item.kind === "error" ? "alert" : "status"} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <span className="ti"><Icon name={icon} size={18} /></span>
      <span className="grow">{item.message}</span>
      {item.action && <Button variant="link" size="sm" onClick={() => { item.action!.onClick(); onClose(item.id); }}>{item.action.label}</Button>}
      <IconButton icon="x" label="Close" size="sm" onClick={() => onClose(item.id)} />
    </div>
  );
}
export function useToast() {
  const push = React.useContext(ToastContext);
  if (!push) throw new Error("useToast must be used inside <ToastProvider>");
  return React.useMemo(() => ({
    success: (message: React.ReactNode, action?: ToastItem["action"]) => push({ kind: "success", message, action }),
    error: (message: React.ReactNode, action?: ToastItem["action"]) => push({ kind: "error", message, action }),
    info: (message: React.ReactNode, action?: ToastItem["action"]) => push({ kind: "info", message, action }),
  }), [push]);
}
