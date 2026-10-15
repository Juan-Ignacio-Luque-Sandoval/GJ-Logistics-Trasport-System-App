import * as React from "react";
import { ICON_PATHS, type IconName } from "./icons";
import { cx } from "./utils";

/* ---------------- Icon ---------------- */
export interface IconProps extends Omit<React.SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  /** Accessible name. Omit for decorative icons (they get aria-hidden). */
  label?: string;
}
export function Icon({ name, size = 16, label, className, ...rest }: IconProps) {
  return (
    <svg className={cx("ic", className)} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" role={label ? "img" : undefined}
      aria-label={label} aria-hidden={label ? undefined : true}
      dangerouslySetInnerHTML={{ __html: ICON_PATHS[name] }} {...rest} />
  );
}

/* ---------------- Spinner / Skeleton ---------------- */
export function Spinner({ size = "sm", label, onFill }: { size?: "xs" | "sm" | "md"; label?: string; onFill?: boolean }) {
  return <span className={cx("spin", size !== "sm" && size, onFill && "on-fill")} role={label ? "status" : undefined} aria-label={label} />;
}

export function Skeleton({ width = "100%", height = 12, circle, style }: { width?: number | string; height?: number; circle?: boolean; style?: React.CSSProperties }) {
  return <span className={cx("sk", circle && "circle")} style={{ display: "block", width, height, ...style }} aria-hidden />;
}

/* ---------------- Button ---------------- */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
export type Size = "sm" | "md" | "lg";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: Size;
  icon?: IconName;
  trailingIcon?: IconName;
  /** Shows a spinner and blocks clicks; keeps the label so the width does not jump. */
  loading?: boolean;
  /** Disabled but still focusable (pair it with the reason, shown as text or tooltip). */
  softDisabled?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", icon, trailingIcon, loading, softDisabled, className, children, onClick, type = "button", ...rest }, ref) {
  const blocked = loading || softDisabled;
  return (
    <button ref={ref} type={type} className={cx("btn", variant, size !== "md" && size, className)}
      aria-disabled={blocked || undefined} aria-busy={loading || undefined}
      onClick={(e) => { if (blocked) { e.preventDefault(); return; } onClick?.(e); }} {...rest}>
      {loading ? <Spinner size={size === "sm" ? "xs" : "sm"} onFill={variant === "primary" || variant === "danger"} /> : icon && <Icon name={icon} size={16} />}
      {children != null && <span>{children}</span>}
      {trailingIcon && <Icon name={trailingIcon} size={16} />}
    </button>
  );
});

export interface IconButtonProps extends Omit<ButtonProps, "icon" | "trailingIcon" | "children"> {
  icon: IconName;
  /** Required accessible name — also the native tooltip unless wrapped in <Tooltip>. */
  label: string;
  pressed?: boolean;
}
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = "ghost", size = "md", loading, pressed, className, ...rest }, ref) {
  return (
    <Button ref={ref} variant={variant} size={size} loading={loading} className={cx("icon", pressed && "is-on", className)}
      aria-label={label} title={label} aria-pressed={pressed} {...rest}>
      {loading ? undefined : <Icon name={icon} size={size === "sm" ? 16 : size === "lg" ? 20 : 18} />}
    </Button>
  );
});

/* ---------------- Badge / Chip / Avatar ---------------- */
export type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info" | "hold" | "obsolete";
export function Badge({ tone = "neutral", dot, inactive, children, className }: { tone?: Tone; dot?: boolean; inactive?: boolean; children: React.ReactNode; className?: string }) {
  return <span className={cx("bdg", `t-${tone}`, inactive && "inactive", className)}>{dot && <span className="dot" />}{children}</span>;
}
/** Gradient count pill (tab counts, notifications). */
export function CountBadge({ count, label }: { count: number; label?: string }) {
  return <span className="bdg count" aria-label={label ?? `${count}`}>{count > 99 ? "99+" : count}</span>;
}

export function Chip({ children, onRemove, href, unresolved, className }: { children: React.ReactNode; onRemove?: () => void; href?: string; unresolved?: boolean; className?: string }) {
  const label = typeof children === "string" ? children : "item";
  const inner = <>{children}{onRemove && <button type="button" className="x" aria-label={`Remove ${label}`} onClick={onRemove} style={{ border: 0, background: "none", padding: 0, cursor: "pointer" }}><Icon name="x" size={12} /></button>}</>;
  return href
    ? <a href={href} className={cx("chip link", className)}>{inner}</a>
    : <span className={cx("chip", unresolved && "unresolved", className)}>{inner}</span>;
}

export type AvatarTint = "a" | "b" | "c" | "d" | "e" | "u";
export function Avatar({ name, initials, src, tint, size = "md" }: { name: string; initials?: string; src?: string; tint?: AvatarTint; size?: "xs" | "s" | "md" | "l" }) {
  const ini = initials ?? name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const t = tint ?? (["a", "b", "c", "d", "e"] as const)[[...name].reduce((s, ch) => s + ch.charCodeAt(0), 0) % 5];
  return (
    <span className={cx("av", `av-${t}`, size !== "md" && size)} role="img" aria-label={name} title={name}>
      {src ? <img className="av-img" src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : ini}
    </span>
  );
}
