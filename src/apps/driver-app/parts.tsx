import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Badge, Button, IconButton, cx, type Tone } from '@zp/ui'
import { Glyph, type GlyphName } from '~/ui-local'
import { hhmm, type StopType } from './data'
import { useDriver, type StopStatus } from './store'

/* ---------------- screen frame ---------------- */

/** The app bar: back, title, and the connection / sync pill that is on every screen (§ 4.5 offline). */
export function AppBar({ title, sub, back = true, action }: { title: string; sub?: string; back?: boolean; action?: ReactNode }) {
  const { s, dispatch, t } = useDriver()
  return (
    <header className="da-bar">
      {back && s.history.length > 0
        ? <IconButton icon="chev-left" label={t('back')} onClick={() => dispatch({ type: 'back' })} />
        : <span className="da-bar-spacer" />}
      <div className="da-bar-title">
        <span className="da-bar-t">{title}</span>
        {sub && <span className="da-bar-sub">{sub}</span>}
      </div>
      {action ?? <SyncPill />}
    </header>
  )
}

export function SyncPill() {
  const { s, t, dispatch } = useDriver()
  const n = s.queue.length
  const go = () => dispatch({ type: 'go', screen: { name: 'more' } })
  if (!s.online) {
    return (
      <button type="button" className="da-pill warn" onClick={go} aria-label={`${t('offline')}, ${t('waiting', { n })}`}>
        <Glyph name="wifi-off" size={14} />{n > 0 ? n : t('offline')}
      </button>
    )
  }
  return (
    <button type="button" className={cx('da-pill', n > 0 ? 'busy' : 'ok')} onClick={go} aria-label={n > 0 ? t('syncing') : t('allSynced')}>
      <Glyph name={n > 0 ? 'cloud-up' : 'wifi'} size={14} />{n > 0 ? n : ''}
    </button>
  )
}

export function OfflineBanner() {
  const { s, t } = useDriver()
  if (s.online) return null
  return (
    <div className="da-offline" role="status">
      <Glyph name="wifi-off" size={16} />
      <span>{s.queue.length ? t('offlineBanner', { n: s.queue.length }) : t('offlineBannerEmpty')}</span>
    </div>
  )
}

export function Body({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('da-body', className)}>{children}</div>
}

/** The sticky action area at the foot of a screen: big buttons, reachable with a thumb. */
export function Footer({ children, reason }: { children: ReactNode; reason?: string | null }) {
  return (
    <div className="da-foot">
      {reason && <p className="da-reason" role="note"><Glyph name="info" size={14} />{reason}</p>}
      {children}
    </div>
  )
}

/** § 10: large buttons, usable with gloves. 56 px high, full width. */
export function Big({ children, icon, variant = 'primary', onClick, blocked, ...rest }: {
  children: ReactNode
  icon?: GlyphName
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  onClick?: () => void
  blocked?: boolean
  'aria-describedby'?: string
}) {
  return (
    <Button variant={variant} size="lg" className="da-big" softDisabled={blocked} onClick={onClick} {...rest}>
      {icon && <Glyph name={icon} size={20} />}{children}
    </Button>
  )
}

/* ---------------- badges ---------------- */

const TYPE: Record<StopType, { icon: GlyphName; key: 'pickup' | 'delivery' | 'crossdock'; tone: Tone }> = {
  pickup: { icon: 'arrow-up', key: 'pickup', tone: 'info' },
  delivery: { icon: 'arrow-down', key: 'delivery', tone: 'primary' },
  crossdock: { icon: 'warehouse', key: 'crossdock', tone: 'neutral' },
}

export function TypeBadge({ type }: { type: StopType }) {
  const { t } = useDriver()
  const c = TYPE[type]
  return <Badge tone={c.tone}><Glyph name={c.icon} size={12} />{t(c.key)}</Badge>
}

const STATUS: Record<StopStatus, { tone: Tone; key: 'stPending' | 'stArrived' | 'stCompleted' | 'stFailed' }> = {
  pending: { tone: 'neutral', key: 'stPending' },
  arrived: { tone: 'warning', key: 'stArrived' },
  completed: { tone: 'success', key: 'stCompleted' },
  failed: { tone: 'danger', key: 'stFailed' },
}
export function StatusBadge({ status }: { status: StopStatus }) {
  const { t } = useDriver()
  return <Badge tone={STATUS[status].tone} dot>{t(STATUS[status].key)}</Badge>
}

/* ---------------- photo (simulated camera) ---------------- */

/** A captured photo stand-in: the frame, a camera glyph and the time / GPS stamp the real one would carry. */
export function PhotoTile({ stamp, onRetake }: { stamp: string; onRetake?: () => void }) {
  const { t } = useDriver()
  return (
    <div className="da-photo">
      <div className="da-photo-img" aria-hidden><Glyph name="image" size={28} /></div>
      <span className="da-photo-stamp">{stamp}</span>
      {onRetake && <Button variant="link" size="sm" onClick={onRetake}>{t('retake')}</Button>}
    </div>
  )
}

export function PhotoCapture({ taken, onTake, label }: { taken: boolean; onTake: (v: boolean) => void; label?: string }) {
  const { s, t } = useDriver()
  if (taken) return <PhotoTile stamp={`${hhmm(s.clock)} · GPS`} onRetake={() => onTake(false)} />
  return (
    <Button variant="secondary" size="lg" className="da-big" onClick={() => onTake(true)}>
      <Glyph name="camera" size={20} />{label ?? t('takePhoto')}
    </Button>
  )
}

/* ---------------- signature pad ---------------- */

/** A real pad: draws with a finger, a pen or the mouse. Returns a PNG data URL, or null when cleared. */
export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const { t } = useDriver()
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [empty, setEmpty] = useState(true)

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const r = c.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    c.width = r.width * dpr
    c.height = r.height * dpr
    const ctx = c.getContext('2d')!
    ctx.scale(dpr, dpr)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = getComputedStyle(c).color
  }, [])

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top] as const
  }

  return (
    <div className="da-sign">
      <canvas
        ref={ref}
        className="da-sign-canvas"
        aria-label={t('signHere')}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          drawing.current = true
          const ctx = e.currentTarget.getContext('2d')!
          const [x, y] = pos(e)
          ctx.beginPath()
          ctx.moveTo(x, y)
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return
          const ctx = e.currentTarget.getContext('2d')!
          const [x, y] = pos(e)
          ctx.lineTo(x, y)
          ctx.stroke()
        }}
        onPointerUp={(e) => {
          if (!drawing.current) return
          drawing.current = false
          setEmpty(false)
          onChange(e.currentTarget.toDataURL('image/png'))
        }}
      />
      {empty && <span className="da-sign-ph" aria-hidden><Glyph name="pen" size={18} />{t('signHere')}</span>}
      <span className="da-sign-line" aria-hidden />
      {!empty && (
        <Button
          variant="ghost" size="sm" className="da-sign-clear"
          onClick={() => {
            const c = ref.current!
            c.getContext('2d')!.clearRect(0, 0, c.width, c.height)
            setEmpty(true)
            onChange(null)
          }}
        >{t('clear')}</Button>
      )}
    </div>
  )
}

/* ---------------- in-phone bottom sheet and snackbar ---------------- */

/** The design system's Sheet portals to the page; inside the phone frame we need one that stays in it. */
export function PhoneSheet({ open, title, onClose, children, footer }: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const { t } = useDriver()
  if (!open) return null
  return (
    <div className="da-sheet-layer">
      <div className="da-sheet-backdrop" onClick={onClose} />
      <div className="da-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="da-sheet-handle" />
        <div className="da-sheet-h">
          <span className="da-sheet-t">{title}</span>
          <IconButton icon="x" label={t('cancel')} size="sm" onClick={onClose} />
        </div>
        <div className="da-sheet-b">{children}</div>
        {footer && <div className="da-sheet-f">{footer}</div>}
      </div>
    </div>
  )
}

export function Snack() {
  const { s, x } = useDriver()
  if (!s.snack) return null
  const icon: GlyphName = s.snack.tone === 'ok' ? 'ok' : s.snack.tone === 'err' ? 'err' : 'info'
  return (
    <div className={cx('da-snack', s.snack.tone)} role={s.snack.tone === 'err' ? 'alert' : 'status'} key={s.snack.id}>
      <Glyph name={icon} size={18} />
      <span>{x(s.snack.text)}</span>
    </div>
  )
}

/* ---------------- small layout helpers ---------------- */

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="da-kv">
      <span className="da-k">{label}</span>
      <span className="da-v">{children}</span>
    </div>
  )
}

export function Section({ title, children, aside }: { title?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="da-sec">
      {title && <div className="da-sec-h"><h3 className="da-sec-t">{title}</h3>{aside}</div>}
      {children}
    </section>
  )
}
