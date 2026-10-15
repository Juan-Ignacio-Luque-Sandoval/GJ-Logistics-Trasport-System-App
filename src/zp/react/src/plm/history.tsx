import * as React from "react";
import { Avatar, Button, Icon, Skeleton } from "../primitives";
import type { IconName } from "../icons";

export type HistoryKind = "create" | "update" | "state_change" | "reclassify" | "reparent" | "delete";
export interface HistoryEvent {
  id: string;
  kind: HistoryKind;
  who: { name: string; initials?: string };
  /** What happened, as a fragment after the name: "changed 3 fields", "moved the style". */
  action: React.ReactNode;
  when: string;
  version: number | string;
  /** Detail lines drawn as a dotted tree (├ / └) under the event — typically <HistoryDiff/> rows. */
  details?: React.ReactNode[];
  comment?: string;
}

const DOT = "var(--border-strong)";
const GLYPH: Record<HistoryKind, { icon: IconName; bg: string; color: string; dotted?: boolean }> = {
  create: { icon: "plus", bg: "var(--success-soft)", color: "var(--success-ink)" },
  update: { icon: "pencil", bg: "var(--surface)", color: "var(--ink-muted)", dotted: true },
  state_change: { icon: "arrow-right", bg: "var(--brand-grad)", color: "var(--on-brand)" },
  reclassify: { icon: "folder", bg: "var(--surface)", color: "var(--ink-muted)", dotted: true },
  reparent: { icon: "link", bg: "var(--surface)", color: "var(--ink-muted)", dotted: true },
  delete: { icon: "trash", bg: "var(--danger-soft)", color: "var(--danger-ink)" },
};

/** One changed value: label, old (struck through) → new. */
export function HistoryDiff({ label, from, to }: { label: string; from?: React.ReactNode; to: React.ReactNode }) {
  return (
    <><span className="muted">{label}</span>{" "}
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {from != null && from !== "" ? <span style={{ color: "var(--ink-faint)", textDecoration: "line-through" }}>{from}</span> : <span className="faint">—</span>}
        <Icon name="arrow-right" size={12} /><span style={{ fontWeight: 600 }}>{to}</span>
      </span></>
  );
}

/** Who did what, when: newest first, a dotted spine linking the events, borderless event cards, details as a dotted tree. */
export function HistoryTimeline({ events, onOpenVersion, loadingMore }: { events: HistoryEvent[]; onOpenVersion?: (v: HistoryEvent) => void; loadingMore?: boolean }) {
  const [hover, setHover] = React.useState<string | null>(null);
  return (
    <>
      <ol aria-label="History" style={{ margin: 0, padding: 0 }}>
        {events.map((e, i) => {
          const g = GLYPH[e.kind];
          const last = i === events.length - 1 && !loadingMore;
          const active = hover === e.id;
          return (
            <li key={e.id} style={{ listStyle: "none", position: "relative", display: "grid", gridTemplateColumns: "28px minmax(0, 1fr)", columnGap: 14, paddingBottom: 18 }}>
              {!last && <span aria-hidden style={{ position: "absolute", left: 13, top: 30, bottom: -2, borderLeft: `2px dotted ${DOT}` }} />}
              <span aria-hidden style={{ width: 28, height: 28, borderRadius: 999, background: g.bg, color: g.color, border: g.dotted ? `1.5px dotted ${DOT}` : undefined, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative", zIndex: 1 }}>
                <Icon name={g.icon} size={14} />
              </span>
              <div role="article" tabIndex={0} aria-label={`Version ${e.version}`} onMouseEnter={() => setHover(e.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(e.id)} onBlur={() => setHover(null)}
                style={{ borderRadius: 12, padding: "4px 12px 10px", margin: "-4px 0 0 -4px", background: active ? "var(--surface-sunken)" : undefined }}>
                <div className="row" style={{ gap: 8, flexWrap: "wrap", fontSize: 14, lineHeight: "20px" }}>
                  <span className="row" style={{ gap: 6 }}><Avatar name={e.who.name} initials={e.who.initials} size="xs" /><b style={{ fontWeight: 600 }}>{e.who.name}</b></span>
                  <span>{e.action}</span>
                  {active && onOpenVersion && <span className="row" style={{ marginLeft: "auto" }}><Button variant="link" size="sm" onClick={() => onOpenVersion(e)}>Open version {e.version}</Button></span>}
                </div>
                <div className="sm faint row" style={{ gap: 8, marginTop: 2 }}><span>{e.when}</span><span>·</span><span className="mono">v{e.version}</span></div>
                {e.details && e.details.length > 0 && (
                  <ul role="list" style={{ listStyle: "none", margin: "8px 0 0", padding: 0 }}>
                    {e.details.map((d, j) => {
                      const end = j === e.details!.length - 1;
                      return (
                        <li key={j} style={{ position: "relative", padding: "3px 0 3px 22px", fontSize: 13, lineHeight: "20px" }}>
                          <span style={{ position: "absolute", left: 0, top: 0, ...(end ? { height: 13 } : { bottom: 0 }), borderLeft: `1.5px dotted ${DOT}` }} />
                          <span style={{ position: "absolute", left: 0, top: 12, width: 14, borderTop: `1.5px dotted ${DOT}` }} />
                          {d}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {e.comment && <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: "20px", color: "var(--ink-muted)", fontStyle: "italic" }}>“{e.comment}”</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {loadingMore && (
        <div aria-busy="true" style={{ display: "grid", gridTemplateColumns: "28px minmax(0,1fr)", columnGap: 14 }}>
          <Skeleton width={28} height={28} circle /><div className="col" style={{ gap: 6 }}><Skeleton width="45%" /><Skeleton width="25%" height={10} /></div>
        </div>
      )}
    </>
  );
}
