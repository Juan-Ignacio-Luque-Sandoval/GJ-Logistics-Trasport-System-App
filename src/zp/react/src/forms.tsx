import * as React from "react";
import { Icon, Spinner } from "./primitives";
import type { IconName } from "./icons";
import { cx, useControllable, useDismiss } from "./utils";

/* ---------------- Form field ---------------- */
interface FieldCtx { id: string; describedBy?: string; invalid: boolean; required: boolean }
const FieldContext = React.createContext<FieldCtx | null>(null);
export const useField = () => React.useContext(FieldContext);

export interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  description?: string;
  /** Error message — what blocks, and the way out. Sets aria-invalid on the control. */
  error?: string;
  /** Neutral note under the control (e.g. "Cleared because Category changed"). */
  note?: string;
  /** Shows the "calculated" tag (formula / generated values). */
  calculated?: boolean;
  /** Gate highlight: the field a blocked move points at. */
  highlight?: boolean;
  className?: string;
}
export function FormField({ label, children, required, description, error, note, calculated, highlight, className }: FormFieldProps) {
  const id = React.useId();
  const descId = description || error || note ? `${id}-d` : undefined;
  return (
    <FieldContext.Provider value={{ id, describedBy: descId, invalid: !!error, required: !!required }}>
      <div className={cx("fld", highlight && "gate-hl", className)}>
        <div className="fld-l">
          <label className="l" htmlFor={id}>{label}{required && <span className="req" aria-hidden>*</span>}</label>
          {calculated && <span className="calc"><Icon name="sigma" size={11} />calculated</span>}
          {description && <span className="d">{description}</span>}
        </div>
        {children}
        {error && <div className="fld-e" id={descId} role="alert"><Icon name="alert" size={14} /><span>{error}</span></div>}
        {!error && note && <div className="fld-n" id={descId}><Icon name="info" size={14} /><span>{note}</span></div>}
      </div>
    </FieldContext.Provider>
  );
}

/** Read-mode value. Read mode shows values, never locked inputs; empty → "—". */
export function ReadValue({ children, mono }: { children?: React.ReactNode; mono?: boolean }) {
  const empty = children == null || children === "";
  if (empty) return <span className="readval empty-val" aria-label="Empty">—</span>;
  return <span className={mono ? "mono-md" : "readval"}>{children}</span>;
}

/* ---------------- Input / Textarea ---------------- */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "prefix"> {
  size?: "sm" | "md";
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  icon?: IconName;
  numeric?: boolean;
  invalid?: boolean;
  loading?: boolean;
  onClear?: () => void;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = "md", prefix, suffix, icon, numeric, invalid, loading, onClear, className, id, ...rest }, ref) {
  const f = useField();
  const bad = invalid ?? f?.invalid;
  return (
    <div className={cx("inp", size === "sm" && "sm", className)}>
      {icon && <Icon name={icon} size={16} className="ic" />}
      {prefix != null && <span className="affix">{prefix}</span>}
      <input ref={ref} id={id ?? f?.id} className={cx(numeric && "num")} inputMode={numeric ? "decimal" : undefined}
        aria-invalid={bad || undefined} aria-describedby={f?.describedBy} aria-required={f?.required || undefined} {...rest} />
      {loading && <Spinner />}
      {onClear && rest.value ? <button type="button" className="ic" aria-label="Clear" onClick={onClear} style={{ border: 0, background: "none", padding: 0, cursor: "pointer", display: "inline-flex" }}><Icon name="x" size={14} /></button> : null}
      {suffix != null && <span className="affix">{suffix}</span>}
    </div>
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { invalid?: boolean }
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ invalid, className, id, maxLength, ...rest }, ref) {
  const f = useField();
  const len = typeof rest.value === "string" ? rest.value.length : undefined;
  return (
    <div className="col" style={{ gap: 4, width: "100%" }}>
      <div className={cx("inp ta", className)}>
        <textarea ref={ref} id={id ?? f?.id} maxLength={maxLength} aria-invalid={(invalid ?? f?.invalid) || undefined} aria-describedby={f?.describedBy} {...rest} />
      </div>
      {maxLength && len !== undefined && <span className="sm faint" style={{ alignSelf: "flex-end" }}>{len} / {maxLength}</span>}
    </div>
  );
});

/* ---------------- Checkbox / Radio / Switch ---------------- */
interface ToggleBase { label?: React.ReactNode; disabled?: boolean; invalid?: boolean; className?: string; id?: string }

export function Checkbox({ checked, defaultChecked = false, indeterminate, onChange, label, disabled, invalid, className, id }:
  ToggleBase & { checked?: boolean; defaultChecked?: boolean; indeterminate?: boolean; onChange?: (v: boolean) => void }) {
  const [on, setOn] = useControllable(checked, defaultChecked, onChange);
  const box = (
    <button type="button" id={id} role="checkbox" aria-checked={indeterminate ? "mixed" : on} disabled={disabled} aria-invalid={invalid || undefined}
      className={cx("cb", (on || indeterminate) && "on", !label && className)} onClick={() => setOn(!on)}>
      {indeterminate ? <Icon name="minus" size={12} /> : on ? <Icon name="check" size={12} /> : null}
    </button>
  );
  return label ? <label className={cx("ctl", className)}>{box}<span>{label}</span></label> : box;
}

/** Never saves on toggle — the value is saved with the card's Save. */
export function Switch({ checked, defaultChecked = false, onChange, label, labelLeft, disabled, className, id }:
  ToggleBase & { checked?: boolean; defaultChecked?: boolean; onChange?: (v: boolean) => void; labelLeft?: boolean }) {
  const [on, setOn] = useControllable(checked, defaultChecked, onChange);
  const s = <button type="button" id={id} role="switch" aria-checked={on} disabled={disabled} className={cx("sw", on && "on", !label && className)} onClick={() => setOn(!on)} />;
  if (!label) return s;
  return <label className={cx("ctl", className)}>{labelLeft && <span>{label}</span>}{s}{!labelLeft && <span>{label}</span>}</label>;
}

export interface RadioOption { value: string; label: React.ReactNode; description?: React.ReactNode; disabled?: boolean }
/** Radio group with roving focus (arrow keys). `card` renders option cards (used for a choice at a fork). */
export function RadioGroup({ options, value, defaultValue = "", onChange, label, orientation = "vertical", card }:
  { options: RadioOption[]; value?: string; defaultValue?: string; onChange?: (v: string) => void; label: string; orientation?: "vertical" | "horizontal"; card?: boolean }) {
  const [cur, setCur] = useControllable(value, defaultValue, onChange);
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const enabled = options.filter((o) => !o.disabled);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const pos = enabled.indexOf(options[i]);
    const next = enabled[(pos + d + enabled.length) % enabled.length];
    setCur(next.value);
    refs.current[options.indexOf(next)]?.focus();
  };
  const tabStop = options.some((o) => o.value === cur) ? cur : enabled[0]?.value;
  return (
    <div role="radiogroup" aria-label={label} className={orientation === "horizontal" ? "row" : "col"} style={{ gap: card ? 8 : 10, flexWrap: "wrap" }}>
      {options.map((o, i) => {
        const on = o.value === cur;
        return (
          <label key={o.value} className={card ? cx("opt", on && "on") : "ctl"} style={{ alignItems: "flex-start" }}>
            <button ref={(el) => { refs.current[i] = el; }} type="button" role="radio" aria-checked={on} disabled={o.disabled}
              tabIndex={o.value === tabStop ? 0 : -1} className={cx("rd", on && "on")} onClick={() => setCur(o.value)} onKeyDown={(e) => onKey(e, i)} />
            <span>{o.label}{o.description && <span className="sm muted" style={{ display: "block" }}>{o.description}</span>}</span>
          </label>
        );
      })}
    </div>
  );
}

/* ---------------- Select (single / multiple, optional search) ---------------- */
export interface SelectOption { value: string; label: string; description?: string; disabled?: boolean; reason?: string }
export interface SelectProps {
  options: SelectOption[];
  value?: string | string[];
  defaultValue?: string | string[];
  onChange?: (v: string | string[]) => void;
  multiple?: boolean;
  searchable?: boolean;
  placeholder?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  invalid?: boolean;
  loading?: boolean;
  emptyText?: string;
  "aria-label"?: string;
}
export function Select({ options, value, defaultValue, onChange, multiple, searchable, placeholder = "Choose…", size = "md", disabled, invalid, loading, emptyText = "No values", ...rest }: SelectProps) {
  const f = useField();
  const [cur, setCur] = useControllable<string | string[]>(value, defaultValue ?? (multiple ? [] : ""), onChange);
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState(0);
  const root = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();
  const close = React.useCallback(() => { setOpen(false); setQ(""); }, []);
  useDismiss(root, open, close);
  const sel = Array.isArray(cur) ? cur : cur ? [cur] : [];
  const shown = options.filter((o) => !q || o.label.toLowerCase().includes(q.toLowerCase()));
  const bad = invalid ?? f?.invalid;
  const pick = (o: SelectOption) => {
    if (o.disabled) return;
    if (multiple) setCur(sel.includes(o.value) ? sel.filter((v) => v !== o.value) : [...sel, o.value]);
    else { setCur(o.value); close(); }
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, shown.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" || (e.key === " " && !searchable)) { e.preventDefault(); if (!open) setOpen(true); else if (shown[active]) pick(shown[active]); }
  };
  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  return (
    <div ref={root} className="zp-anchor" style={{ width: "100%", display: "flex" }}>
      <div id={f?.id} role="combobox" tabIndex={disabled ? -1 : 0} aria-expanded={open} aria-controls={listId} aria-haspopup="listbox"
        aria-invalid={bad || undefined} aria-disabled={disabled || undefined} aria-label={rest["aria-label"]} aria-describedby={f?.describedBy}
        className={cx("inp", size === "sm" && "sm", open && "is-focus", bad && "is-invalid", disabled && "is-disabled")}
        onClick={() => !disabled && setOpen((o) => !o)} onKeyDown={onKey}>
        {multiple && sel.length ? (
          <span className="row grow" style={{ gap: 4, overflow: "hidden" }}>
            {sel.map((v) => <span key={v} className="chip" style={{ height: 24, fontSize: 12, padding: "0 8px" }}>{labelOf(v)}
              <span className="x" role="button" aria-label={`Remove ${labelOf(v)}`} onClick={(e) => { e.stopPropagation(); setCur(sel.filter((x) => x !== v)); }}><Icon name="x" size={12} /></span></span>)}
          </span>
        ) : <span className={cx("val", !sel.length && "ph")}>{sel.length ? labelOf(sel[0]) : placeholder}</span>}
        <span className="ic"><Icon name="chev-down" size={16} /></span>
      </div>
      {open && (
        <div className="menu zp-float" role="listbox" id={listId} aria-multiselectable={multiple || undefined} style={{ width: "100%", maxHeight: 320, overflow: "auto" }}>
          {searchable && <div style={{ padding: 4 }}><Input size="sm" icon="search" autoFocus value={q} onChange={(e) => { setQ(e.target.value); setActive(0); }} onKeyDown={onKey} placeholder="Search" aria-label="Search options" /></div>}
          {loading ? <div style={{ padding: 10, display: "grid", gap: 10 }}><span className="sk" style={{ width: "60%" }} /><span className="sk" style={{ width: "45%" }} /></div>
            : shown.length === 0 ? <div className="mi faint">{emptyText}</div>
            : shown.map((o, i) => (
              <div key={o.value} role="option" aria-selected={sel.includes(o.value)} aria-disabled={o.disabled || undefined}
                className={cx("mi", i === active && "is-hover")} style={o.disabled ? { opacity: 0.5 } : undefined}
                onMouseEnter={() => setActive(i)} onClick={() => pick(o)}>
                {multiple && <span className={cx("cb", sel.includes(o.value) && "on")}>{sel.includes(o.value) && <Icon name="check" size={12} />}</span>}
                <span>{o.label}{o.description && <span className="sub">{o.description}</span>}{o.disabled && o.reason && <span className="reason">{o.reason}</span>}</span>
                {!multiple && sel.includes(o.value) && <span className="chk"><Icon name="check" size={16} /></span>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
