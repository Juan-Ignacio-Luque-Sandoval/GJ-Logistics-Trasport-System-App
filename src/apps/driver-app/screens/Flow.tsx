import { useState } from 'react'
import { Badge, Button, Input, cx } from '@zp/ui'
import { Glyph } from '~/ui-local'
import { STOPS, hhmm, transferByNo, type PlannedStop } from '../data'
import { both } from '../i18n'
import { AppBar, Big, Body, Footer, OfflineBanner, PhoneSheet, PhotoCapture, Section, SignaturePad } from '../parts'
import { expectedCartons, useDriver } from '../store'

type Step = 'scan' | 'check' | 'seals' | 'sign'
const STEP_KEY = { scan: 'stepScan', check: 'stepCheck', seals: 'stepSeals', sign: 'stepSign' } as const

/** A check step for pickups and cross-dock loads only when something is short or damaged, decided on leaving the scan. */
function stepsFor(stop: PlannedStop, withCheck: boolean): Step[] {
  if (stop.type === 'delivery') return ['scan', 'check', 'sign']
  return ['scan', ...(withCheck ? (['check'] as const) : []), 'seals', 'sign']
}

/**
 * One stop, from arrival to proof (§ 3, § 4.5): scan the cartons, compare with the list, check the
 * seals (pickups and cross-dock loads), then the signature or a photo. Each step writes its record.
 */
export function Flow({ id }: { id: string }) {
  const { s, t } = useDriver()
  const stop = STOPS.find((x) => x.id === id)!
  const st = s.stops[id]!
  const [step, setStep] = useState<Step>('scan')
  const [withCheck, setWithCheck] = useState(false)
  const steps = stepsFor(stop, withCheck)
  const i = steps.indexOf(step)
  const next = () => setStep(steps[i + 1] ?? 'sign')
  const leaveScan = () => {
    const discrepancy = st.scanned.length < expectedCartons(s, stop).length || st.damaged.length > 0
    if (stop.type !== 'delivery') setWithCheck(discrepancy)
    setStep(stop.type === 'delivery' || discrepancy ? 'check' : 'seals')
  }

  return (
    <div className="da-screen">
      <AppBar title={`${stop.seq}. ${stop.location.name}`} sub={`${t('stepOf', { i: i + 1, n: steps.length })} · ${t(STEP_KEY[step])}`} />
      <OfflineBanner />
      <ol className="da-steps" aria-label={t('stepOf', { i: i + 1, n: steps.length })}>
        {steps.map((k, j) => (
          <li key={k} className={cx(j < i && 'done', j === i && 'cur')} aria-current={j === i ? 'step' : undefined}>
            <span className="sr-only">{t(STEP_KEY[k])}</span>
          </li>
        ))}
      </ol>
      {step === 'scan' && <ScanStep stop={stop} onNext={leaveScan} />}
      {step === 'check' && <CheckStep stop={stop} onNext={next} />}
      {step === 'seals' && <SealStep stop={stop} onNext={next} />}
      {step === 'sign' && <SignStep stop={stop} />}
    </div>
  )
}

/* ---------------- scan ---------------- */

function ScanStep({ stop, onNext }: { stop: PlannedStop; onNext: () => void }) {
  const { s, t, dispatch } = useDriver()
  const st = s.stops[stop.id]!
  const expected = expectedCartons(s, stop)
  const left = expected.filter((c) => !st.scanned.includes(c.id))
  const [manual, setManual] = useState('')
  const [damage, setDamage] = useState<string | null>(null)
  const [photo, setPhoto] = useState(false)
  const [flash, setFlash] = useState<'ok' | 'err' | null>(null)

  function read(raw: string) {
    const code = raw.trim().toUpperCase().replace(/^C-?/, '')
    if (!code) return
    if (st.scanned.includes(code)) {
      setFlash('err')
      dispatch({ type: 'snack', text: both('already', { id: code }), tone: 'err' })
    } else if (!expected.some((c) => c.id === code)) {
      setFlash('err')
      dispatch({ type: 'snack', text: both('notOnList', { id: code }), tone: 'err' })
    } else {
      setFlash('ok')
      dispatch({ type: 'scan', id: stop.id, carton: code })
    }
    window.setTimeout(() => setFlash(null), 500)
  }

  return (
    <>
      <Body>
        <div className={cx('da-viewfinder', flash && `flash-${flash}`)} aria-live="polite">
          <span className="da-vf-corners" aria-hidden />
          <Glyph name={s.bt ? 'bluetooth' : 'scan'} size={30} />
          <span className="da-sm">{s.bt ? t('btReady') : t('aimCamera')}</span>
          {st.scanned.length > 0 && <span className="mono da-vf-last">{st.scanned[st.scanned.length - 1]}</span>}
        </div>

        <div className="da-count">
          <span className="num da-count-n">{st.scanned.length}<span className="da-muted"> / {expected.length}</span></span>
          <span className="da-muted da-sm">{left.length === 0 ? t('allScanned') : t('scannedOf', { n: st.scanned.length, total: expected.length })}</span>
        </div>
        <div className="da-progress inline" aria-hidden><span style={{ width: `${(st.scanned.length / expected.length) * 100}%` }} /></div>

        <form className="da-manual" onSubmit={(e) => { e.preventDefault(); read(manual); setManual('') }}>
          <Input value={manual} onChange={(e) => setManual(e.target.value)} placeholder={t('typeCarton')} aria-label={t('typeCarton')} inputMode="numeric" />
          <Button type="submit" variant="secondary">{t('add')}</Button>
        </form>

        {stop.transfers.filter((no) => expected.some((c) => c.transfer === no)).map((no) => {
          const list = expected.filter((c) => c.transfer === no)
          return (
          <Section key={no} title={no} aside={<span className="da-sm da-muted num">{list.filter((c) => st.scanned.includes(c.id)).length} / {list.length}</span>}>
            <ul className="da-cartons">
              {list.map((c) => {
                const ok = st.scanned.includes(c.id)
                const dmg = st.damaged.includes(c.id)
                return (
                  <li key={c.id} className={cx(ok && 'ok', dmg && 'dmg')}>
                    <Glyph name={ok ? 'ok' : 'box'} size={18} />
                    <span className="mono grow">{c.id}</span>
                    <span className="num da-sm da-muted">{c.kg} kg</span>
                    {dmg
                      ? <Badge tone="danger">{t('damaged')}</Badge>
                      : ok
                        ? <Button variant="ghost" size="sm" onClick={() => { setDamage(c.id); setPhoto(false) }}>{t('markDamaged')}</Button>
                        : <span className="da-sm da-faint">{t('notScanned')}</span>}
                  </li>
                )
              })}
            </ul>
          </Section>
          )
        })}
      </Body>
      <Footer>
        {left.length > 0 && <Big icon={s.bt ? 'bluetooth' : 'scan'} onClick={() => read(left[0]!.id)}>{t('scan')}</Big>}
        <Big
          variant={left.length > 0 ? 'secondary' : 'primary'}
          icon={left.length > 0 ? undefined : 'arrow-right'}
          onClick={onNext}
        >{left.length > 0 ? t('continueMissing', { n: left.length }) : t('continue')}</Big>
      </Footer>

      <PhoneSheet
        open={damage != null} title={t('damageTitle', { id: damage ?? '' })} onClose={() => setDamage(null)}
        footer={
          <Big
            variant="danger" blocked={!photo}
            onClick={() => { dispatch({ type: 'damage', id: stop.id, carton: damage! }); setDamage(null) }}
          >{photo ? t('confirmDamage') : t('photoNeeded')}</Big>
        }
      >
        <p className="da-muted">{t('damageNote')}</p>
        <PhotoCapture taken={photo} onTake={setPhoto} />
      </PhoneSheet>
    </>
  )
}

/* ---------------- check against the list ---------------- */

function CheckStep({ stop, onNext }: { stop: PlannedStop; onNext: () => void }) {
  const { s, t, dispatch } = useDriver()
  const st = s.stops[stop.id]!
  const expected = expectedCartons(s, stop)
  const missing = expected.filter((c) => !st.scanned.includes(c.id)).map((c) => c.id)
  const clean = missing.length === 0 && st.damaged.length === 0
  return (
    <>
      <Body>
        <div className="da-stats three">
          <div className="da-stat"><span className="da-stat-v num">{expected.length}</span><span className="da-stat-l">{t('expected')}</span></div>
          <div className="da-stat"><span className="da-stat-v num">{st.scanned.length}</span><span className="da-stat-l">{t('scanned')}</span></div>
          <div className={cx('da-stat', missing.length > 0 && 'bad')}><span className="da-stat-v num">{missing.length}</span><span className="da-stat-l">{t('missing')}</span></div>
        </div>
        {clean
          ? <div className="da-alert ok"><Glyph name="ok" size={18} /><span>{t('checkAllGood')}</span></div>
          : (
            <>
              {missing.length > 0 && (
                <Section title={t('missing')}>
                  <ul className="da-cartons">{missing.map((c) => <li key={c} className="miss"><Glyph name="err" size={18} /><span className="mono grow">{c}</span><Badge tone="danger">{t('eMissing')}</Badge></li>)}</ul>
                </Section>
              )}
              {st.damaged.length > 0 && (
                <Section title={t('damaged')}>
                  <ul className="da-cartons">{st.damaged.map((c) => <li key={c} className="dmg"><Glyph name="alert" size={18} /><span className="mono grow">{c}</span><Badge tone="danger">{t('damaged')}</Badge></li>)}</ul>
                </Section>
              )}
              <div className="da-alert warn"><Glyph name="info" size={18} /><span>{t('checkReport')}</span></div>
            </>
          )}
      </Body>
      <Footer>
        <Big icon="check" onClick={() => {
          if (!clean) dispatch({ type: 'discrepancy', id: stop.id, missing, damaged: st.damaged })
          onNext()
        }}>{t('confirmContinue')}</Big>
      </Footer>
    </>
  )
}

/* ---------------- seals ---------------- */

function SealStep({ stop, onNext }: { stop: PlannedStop; onNext: () => void }) {
  const { t, dispatch } = useDriver()
  const [seals, setSeals] = useState<Record<string, 'intact' | 'broken'>>({})
  const [photos, setPhotos] = useState<Record<string, boolean>>({})
  const ready = stop.transfers.every((no) => seals[no] === 'intact' || (seals[no] === 'broken' && photos[no]))
  return (
    <>
      <Body>
        {stop.transfers.map((no) => {
          const tf = transferByNo(no)
          return (
            <section key={no} className="da-card da-seal">
              <div className="da-row">
                <Glyph name="seal" size={20} />
                <span className="grow"><b>{t('sealOf', { no })}</b><br /><span className="da-sm da-muted">{t('expectedSeal', { seal: '' })}<span className="mono">{tf.seal}</span></span></span>
              </div>
              <div className="da-two">
                <button type="button" className={cx('da-choice', seals[no] === 'intact' && 'on ok')} aria-pressed={seals[no] === 'intact'} onClick={() => setSeals({ ...seals, [no]: 'intact' })}>
                  <Glyph name="ok" size={20} />{t('intact')}
                </button>
                <button type="button" className={cx('da-choice', seals[no] === 'broken' && 'on bad')} aria-pressed={seals[no] === 'broken'} onClick={() => setSeals({ ...seals, [no]: 'broken' })}>
                  <Glyph name="alert" size={20} />{t('broken')}
                </button>
              </div>
              {seals[no] === 'broken' && <PhotoCapture taken={!!photos[no]} onTake={(v) => setPhotos({ ...photos, [no]: v })} />}
            </section>
          )
        })}
      </Body>
      <Footer reason={ready ? null : t('sealsBlocked')}>
        <Big icon="arrow-right" blocked={!ready} onClick={() => { dispatch({ type: 'seals', id: stop.id, seals }); onNext() }}>{t('continue')}</Big>
      </Footer>
    </>
  )
}

/* ---------------- signature / photo POD ---------------- */

function SignStep({ stop }: { stop: PlannedStop }) {
  const { s, t, x, dispatch } = useDriver()
  const st = s.stops[stop.id]!
  const [signer, setSigner] = useState('')
  const [signature, setSignature] = useState<string | null>(null)
  const [photoMode, setPhotoMode] = useState(false)
  const [photo, setPhoto] = useState(false)
  const ready = signer.trim().length > 1 && (photoMode ? photo : !!signature)
  const title = stop.type === 'pickup' ? t('signTitlePickup') : stop.type === 'delivery' ? t('signTitleDelivery') : t('signTitleCross')
  const confirm = stop.type === 'pickup' ? t('confirmPickup') : stop.type === 'delivery' ? t('confirmDelivery') : t('confirmCross')
  const contact = x(stop.location.contact.name).replace(/\s*\(.*\)$/, '')

  return (
    <>
      <Body>
        <h2 className="da-h2">{title}</h2>
        <p className="da-muted da-sm">{t('proofLine', { n: st.scanned.length, time: hhmm(s.clock), gps: '' })}<span className="mono">{stop.location.gps.map((v) => v.toFixed(4)).join(', ')}</span></p>

        <label className="da-label" htmlFor="da-signer">{t('signer')}</label>
        <Input id="da-signer" value={signer} onChange={(e) => setSigner(e.target.value)} autoComplete="off" />
        {!signer && (
          <button type="button" className="chip da-suggest" onClick={() => setSigner(contact)}>
            <Glyph name="user" size={14} />{contact}
          </button>
        )}

        {photoMode
          ? <PhotoCapture taken={photo} onTake={setPhoto} />
          : <SignaturePad onChange={setSignature} />}

        <Button variant="link" onClick={() => { setPhotoMode(!photoMode); setPhoto(false); setSignature(null) }}>
          {photoMode ? t('useSignature') : t('noSignature')}
        </Button>
      </Body>
      <Footer reason={ready ? null : t('signBlocked')}>
        <Big
          icon="check" blocked={!ready}
          onClick={() => dispatch({ type: 'complete', id: stop.id, signer: signer.trim(), signature: signature ?? undefined, photo: photoMode })}
        >{confirm}</Big>
      </Footer>
    </>
  )
}
