import { imageFor } from './mockNews'
import type { ML } from './types'

/* ============================================================
   Modul „Prohlídky" (dříve Vstupenky).
   Kategorie prohlídek → prohlídky → (termíny + vstupenky z Colossea).
   Colosseum data (termíny, volná místa, vstupenky) jsou READ-ONLY —
   v adminu se needitují, tahají se přes API. V prototypu jsou to mock data.
   ============================================================ */

export const TOURS_NOW = new Date('2026-07-28T12:00:00')

function ml(cs: string): ML {
  return { cs, en: '', de: '', pl: '' }
}

/* ---------- Kategorie prohlídek ---------- */
export interface TourCategory {
  id: string
  name: ML
  /** Popis kategorie (richtext). */
  description: ML
  image: string
  published: boolean
}

/* ---------- Prohlídka ---------- */
/** Cenová hladina (řádek ceníku). */
export interface PriceTier {
  id: string
  label: string
  price: string
  /** Volitelná poznámka / vysvětlivka. */
  note: string
}
/** Odrážka „Co vás při prohlídce čeká". */
export interface TourHighlight {
  id: string
  text: ML
}
/** Termín prohlídky z Colossea (read-only). */
export interface TourSlot {
  id: string
  /** ISO datum a čas začátku. */
  datetime: string
  capacity: number
  booked: number
}

export interface Tour {
  id: string
  categoryId: string
  title: ML
  /** Krátký perex do výpisu. */
  perex: ML
  /** Hlavní popis (richtext). */
  description: ML
  image: string
  /** Délka prohlídky (např. „100 minut"). */
  duration: string
  /** „Co vás při prohlídce čeká" — odrážky. */
  highlights: TourHighlight[]
  /** „Kdy prohlídky začínají" — volný text. */
  scheduleNote: ML
  /** Ceník. */
  priceTiers: PriceTier[]
  /** Kontaktní e-mail (alternativa k nákupu). */
  contactEmail: string
  /** Poznámka k platbě (např. platba kartou). */
  paymentNote: ML
  /** Unikátní ID prohlídky v Colosseu (napojení prodeje vstupenek). */
  colosseumId: string
  published: boolean
  /** Nejbližší termíny z Colossea (read-only). */
  slots: TourSlot[]
}

/* ---------- Vstupenka (podmodul Vstupenky) — z Colossea přes API ---------- */
export interface Ticket {
  id: string
  tourId: string
  customer: string
  email: string
  /** Termín prohlídky (ISO). */
  slotDatetime: string
  /** Kdy byla vstupenka zakoupena (ISO). */
  purchasedAt: string
  tierLabel: string
  count: number
  /** Celková částka v Kč. */
  amount: number
}

/* ============================================================
   Mock data
   ============================================================ */
export const MOCK_CATEGORIES: TourCategory[] = [
  {
    id: 'cat-dov',
    name: ml('Dolní Vítkovice'),
    description: ml(
      '<p>Komentované prohlídky industriálního areálu Dolních Vítkovic — vysoké pece, Bolt Tower, plynojem Gong a další.</p>',
    ),
    image: imageFor(0),
    published: true,
  },
  {
    id: 'cat-hornicke',
    name: ml('Hornické muzeum'),
    description: ml(
      '<p>Prohlídky dolu Hlubina a hornického provozu — sfárání, těžní věž a autentické prostory černouhelného dolu.</p>',
    ),
    image: imageFor(5),
    published: true,
  },
]

function tier(label: string, price: string, note = ''): PriceTier {
  return { id: `${label}-${price}`, label, price, note }
}
function hl(text: string): TourHighlight {
  return { id: text.slice(0, 16), text: ml(text) }
}
function slot(datetime: string, capacity: number, booked: number): TourSlot {
  return { id: datetime, datetime, capacity, booked }
}

type RawTour = Omit<Tour, 'title' | 'perex' | 'description' | 'scheduleNote' | 'paymentNote' | 'highlights'> & {
  title: string
  perex: string
  description: string
  scheduleNote: string
  paymentNote: string
  highlights: string[]
}

const RAW_TOURS: RawTour[] = [
  {
    id: 't-vysokopecni',
    categoryId: 'cat-dov',
    title: 'Vysokopecní okruh vč. návštěvy Bolt Tower',
    perex: 'Komentovaná prohlídka Vysoké pece č. 1 o historii Vítkovic a výrobě surového železa (v polovině prohlídky rozchod na Bolt Tower).',
    description:
      '<p>Vydejte se po stopách výroby surového železa. Komentovaná prohlídka vás provede vysokou pecí č. 1 a vysvětlí, jak fungoval jeden z nejdůležitějších provozů Vítkovic.</p>',
    image: imageFor(0),
    duration: '100 minut',
    highlights: [
      'Procházka částí areálu DOV.',
      'Jízda skipovým výtahem / skleněným výtahem.',
      'Adrenalinové roštové lávky ve výšce 70 m.',
      'Nahlédnutí do nitra vysoké pece.',
    ],
    scheduleNote:
      'Denně v 10:00, 12:00, 14:00 a 16:00 (pro předem objednané organizované skupiny dle dohody). Max. kapacita jedné skupiny je 17 osob. V jeden čas mohou vyjít 2 skupiny. Pro větší skupiny jsou možné individuální prohlídky dle dohody.',
    priceTiers: [
      tier('Dospělí', '295 Kč'),
      tier('Zvýhodněné vstupné', '220 Kč', '(1) senioři 65+, studenti, děti 6–15 let'),
      tier('Rodinné vstupné', '800 Kč', '(2) 2 dospělí + 2 děti'),
      tier('ZTP/P', '220 Kč', '(3) včetně doprovodu'),
      tier('Školní skupiny', '170 Kč', '(4) za žáka, pedag. doprovod zdarma'),
    ],
    contactEmail: 'nkp@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze platit platební kartou.',
    colosseumId: 'COL-TOUR-4401',
    published: true,
    slots: [
      slot('2026-07-30T10:00', 34, 31),
      slot('2026-07-30T12:00', 34, 18),
      slot('2026-07-30T14:00', 34, 34),
      slot('2026-07-31T10:00', 34, 6),
      slot('2026-07-31T16:00', 34, 0),
    ],
  },
  {
    id: 't-plynojem',
    categoryId: 'cat-dov',
    title: 'Prohlídka plynojemu Gong',
    perex: 'Komentovaná prohlídka bývalého plynojemu přeměněného v multifunkční aulu Gong.',
    description: '<p>Prohlídka unikátní stavby plynojemu a jeho proměny v multifunkční aulu.</p>',
    image: imageFor(8),
    duration: '60 minut',
    highlights: ['Historie plynojemu.', 'Vstup do hlavního sálu Gong.'],
    scheduleNote: 'Denně v 11:00 a 15:00. Kapacita skupiny 25 osob.',
    priceTiers: [tier('Dospělí', '180 Kč'), tier('Snížené', '120 Kč')],
    contactEmail: 'nkp@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze platit platební kartou.',
    colosseumId: 'COL-TOUR-4402',
    published: true,
    slots: [slot('2026-07-30T11:00', 25, 20), slot('2026-07-31T15:00', 25, 25)],
  },
  {
    id: 't-hlubina-den',
    categoryId: 'cat-hornicke',
    title: 'Denní prohlídka Dolu Hlubina',
    perex: 'Komentovaná prohlídka hornického provozu a těžní věže dolu Hlubina.',
    description: '<p>Projděte si autentické prostory černouhelného dolu s průvodcem.</p>',
    image: imageFor(5),
    duration: '90 minut',
    highlights: ['Těžní věž a strojovna.', 'Autentické prostory dolu.', 'Výklad o práci horníků.'],
    scheduleNote: 'Út–Ne v 10:00, 13:00 a 15:00. Kapacita skupiny 20 osob.',
    priceTiers: [tier('Dospělí', '220 Kč'), tier('Snížené', '150 Kč'), tier('Rodinné', '600 Kč')],
    contactEmail: 'muzeum@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze platit platební kartou.',
    colosseumId: 'COL-TOUR-4410',
    published: true,
    slots: [slot('2026-07-30T10:00', 20, 12), slot('2026-07-30T13:00', 20, 3), slot('2026-08-01T15:00', 20, 0)],
  },
  {
    id: 't-hlubina-nocni',
    categoryId: 'cat-hornicke',
    title: 'Noční prohlídka Dolu Hlubina',
    perex: 'Zážitková prohlídka dolu při svitu hornických lamp.',
    description: '<p>Vydejte se do útrob dolu po setmění — atmosférická prohlídka při svitu lamp.</p>',
    image: imageFor(13),
    duration: '90 minut',
    highlights: ['Prohlídka při svitu lamp.', 'Omezená kapacita.'],
    scheduleNote: 'Vybrané pátky ve 21:00. Nutná rezervace předem.',
    priceTiers: [tier('Jednotné vstupné', '260 Kč')],
    contactEmail: 'muzeum@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze platit platební kartou.',
    colosseumId: '',
    published: false,
    slots: [],
  },
]

export const MOCK_TOURS: Tour[] = RAW_TOURS.map((r) => ({
  ...r,
  title: ml(r.title),
  perex: ml(r.perex),
  description: ml(r.description),
  scheduleNote: ml(r.scheduleNote),
  paymentNote: ml(r.paymentNote),
  highlights: r.highlights.map(hl),
}))

export const MOCK_TICKETS: Ticket[] = [
  { id: 'tk-1', tourId: 't-vysokopecni', customer: 'Petr Novák', email: 'p.novak@email.cz', slotDatetime: '2026-07-30T10:00', purchasedAt: '2026-07-24T18:32', tierLabel: 'Dospělí', count: 2, amount: 590 },
  { id: 'tk-2', tourId: 't-vysokopecni', customer: 'Jana Dvořáková', email: 'jana.d@email.cz', slotDatetime: '2026-07-30T10:00', purchasedAt: '2026-07-25T09:10', tierLabel: 'Rodinné vstupné', count: 1, amount: 800 },
  { id: 'tk-3', tourId: 't-vysokopecni', customer: 'ZŠ Ostrava-Poruba', email: 'skola@zsporuba.cz', slotDatetime: '2026-07-31T10:00', purchasedAt: '2026-07-20T11:05', tierLabel: 'Školní skupiny', count: 24, amount: 4080 },
  { id: 'tk-4', tourId: 't-plynojem', customer: 'Tomáš Král', email: 't.kral@email.cz', slotDatetime: '2026-07-30T11:00', purchasedAt: '2026-07-26T14:47', tierLabel: 'Dospělí', count: 3, amount: 540 },
  { id: 'tk-5', tourId: 't-hlubina-den', customer: 'Eva Malá', email: 'eva.mala@email.cz', slotDatetime: '2026-07-30T13:00', purchasedAt: '2026-07-27T20:15', tierLabel: 'Snížené', count: 2, amount: 300 },
  { id: 'tk-6', tourId: 't-hlubina-den', customer: 'Martin Beneš', email: 'm.benes@email.cz', slotDatetime: '2026-07-30T10:00', purchasedAt: '2026-07-27T21:40', tierLabel: 'Dospělí', count: 2, amount: 440 },
  { id: 'tk-7', tourId: 't-vysokopecni', customer: 'Lucie Horáková', email: 'l.horakova@email.cz', slotDatetime: '2026-07-30T12:00', purchasedAt: '2026-07-28T08:03', tierLabel: 'ZTP/P', count: 2, amount: 440 },
]

/* ============================================================
   Helpers
   ============================================================ */
export function category(id: string): TourCategory | undefined {
  return MOCK_CATEGORIES.find((c) => c.id === id)
}
export function tour(id: string): Tour | undefined {
  return MOCK_TOURS.find((t) => t.id === id)
}
export function toursForCategory(categoryId: string): Tour[] {
  return MOCK_TOURS.filter((t) => t.categoryId === categoryId)
}
export function remaining(s: TourSlot): number {
  return Math.max(0, s.capacity - s.booked)
}
/** Nejbližší budoucí termíny (seřazené). */
export function upcomingSlots(t: Tour, now = TOURS_NOW): TourSlot[] {
  return t.slots
    .filter((s) => new Date(s.datetime) >= now)
    .sort((a, b) => a.datetime.localeCompare(b.datetime))
}
/** Součet volných míst na nejbližších termínech. */
export function freeSeats(t: Tour, now = TOURS_NOW): number {
  return upcomingSlots(t, now).reduce((sum, s) => sum + remaining(s), 0)
}

export type Availability = 'available' | 'lastSpots' | 'soldout' | 'none'
/** Odvozený stav dostupnosti z nejbližších termínů. */
export function availability(t: Tour, now = TOURS_NOW): Availability {
  const up = upcomingSlots(t, now)
  if (!up.length) return 'none'
  const free = up.reduce((sum, s) => sum + remaining(s), 0)
  if (free === 0) return 'soldout'
  if (free <= 10) return 'lastSpots'
  return 'available'
}
export const AVAILABILITY_META: Record<Availability, { label: string; dot: string; text: string; bg: string }> = {
  available: { label: 'Volná místa', dot: 'bg-forge-500', text: 'text-forge-600', bg: 'bg-forge-500/10' },
  lastSpots: { label: 'Poslední místa', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-500/10' },
  soldout: { label: 'Vyprodáno', dot: 'bg-danger-500', text: 'text-danger-600', bg: 'bg-danger-500/10' },
  none: { label: 'Bez termínů', dot: 'bg-steel-400', text: 'text-steel-600', bg: 'bg-steel-200' },
}

export function ticketsForTour(tourId: string): Ticket[] {
  return MOCK_TICKETS.filter((t) => t.tourId === tourId)
}

/** Prázdné entity pro zakládání. */
export function blankCategory(): TourCategory {
  return { id: 'nová', name: ml(''), description: ml(''), image: '', published: false }
}
export function blankTour(categoryId = 'cat-dov'): Tour {
  return {
    id: 'nová',
    categoryId,
    title: ml(''),
    perex: ml(''),
    description: ml(''),
    image: '',
    duration: '',
    highlights: [],
    scheduleNote: ml(''),
    priceTiers: [],
    contactEmail: '',
    paymentNote: ml('Vstupenky lze platit platební kartou.'),
    colosseumId: '',
    published: false,
    slots: [],
  }
}

export const CATEGORY_OPTIONS = MOCK_CATEGORIES.map((c) => ({ value: c.id, label: c.name.cs }))

/** Položky pro výběr prohlídek v jiných modulech (Areál, Novinky, Kalendář akcí)
    — kompatibilní s `RelItem` sdílené `RelationPicker`. */
export function tourOptionsList(): { id: string; label: string; sub: string; thumb: string }[] {
  return MOCK_TOURS.map((t) => ({
    id: t.id,
    label: t.title.cs,
    sub: category(t.categoryId)?.name.cs ?? '',
    thumb: t.image,
  }))
}

/** Formátování data/času termínu do CZ. */
export function fmtSlot(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
