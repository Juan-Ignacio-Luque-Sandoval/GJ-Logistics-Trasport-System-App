import { useState } from 'react'
import { Badge, FormField, Input, type Tone } from '@zp/ui'
import { Glyph } from '~/ui-local'
import { DISPATCHER, DRIVER, ROUTE, RULES, STOPS, VEHICLE, cartonsOf, hhmm, stopMinutes } from '../data'
import { AppBar, Big, Body, Field, Footer, OfflineBanner, Section, TypeBadge } from '../parts'
import { currentStop, etas, useDriver } from '../store'

/* ---------------- sign-in ---------------- */

export function SignIn() {
  const { t, dispatch } = useDriver()
  const [id, setId] = useState(DRIVER.id)
  const [pin, setPin] = useState('')
  const ok = id.trim().length > 0 && /^\d{4}$/.test(pin)
  return (
    <div className="da-screen da-signin">
      <div className="da-signin-top">
        <span className="da-logo" aria-hidden><Glyph name="truck" size={28} /></span>
        <h1 className="da-signin-t">{t('appName')}</h1>
        <p className="da-muted">{t('signInTitle')}</p>
      </div>
      <Body>
        <FormField label={t('driverId')}>
          <Input value={id} onChange={(e) => setId(e.target.value)} autoComplete="off" />
        </FormField>
        <FormField label={t('pin')} description="Demo: any 4 digits">
          <Input
            value={pin} inputMode="numeric" type="password" maxLength={4}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => { if (e.key === 'Enter' && ok) dispatch({ type: 'signIn' }) }}
          />
        </FormField>
        <LangSwitch />
        <p className="da-note"><Glyph name="info" size={14} />{t('signInNote')}</p>
      </Body>
      <Footer reason={ok ? null : t('signInBlocked')}>
        <Big icon="lock" blocked={!ok} onClick={() => dispatch({ type: 'signIn' })}>{t('signIn')}</Big>
      </Footer>
    </div>
  )
}

export function LangSwitch() {
  const { s, t, dispatch } = useDriver()
  return (
    <div className="da-lang" role="group" aria-label={t('language')}>
      <Glyph name="globe" size={16} />
      <span className="da-k">{t('language')}</span>
      <span className="grow" />
      {(['en', 'ru'] as const).map((l) => (
        <button
          key={l} type="button" className={l === s.lang ? 'da-seg on' : 'da-seg'} aria-pressed={l === s.lang}
          onClick={() => dispatch({ type: 'lang', lang: l })}
        >{l === 'en' ? 'English' : 'Русский'}</button>
      ))}
    </div>
  )
}

/* ---------------- today ---------------- */

const routeTone: Record<string, Tone> = { released: 'info', started: 'warning', completed: 'success', closed: 'neutral' }
const routeKey = { released: 'routeReleased', started: 'routeStarted', completed: 'routeCompleted', closed: 'routeClosed' } as const

export function Today() {
  const { s, t, x, dispatch } = useDriver()
  const all = cartonsOf([...new Set(STOPS.flatMap((st) => st.transfers))])
  const kg = all.reduce((a, c) => a + c.kg, 0)
  const m3 = all.reduce((a, c) => a + c.m3, 0)
  const last = STOPS[STOPS.length - 1]!
  const plannedEnd = last.planned + stopMinutes(cartonsOf(last.transfers).length)
  const next = currentStop(s)
  const eta = etas(s)
  const count = (type: string) => STOPS.filter((st) => st.type === type).length

  return (
    <div className="da-screen">
      <AppBar title={t('appName')} sub={t('todayIs', { date: ROUTE.date })} back={false} />
      <OfflineBanner />
      <Body>
        <p className="da-hello">{t('hello', { name: s.lang === 'en' ? DRIVER.name.split(' ')[0]! : DRIVER.nameRu.split(' ')[0]! })}</p>

        <section className="da-card da-route">
          <div className="da-route-h">
            <span className="da-route-ic" aria-hidden><Glyph name="route" size={20} /></span>
            <div className="grow">
              <div className="da-k">{t('route')} · {x(ROUTE.region)}</div>
              <div className="da-route-id mono">{ROUTE.id}</div>
            </div>
            <Badge tone={routeTone[s.route]!} dot>{t(routeKey[s.route])}</Badge>
          </div>
          <div className="da-stats">
            <Stat label={t('stops')} value={STOPS.length} />
            <Stat label={t('cartons')} value={all.length} />
            <Stat label={t('weight')} value={`${kg} kg`} />
            <Stat label={t('volume')} value={`${m3.toFixed(1)} m³`} />
          </div>
          <p className="da-muted da-sm">{t('pickupsDeliveries', { p: count('pickup'), d: count('delivery'), x: count('crossdock') })}</p>
          <Field label={t('planned')}><span className="num">{hhmm(ROUTE.start)}–{hhmm(plannedEnd)}</span></Field>
          <Field label={t('vehicle')}>{x(VEHICLE.type)} · <span className="mono">{VEHICLE.plate}</span></Field>
          <Field label={t('fill')}><span className="num">{Math.round((m3 / VEHICLE.m3) * 100)} % m³ · {Math.round((kg / VEHICLE.kg) * 100)} % kg</span></Field>
          <Field label={t('carrier')}>{x(DRIVER.carrier)}</Field>
        </section>

        {s.route === 'started' && next && (
          <Section title={t('nextStop')}>
            <button type="button" className="da-card da-next" onClick={() => dispatch({ type: 'go', screen: { name: 'stop', id: next.id } })}>
              <span className="da-seq">{next.seq}</span>
              <span className="grow da-next-b">
                <span className="da-next-n">{next.location.name}</span>
                <span className="da-row"><TypeBadge type={next.type} /><span className="da-sm da-muted num">{t('eta')} {hhmm(eta[next.id] ?? next.planned)}</span></span>
              </span>
              <Glyph name="chev-right" size={20} />
            </button>
          </Section>
        )}

        <Section title={t('dispatcher')}>
          <div className="da-card da-row">
            <span className="grow">{x(DISPATCHER.name)}<br /><span className="da-sm da-muted num">{DISPATCHER.phone}</span></span>
            <a className="btn secondary" href={`tel:${DISPATCHER.phone.replace(/\s|-/g, '')}`}><Glyph name="phone" size={16} /><span>{t('call')}</span></a>
          </div>
        </Section>
      </Body>
      <Footer>
        {s.route === 'released' && (
          <Big icon="play" onClick={() => dispatch({ type: 'go', screen: s.consentAt ? { name: 'stops' } : { name: 'consent' } })}>{t('startRoute')}</Big>
        )}
        {(s.route === 'started' || s.route === 'completed') && (
          <Big icon="list" variant={s.route === 'completed' ? 'secondary' : 'primary'} onClick={() => dispatch({ type: 'go', screen: { name: 'stops' } })}>{t('continueRoute')}</Big>
        )}
        {s.route === 'completed' && <Big icon="flag" onClick={() => dispatch({ type: 'go', screen: { name: 'close' } })}>{t('closeRoute')}</Big>}
      </Footer>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="da-stat">
      <span className="da-stat-v num">{value}</span>
      <span className="da-stat-l">{label}</span>
    </div>
  )
}

/* ---------------- tracking consent (§ 11) ---------------- */

export function Consent() {
  const { t, dispatch } = useDriver()
  return (
    <div className="da-screen">
      <AppBar title={t('consentTitle')} />
      <Body>
        <div className="da-consent-ic" aria-hidden><Glyph name="map-pin" size={36} /></div>
        <p className="da-lead">{t('consentBody', { n: RULES.gpsEveryMin })}</p>
      </Body>
      <Footer>
        <Big icon="check" onClick={() => dispatch({ type: 'startRoute' })}>{t('consentAgree')}</Big>
        <Big variant="ghost" onClick={() => dispatch({ type: 'back' })}>{t('consentLater')}</Big>
      </Footer>
    </div>
  )
}
