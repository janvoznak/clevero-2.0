import { MOCK_CATEGORIES, MOCK_TOURS, TOURS_NOW, tour } from './mockTours'
import { LANGS } from './types'
import type { LangCode } from './types'

/* ============================================================
   Podmodul „Statistiky" (Prohlídky) — prodej vstupenek.

   Data jsou MOCK. V ostrém provozu je dodá Colosseum přes API
   (prodeje po dnech, typ vstupenky, jazyková mutace, kanál).
   V adminu se nic nepočítá do zdroje — statistiky jsou READ-ONLY
   projekce téhož zdroje jako podmodul Vstupenky.

   Generátor je deterministický (seedovaný LCG) — čísla jsou při
   každém načtení stejná, aby prototyp nemátl skákajícími grafy.
   ============================================================ */

/** „Dnešek" statistik — stejný referenční čas jako zbytek modulu Prohlídky. */
export const STATS_NOW = TOURS_NOW

/** Typ vstupenky (skladba z Colossea). */
export type TicketTierKey = 'adult' | 'reduced' | 'family' | 'school' | 'ztp'
export const TIER_META: Record<TicketTierKey, { label: string; price: number }> = {
  adult: { label: 'Dospělí', price: 295 },
  reduced: { label: 'Snížené (děti, studenti, senioři)', price: 195 },
  family: { label: 'Rodinné vstupné', price: 800 },
  school: { label: 'Školní skupiny', price: 170 },
  ztp: { label: 'ZTP/P', price: 150 },
}

/** Prodejní kanál. */
export type SaleChannel = 'online' | 'onsite'
export const CHANNEL_META: Record<SaleChannel, { label: string }> = {
  online: { label: 'Online (e-shop)' },
  onsite: { label: 'Pokladna' },
}

/** Jeden prodej (objednávka jednoho typu vstupenky na jednu prohlídku). */
export interface TourSale {
  id: string
  /** Den prodeje (YYYY-MM-DD). */
  date: string
  tourId: string
  categoryId: string
  /** Jazyková mutace, ve které prodej proběhl (= jazyk prohlídky). */
  lang: LangCode
  tier: TicketTierKey
  channel: SaleChannel
  /** Počet vstupenek v objednávce. */
  count: number
  /** Tržba v Kč. */
  amount: number
}

/* ---------- Deterministický generátor ---------- */
function lcg(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}
/** Vážený výběr z dvojic [hodnota, váha]. */
function pick<T>(rnd: () => number, weighted: [T, number][]): T {
  const total = weighted.reduce((s, w) => s + w[1], 0)
  let r = rnd() * total
  for (const [value, weight] of weighted) {
    r -= weight
    if (r <= 0) return value
  }
  return weighted[weighted.length - 1][0]
}
function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* Popularita prohlídek — vysokopecní okruh táhne, zámek je komorní.
   Prohlídky bez váhy dostanou 1 (rovnoměrný zbytek). */
const TOUR_WEIGHT: Record<string, number> = {
  't-vysokopecni': 10,
  't-bolt-cafe': 7,
  't-farani-dul': 6,
  't-vitkovicke-pece': 4,
  't-cesta-uhli': 3,
  't-kox': 2.5,
  't-vysoka-pec-po-setmeni': 2,
  't-dulni-vlacek': 2,
  't-banske-zachranarstvi': 1.5,
  't-vyslap-vysoka-pec': 1.5,
  't-architektura-dov': 1.2,
  't-farani-stajgr': 1.2,
  't-zamek-promeny': 1,
  't-zamek-obyvatele': 0.8,
}
const TOUR_POOL: [string, number][] = MOCK_TOURS.map((t) => [t.id, TOUR_WEIGHT[t.id] ?? 1])
const LANG_POOL: [LangCode, number][] = [
  ['cs', 70],
  ['en', 15],
  ['pl', 8],
  ['de', 7],
]
const TIER_POOL: [TicketTierKey, number][] = [
  ['adult', 46],
  ['reduced', 27],
  ['family', 13],
  ['school', 9],
  ['ztp', 5],
]
const CHANNEL_POOL: [SaleChannel, number][] = [
  ['online', 66],
  ['onsite', 34],
]

/** Sezónnost — léto a advent táhnou, únor je hluchý (index 0 = leden). */
const MONTH_FACTOR = [0.55, 0.5, 0.7, 0.95, 1.15, 1.35, 1.6, 1.55, 1.2, 1.0, 0.7, 0.9]
/** Den v týdnu (0 = neděle) — víkendy výrazně silnější. */
const WEEKDAY_FACTOR = [1.5, 0.7, 0.75, 0.8, 0.9, 1.15, 1.6]

/** Kolik dnů historie prototyp drží — dva roky, aby i „posledních 12 měsíců"
    mělo s čím srovnávat (předchozí stejně dlouhé období). */
const HISTORY_DAYS = 780

function buildSales(): TourSale[] {
  const rnd = lcg(20260728)
  const out: TourSale[] = []
  const start = new Date(STATS_NOW)
  start.setDate(start.getDate() - HISTORY_DAYS + 1)

  for (let i = 0; i < HISTORY_DAYS; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    const date = iso(day)
    const factor = MONTH_FACTOR[day.getMonth()] * WEEKDAY_FACTOR[day.getDay()]
    // Meziroční růst — letošní sezóna je o kus silnější než loňská.
    const growth = 1 + i / HISTORY_DAYS / 3
    const orders = Math.max(2, Math.round((6 + rnd() * 6) * factor * growth))

    for (let o = 0; o < orders; o++) {
      const tourId = pick(rnd, TOUR_POOL)
      const tier = pick(rnd, TIER_POOL)
      const lang = pick(rnd, LANG_POOL)
      const channel = pick(rnd, CHANNEL_POOL)
      const count =
        tier === 'school'
          ? 14 + Math.floor(rnd() * 18)
          : tier === 'family'
            ? 1
            : 1 + Math.floor(rnd() * 4)
      const unit = TIER_META[tier].price
      out.push({
        id: `s-${date}-${o}`,
        date,
        tourId,
        categoryId: tour(tourId)?.categoryId ?? 'cat-dov',
        lang,
        tier,
        channel,
        count,
        amount: unit * count,
      })
    }
  }
  return out
}

/** Kompletní mock historie prodeje (read-only projekce Colossea). */
export const MOCK_SALES: TourSale[] = buildSales()

/* ============================================================
   Filtrování obdobím
   ============================================================ */
export interface RangePreset {
  value: string
  label: string
  /** Délka období ve dnech (od „dneška" zpět). */
  days: number
  /** 'month' = období začne 1. dnem měsíce, aby první měsíc v grafu nebyl osekaný. */
  align?: 'month'
}
export const RANGE_PRESETS: RangePreset[] = [
  { value: '7', label: 'Posledních 7 dní', days: 7 },
  { value: '30', label: 'Posledních 30 dní', days: 30 },
  { value: '90', label: 'Posledních 90 dní', days: 90 },
  { value: '365', label: 'Posledních 12 měsíců', days: 365, align: 'month' },
]
export const DEFAULT_RANGE = '30'

export interface DateRange {
  from: string
  to: string
  days: number
}
function shiftDays(base: Date, delta: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + delta)
  return d
}
const DAY_MS = 86_400_000
/** Období podle presetu (od–do včetně, „do" = dnešek). */
export function rangeOf(preset: string): DateRange {
  const p = RANGE_PRESETS.find((r) => r.value === preset) ?? RANGE_PRESETS[1]
  if (p.align === 'month') {
    // 12 celých měsíců včetně toho letošního — graf pak nezačíná půlkou měsíce.
    const months = Math.round(p.days / 30.4) - 1
    const from = new Date(STATS_NOW.getFullYear(), STATS_NOW.getMonth() - months, 1)
    const days = Math.round((STATS_NOW.getTime() - from.getTime()) / DAY_MS) + 1
    return { from: iso(from), to: iso(STATS_NOW), days }
  }
  return { from: iso(shiftDays(STATS_NOW, -(p.days - 1))), to: iso(STATS_NOW), days: p.days }
}
/** Předchozí stejně dlouhé období (pro srovnání „vs. předchozí období"). */
export function previousRange(r: DateRange): DateRange {
  const from = new Date(r.from)
  return { from: iso(shiftDays(from, -r.days)), to: iso(shiftDays(from, -1)), days: r.days }
}

export interface StatsFilter {
  range: DateRange
  /** 'all' = bez omezení. */
  categoryId: string
  tourId: string
  lang: string
}
export function filterSales(f: StatsFilter, sales: TourSale[] = MOCK_SALES): TourSale[] {
  return sales.filter(
    (s) =>
      s.date >= f.range.from &&
      s.date <= f.range.to &&
      (f.categoryId === 'all' || s.categoryId === f.categoryId) &&
      (f.tourId === 'all' || s.tourId === f.tourId) &&
      (f.lang === 'all' || s.lang === f.lang),
  )
}

/* ============================================================
   Agregace
   ============================================================ */
export interface Totals {
  tickets: number
  revenue: number
  orders: number
}
export function totals(sales: TourSale[]): Totals {
  return sales.reduce<Totals>(
    (acc, s) => ({ tickets: acc.tickets + s.count, revenue: acc.revenue + s.amount, orders: acc.orders + 1 }),
    { tickets: 0, revenue: 0, orders: 0 },
  )
}

export interface Bucket extends Totals {
  key: string
  label: string
}
/** Součty podle libovolného klíče (prohlídka, jazyk, typ vstupenky, kanál…). */
export function groupBy(sales: TourSale[], keyOf: (s: TourSale) => string, labelOf: (key: string) => string): Bucket[] {
  const map = new Map<string, Bucket>()
  for (const s of sales) {
    const key = keyOf(s)
    const b = map.get(key) ?? { key, label: labelOf(key), tickets: 0, revenue: 0, orders: 0 }
    b.tickets += s.count
    b.revenue += s.amount
    b.orders += 1
    map.set(key, b)
  }
  return [...map.values()].sort((a, b) => b.tickets - a.tickets)
}

export function byTour(sales: TourSale[]): Bucket[] {
  return groupBy(sales, (s) => s.tourId, (id) => tour(id)?.title.cs ?? id)
}
export function byCategory(sales: TourSale[]): Bucket[] {
  return groupBy(sales, (s) => s.categoryId, (id) => MOCK_CATEGORIES.find((c) => c.id === id)?.name.cs ?? id)
}
export function byLang(sales: TourSale[]): Bucket[] {
  return groupBy(sales, (s) => s.lang, (code) => LANGS.find((l) => l.code === code)?.labelCs ?? code)
}
export function byTier(sales: TourSale[]): Bucket[] {
  return groupBy(sales, (s) => s.tier, (key) => TIER_META[key as TicketTierKey].label)
}
export function byChannel(sales: TourSale[]): Bucket[] {
  return groupBy(sales, (s) => s.channel, (key) => CHANNEL_META[key as SaleChannel].label)
}

const WEEKDAY_LABELS = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']
/** Prodej podle dne v týdnu (Po → Ne, ne podle objemu). */
export function byWeekday(sales: TourSale[]): Bucket[] {
  const rows = groupBy(sales, (s) => String(new Date(s.date).getDay()), (key) => WEEKDAY_LABELS[Number(key)])
  const order = ['1', '2', '3', '4', '5', '6', '0']
  return order.map((key) => rows.find((r) => r.key === key) ?? { key, label: WEEKDAY_LABELS[Number(key)], tickets: 0, revenue: 0, orders: 0 })
}

/* ---------- Vývoj v čase ---------- */
/** Granularita se volí podle délky období — do 31 dnů po dnech, do 120 po týdnech, dál po měsících. */
export type TrendGrain = 'day' | 'week' | 'month'
export function grainFor(days: number): TrendGrain {
  if (days <= 31) return 'day'
  if (days <= 120) return 'week'
  return 'month'
}
const MONTH_SHORT = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro']
/** Pondělí týdne, do kterého datum spadá. */
function weekStart(d: Date): Date {
  const day = (d.getDay() + 6) % 7
  return shiftDays(d, -day)
}
export interface TrendPoint {
  key: string
  /** Popisek na osu X. */
  label: string
  /** Delší popisek do tooltipu. */
  full: string
  tickets: number
  revenue: number
}
/** Řada pro graf vývoje — včetně prázdných období (žádné díry v ose). */
export function trendSeries(sales: TourSale[], range: DateRange): TrendPoint[] {
  const grain = grainFor(range.days)
  const points = new Map<string, TrendPoint>()

  const from = new Date(range.from)
  const to = new Date(range.to)
  // Předpřipravit všechna období, aby graf neměl díry.
  if (grain === 'day') {
    for (let d = new Date(from); d <= to; d = shiftDays(d, 1)) {
      points.set(iso(d), { key: iso(d), label: `${d.getDate()}. ${d.getMonth() + 1}.`, full: d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' }), tickets: 0, revenue: 0 })
    }
  } else if (grain === 'week') {
    for (let d = weekStart(from); d <= to; d = shiftDays(d, 7)) {
      const end = shiftDays(d, 6)
      points.set(iso(d), { key: iso(d), label: `${d.getDate()}. ${d.getMonth() + 1}.`, full: `Týden ${d.getDate()}. ${d.getMonth() + 1}. – ${end.getDate()}. ${end.getMonth() + 1}.`, tickets: 0, revenue: 0 })
    }
  } else {
    for (let d = new Date(from.getFullYear(), from.getMonth(), 1); d <= to; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      points.set(key, { key, label: MONTH_SHORT[d.getMonth()], full: `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`, tickets: 0, revenue: 0 })
    }
  }

  for (const s of sales) {
    const d = new Date(s.date)
    const key = grain === 'day' ? s.date : grain === 'week' ? iso(weekStart(d)) : s.date.slice(0, 7)
    const p = points.get(key)
    if (!p) continue
    p.tickets += s.count
    p.revenue += s.amount
  }
  return [...points.values()]
}

/* ============================================================
   Formátování
   ============================================================ */
export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('cs-CZ')
}
export function fmtCzk(n: number): string {
  return `${Math.round(n).toLocaleString('cs-CZ')} Kč`
}
/** Kompaktní tvar do os grafů (12 500 → 12,5 tis.) — desetinné místo zůstává,
    aby popisky osy odpovídaly kulatým krokům a nezaokrouhlovaly se „nakřivo". */
export function fmtCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString('cs-CZ', { maximumFractionDigits: 2 })} mil.`
  if (Math.abs(n) >= 10_000) return `${(n / 1000).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} tis.`
  return fmtInt(n)
}
/** Změna proti předchozímu období v % (null = předchozí období bylo nulové). */
export function deltaPct(current: number, previous: number): number | null {
  if (!previous) return null
  return Math.round(((current - previous) / previous) * 100)
}

/* ---------- Barvy grafů ----------
   Kategorická paleta z design tokenů (`--color-chart-1..6`) — pevné pořadí,
   barva patří entitě (kategorii prohlídek / jazyku), nikdy se necykluje podle
   pořadí v aktuálním výpisu. */
export const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
]
/** Barva kategorie prohlídek — podle pořadí v kanonickém seznamu (stabilní). */
export function categoryColor(categoryId: string): string {
  const i = MOCK_CATEGORIES.findIndex((c) => c.id === categoryId)
  return CHART_COLORS[(i < 0 ? 0 : i) % CHART_COLORS.length]
}
/** Barva jazykové mutace — podle pořadí v `LANGS` (stabilní napříč filtry). */
export function langColor(code: string): string {
  const i = LANGS.findIndex((l) => l.code === code)
  return CHART_COLORS[(i < 0 ? 0 : i) % CHART_COLORS.length]
}
