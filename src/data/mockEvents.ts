import { imageFor, TAG_PALETTE } from './mockNews'
import type { ML, Tag } from './types'

/** „Dnešek" prototypu — kvůli stavům a zvýraznění v kalendáři. */
export const EVENTS_NOW = new Date('2026-07-28T12:00:00')

export const EVENT_TYPES = [
  'Festival',
  'Koncert',
  'Sportovní akce',
  'Výstava',
  'Prohlídka',
  'Vzdělávací program',
  'Konference',
  'Stand-up',
]

/** Předdefinované štítky akcí s barvami — stejný model jako v Aktualitách
    (sdílený `TagPicker`). Uživatel může přidat i vlastní. */
export const PREDEFINED_EVENT_TAGS: Tag[] = [
  { label: 'Zdarma', color: '#15916a' },
  { label: 'Rodinné', color: '#ee703d' },
  { label: 'Venku', color: '#3b6fb0' },
  { label: 'Hudba', color: '#7b5ea7' },
  { label: 'Industriál', color: '#b04f20' },
  { label: 'Pro školy', color: '#0e8a8a' },
  { label: 'Noční', color: '#4c545f' },
  { label: 'Sport', color: '#c2568c' },
  { label: 'Komentováno', color: '#6b7480' },
  { label: 'Občerstvení', color: '#e0a52a' },
]

export interface DovEvent {
  id: string
  /** Vícejazyčný název (ML) — v seznamu/kalendáři zobrazujeme CZ. */
  title: ML
  /** Podnadpis / claim (ML). */
  subtitle: ML
  type: string
  /** Rozsah dat (ISO YYYY-MM-DD). from === to = jednodenní. */
  from: string
  to: string
  /** Volitelný čas začátku (jednodenní akce). */
  time?: string
  /** Volitelný čas konce. */
  timeTo?: string
  /** Vícejazyčný perex / krátké shrnutí do výpisu (ML). */
  summary: ML
  /** Vícejazyčný dlouhý popis (ML, richtext). */
  description: ML
  image: string
  /** Vstupné (krátký text, např. „Vstup zdarma" / „od 390 Kč"). */
  price: string
  /** Odkaz na prodej vstupenek / rezervaci. */
  ticketUrl: string
  /** Věkové omezení (např. „15+"). */
  ageLimit: string
  /** Délka akce (např. „60 min"). */
  duration: string
  /** Účinkující / lektoři (volný text). */
  performers: string
  /** Štítky akce. */
  tags: string[]
  /** Vazba na objekt v Areálu (ID objektu, '' = nepropojeno). */
  areaId: string
  /** Související prohlídky (ID z modulu Prohlídky). */
  tourIds: string[]
  published: boolean
}

/** Raw varianta — v mock datech píšeme jen CZ, ML doplní normalizace. */
type RawEvent = {
  id: string
  title: string
  type: string
  from: string
  to: string
  time?: string
  timeTo?: string
  summary: string
  image: string
  published: boolean
  /** Volitelné rich údaje (jinak default). */
  subtitle?: string
  description?: string
  price?: string
  ticketUrl?: string
  ageLimit?: string
  duration?: string
  performers?: string
  tags?: string[]
  areaId?: string
  tourIds?: string[]
}
function ml(cs: string): ML {
  return { cs, en: '', de: '', pl: '' }
}

const RAW_EVENTS: RawEvent[] = [
  // — Dlouhodobé výstavy —
  { id: 'e-neuropolis', title: 'Krištof Kintera: Neuropolis', areaId: 'v-galerie', type: 'Výstava', from: '2026-05-01', to: '2026-12-31', summary: 'Rozsáhlá výstava propojující umění a technologie v Galerii Gong.', image: imageFor(3), published: true, price: '250 Kč', ageLimit: '', tags: ['Industriál'] },
  { id: 'e-machac', title: 'David Macháč: Soukromé ráje', areaId: 'v-areal', type: 'Výstava', from: '2026-03-19', to: '2026-09-27', summary: 'Site-specific instalace v prostorách areálu.', image: imageFor(11), published: true },
  { id: 'e-salon', title: 'Letní salón 2', areaId: 'v-galerie', type: 'Výstava', from: '2026-06-23', to: '2026-08-28', summary: 'Přehlídka současné regionální tvorby.', image: imageFor(6), published: true },

  // — Vzdělávací / prohlídky (konec července) —
  { id: 'e-tabor', areaId: 'v-u6', title: 'Letní příměstský tábor U6', type: 'Vzdělávací program', from: '2026-07-27', to: '2026-07-31', summary: 'Týdenní tábor plný experimentů ve Světě techniky.', image: imageFor(4), published: true, price: '2 900 Kč', ageLimit: '7–12 let', tags: ['Pro školy', 'Rodinné'] },
  { id: 'e-scienceshow', areaId: 'v-u6', title: 'Science Show: Živly', type: 'Vzdělávací program', from: '2026-07-29', to: '2026-07-29', time: '15:00', timeTo: '16:00', summary: 'Interaktivní představení o přírodních živlech.', image: imageFor(13), published: true, price: 'Vstup zdarma', duration: '60 min', tags: ['Rodinné', 'Zdarma'] },
  { id: 'e-boltden', areaId: 'v-bolt', title: 'Komentovaná prohlídka Bolt Tower', type: 'Prohlídka', from: '2026-07-30', to: '2026-07-30', time: '11:00', summary: 'Výstup na vrchol vysoké pece s průvodcem.', image: imageFor(0), published: true, price: '180 Kč', duration: '45 min', tags: ['Komentováno', 'Industriál'] },

  // — Srpen: festivaly a akce (více budov v jeden den) —
  { id: 'e-plameny', title: 'Ostrava v plamenech 2026', areaId: 'v-areal', type: 'Festival', from: '2026-08-01', to: '2026-08-01', time: '18:00', summary: 'Ohnivá show a doprovodný program v celém areálu.', image: imageFor(1), published: true, price: 'od 290 Kč', tags: ['Venku', 'Hudba'] },
  { id: 'e-hlubinanoc', areaId: 'v-hlubina', title: 'Noční prohlídka Dolu Hlubina', type: 'Prohlídka', from: '2026-08-01', to: '2026-08-01', time: '21:00', timeTo: '22:30', summary: 'Zážitková prohlídka dolu při svitu lamp.', image: imageFor(5), published: true, subtitle: 'Zážitková prohlídka při svitu hornických lamp', description: '<p>Vydejte se do útrob Dolu Hlubina po setmění. Komentovaná prohlídka vás provede autentickými prostorami dolu při svitu lamp a přiblíží každodennost horníků.</p><p>Kapacita je omezená, doporučujeme rezervaci předem.</p>', price: '220 Kč', ticketUrl: '/vstupenky/hlubina-noc', ageLimit: '10+', duration: '90 min', tags: ['Noční', 'Komentováno', 'Industriál'] },
  { id: 'e-race', title: 'Race the Streets', areaId: 'v-areal', type: 'Sportovní akce', from: '2026-08-07', to: '2026-08-08', summary: 'Městské závody napříč industriálním areálem.', image: imageFor(2), published: true, tags: ['Sport', 'Venku'] },
  { id: 'e-gongkoncert', areaId: 'v-gong', title: 'Letní koncert v Gongu', type: 'Koncert', from: '2026-08-07', to: '2026-08-07', time: '19:30', summary: 'Večerní koncert v multifunkční aule.', image: imageFor(8), published: true, price: 'od 490 Kč', tags: ['Hudba'] },
  { id: 'e-hopjump', title: 'HopJump večerní jam', areaId: 'v-hopjump', type: 'Sportovní akce', from: '2026-08-08', to: '2026-08-08', time: '20:00', summary: 'Trampolínový večer pro všechny věkové kategorie.', image: imageFor(9), published: true, tags: ['Sport', 'Rodinné'] },
  { id: 'e-afrostrava', title: 'Festival AFROSTRAVA', areaId: 'v-areal', type: 'Festival', from: '2026-08-14', to: '2026-08-15', summary: 'Přehlídka africké hudby, tance a gastronomie.', image: imageFor(7), published: true, tags: ['Hudba', 'Venku', 'Občerstvení'] },
  { id: 'e-lezecka', title: 'Závody na lezecké stěně', areaId: 'v-lezecka', type: 'Sportovní akce', from: '2026-08-15', to: '2026-08-15', time: '10:00', summary: 'Regionální kolo v lezení na obtížnost.', image: imageFor(10), published: true, tags: ['Sport'] },
  { id: 'e-hiphop', areaId: 'v-gong', title: 'HIP HOP ŽIJE OSTRAVA', type: 'Koncert', from: '2026-08-28', to: '2026-08-29', summary: 'Dvoudenní hip-hopový festival v Gongu.', image: imageFor(12), published: true, tags: ['Hudba'] },
  { id: 'e-konference', title: 'Konference Industry 5.0', areaId: 'v-u6', type: 'Konference', from: '2026-08-20', to: '2026-08-21', summary: 'Odborná konference o budoucnosti průmyslu.', image: imageFor(14), published: false, tags: ['Pro školy'] },
]

/** Normalizace na plný model (ML — vyplněná zatím jen čeština). */
export const MOCK_EVENTS: DovEvent[] = RAW_EVENTS.map((r) => ({
  id: r.id,
  title: ml(r.title),
  subtitle: ml(r.subtitle ?? ''),
  type: r.type,
  from: r.from,
  to: r.to,
  time: r.time,
  timeTo: r.timeTo,
  summary: ml(r.summary),
  description: ml(r.description ?? `<p>${r.summary}</p>`),
  image: r.image,
  price: r.price ?? '',
  ticketUrl: r.ticketUrl ?? '',
  ageLimit: r.ageLimit ?? '',
  duration: r.duration ?? '',
  performers: r.performers ?? '',
  tags: r.tags ?? [],
  areaId: r.areaId ?? '',
  tourIds: r.tourIds ?? [],
  published: r.published,
}))

/** Barva štítku akce — z předdefinovaných, jinak stabilní z palety (stejná
    logika jako `tagColor` v Aktualitách → shodné barvy v pickeru i výpisu). */
export function eventTagColor(label: string): string {
  const f = PREDEFINED_EVENT_TAGS.find((t) => t.label.toLowerCase() === label.toLowerCase())
  if (f) return f.color
  let h = 0
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0
  return TAG_PALETTE[h % TAG_PALETTE.length]
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

/* ============================================================
   AI-first import akce z odkazu (prototyp — bez reálné AI).
   Vloží se URL akce konané v DOV; „AI" z ní připraví kompletní
   obsah (název, popis, termín, vstupné, štítky, plakát…).
   V prototypu je to deterministický mock podle klíčových slov v URL.
   ============================================================ */
export interface EventDraft {
  title: string
  subtitle: string
  summary: string
  description: string
  type: string
  areaId: string
  from: string
  to: string
  time: string
  timeTo: string
  price: string
  ticketUrl: string
  ageLimit: string
  duration: string
  performers: string
  tags: string[]
  image: string
}

export function aiImportFromUrl(url: string): EventDraft {
  const u = url.toLowerCase()

  // Sportovní akce (např. Race the Streets Ostrava)
  if (/race|streets|run|sport|zavod|závod|marat/.test(u)) {
    return {
      title: 'Race the Streets Ostrava 2026',
      subtitle: 'Městský závod v srdci industriálního areálu',
      summary:
        'Adrenalinové městské závody napříč Dolními Vítkovicemi — běh, překážky a jedinečná industriální kulisa vysokých pecí.',
      description:
        '<p>Race the Streets přiváží do Ostravy jedinečný formát městského závodu, který spojuje sport s objevováním města. Trasa vede přímo areálem Dolních Vítkovic — mezi vysokými pecemi, halami a industriálními dominantami.</p>' +
        '<p>Připraveny jsou kategorie pro jednotlivce i týmy, kratší dětská trasa a bohatý doprovodný program s občerstvením.</p>' +
        '<ul><li>Závod jednotlivců i štafet</li><li>Dětská trasa zdarma</li><li>Doprovodný program a food zóna</li></ul>',
      type: 'Sportovní akce',
      areaId: 'v-areal',
      from: '2026-08-07',
      to: '2026-08-08',
      time: '09:00',
      timeTo: '18:00',
      price: 'od 390 Kč',
      ticketUrl: url,
      ageLimit: '12+ (děti v doprovodu)',
      duration: 'celodenní program',
      performers: '',
      tags: ['Sport', 'Venku', 'Industriál', 'Rodinné'],
      image: imageFor(2),
    }
  }

  // Stand-up / komedie
  if (/stojak|stand|komedie|comedy|kocic/.test(u)) {
    return {
      title: 'Na Stojáka! v Dolních Vítkovicích',
      subtitle: 'Večer plný stand-up comedy',
      summary: 'Oblíbená stand-up show přijíždí do industriálního areálu. Nutná rezervace, kapacita omezená.',
      description:
        '<p>Přední čeští komici rozezní halu Dolních Vítkovic. Připravte se na večer plný vtipu, improvizace a nečekaných situací.</p>',
      type: 'Stand-up',
      areaId: 'v-gong',
      from: '2026-08-05',
      to: '2026-08-05',
      time: '19:00',
      timeTo: '20:30',
      price: 'Vstup zdarma (nutná rezervace)',
      ticketUrl: url,
      ageLimit: '15+',
      duration: '90 min',
      performers: '',
      tags: ['Komedie', 'Zdarma', 'Noční'],
      image: imageFor(8),
    }
  }

  // Obecná akce (fallback)
  return {
    title: 'Nová akce v Dolních Vítkovicích',
    subtitle: 'Připravili jsme pro vás jedinečný program',
    summary: 'Přijďte zažít výjimečnou akci v industriálním areálu Dolních Vítkovic.',
    description: '<p>Podrobnosti programu doplníme. Sledujte web a rezervujte si vstupenky včas.</p>',
    type: 'Festival',
    areaId: 'v-areal',
    from: '',
    to: '',
    time: '',
    timeTo: '',
    price: '',
    ticketUrl: url,
    ageLimit: '',
    duration: '',
    performers: '',
    tags: ['Novinka'],
    image: imageFor(7),
  }
}
