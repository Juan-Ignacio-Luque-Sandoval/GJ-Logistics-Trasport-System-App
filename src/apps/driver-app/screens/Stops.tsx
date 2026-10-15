import { Badge, Button, cx } from '@zp/ui'
import { Glyph } from '~/ui-local'
import { STOPS, cartonsOf, hhmm, transferByNo } from '../data'
import { AppBar, Big, Body, Field, Footer, OfflineBanner, Section, StatusBadge, TypeBadge } from '../parts'
import { currentStop, delayOf, etas, expectedCartons, failKey, nextKey, useDriver } from '../store'

/* ---------------- stop list ---------------- */

export function Stops() {
  const { s, t, dispatch } = useDriver()
  const eta = etas(s)
  const cur = currentStop(s)
  const done = STOPS.filter((x) => ['completed', 'failed'].includes(s.stops[x.id]!.status)).length

  return (
    <div className="da-screen">
      <AppBar title={t('stops')} sub={t('stopsProgress', { done, total: STOPS.length })} />
      <OfflineBanner />
      <div className="da-progress" aria-hidden><span style={{ width: `${(done / STOPS.length) * 100}%` }} /></div>
      <Body className="da-tight">
        <ol className="da-stops">
          {STOPS.map((stop, i) => {
            const st = s.stops[stop.id]!
            const late = st.status === 'pending' ? delayOf(stop, eta[stop.id]) : null
            const isCur = cur?.id === stop.id && s.route === 'started'
            const n = expectedCartons(s, stop).length
            return (
              <li key={stop.id} className={cx('da-stop', `is-${st.status}`, isCur && 'is-cur')}>
                <div className="da-stop-rail" aria-hidden>
                  <span className="da-seq">{st.status === 'completed' ? <Glyph name="check" size={16} /> : st.status === 'failed' ? <Glyph name="x" size={16} /> : stop.seq}</span>
                  {i < STOPS.length - 1 && <span className="da-stop-line" />}
                </div>
                <button type="button" className="da-stop-card" onClick={() => dispatch({ type: 'go', screen: { name: 'stop', id: stop.id } })}>
                  <span className="da-row da-wrap">
                    <TypeBadge type={stop.type} />
                    {isCur && <Badge tone="primary">{t('next')}</Badge>}
                    {st.status !== 'pending' && <StatusBadge status={st.status} />}
                  </span>
                  <span className="da-stop-n">{stop.location.name}</span>
                  <span className="da-stop-m num">
                    {t('window')} {hhmm(stop.window[0])}–{hhmm(stop.window[1])} · {t('nCartons', { n })}
                  </span>
                  <span className="da-stop-m num">
                    {st.status === 'pending' && <>{t('eta')} <b>{hhmm(eta[stop.id]!)}</b></>}
                    {st.status === 'arrived' && t('arrivedAt', { time: hhmm(st.arrivedAt!) })}
                    {st.status === 'completed' && t('doneAt', { time: hhmm(st.doneAt!) })}
                    {st.status === 'failed' && t('failedAt', { time: hhmm(st.doneAt!) })}
                  </span>
                  {late && (
                    <span className="da-late">
                      <Glyph name="clock" size={14} />
                      {late.afterWindow ? t('lateWindow') : t('late', { n: late.behind })}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ol>
      </Body>
      <Footer>
        {s.route === 'completed'
          ? <Big icon="flag" onClick={() => dispatch({ type: 'go', screen: { name: 'close' } })}>{t('closeRoute')}</Big>
          : cur && s.route === 'started' && (
            <Big icon="chev-right" onClick={() => dispatch({ type: 'go', screen: { name: 'stop', id: cur.id } })}>
              {cur.seq}. {cur.location.name}
            </Big>
          )}
      </Footer>
    </div>
  )
}

/* ---------------- stop detail ---------------- */

export function StopDetail({ id }: { id: string }) {
  const { s, t, x, dispatch } = useDriver()
  const stop = STOPS.find((st) => st.id === id)!
  const st = s.stops[id]!
  const eta = etas(s)[id]
  const late = st.status === 'pending' ? delayOf(stop, eta) : null
  const cur = currentStop(s)
  const blockedBy = st.status === 'pending' && cur && cur.id !== id && s.stops[cur.id]!.status === 'arrived' ? cur : null
  const loc = stop.location
  const mapUrl = `https://yandex.ru/maps/?pt=${loc.gps[1]},${loc.gps[0]}&z=16&l=map`

  return (
    <div className="da-screen">
      <AppBar title={`${stop.seq}. ${loc.name}`} sub={x(loc.address)} />
      <OfflineBanner />
      <Body>
        <div className="da-row da-wrap">
          <TypeBadge type={stop.type} />
          <StatusBadge status={st.status} />
        </div>

        {late && (
          <div className="da-alert warn" role="status">
            <Glyph name="clock" size={18} />
            <span><b>{late.afterWindow ? t('lateWindow') : t('late', { n: late.behind })}</b><br />{t('delayAlertSent')}</span>
          </div>
        )}

        <div className="da-two">
          <button type="button" className="da-tile" onClick={() => window.open(mapUrl, '_blank', 'noopener')}>
            <Glyph name="navigation" size={22} /><span>{t('navigate')}</span>
          </button>
          <a className="da-tile" href={`tel:${loc.contact.phone.replace(/\s|-/g, '')}`}>
            <Glyph name="phone" size={22} /><span>{t('callStore')}</span>
          </a>
        </div>

        <section className="da-card">
          <Field label={t('window')}><span className="num">{hhmm(stop.window[0])}–{hhmm(stop.window[1])}</span></Field>
          {st.status === 'pending' && <Field label={t('eta')}><span className="num">{hhmm(eta!)}</span></Field>}
          {st.arrivedAt != null && <Field label={t('stArrived')}><span className="num">{hhmm(st.arrivedAt)}</span></Field>}
          <Field label={t('hours')}><span className="num">{loc.hours}</span></Field>
          <Field label={t('contact')}>{x(loc.contact.name)}<br /><span className="num da-muted">{loc.contact.phone}</span></Field>
          <Field label={t('dock')}>{x(loc.dock)}</Field>
        </section>

        <Section title={stop.type === 'delivery' ? t('unloadHere') : t('loadHere')}>
          <div className="da-card da-list">
            {stop.transfers.map((no) => {
              const tf = transferByNo(no)
              const n = expectedCartons(s, stop).filter((c) => c.transfer === no).length
              const planned = cartonsOf([no]).length
              return (
                <div key={no} className="da-list-row">
                  <Glyph name="box" size={18} />
                  <span className="grow">
                    <span className="mono">{no}</span>{tf.priority === 'urgent' && <> <Badge tone="danger">{t('urgent')}</Badge></>}
                    <br /><span className="da-sm da-muted">{stop.type === 'delivery' ? t('from', { name: tf.from }) : t('to', { name: tf.to })}</span>
                    {tf.handling && <><br /><span className="da-sm da-warn-ink">{x(tf.handling)}</span></>}
                  </span>
                  <span className="num da-strong">{n}{n !== planned && <span className="da-sm da-muted"> / {planned}</span>}</span>
                </div>
              )
            })}
          </div>
        </Section>

        {st.status === 'completed' && st.proof && (
          <div className="da-alert ok"><Glyph name="ok" size={18} /><span>{t('stopDone')} {st.proof.signer} · <span className="num">{hhmm(st.proof.at)}</span></span></div>
        )}
        {st.status === 'failed' && st.failure && (
          <div className="da-alert err"><Glyph name="err" size={18} /><span>{t('stopFailedNote', { reason: t(failKey[st.failure.reason]), next: t(nextKey[st.failure.next]) })}</span></div>
        )}

        {st.trail.length > 0 && (
          <Section title={t('trail')}>
            <ol className="da-trail">
              {st.trail.map((e, i) => (
                <li key={i}><span className="num da-muted">{hhmm(e.at)}</span><span className="grow">{x(e.what)}<br /><span className="da-sm da-faint mono">GPS {e.gps}</span></span></li>
              ))}
            </ol>
          </Section>
        )}

        {(st.status === 'pending' || st.status === 'arrived') && s.route === 'started' && (
          <div className="da-row da-wrap da-links">
            <Button variant="ghost" onClick={() => dispatch({ type: 'go', screen: { name: 'report', stopId: id } })}><Glyph name="alert" size={16} />{t('reportIssue')}</Button>
          </div>
        )}
      </Body>
      {s.route === 'started' && (st.status === 'pending' || st.status === 'arrived') && (
        <Footer reason={blockedBy ? t('prevOpen', { n: blockedBy.seq }) : null}>
          {st.status === 'pending'
            ? <Big icon="map-pin" blocked={!!blockedBy} onClick={() => dispatch({ type: 'arrive', id })}>{t('arrived')}</Big>
            : <Big icon="scan" onClick={() => dispatch({ type: 'go', screen: { name: 'flow', id } })}>{t('resume')}</Big>}
          <Big variant="ghost" icon="err" blocked={!!blockedBy} onClick={() => dispatch({ type: 'go', screen: { name: 'fail', id } })}>{t('cantComplete')}</Big>
        </Footer>
      )}
    </div>
  )
}
