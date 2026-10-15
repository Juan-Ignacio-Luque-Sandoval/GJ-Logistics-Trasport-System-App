import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import {
  RULES, ROUTE, STOPS, cartonsOf, fixNear, stopMinutes,
  type Lang, type PlannedStop, type Text,
} from './data'
import { both, tr, type Key, type Params } from './i18n'

/* ---------------- state ---------------- */

export type StopStatus = 'pending' | 'arrived' | 'completed' | 'failed'
export type FailReason = 'closed' | 'refused' | 'address' | 'other'
export type NextStep = 'retry' | 'return' | 'call'
export type ExceptionReason = 'delay' | 'breakdown' | 'damaged' | 'missing' | 'closed' | 'refused' | 'seal' | 'other'

export interface Stamp { at: number; gps: string; what: Text }

export interface StopState {
  status: StopStatus
  arrivedAt?: number
  doneAt?: number
  scanned: string[]
  damaged: string[]
  /** Transfer → seal verdict, for pickups and cross-dock loads. */
  seals: Record<string, 'intact' | 'broken'>
  proof?: { signer: string; signature?: string; photo: boolean; at: number; gps: string }
  failure?: { reason: FailReason; next: NextStep; note: string; at: number; gps: string }
  trail: Stamp[]
}

export interface Exception {
  id: string
  stopId?: string
  reason: ExceptionReason
  comment: string
  photo: boolean
  at: number
  owner: Text
  deadline: number
}

export interface QueueItem { id: number; what: Text; at: number }

export type Screen =
  | { name: 'today' }
  | { name: 'consent' }
  | { name: 'stops' }
  | { name: 'stop'; id: string }
  | { name: 'flow'; id: string }
  | { name: 'fail'; id: string }
  | { name: 'report'; stopId?: string }
  | { name: 'issues' }
  | { name: 'close' }
  | { name: 'closed' }
  | { name: 'more' }

export interface State {
  lang: Lang
  signedIn: boolean
  consentAt: number | null
  route: 'released' | 'started' | 'completed' | 'closed'
  /** The simulated clock of the demo day, minutes after midnight. */
  clock: number
  /** Extra minutes on the next leg (traffic, a reported delay). Spent on arrival. */
  traffic: number
  stops: Record<string, StopState>
  exceptions: Exception[]
  online: boolean
  queue: QueueItem[]
  synced: QueueItem[]
  lastSync: number | null
  bt: boolean
  screen: Screen
  history: Screen[]
  snack: { id: number; text: Text; tone: 'ok' | 'err' | 'info' } | null
}

const freshStops = () =>
  Object.fromEntries(STOPS.map((s) => [s.id, { status: 'pending', scanned: [], damaged: [], seals: {}, trail: [] } as StopState]))

export const initialState = (lang: Lang = 'en'): State => ({
  lang,
  signedIn: false,
  consentAt: null,
  route: 'released',
  clock: 7 * 60 + 52,
  traffic: 0,
  stops: freshStops(),
  exceptions: [],
  online: true,
  queue: [],
  synced: [],
  lastSync: 7 * 60 + 40,
  bt: false,
  screen: { name: 'today' },
  history: [],
  snack: null,
})

/* ---------------- actions ---------------- */

export type Action =
  | { type: 'signIn' }
  | { type: 'signOut' }
  | { type: 'lang'; lang: Lang }
  | { type: 'go'; screen: Screen; replace?: boolean }
  | { type: 'tab'; screen: Screen }
  | { type: 'back' }
  | { type: 'startRoute' }
  | { type: 'arrive'; id: string }
  | { type: 'scan'; id: string; carton: string }
  | { type: 'damage'; id: string; carton: string }
  | { type: 'seals'; id: string; seals: Record<string, 'intact' | 'broken'> }
  | { type: 'discrepancy'; id: string; missing: string[]; damaged: string[] }
  | { type: 'complete'; id: string; signer: string; signature?: string; photo: boolean }
  | { type: 'fail'; id: string; reason: FailReason; next: NextStep; note: string }
  | { type: 'report'; stopId?: string; reason: ExceptionReason; comment: string; photo: boolean; delay?: number }
  | { type: 'closeRoute' }
  | { type: 'online'; online: boolean }
  | { type: 'bt'; on: boolean }
  | { type: 'traffic'; minutes: number }
  | { type: 'synced' }
  | { type: 'snack'; text: Text; tone?: 'ok' | 'err' | 'info' }
  | { type: 'unsnack'; id: number }
  | { type: 'fastForward' }
  | { type: 'reset' }

const stopById = (id: string) => STOPS.find((s) => s.id === id)!
let seq = 0

function gpsAt(stop: PlannedStop | undefined, salt: number) {
  return stop ? fixNear(stop.location.gps, salt) : '55.90000, 37.43000'
}

/** Writes a status record: on the stop's trail (§ 7) and into the sync queue (§ 4.5 offline). */
function record(s: State, what: Text, stopId?: string): State {
  const stop = stopId ? stopById(stopId) : undefined
  const at = s.clock
  const item: QueueItem = { id: ++seq, what, at }
  let stops = s.stops
  if (stopId) {
    const st = s.stops[stopId]!
    stops = { ...s.stops, [stopId]: { ...st, trail: [...st.trail, { at, gps: gpsAt(stop, seq), what }] } }
  }
  return { ...s, stops, queue: [...s.queue, item] }
}

const patchStop = (s: State, id: string, patch: Partial<StopState>): State =>
  ({ ...s, stops: { ...s.stops, [id]: { ...s.stops[id]!, ...patch } } })

const snack = (s: State, key: Key, p?: Params, tone: 'ok' | 'err' | 'info' = 'ok'): State =>
  ({ ...s, snack: { id: ++seq, text: both(key, p), tone } })

/** § 4.8: each exception notifies the right person and gets a deadline. */
function ownerFor(reason: ExceptionReason): { owner: Text; minutes: number } {
  const ct = both('controlTower')
  switch (reason) {
    case 'breakdown': case 'closed': case 'refused':
      return { owner: { en: `Dispatcher · Irina Volkova`, ru: `Диспетчер · Ирина Волкова` }, minutes: 30 }
    case 'damaged': case 'missing': case 'seal':
      return { owner: { en: `${ct.en} + sending store`, ru: `${ct.ru} + магазин-отправитель` }, minutes: 240 }
    default:
      return { owner: ct, minutes: 60 }
  }
}

export const reasonKey: Record<ExceptionReason, Key> = {
  delay: 'eDelay', breakdown: 'eBreakdown', damaged: 'eDamaged', missing: 'eMissing',
  closed: 'eClosed', refused: 'eRefused', seal: 'eSeal', other: 'eOther',
}
export const failKey: Record<FailReason, Key> = { closed: 'rClosed', refused: 'rRefused', address: 'rAddress', other: 'rOther' }
export const nextKey: Record<NextStep, Key> = { retry: 'nRetry', return: 'nReturn', call: 'nCall' }

function addException(s: State, e: Omit<Exception, 'id' | 'at' | 'owner' | 'deadline'>): State {
  const { owner, minutes } = ownerFor(e.reason)
  const ex: Exception = { ...e, id: `EX-${1040 + s.exceptions.length + 1}`, at: s.clock, owner, deadline: s.clock + minutes }
  const next = { ...s, exceptions: [...s.exceptions, ex] }
  return record(next, both('evException', { reason: both(reasonKey[e.reason]) }), e.stopId)
}

function completeAll(s: State, id: string): State {
  // Used by the demo fast-forward: a clean, on-time stop.
  const stop = stopById(id)
  const cartons = cartonsOf(stop.transfers)
  const at = Math.max(s.clock, etaOf(s, id))
  let n: State = { ...s, clock: at, traffic: 0 }
  n = patchStop(n, id, { status: 'arrived', arrivedAt: at })
  n = record(n, both('evArrived', { n: stop.seq }), id)
  n = patchStop(n, id, {
    scanned: cartons.map((c) => c.id),
    seals: stop.type === 'delivery' ? {} : Object.fromEntries(stop.transfers.map((t) => [t, 'intact' as const])),
  })
  const done = at + stopMinutes(cartons.length)
  n = { ...n, clock: done }
  n = patchStop(n, id, {
    status: 'completed', doneAt: done,
    proof: { signer: stop.location.contact.name.en, photo: false, signature: undefined, at: done, gps: gpsAt(stop, 3) },
  })
  return record(n, both('evDone', { n: stop.seq }), id)
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'signIn': return { ...s, signedIn: true, screen: { name: 'today' }, history: [] }
    case 'signOut': return { ...s, signedIn: false }
    case 'lang': return { ...s, lang: a.lang }
    case 'go':
      return { ...s, screen: a.screen, history: a.replace ? s.history : [...s.history, s.screen] }
    case 'tab': return { ...s, screen: a.screen, history: [] }
    case 'back': {
      const history = [...s.history]
      const prev = history.pop()
      return prev ? { ...s, screen: prev, history } : s
    }
    case 'startRoute': {
      let n: State = { ...s, route: 'started', consentAt: s.consentAt ?? s.clock, clock: Math.max(s.clock, ROUTE.start) }
      n = record(n, both('evStarted'))
      return { ...n, screen: { name: 'stops' }, history: [{ name: 'today' }] }
    }
    case 'arrive': {
      const stop = stopById(a.id)
      const at = Math.max(s.clock, etaOf(s, a.id))
      let n = patchStop({ ...s, clock: at, traffic: 0 }, a.id, { status: 'arrived', arrivedAt: at })
      n = record(n, both('evArrived', { n: stop.seq }), a.id)
      return { ...n, screen: { name: 'flow', id: a.id }, history: [...s.history, s.screen] }
    }
    case 'scan': {
      const st = s.stops[a.id]!
      const n = patchStop(s, a.id, { scanned: [...st.scanned, a.carton] })
      return snack(record(n, both('evScan', { id: a.carton, n: stopById(a.id).seq })), 'scannedOk', { id: a.carton })
    }
    case 'damage': {
      const st = s.stops[a.id]!
      const n = patchStop(s, a.id, { damaged: [...st.damaged, a.carton] })
      return record(n, both('evDamage', { id: a.carton }), a.id)
    }
    case 'seals': {
      let n = patchStop(s, a.id, { seals: a.seals })
      n = record(n, both('evSeal', { n: stopById(a.id).seq }), a.id)
      const broken = Object.entries(a.seals).filter(([, v]) => v === 'broken').map(([k]) => k)
      if (broken.length) n = addException(n, { stopId: a.id, reason: 'seal', comment: broken.join(', '), photo: true })
      return n
    }
    case 'discrepancy': {
      let n = s
      if (a.missing.length) n = addException(n, { stopId: a.id, reason: 'missing', comment: a.missing.join(', '), photo: false })
      if (a.damaged.length) n = addException(n, { stopId: a.id, reason: 'damaged', comment: a.damaged.join(', '), photo: true })
      return n
    }
    case 'complete': {
      const stop = stopById(a.id)
      const st = s.stops[a.id]!
      const done = Math.max(s.clock, (st.arrivedAt ?? s.clock) + stopMinutes(st.scanned.length))
      let n: State = { ...s, clock: done }
      n = patchStop(n, a.id, {
        proof: { signer: a.signer, signature: a.signature, photo: a.photo, at: done, gps: gpsAt(stop, 5) },
      })
      n = record(n, both('evProof', { n: stop.seq, kind: both(a.photo ? 'kindPhoto' : 'kindSignature') }), a.id)
      n = patchStop(n, a.id, { status: 'completed', doneAt: done })
      n = record(n, both('evDone', { n: stop.seq }), a.id)
      n = finishIfLast(n)
      return snack({ ...n, screen: { name: 'stops' }, history: [{ name: 'today' }] }, 'stopCompleted', { n: stop.seq })
    }
    case 'fail': {
      const stop = stopById(a.id)
      const st = s.stops[a.id]!
      const at = Math.max(s.clock, st.arrivedAt ?? etaOf(s, a.id)) + 10
      let n: State = { ...s, clock: at, traffic: 0 }
      n = patchStop(n, a.id, {
        status: 'failed', arrivedAt: st.arrivedAt ?? at - 10, doneAt: at,
        failure: { reason: a.reason, next: a.next, note: a.note, at, gps: gpsAt(stop, 7) },
      })
      n = record(n, both('evFailed', { n: stop.seq, reason: both(failKey[a.reason]) }), a.id)
      const exReason: ExceptionReason = a.reason === 'closed' ? 'closed' : a.reason === 'refused' ? 'refused' : 'other'
      n = addException(n, { stopId: a.id, reason: exReason, comment: a.note, photo: true })
      n = finishIfLast(n)
      return snack({ ...n, screen: { name: 'stops' }, history: [{ name: 'today' }] }, 'stopFailed', { n: stop.seq }, 'info')
    }
    case 'report': {
      let n = addException(s, { stopId: a.stopId, reason: a.reason, comment: a.comment, photo: a.photo })
      if (a.delay) n = { ...n, traffic: n.traffic + a.delay }
      const ex = n.exceptions[n.exceptions.length - 1]!
      n = { ...n, screen: n.history[n.history.length - 1] ?? { name: 'stops' }, history: n.history.slice(0, -1) }
      return snack(n, 'reportSent', { owner: ex.owner })
    }
    case 'closeRoute': {
      const n = record({ ...s, route: 'closed' }, both('evClosed'))
      return { ...n, screen: { name: 'closed' }, history: [] }
    }
    case 'online': return { ...s, online: a.online }
    case 'bt': return { ...s, bt: a.on }
    case 'traffic': return { ...s, traffic: s.traffic + a.minutes }
    case 'synced': return { ...s, synced: [...s.queue.slice().reverse(), ...s.synced].slice(0, 60), queue: [], lastSync: s.clock }
    case 'snack': return { ...s, snack: { id: ++seq, text: a.text, tone: a.tone ?? 'info' } }
    case 'unsnack': return s.snack?.id === a.id ? { ...s, snack: null } : s
    case 'fastForward': {
      let n: State = s.route === 'released' ? reducer({ ...s, signedIn: true }, { type: 'startRoute' }) : { ...s, signedIn: true }
      for (const stop of STOPS.slice(0, 4)) if (n.stops[stop.id]!.status === 'pending') n = completeAll(n, stop.id)
      return { ...n, screen: { name: 'stops' }, history: [{ name: 'today' }], snack: null }
    }
    case 'reset': return initialState(s.lang)
  }
}

function finishIfLast(s: State): State {
  const open = STOPS.some((x) => ['pending', 'arrived'].includes(s.stops[x.id]!.status))
  return open ? s : { ...s, route: 'completed' }
}

/* ---------------- derived: ETA and delay (§ 4.6, § 5) ---------------- */

/** ETA of every open stop: the clock, plus driving time, the traffic on the next leg and stop times. */
export function etas(s: State): Record<string, number> {
  const out: Record<string, number> = {}
  let cursor = s.route === 'released' ? ROUTE.start : s.clock
  let traffic = s.traffic
  for (const stop of STOPS) {
    const st = s.stops[stop.id]!
    const n = cartonsOf(stop.transfers).length
    if (st.status === 'completed' || st.status === 'failed') { cursor = Math.max(cursor, st.doneAt ?? cursor); continue }
    if (st.status === 'arrived') { out[stop.id] = st.arrivedAt!; cursor = Math.max(s.clock, st.arrivedAt! + stopMinutes(n)); continue }
    const eta = cursor + stop.drive + traffic
    traffic = 0
    out[stop.id] = eta
    cursor = eta + stopMinutes(n)
  }
  return out
}
export const etaOf = (s: State, id: string) => etas(s)[id] ?? s.clock

/** § 5: ETA later than the end of the window, or more than N minutes behind plan. */
export function delayOf(stop: PlannedStop, eta: number | undefined) {
  if (eta == null) return null
  const behind = Math.round(eta - stop.planned)
  const afterWindow = eta > stop.window[1]
  return afterWindow || behind > RULES.delayAlertMin ? { behind, afterWindow } : null
}

/**
 * What should be scanned at a stop. A delivery expects what was actually loaded: cartons scanned at
 * their pickup, nothing from a failed pickup, and the full list while the pickup is still ahead.
 */
export function expectedCartons(s: State, stop: PlannedStop) {
  const all = cartonsOf(stop.transfers)
  if (stop.type !== 'delivery') return all
  return all.filter((c) => {
    const from = STOPS.find((x) => x.type !== 'delivery' && x.transfers.includes(c.transfer))
    if (!from) return true
    const st = s.stops[from.id]!
    if (st.status === 'failed') return false
    return st.status === 'completed' ? st.scanned.includes(c.id) : true
  })
}

/** The stop the driver should work on now: the arrived one, else the first pending. */
export function currentStop(s: State) {
  return STOPS.find((x) => s.stops[x.id]!.status === 'arrived') ?? STOPS.find((x) => s.stops[x.id]!.status === 'pending')
}

/* ---------------- context ---------------- */

interface Ctx {
  s: State
  dispatch: Dispatch<Action>
  t: (key: Key, p?: Params) => string
  x: (text: Text) => string
}
const StoreContext = createContext<Ctx | null>(null)

export function DriverStore({ children }: { children: ReactNode }) {
  const [s, dispatch] = useReducer(reducer, undefined, () => initialState())

  // § 4.5: queued records leave as soon as there is a connection.
  useEffect(() => {
    if (!s.online || s.queue.length === 0) return
    const h = window.setTimeout(() => dispatch({ type: 'synced' }), 1400)
    return () => window.clearTimeout(h)
  }, [s.online, s.queue.length])

  useEffect(() => {
    if (!s.snack) return
    const id = s.snack.id
    const h = window.setTimeout(() => dispatch({ type: 'unsnack', id }), s.snack.tone === 'err' ? 5000 : 2600)
    return () => window.clearTimeout(h)
  }, [s.snack])

  const value = useMemo<Ctx>(() => ({
    s,
    dispatch,
    t: (key, p) => tr(s.lang, key, p),
    x: (text) => text[s.lang],
  }), [s])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useDriver() {
  const c = useContext(StoreContext)
  if (!c) throw new Error('useDriver must be used inside <DriverStore>')
  return c
}
