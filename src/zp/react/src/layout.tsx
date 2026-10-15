import * as React from "react";
import { Avatar, Badge, Icon, IconButton, Skeleton } from "./primitives";
import type { IconName } from "./icons";
import { cx, useControllable } from "./utils";

/* ---------------- Tabs ---------------- */
export interface TabItem { id: string; label: string; count?: number; content?: React.ReactNode }
/** Line tabs: one word each, 2 px gradient indicator under the active tab. Arrow keys move between tabs. */
export function Tabs({ items, value, defaultValue, onChange, label = "Sections" }: { items: TabItem[]; value?: string; defaultValue?: string; onChange?: (id: string) => void; label?: string }) {
  const [cur, setCur] = useControllable(value, defaultValue ?? items[0]?.id ?? "", onChange);
  const base = React.useId();
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    const n = (i + d + items.length) % items.length;
    setCur(items[n].id); refs.current[n]?.focus();
  };
  const active = items.find((t) => t.id === cur);
  return (
    <>
      <div className="tabs" role="tablist" aria-label={label}>
        {items.map((t, i) => (
          <button key={t.id} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" id={`${base}-t-${t.id}`} aria-selected={t.id === cur}
            aria-controls={`${base}-p-${t.id}`} tabIndex={t.id === cur ? 0 : -1} className={cx("tab", t.id === cur && "on")}
            onClick={() => setCur(t.id)} onKeyDown={(e) => onKey(e, i)}>
            {t.label}{t.count != null && <Badge>{t.count}</Badge>}
          </button>
        ))}
      </div>
      {active?.content !== undefined && <div role="tabpanel" id={`${base}-p-${active.id}`} aria-labelledby={`${base}-t-${active.id}`}>{active.content}</div>}
    </>
  );
}

/* ---------------- Breadcrumb ---------------- */
export function Breadcrumb({ items, backHref, onBack }: { items: Array<{ label: string; href?: string; onClick?: () => void }>; backHref?: string; onBack?: () => void }) {
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep" aria-hidden>/</span>}
          {i === items.length - 1 && !it.href && !it.onClick ? <span aria-current="page" style={{ color: "var(--ink)" }}>{it.label}</span>
            : <a href={it.href ?? "#"} className="c" onClick={it.onClick ? (e) => { e.preventDefault(); it.onClick!(); } : undefined}>{it.label}</a>}
        </React.Fragment>
      ))}
      {(backHref || onBack) && <><span className="sep" aria-hidden>/</span><a href={backHref ?? "#"} className="back" onClick={onBack ? (e) => { e.preventDefault(); onBack(); } : undefined}><Icon name="chev-left" size={14} />back</a></>}
    </nav>
  );
}

/* ---------------- Alert / Banner / EmptyState ---------------- */
type StatusTone = "info" | "success" | "warning" | "danger";
const TONE_ICON: Record<StatusTone, IconName> = { info: "info", success: "ok", warning: "alert", danger: "err" };
/** Inline message inside a dialog, form or panel. Always a word, never colour alone. */
export function Alert({ tone = "info", title, children, action }: { tone?: StatusTone; title?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className={`alert t-${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <Icon name={TONE_ICON[tone]} size={16} />
      <span className="grow">{title && <b>{title} </b>}{children}</span>
      {action}
    </div>
  );
}
/** Full-width strip at the top of a screen (old version open, offline, read-only…). */
export function Banner({ tone = "info", icon, children, action }: { tone?: StatusTone | "neutral"; icon?: IconName; children: React.ReactNode; action?: React.ReactNode }) {
  return <div className={`banner t-${tone}`} role="status"><Icon name={icon ?? (tone === "neutral" ? "info" : TONE_ICON[tone])} size={16} /><span className="grow">{children}</span>{action}</div>;
}

export function EmptyState({ title, children, action, visual = true }: { title: string; children?: React.ReactNode; action?: React.ReactNode; visual?: boolean }) {
  return (
    <div className="es">
      {visual && <div className="es-vis" aria-hidden><span className="s1" /><span className="s2" /><span className="s3" /></div>}
      <h4 className="es-t">{title}</h4>
      {children && <p className="es-b">{children}</p>}
      {action}
    </div>
  );
}

/* ---------------- Table ---------------- */
export interface Column<T> {
  key: string;
  header: string;
  /** CSS grid track, e.g. "minmax(0,2fr)" or "110px". */
  width?: string;
  align?: "left" | "right";
  mono?: boolean;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}
export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  sort?: { key: string; dir: "asc" | "desc" };
  onSortChange?: (s: { key: string; dir: "asc" | "desc" }) => void;
  loading?: boolean;
  count?: string;
  empty?: React.ReactNode;
  rowActions?: (row: T) => React.ReactNode;
}
/** Grid table. No pagination anywhere: render all rows (virtualise long lists) and load more silently on scroll. */
export function DataTable<T>({ columns, rows, rowKey, onRowClick, selectable, selected = [], onSelectedChange, sort, onSortChange, loading, count, empty, rowActions }: DataTableProps<T>) {
  const tracks = [selectable && "32px", ...columns.map((c) => c.width ?? "minmax(0,1fr)"), rowActions && "44px"].filter(Boolean).join(" ");
  const all = rows.length > 0 && rows.every((r) => selected.includes(rowKey(r)));
  const some = !all && rows.some((r) => selected.includes(rowKey(r)));
  const toggle = (id: string) => onSelectedChange?.(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const cb = (on: boolean, mixed: boolean, onClick: () => void, label: string) => (
    <button type="button" role="checkbox" aria-checked={mixed ? "mixed" : on} aria-label={label} className={cx("cb", (on || mixed) && "on")} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      {mixed ? <Icon name="minus" size={12} /> : on ? <Icon name="check" size={12} /> : null}
    </button>
  );
  return (
    <div className="col w100" style={{ gap: 6 }}>
      {count && <span className="tbl-count">{count}</span>}
      <div className="tbl" role="grid" aria-rowcount={rows.length + 1} aria-busy={loading || undefined}>
        <div className="tr th" role="row" style={{ gridTemplateColumns: tracks }}>
          {selectable && <div role="columnheader">{cb(all, some, () => onSelectedChange?.(all ? [] : rows.map(rowKey)), "Select all")}</div>}
          {columns.map((c) => {
            const on = sort?.key === c.key;
            return (
              <div key={c.key} role="columnheader" aria-sort={on ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined} style={c.align === "right" ? { justifyContent: "flex-end" } : undefined}>
                {c.sortable ? <button type="button" className="row" style={{ border: 0, background: "none", padding: 0, font: "inherit", color: "inherit", cursor: "pointer", gap: 4 }}
                  onClick={() => onSortChange?.({ key: c.key, dir: on && sort!.dir === "asc" ? "desc" : "asc" })}>
                  {c.header}<span className="faint" style={{ display: "inline-flex" }}><Icon name={on && sort!.dir === "desc" ? "arrow-down" : "arrow-up"} size={12} /></span></button> : c.header}
              </div>
            );
          })}
          {rowActions && <div />}
        </div>
        {loading && !rows.length && Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="tr" style={{ gridTemplateColumns: tracks }}>{tracks.split(" ").map((_, j) => <div key={j}><Skeleton width={`${50 + ((i + j) % 4) * 10}%`} /></div>)}</div>
        ))}
        {!loading && !rows.length && <div style={{ padding: 32 }}>{empty ?? <EmptyState title="Nothing here yet" />}</div>}
        {rows.map((r) => {
          const id = rowKey(r);
          const isSel = selected.includes(id);
          return (
            <div key={id} role="row" aria-selected={selectable ? isSel : undefined} tabIndex={onRowClick ? 0 : undefined} className={cx("tr", isSel && "sel")}
              style={{ gridTemplateColumns: tracks, cursor: onRowClick ? "pointer" : undefined }} onClick={() => onRowClick?.(r)}
              onKeyDown={(e) => { if (e.key === "Enter" && onRowClick) onRowClick(r); }}>
              {selectable && <div role="gridcell">{cb(isSel, false, () => toggle(id), "Select row")}</div>}
              {columns.map((c) => (
                <div key={c.key} role="gridcell" className={cx(c.align === "right" && "r", c.mono && "mono faint")}>
                  {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? "—")}
                </div>
              ))}
              {rowActions && <div role="gridcell" style={{ padding: 0, overflow: "visible" }} onClick={(e) => e.stopPropagation()}>{rowActions(r)}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Field group (card section) ---------------- */
/** A section of a record: bordered card, tinted header band with gradient icon chip, title, description, field count, collapse. */
export function FieldGroup({ title, description, icon = "tag", count, children, defaultOpen = true, columns = 2, id }:
  { title: string; description?: string; icon?: IconName; count?: number; children: React.ReactNode; defaultOpen?: boolean; columns?: 1 | 2 | 3; id?: string }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const hid = React.useId();
  const n = count ?? React.Children.count(children);
  return (
    <section id={id} aria-labelledby={hid} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow-sm)" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", background: "var(--brand-soft)", borderBottom: open ? "1px solid var(--border)" : 0, borderRadius: open ? "12px 12px 0 0" : 12 }}>
        <span aria-hidden style={{ width: 24, height: 24, borderRadius: 6, background: "var(--brand-grad)", color: "var(--on-brand)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={icon} size={14} /></span>
        <span style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
          <h2 id={hid} style={{ fontSize: 15, lineHeight: "20px", fontWeight: 600, margin: 0 }}>{title}</h2>
          {description && <span className="sm muted trunc">{description}</span>}
        </span>
        <span className="grow" />
        <Badge>{n === 1 ? "1 field" : `${n} fields`}</Badge>
        <IconButton icon={open ? "chev-down" : "chev-right"} label={`${open ? "Collapse" : "Expand"} ${title}`} size="sm" aria-expanded={open} onClick={() => setOpen(!open)} />
      </header>
      {open && <div style={{ padding: "16px 16px 20px" }}><div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`, gap: "16px 24px" }}>{children}</div></div>}
    </section>
  );
}

/* ---------------- App sidebar ---------------- */
export interface NavNode { id: string; label: string; icon?: IconName; count?: string | number; children?: NavNode[]; loading?: boolean }
export interface NavSection { id: string; title: string; icon: IconName; nodes: NavNode[] }
export interface AppSidebarProps {
  brand?: { initials: string; name: string };
  sections: NavSection[];
  selectedId?: string;
  onSelect?: (node: NavNode) => void;
  user?: { name: string; login?: string; initials?: string };
  onUserClick?: () => void;
  /** Rendered just above the user button — e.g. an Appearance popover or the account menu. */
  footer?: React.ReactNode;
  collapsed?: boolean;
  onCollapsedChange?: (c: boolean) => void;
  width?: number;
  loading?: boolean;
  /** Ids of tree nodes open at first render (default: the top-level nodes). */
  defaultOpen?: string[];
}
/** Light sidebar with distinct sections (one bordered card per section), a tree inside each, the account at the foot. No background gradient. */
export function AppSidebar({ brand = { initials: "ZP", name: "Zabriskie Point" }, sections, selectedId, onSelect, user, onUserClick, footer, collapsed, onCollapsedChange, width = 260, loading, defaultOpen }: AppSidebarProps) {
  const [open, setOpen] = React.useState<Record<string, boolean>>(() => Object.fromEntries((defaultOpen ?? []).map((id) => [id, true])));
  const [closedSecs, setClosedSecs] = React.useState<Record<string, boolean>>({});
  const logo = <span aria-hidden style={{ width: 28, height: 28, borderRadius: 8, background: "var(--brand-grad)", color: "var(--on-brand)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{brand.initials}</span>;
  if (collapsed) {
    return (
      <nav className="side" aria-label="Workspace" style={{ width: 64, height: "100%", alignItems: "center", padding: "14px 0", gap: 6 }}>
        <span style={{ marginBottom: 10 }}>{logo}</span>
        {sections.flatMap((s) => s.nodes).filter((n) => n.icon).map((n) => (
          <button key={n.id} type="button" className={cx("node", selectedId === n.id && "sel")} style={{ justifyContent: "center", padding: 0, width: 40 }} aria-label={n.label} title={n.label} onClick={() => onSelect?.(n)}>
            <Icon name={n.icon!} size={20} />
          </button>
        ))}
        <span className="grow" />
        <IconButton icon="chevs-left" label="Expand sidebar" size="sm" style={{ transform: "rotate(180deg)" }} onClick={() => onCollapsedChange?.(false)} />
        {user && <Avatar name={user.name} initials={user.initials} size="s" />}
      </nav>
    );
  }
  const renderNode = (n: NavNode, depth: number): React.ReactNode => {
    const has = !!n.children?.length || n.loading;
    const isOpen = open[n.id] ?? (depth === 0 && !defaultOpen);
    const sel = selectedId === n.id;
    const toggle = () => setOpen((o) => ({ ...o, [n.id]: !isOpen }));
    return (
      <React.Fragment key={n.id}>
        <div className={cx("node", sel && "sel")} role="treeitem" aria-level={depth + 1} aria-expanded={has ? isOpen : undefined} aria-selected={sel} aria-current={sel ? "page" : undefined}
          tabIndex={0} style={{ paddingLeft: 6 + depth * 16 }} onClick={() => (has && !onSelect ? toggle() : onSelect?.(n))}
          onKeyDown={(e) => { if (e.key === "Enter") onSelect?.(n); if (has && (e.key === "ArrowRight" || e.key === "ArrowLeft")) setOpen((o) => ({ ...o, [n.id]: e.key === "ArrowRight" })); }}>
          {has ? <button type="button" className={cx("tri", isOpen && "open")} aria-label={`${isOpen ? "Collapse" : "Expand"} ${n.label}`} tabIndex={-1}
            style={{ border: 0, background: "none", padding: 0 }} onClick={(e) => { e.stopPropagation(); toggle(); }}>
            {n.loading ? <span className="spin xs" /> : <Icon name="chev-right" size={14} />}</button> : <span className="tri" />}
          {n.icon && <span className="ni"><Icon name={n.icon} size={16} /></span>}
          <span className="nl">{n.label}</span>
          {n.count != null && <span className="cnt">{n.count}</span>}
        </div>
        {has && isOpen && n.children?.map((c) => renderNode(c, depth + 1))}
      </React.Fragment>
    );
  };
  return (
    <nav className="side" aria-label="Workspace" style={{ width, height: "100%", flexShrink: 0 }}>
      <div className="row" style={{ padding: "16px 14px 12px", gap: 10, borderBottom: "1px solid var(--border)" }}>
        {logo}<span style={{ fontSize: 15, fontWeight: 600 }}>{brand.name}</span><span className="grow" />
        {onCollapsedChange && <IconButton icon="chevs-left" label="Collapse sidebar" size="sm" onClick={() => onCollapsedChange(true)} />}
      </div>
      <div role="tree" aria-label="Workspace" className="col" style={{ gap: 10, padding: "12px 10px", flexGrow: 1, background: "var(--canvas)", overflow: "auto" }}>
        {loading ? [0, 1].map((i) => (
          <div key={i} className="nav-sec" aria-busy="true"><div className="nav-sec-h"><Skeleton width={22} height={22} /><Skeleton width="50%" /></div>
            <div className="nav-sec-b" style={{ gap: 10, padding: 12 }}><Skeleton width="80%" /><Skeleton width="65%" /></div></div>
        )) : sections.map((s) => {
          const closed = !!closedSecs[s.id];
          return (
            <section key={s.id} className={cx("nav-sec", closed && "collapsed")} aria-label={s.title}>
              <div className="nav-sec-h">
                <span className="chip" aria-hidden><Icon name={s.icon} size={13} /></span>
                <span className="t">{s.title}</span>
                <span className="bdg t-neutral" style={{ height: 18, fontSize: 11 }}>{s.nodes.length}</span>
                <IconButton icon={closed ? "chev-right" : "chev-down"} label={`${closed ? "Expand" : "Collapse"} ${s.title}`} size="sm" aria-expanded={!closed}
                  style={{ width: 24, height: 24 }} onClick={() => setClosedSecs({ ...closedSecs, [s.id]: !closed })} />
              </div>
              {!closed && <div className="nav-sec-b" role="group">{s.nodes.map((n) => renderNode(n, 0))}</div>}
            </section>
          );
        })}
      </div>
      {footer}
      {user && (
        <button type="button" className="row" onClick={onUserClick} style={{ padding: 12, border: 0, borderTop: "1px solid var(--border)", background: "none", width: "100%", textAlign: "left", fontFamily: "inherit", color: "inherit", cursor: "pointer" }}>
          <Avatar name={user.name} initials={user.initials} />
          <span className="col" style={{ gap: 0, minWidth: 0 }}><span style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</span>{user.login && <span className="mono faint">{user.login}</span>}</span>
          <span className="grow" /><Icon name="chev-down" size={16} />
        </button>
      )}
    </nav>
  );
}
