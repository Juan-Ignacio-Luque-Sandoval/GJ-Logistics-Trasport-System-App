import * as React from "react";
import { Avatar, Badge, Button } from "../primitives";
import { cx } from "../utils";

/* ---------------- Step glyph ---------------- */
export type StepState = "done" | "current" | "retired" | "next-available" | "next-blocked" | "choice" | "upcoming" | "fork-ahead" | "redo" | "end";

/** The 10 step glyphs. Primary ones are painted with the theme gradient (SVG stops read --brand-a / --brand-b). */
export function StepGlyph({ state, size = 20 }: { state: StepState; size?: number }) {
  const gid = "zpg" + React.useId().replace(/[^a-zA-Z0-9]/g, "");
  const G = `url(#${gid})`;
  let body: React.ReactNode;
  switch (state) {
    case "done": body = <><circle cx="10" cy="10" r="9" fill="var(--released-ink)" /><path d="M6 10.2 8.7 13 14 7.4" fill="none" stroke="var(--surface)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>; break;
    case "current": body = <><circle cx="10" cy="10" r="8.25" fill="var(--surface)" stroke={G} strokeWidth="2.5" /><circle cx="10" cy="10" r="4" fill={G} /></>; break;
    case "retired": body = <><circle cx="10" cy="10" r="8.25" fill="var(--surface)" stroke="var(--ink-faint)" strokeWidth="2.5" /><circle cx="10" cy="10" r="4" fill="var(--ink-faint)" /></>; break;
    case "next-available": body = <circle cx="10" cy="10" r="8.25" fill="var(--surface)" stroke={G} strokeWidth="2" strokeDasharray="3.2 2.4" />; break;
    case "next-blocked": body = <><circle cx="10" cy="10" r="8.25" fill="var(--review-soft)" stroke="var(--review-ink)" strokeWidth="2" /><path d="M10 5.6v5.2" stroke="var(--review-ink)" strokeWidth="2.2" strokeLinecap="round" /><circle cx="10" cy="14" r="1.25" fill="var(--review-ink)" /></>; break;
    case "choice": body = <><circle cx="10" cy="10" r="9" fill={G} /><path d="M10 15v-3.5M10 11.5 6.5 7.5M10 11.5l3.5-4" fill="none" stroke="var(--on-brand)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /><circle cx="6.3" cy="6.6" r="1.3" fill="var(--on-brand)" /><circle cx="13.7" cy="6.6" r="1.3" fill="var(--on-brand)" /></>; break;
    case "upcoming": body = <circle cx="10" cy="10" r="8" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.75" />; break;
    case "fork-ahead": body = <><path d="M10 16v-4.5M10 11.5 6 7M10 11.5 14 7" fill="none" stroke="var(--ink-faint)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /><circle cx="5.6" cy="6.4" r="1.6" fill="none" stroke="var(--ink-faint)" strokeWidth="1.4" /><circle cx="14.4" cy="6.4" r="1.6" fill="none" stroke="var(--ink-faint)" strokeWidth="1.4" /></>; break;
    case "redo": body = <><circle cx="10" cy="10" r="8.25" fill="var(--review-soft)" stroke="var(--review-ink)" strokeWidth="2" /><path d="M6.6 9.6a3.6 3.6 0 1 0 1.2-2.7M6.4 5.6v2.6H9" fill="none" stroke="var(--review-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></>; break;
    case "end": body = <rect x="4" y="4" width="12" height="12" rx="2" fill="var(--ink-faint)" />; break;
  }
  return (
    <svg className="gl" width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" style={{ stopColor: "var(--brand-a)" }} /><stop offset="1" style={{ stopColor: "var(--brand-b)" }} /></linearGradient></defs>
      {body}
    </svg>
  );
}

/* ---------------- Pipeline ---------------- */
export interface PipelineStep {
  id: string;
  title: string;
  state: StepState;
  /** One line under the title: who/when for done steps, the blocking reason for next-blocked… */
  meta?: React.ReactNode;
  description?: string;
  who?: { name: string; initials?: string };
  /** Extra content under the step (gate list, choice options…). */
  extra?: React.ReactNode;
}
type Seg = "solid" | "dashed" | "none";
function segBetween(a?: PipelineStep, b?: PipelineStep): Seg {
  if (!a || !b) return "none";
  if (a.state === "end" || a.state === "fork-ahead") return "none";
  if (a.state === "done" && (b.state === "done" || b.state === "current" || b.state === "retired")) return "solid";
  return "dashed";
}
/** Vertical chain of steps: done (solid connector) → current (tinted row) → next / upcoming (dashed). Only real data — no deadlines, assignees or % complete. */
export function Pipeline({ steps, compact, onStepClick }: { steps: PipelineStep[]; compact?: boolean; onStepClick?: (s: PipelineStep) => void }) {
  return (
    <ol className="pl" style={{ margin: 0, padding: 0 }}>
      {steps.map((s, i) => {
        const cur = s.state === "current" || s.state === "retired";
        const warn = s.state === "next-blocked" || s.state === "redo";
        return (
          <li key={s.id} className={cx("st", compact && "compact", cur && "cur")} aria-current={cur ? "step" : undefined} style={{ listStyle: "none", cursor: onStepClick ? "pointer" : "default" }}
            tabIndex={onStepClick ? 0 : undefined} onClick={onStepClick ? () => onStepClick(s) : undefined}
            onKeyDown={onStepClick ? (e) => e.key === "Enter" && onStepClick(s) : undefined}>
            <div className="ax"><span className={`seg top ${segBetween(steps[i - 1], s)}`} /><StepGlyph state={s.state} size={compact ? 16 : 20} /><span className={`seg ${segBetween(s, steps[i + 1])}`} /></div>
            <div className="body">
              <div className={cx("t", compact && "trunc")}>{s.title}</div>
              {(s.meta || s.who || s.state === "retired") && (
                <div className="m" style={warn ? { color: "var(--review-ink)" } : undefined}>
                  {s.who && <Avatar name={s.who.name} initials={s.who.initials} size="xs" />}
                  {s.state === "retired" && <Badge>retired</Badge>}
                  {s.meta && <span>{s.meta}</span>}
                </div>
              )}
              {s.description && !compact && <div className="ds">{s.description}</div>}
              {s.extra}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ---------------- Mini-block ---------------- */
export interface MiniBlockProps {
  current: string;
  /** e.g. "8 / 11+" — position on the route; "+" when a fork makes the total open. */
  progress?: string;
  next?: { kind: "next-available" | "next-blocked" | "choice"; name: string; reason?: string };
  retired?: boolean;
  atEnd?: boolean;
  /** Omit when the user has no right to move, the card is in edit mode, or an old version is open — the button is then absent. */
  onMove?: () => void;
  moving?: boolean;
  onViewPipeline?: () => void;
}
/** The workflow block at the bottom of the card rail: current step, next step, the move button, a link to the full pipeline. */
export function MiniBlock({ current, progress, next, retired, atEnd, onMove, moving, onViewPipeline }: MiniBlockProps) {
  const blocked = next?.kind === "next-blocked";
  return (
    <section className="mb" aria-label="Workflow">
      <div className="mb-top"><StepGlyph state={retired ? "retired" : "current"} size={16} /><span className="mb-cur" title={current}>{current}</span>{progress && <span className="mb-prog">{progress}</span>}</div>
      {retired && <div className="row" style={{ gap: 6 }}><Badge>retired</Badge></div>}
      {atEnd && <span className="sm muted">End of route</span>}
      {next && (
        <>
          <div className="mb-next"><StepGlyph state={next.kind} size={16} />
            {next.kind === "choice" ? <span>{next.name}</span> : <span style={blocked ? { color: "var(--review-ink)" } : undefined}>Next: <b style={{ color: "var(--ink)" }}>{next.name}</b></span>}
          </div>
          {blocked && next.reason && <span className="sm" style={{ color: "var(--review-ink)", marginTop: -6, paddingLeft: 22 }}>{next.reason}</span>}
        </>
      )}
      {next && onMove && (
        <Button size="sm" style={{ width: "100%" }} loading={moving} softDisabled={blocked} title={blocked ? next.reason : undefined}
          trailingIcon={next.kind === "choice" ? "chev-down" : undefined} onClick={onMove}>
          {next.kind === "choice" ? "Move to" : `Move to ${next.name}`}
        </Button>
      )}
      {onViewPipeline && <Button variant="ghost" size="sm" icon="panel" style={{ width: "100%", justifyContent: "flex-start" }} onClick={onViewPipeline}>View pipeline</Button>}
    </section>
  );
}
