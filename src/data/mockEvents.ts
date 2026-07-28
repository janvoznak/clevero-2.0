import { imageFor } from './mockNews'
import type { ML } from './types'

/** „Dnešek" prototypu — kvůli stavům a zvýraznění v kalendáři. */
export const EVENTS_NOW = new Date('2026-07-28T12:00:00')

export interface Venue {
  id: string
  label: string
  color: string
}

/** Budovy / místa konání v areálu DOV (barevně odlišené). */
export const VENUES: Venue[] = [
  { id: 'areal', label: 'Areál DOV', color: '#64748b' },
  { id: 'bolt', label: 'Bolt Tower', color: '#ee703d' },
  { id: 'gong', label: 'Gong', color: '#7b5ea7' },
  { id: 'galerie', label: 'Galerie Gong', color: '#c2568c' },
  { id: 'technika', label: 'Svět techniky', color: '#3b6fb0' },
  { id: 'hlubina', label: 'Důl Hlubina', color: '#b04f20' },
  { id: 'hopjump', label: 'HopJump', color: '#15916a' },
  { id: 'lezecka', label: 'Lezecká stěna', color: '#0e8a8a' },
]

export const EVENT_TYPES = [
  'Festival',
  'Koncert',
  'Sportovní akce',
  'Výstava',
  'Prohlídka',
  'Vzdělávací program',
  'Konference',
]

export interface DovEvent {
  id: string
  /** Vícejazyčný název (ML) — v seznamu/kalendáři zobrazujeme CZ. */
  title: ML
  venueId: string
  type: string
  /** Rozsah dat (ISO YYYY-MM-DD). from === to = jednodenní. */
  from: string
  to: string
  /** Volitelný čas (jednodenní akce). Prázdné u dlouhodobých. */
  time?: string
  /** Vícejazyčné shrnutí (ML). */
  summary: ML
  image: string
  published: boolean
}

/** Raw varianta — v mock datech píšeme jen CZ, ML doplní normalizace. */
type RawEvent = Omit<DovEvent, 'title' | 'summary'> & { title: string; summary: string }
function ml(cs: string): ML {
  return { cs, en: '', de: '', pl: '' }
}

const RAW_EVENTS: RawEvent[] = [
  // — Dlouhodobé výstavy —
  { id: 'e-neuropolis', title: 'Krištof Kintera: Neuropolis', venueId: 'galerie', type: 'Výstava', from: '2026-05-01', to: '2026-12-31', summary: 'Rozsáhlá výstava propojující umění a technologie v Galerii Gong.', image: imageFor(3), published: true },
  { id: 'e-machac', title: 'David Macháč: Soukromé ráje', venueId: 'areal', type: 'Výstava', from: '2026-03-19', to: '2026-09-27', summary: 'Site-specific instalace v prostorách areálu.', image: imageFor(11), published: true },
  { id: 'e-salon', title: 'Letní salón 2', venueId: 'galerie', type: 'Výstava', from: '2026-06-23', to: '2026-08-28', summary: 'Přehlídka současné regionální tvorby.', image: imageFor(6), published: true },

  // — Vzdělávací / prohlídky (konec července) —
  { id: 'e-tabor', title: 'Letní příměstský tábor U6', venueId: 'technika', type: 'Vzdělávací program', from: '2026-07-27', to: '2026-07-31', summary: 'Týdenní tábor plný experimentů ve Světě techniky.', image: imageFor(4), published: true },
  { id: 'e-scienceshow', title: 'Science Show: Živly', venueId: 'technika', type: 'Vzdělávací program', from: '2026-07-29', to: '2026-07-29', time: '15:00', summary: 'Interaktivní představení o přírodních živlech.', image: imageFor(13), published: true },
  { id: 'e-boltden', title: 'Komentovaná prohlídka Bolt Tower', venueId: 'bolt', type: 'Prohlídka', from: '2026-07-30', to: '2026-07-30', time: '11:00', summary: 'Výstup na vrchol vysoké pece s průvodcem.', image: imageFor(0), published: true },

  // — Srpen: festivaly a akce (více budov v jeden den) —
  { id: 'e-plameny', title: 'Ostrava v plamenech 2026', venueId: 'areal', type: 'Festival', from: '2026-08-01', to: '2026-08-01', time: '18:00', summary: 'Ohnivá show a doprovodný program v celém areálu.', image: imageFor(1), published: true },
  { id: 'e-hlubinanoc', title: 'Noční prohlídka Dolu Hlubina', venueId: 'hlubina', type: 'Prohlídka', from: '2026-08-01', to: '2026-08-01', time: '21:00', summary: 'Zážitková prohlídka dolu při svitu lamp.', image: imageFor(5), published: true },
  { id: 'e-race', title: 'Race the Streets', venueId: 'areal', type: 'Sportovní akce', from: '2026-08-07', to: '2026-08-08', summary: 'Městské závody napříč industriálním areálem.', image: imageFor(2), published: true },
  { id: 'e-gongkoncert', title: 'Letní koncert v Gongu', venueId: 'gong', type: 'Koncert', from: '2026-08-07', to: '2026-08-07', time: '19:30', summary: 'Večerní koncert v multifunkční aule.', image: imageFor(8), published: true },
  { id: 'e-hopjump', title: 'HopJump večerní jam', venueId: 'hopjump', type: 'Sportovní akce', from: '2026-08-08', to: '2026-08-08', time: '20:00', summary: 'Trampolínový večer pro všechny věkové kategorie.', image: imageFor(9), published: true },
  { id: 'e-afrostrava', title: 'Festival AFROSTRAVA', venueId: 'areal', type: 'Festival', from: '2026-08-14', to: '2026-08-15', summary: 'Přehlídka africké hudby, tance a gastronomie.', image: imageFor(7), published: true },
  { id: 'e-lezecka', title: 'Závody na lezecké stěně', venueId: 'lezecka', type: 'Sportovní akce', from: '2026-08-15', to: '2026-08-15', time: '10:00', summary: 'Regionální kolo v lezení na obtížnost.', image: imageFor(10), published: true },
  { id: 'e-hiphop', title: 'HIP HOP ŽIJE OSTRAVA', venueId: 'gong', type: 'Koncert', from: '2026-08-28', to: '2026-08-29', summary: 'Dvoudenní hip-hopový festival v Gongu.', image: imageFor(12), published: true },
  { id: 'e-konference', title: 'Konference Industry 5.0', venueId: 'technika', type: 'Konference', from: '2026-08-20', to: '2026-08-21', summary: 'Odborná konference o budoucnosti průmyslu.', image: imageFor(14), published: false },
]

/** Normalizace na plný model (ML — vyplněná zatím jen čeština). */
export const MOCK_EVENTS: DovEvent[] = RAW_EVENTS.map((r) => ({
  ...r,
  title: ml(r.title),
  summary: ml(r.summary),
}))

export function venue(id: string): Venue {
  return VENUES.find((v) => v.id === id) ?? VENUES[0]
}

export type EventStatus = 'ongoing' | 'upcoming' | 'past'

/** Odvození stavu z termínu vůči „dnešku". */
export function eventStatus(e: DovEvent, now = EVENTS_NOW): EventStatus {
  const from = new Date(e.from + 'T00:00:00')
  const to = new Date(e.to + 'T23:59:59')
  if (to < now) return 'past'
  if (from > now) return 'upcoming'
  return 'ongoing'
}

export const EVENT_STATE_META: Record<EventStatus, { label: string; dot: string; text: string; bg: string }> = {
  ongoing: { label: 'Probíhá', dot: 'bg-forge-500', text: 'text-forge-600', bg: 'bg-forge-500/10' },
  upcoming: { label: 'Nadcházející', dot: 'bg-brand-500', text: 'text-brand-600', bg: 'bg-brand-50' },
  past: { label: 'Ukončeno', dot: 'bg-steel-400', text: 'text-steel-600', bg: 'bg-steel-200' },
}

/** Je událost vícedenní? */
export function isMultiDay(e: DovEvent): boolean {
  return e.from !== e.to
}

/** Dlouhodobá akce (typicky výstava přes týdny) — pro oddělený „pruh" v kalendáři. */
export function isLongRunning(e: DovEvent, days = 14): boolean {
  const from = new Date(e.from + 'T00:00:00')
  const to = new Date(e.to + 'T00:00:00')
  return (to.getTime() - from.getTime()) / 86400000 >= days
}
