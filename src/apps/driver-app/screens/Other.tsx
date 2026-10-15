import { useState } from 'react'
import { Badge, Button, EmptyState, Input, Switch, Textarea, cx } from '@zp/ui'
import { Glyph, type GlyphName } from '~/ui-local'
import { DISPATCHER, DRIVER, STOPS, VEHICLE, hhmm } from '../data'
import { AppBar, Big, Body, Field, Footer, OfflineBanner, PhotoCapture, Section } from '../parts'
import { LangSwitch } from './Start'
import { expectedCartons, failKey, nextKey, reasonKey, useDriver, type ExceptionReason, type FailReason, type NextStep } from '../store'

/* ---------------- failed stop (§ 4.5) ---------------- */

/** The app proposes a next step from the reason; the driver can pick another. */
const PROPOSAL: Record<FailReason, NextStep> = { closed: 'retry', refused: 'return', address: 'call', other: 'call' }
const FAIL_ICON: Record<FailReason, GlyphName> = { closed: 'lock', refused: 'x', address: 'map-pin', other: 'more' }

export function Fail({ id }: { id: string }) {
  const { t, dispatch } = useDriver()
  const stop = STOPS.find((x) => x.id === id)!
  const [reason, setReason] = useState<FailReason | null>(null)
  const [next, setNext] = useState<NextStep | null>(null)
  const [photo, setPhoto] = useState(false)
  const [note, setNote] = useState('')
  const proposed = reason ? PROPOSAL[reason] : null
  const chosen = next ?? proposed
  const ready = !!reason && photo

  return (
    <div className="da-screen">
      <AppBar title={t('cantComplete')} sub={`${stop.seq}. ${stop.location.name}`} />
      <OfflineBanner />
      <Body>
        <h2 className="da-h2">{t('failTitle')}</h2>
        <div className="da-choices">
          {(Object.keys(failKey) as FailReason[]).map((r) => (
            <button
              key={r} type="button" className={cx('da-choice wide', reason === r && 'on')} aria-pressed={reason === r}
              onClick={() => { setReason(r); setNext(null) }}
            ><Glyph name={FAIL_ICON[r]} size={20} />{t(failKey[r])}</button>
          ))}
        </div>

        {reason && (
          <>
            <Section title={t('failPhoto')}><PhotoCapture taken={photo} onTake={setPhoto} /></Section>
            <Section title={t('proposed')}>
              <div className="da-choices">
                {(Object.keys(nextKey) as NextStep[]).map((n) => (
                  <button
                    key={n} type="button" className={cx('da-choice wide', chosen === n && 'on')} aria-pressed={chosen === n}
                    onClick={() => setNext(n)}
                  >
                    <Glyph name={n === 'retry' ? 'refresh' : n === 'return' ? 'warehouse' : 'phone'} size={20} />
                    <span className="grow">{t(nextKey[n])}</span>
                    {n === proposed && <Badge tone="primary">{t('suggested')}</Badge>}
                  </button>
                ))}
              </div>
            </Section>
            <label className="da-label" htmlFor="da-fail-note">{t('comment')}</label>
            <Textarea id="da-fail-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('commentPh')} rows={3} />
          </>
        )}
      </Body>
      <Footer reason={ready ? null : t('failBlocked')}>
        <Big variant="danger" icon="err" blocked={!ready} onClick={() => dispatch({ type: 'fail', id, reason: reason!, next: chosen!, note })}>{t('confirmFail')}</Big>
      </Footer>
    </div>
  )
}

/* ---------------- report an issue (§ 4.8) ---------------- */

const REPORTABLE: Array<{ r: ExceptionReason; icon: GlyphName }> = [
  { r: 'delay', icon: 'clock' },
  { r: 'breakdown', icon: 'truck' },
  { r: 'damaged', icon: 'alert' },
  { r: 'missing', icon: 'box' },
  { r: 'other', icon: 'more' },
]

export function Report({ stopId }: { stopId?: string }) {
  const { t, dispatch } = useDriver()
  const stop = stopId ? STOPS.find((x) => x.id === stopId) : undefined
  const [reason, setReason] = useState<ExceptionReason | null>(null)
  const [delay, setDelay] = useState(30)
  const [comment, setComment] = useState('')
  const [photo, setPhoto] = useState(false)

  return (
    <div className="da-screen">
      <AppBar title={t('reportTitle')} sub={stop ? `${stop.seq}. ${stop.location.name}` : t('general')} />
      <OfflineBanner />
      <Body>
        <div className="da-choices">
          {REPORTABLE.map(({ r, icon }) => (
            <button key={r} type="button" className={cx('da-choice wide', reason === r && 'on')} aria-pressed={reason === r} onClick={() => setReason(r)}>
              <Glyph name={icon} size={20} />{t(reasonKey[r])}
            </button>
          ))}
        </div>
        {reason === 'delay' && (
          <Section title={t('howLate')}>
            <div className="da-seg-row" role="group" aria-label={t('howLate')}>
              {[15, 30, 60].map((m) => (
                <button key={m} type="button" className={m === delay ? 'da-seg on' : 'da-seg'} aria-pressed={m === delay} onClick={() => setDelay(m)}>+{m} min</button>
              ))}
            </div>
          </Section>
        )}
        {reason === 'breakdown' && <div className="da-alert warn"><Glyph name="info" size={18} /><span>{t('breakdownNote')}</span></div>}
        {reason && (
          <>
            <label className="da-label" htmlFor="da-rep-note">{t('comment')}</label>
            <Textarea id="da-rep-note" value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t('commentPh')} rows={3} />
            <Section title={t('photoOptional')}><PhotoCapture taken={photo} onTake={setPhoto} /></Section>
          </>
        )}
      </Body>
      <Footer reason={reason ? null : t('reportBlocked')}>
        <Big
          icon="arrow-right" blocked={!reason}
          onClick={() => dispatch({ type: 'report', stopId, reason: reason!, comment, photo, delay: reason === 'delay' ? delay : undefined })}
        >{t('sendReport')}</Big>
      </Footer>
    </div>
  )
}

/* ---------------- issues list ---------------- */

export function Issues() {
  const { s, t, x, dispatch } = useDriver()
  return (
    <div className="da-screen">
      <AppBar title={t('issuesTitle')} back={false} />
      <OfflineBanner />
      <Body>
        {s.exceptions.length === 0
          ? <EmptyState title={t('noIssues')}>{t('noIssuesBody')}</EmptyState>
          : (
            <ul className="da-issues">
              {[...s.exceptions].reverse().map((e) => {
                const stop = e.stopId ? STOPS.find((x) => x.id === e.stopId) : undefined
                return (
                  <li key={e.id} className="da-card">
                    <div className="da-row">
                      <span className="mono da-sm da-muted">{e.id}</span>
                      <span className="grow" />
                      <Badge tone="warning" dot>{t('open')}</Badge>
                    </div>
                    <b>{t(reasonKey[e.reason])}</b>
                    <span className="da-sm">{stop ? `${stop.seq}. ${stop.location.name}` : t('general')} · <span className="num">{hhmm(e.at)}</span></span>
                    {e.comment && <span className="da-sm da-muted">{e.comment}</span>}
                    <span className="da-sm"><span className="da-muted">{t('owner')}:</span> {x(e.owner)} · <span className="num">{t('deadline', { time: hhmm(e.deadline) })}</span></span>
                  </li>
                )
              })}
            </ul>
          )}
      </Body>
      {s.route === 'started' && (
        <Footer>
          <Big variant="secondary" icon="alert" onClick={() => dispatch({ type: 'go', screen: { name: 'report' } })}>{t('reportIssue')}</Big>
        </Footer>
      )}
    </div>
  )
}

/* ---------------- close route ---------------- */

export function Close() {
  const { s, t, dispatch } = useDriver()
  const [odo, setOdo] = useState('')
  const done = STOPS.filter((x) => s.stops[x.id]!.status === 'completed')
  const failed = STOPS.filter((x) => s.stops[x.id]!.status === 'failed')
  const open = STOPS.length - done.length - failed.length
  const sum = (types: string[], list = done) =>
    list.filter((x) => types.includes(x.type)).reduce((a, x) => a + s.stops[x.id]!.scanned.length, 0)
  const picked = sum(['pickup', 'crossdock'])
  const delivered = sum(['delivery'])
  const onBoard = failed.filter((x) => x.type === 'delivery').reduce((a, x) => a + expectedCartons(s, x).length, 0)
  const pods = done.filter((x) => s.stops[x.id]!.proof).length

  return (
    <div className="da-screen">
      <AppBar title={t('closeTitle')} />
      <OfflineBanner />
      <Body>
        <section className="da-card">
          <Field label={t('stopsDone')}><span className="num">{done.length} / {STOPS.length}</span></Field>
          <Field label={t('stopsFailed')}><span className="num">{failed.length}</span></Field>
          <Field label={t('cartonsPicked')}><span className="num">{picked}</span></Field>
          <Field label={t('cartonsDelivered')}><span className="num">{delivered}</span></Field>
          <Field label={t('pods')}><span className="num">{pods}</span></Field>
          <Field label={t('issues')}><span className="num">{s.exceptions.length}</span></Field>
        </section>
        {onBoard > 0 && (
          <div className="da-alert warn"><Glyph name="box" size={18} /><span><b>{t('onBoard')}: <span className="num">{onBoard}</span></b><br />{t('returnCd')}</span></div>
        )}
        <label className="da-label" htmlFor="da-odo">{t('odometer')}</label>
        <Input id="da-odo" value={odo} onChange={(e) => setOdo(e.target.value.replace(/\D/g, ''))} numeric suffix="km" placeholder="48 215" />
      </Body>
      <Footer reason={open > 0 ? t('stopsOpen', { n: open }) : null}>
        <Big icon="flag" blocked={open > 0} onClick={() => dispatch({ type: 'closeRoute' })}>{t('confirmClose')}</Big>
      </Footer>
    </div>
  )
}

export function Closed() {
  const { s, t } = useDriver()
  return (
    <div className="da-screen">
      <AppBar title={t('routeClosedTitle')} back={false} />
      <OfflineBanner />
      <Body className="da-center">
        <span className="da-done-ic" aria-hidden><Glyph name="check" size={40} /></span>
        <h2 className="da-h2">{t('routeClosedTitle')}</h2>
        <p className="da-lead">{t('routeClosedBody', { name: s.lang === 'en' ? DRIVER.name.split(' ')[0]! : DRIVER.nameRu.split(' ')[0]! })}</p>
        <div className={cx('da-alert', s.queue.length ? 'warn' : 'ok')}>
          <Glyph name={s.queue.length ? 'cloud-up' : 'ok'} size={18} />
          <span>{s.queue.length ? t('closedWaiting', { n: s.queue.length }) : t('closedSynced')}</span>
        </div>
      </Body>
    </div>
  )
}

/* ---------------- more ---------------- */

export function More() {
  const { s, t, x, dispatch } = useDriver()
  const active = s.route === 'started' || s.route === 'completed'
  return (
    <div className="da-screen">
      <AppBar title={t('tabMore')} />
      <OfflineBanner />
      <Body>
        <Section
          title={t('syncQueue')}
          aside={<Badge tone={s.online ? (s.queue.length ? 'info' : 'success') : 'warning'} dot>{s.online ? (s.queue.length ? t('syncing') : t('online')) : t('offline')}</Badge>}
        >
          <div className="da-card da-list">
            {s.queue.length === 0
              ? <p className="da-muted da-sm">{t('syncEmpty', { time: s.lastSync != null ? hhmm(s.lastSync) : '—' })}</p>
              : s.queue.slice(-8).reverse().map((q) => (
                <div key={q.id} className="da-list-row"><Glyph name="cloud-up" size={16} /><span className="grow da-sm">{x(q.what)}</span><span className="num da-sm da-muted">{hhmm(q.at)}</span></div>
              ))}
            {s.queue.length > 8 && <p className="da-sm da-muted">+{s.queue.length - 8}</p>}
          </div>
          {s.queue.length > 0 && (
            <Button variant="secondary" softDisabled={!s.online} onClick={() => dispatch({ type: 'synced' })} icon="refresh">{t('syncNow')}</Button>
          )}
          {!s.online && s.queue.length > 0 && <p className="da-reason"><Glyph name="info" size={14} />{t('syncOffline')}</p>}
        </Section>

        <section className="da-card">
          <div className="da-row">
            <Glyph name="bluetooth" size={18} />
            <span className="grow"><Switch checked={s.bt} onChange={(v) => dispatch({ type: 'bt', on: v })} label={t('btScanner')} labelLeft /></span>
          </div>
          <div className="da-sm da-muted">{s.bt ? t('btOn') : t('btOff')}
          </div>
        </section>

        <LangSwitch />

        <section className="da-card">
          <Field label={t('driver')}>{s.lang === 'en' ? DRIVER.name : DRIVER.nameRu} · <span className="mono">{DRIVER.id}</span></Field>
          <Field label={t('licence')}><span className="num">{DRIVER.licence}</span></Field>
          <Field label={t('vehicle')}>{x(VEHICLE.type)} · <span className="mono">{VEHICLE.plate}</span></Field>
          <Field label={t('dispatcher')}>{x(DISPATCHER.name)} · <span className="num">{DISPATCHER.phone}</span></Field>
          {s.consentAt != null && <p className="da-sm da-muted">{t('consentRecorded', { time: hhmm(s.consentAt) })}</p>}
        </section>
      </Body>
      <Footer reason={active ? t('signOutBlocked') : null}>
        <Big variant="secondary" icon="logout" blocked={active} onClick={() => dispatch({ type: 'signOut' })}>{t('signOut')}</Big>
      </Footer>
    </div>
  )
}
