/**
 * Sample data for one driver's day in the pilot region (Technical Sheet § 13: one region, ~5 stores,
 * 2–3 drivers). Times are minutes after midnight. Nothing here is real: names, phones, plates and
 * seal numbers are made up.
 */

export type Lang = 'en' | 'ru'
export type Text = Record<Lang, string>

export type StopType = 'pickup' | 'delivery' | 'crossdock'

export interface Location {
  id: string
  name: string
  kind: 'store' | 'crossdock'
  address: Text
  gps: [number, number]
  hours: string
  contact: { name: Text; phone: string }
  dock: Text
}

export interface Carton {
  id: string
  transfer: string
  kg: number
  m3: number
}

export interface Transfer {
  no: string
  from: string
  to: string
  seal: string
  priority: 'normal' | 'urgent'
  handling?: Text
}

export interface PlannedStop {
  id: string
  seq: number
  type: StopType
  location: Location
  /** Delivery or pickup window [from, to]. */
  window: [number, number]
  /** Planned arrival, the baseline the delay rule compares against (§ 5). */
  planned: number
  /** Driving minutes from the previous stop (from the depot for the first). */
  drive: number
  km: number
  /** Transfers loaded (pickup, cross-dock) or unloaded (delivery) here. */
  transfers: string[]
}

export const RULES = {
  /** § 5 Stop time = fixed time per stop + time per carton × number of cartons. */
  stopFixedMin: 10,
  stopPerCartonMin: 0.5,
  /** § 5 Delay alert: ETA after the window end, or more than this many minutes behind plan. */
  delayAlertMin: 20,
  /** § 4.6 GPS position every 1 to 5 minutes while on route. */
  gpsEveryMin: 2,
}

export const DRIVER = {
  id: 'D-0417',
  name: 'Alexey Smirnov',
  nameRu: 'Алексей Смирнов',
  phone: '+7 900 555-04-17',
  carrier: { en: 'Own fleet', ru: 'Собственный парк' } satisfies Text,
  licence: '77 21 555417 · valid to 03.2029',
}

export const DISPATCHER = { name: { en: 'Irina Volkova', ru: 'Ирина Волкова' } satisfies Text, phone: '+7 495 555-20-00' }

export const VEHICLE = {
  id: 'V-12',
  type: { en: 'GAZelle Next van', ru: 'Фургон ГАЗель Next' } satisfies Text,
  plate: 'А 417 КМ 799',
  m3: 16,
  kg: 1500,
}

export const ROUTE = {
  id: 'R-1015-MSK-03',
  date: '15.10.2026',
  region: { en: 'Moscow north-west', ru: 'Москва, северо-запад' } satisfies Text,
  /** Planned departure from the depot. */
  start: 8 * 60 + 5,
  depot: { en: 'Khimki cross-dock (depot)', ru: 'Кросс-док Химки (база)' } satisfies Text,
}

const L = {
  aviapark: {
    id: 'S-112', name: 'GJ Aviapark', kind: 'store',
    address: { en: 'Khodynsky Blvd 4, Moscow', ru: 'Ходынский бульвар, 4, Москва' },
    gps: [55.7905, 37.5309], hours: '08:00–22:00',
    contact: { name: { en: 'Marina Belova', ru: 'Марина Белова' }, phone: '+7 495 555-01-12' },
    dock: { en: 'Service yard B, gate 3. Height limit 2.6 m. Ring the bell at the goods lift.', ru: 'Служебный двор B, ворота 3. Ограничение высоты 2,6 м. Звонок у грузового лифта.' },
  },
  atrium: {
    id: 'S-104', name: 'GJ Atrium', kind: 'store',
    address: { en: 'Zemlyanoy Val 33, Moscow', ru: 'Земляной Вал, 33, Москва' },
    gps: [55.757, 37.659], hours: '08:00–22:00',
    contact: { name: { en: 'Oleg Frolov', ru: 'Олег Фролов' }, phone: '+7 495 555-01-04' },
    dock: { en: 'Loading bay −1 from Kazakova St. Pass ordered at the security desk.', ru: 'Разгрузка на −1 с ул. Казакова. Пропуск заказан на посту охраны.' },
  },
  evropeisky: {
    id: 'S-131', name: 'GJ Evropeisky', kind: 'store',
    address: { en: 'Kiyevskogo Vokzala Sq 2, Moscow', ru: 'пл. Киевского Вокзала, 2, Москва' },
    gps: [55.7447, 37.566], hours: '08:00–22:00',
    contact: { name: { en: 'Yulia Popova', ru: 'Юлия Попова' }, phone: '+7 495 555-01-31' },
    dock: { en: 'Dock 7, 2nd underground level. Unloading slots of 20 min.', ru: 'Док 7, второй подземный уровень. Слоты разгрузки по 20 мин.' },
  },
  khimkiCd: {
    id: 'X-01', name: 'Khimki cross-dock', kind: 'crossdock',
    address: { en: 'Leningradskoe Hwy, 25 km, Khimki', ru: 'Ленинградское шоссе, 25 км, Химки' },
    gps: [55.9, 37.43], hours: '06:00–23:00',
    contact: { name: { en: 'Pavel Egorov (shift lead)', ru: 'Павел Егоров (начальник смены)' }, phone: '+7 495 555-30-01' },
    dock: { en: 'Gates 4–6 for vans. Outbound wave closes 12:30.', ru: 'Ворота 4–6 для фургонов. Отгрузочная волна закрывается в 12:30.' },
  },
  megaKhimki: {
    id: 'S-158', name: 'GJ Mega Khimki', kind: 'store',
    address: { en: 'Mega Khimki, 8th microdistrict, Khimki', ru: 'МЕГА Химки, 8-й микрорайон, Химки' },
    gps: [55.911, 37.397], hours: '08:00–23:00',
    contact: { name: { en: 'Artem Lebedev', ru: 'Артём Лебедев' }, phone: '+7 495 555-01-58' },
    dock: { en: 'Goods yard north side, ramp 12. Report to the mall dispatcher first.', ru: 'Хоздвор с северной стороны, рампа 12. Сначала к диспетчеру ТЦ.' },
  },
  zelenograd: {
    id: 'S-173', name: 'GJ Zelenograd', kind: 'store',
    address: { en: 'Panfilovsky Ave 6, Zelenograd', ru: 'Панфиловский пр-т, 6, Зеленоград' },
    gps: [55.989, 37.212], hours: '09:00–21:00',
    contact: { name: { en: 'Nina Sorokina', ru: 'Нина Сорокина' }, phone: '+7 499 555-01-73' },
    dock: { en: 'Rear entrance, no ramp: hand trolley needed.', ru: 'Задний вход, рампы нет: нужна тележка.' },
  },
} satisfies Record<string, Location>

export const TRANSFERS: Transfer[] = [
  { no: 'TR-48211', from: 'GJ Aviapark', to: 'GJ Evropeisky', seal: '7731204', priority: 'normal' },
  { no: 'TR-48212', from: 'GJ Aviapark', to: 'GJ Mega Khimki', seal: '7731205', priority: 'urgent', handling: { en: 'Window display items, keep upright', ru: 'Витринные товары, не кантовать' } },
  { no: 'TR-48220', from: 'GJ Atrium', to: 'GJ Mega Khimki', seal: '7731211', priority: 'normal' },
  { no: 'TR-48241', from: 'Khimki cross-dock', to: 'GJ Zelenograd', seal: '7731230', priority: 'normal' },
]

const COUNTS: Record<string, number> = { 'TR-48211': 7, 'TR-48212': 5, 'TR-48220': 8, 'TR-48241': 6 }

export const CARTONS: Carton[] = Object.entries(COUNTS).flatMap(([transfer, n]) =>
  Array.from({ length: n }, (_, i) => ({
    id: `${transfer.slice(3)}-${String(i + 1).padStart(2, '0')}`,
    transfer,
    kg: 6 + ((i * 7 + Number(transfer.slice(-2))) % 9),
    m3: 0.06 + ((i * 3) % 4) / 100,
  })),
)

const t = (h: number, m = 0) => h * 60 + m

export const STOPS: PlannedStop[] = [
  { id: 'ST-1', seq: 1, type: 'pickup', location: L.aviapark, window: [t(8, 30), t(9, 30)], planned: t(8, 30), drive: 25, km: 17, transfers: ['TR-48211', 'TR-48212'] },
  { id: 'ST-2', seq: 2, type: 'pickup', location: L.atrium, window: [t(9, 0), t(10, 0)], planned: t(9, 16), drive: 30, km: 12, transfers: ['TR-48220'] },
  { id: 'ST-3', seq: 3, type: 'delivery', location: L.evropeisky, window: [t(10, 0), t(12, 0)], planned: t(9, 55), drive: 25, km: 9, transfers: ['TR-48211'] },
  { id: 'ST-4', seq: 4, type: 'crossdock', location: L.khimkiCd, window: [t(10, 30), t(12, 30)], planned: t(10, 54), drive: 45, km: 27, transfers: ['TR-48241'] },
  { id: 'ST-5', seq: 5, type: 'delivery', location: L.megaKhimki, window: [t(11, 0), t(14, 0)], planned: t(11, 22), drive: 15, km: 6, transfers: ['TR-48212', 'TR-48220'] },
  { id: 'ST-6', seq: 6, type: 'delivery', location: L.zelenograd, window: [t(12, 0), t(13, 0)], planned: t(12, 19), drive: 40, km: 24, transfers: ['TR-48241'] },
]

export const transferByNo = (no: string) => TRANSFERS.find((x) => x.no === no)!
export const cartonsOf = (transfers: string[]) => CARTONS.filter((c) => transfers.includes(c.transfer))
export const stopMinutes = (cartons: number) => RULES.stopFixedMin + RULES.stopPerCartonMin * cartons

export const hhmm = (min: number) => {
  const m = Math.round(min)
  return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

/** A believable GPS fix near a location, for proof and status stamps (§ 6 Proof, § 7). */
export const fixNear = ([lat, lon]: [number, number], salt = 0) =>
  `${(lat + ((salt * 37) % 9) / 10000).toFixed(5)}, ${(lon + ((salt * 53) % 9) / 10000).toFixed(5)}`
