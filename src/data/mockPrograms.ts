import type { ML, Tag, ContentBlock, LangCode } from './types'
import { TAG_PALETTE } from './mockNews'

/* ============================================================
   Modul „Vzdělávací programy" (entita `program`).
   Katalog programů pro školy. Rezervace/objednávka běží v externím
   systému DOVIS — v CMS se ukládá jen vygenerovaný URL odkaz
   (u každého programu jiný), který se na webu zobrazí jako tlačítko.
   Stavy publikace zatím neřešíme.
   ============================================================ */

export const PROGRAMS_NOW = new Date('2026-07-28T12:00:00')

function ml(cs: string): ML {
  return { cs, en: '', de: '', pl: '' }
}
function emptyML(): ML {
  return { cs: '', en: '', de: '', pl: '' }
}

function colorFrom(list: Tag[], label: string): string {
  const f = list.find((t) => t.label.toLowerCase() === label.toLowerCase())
  if (f) return f.color
  let h = 0
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0
  return TAG_PALETTE[h % TAG_PALETTE.length]
}

/* ---------- Štítky (průřezové, sdílený TagPicker jako v ostatních modulech) ---------- */
export const PROGRAM_TAGS: Tag[] = [
  { label: 'Novinka', color: '#ee703d' },
  { label: 'Oblíbené', color: '#d98a15' },
  { label: 'Sezónní', color: '#0e8a8a' },
  { label: 'S dotací', color: '#15916a' },
]
export const tagColor = (l: string) => colorFrom(PROGRAM_TAGS, l)

/* ---------- Taxonomie ---------- */

/** Stupeň školy (WP „Kategorie"). */
export const SCHOOL_LEVELS: Tag[] = [
  { label: 'Mateřské školy', color: '#15916a' },
  { label: 'Základní školy 1. stupeň', color: '#3b6fb0' },
  { label: 'Základní školy 2. stupeň', color: '#5b5bd6' },
  { label: 'Střední školy', color: '#7b5ea7' },
]

/** Ročníky (WP „Typy"). Neutrální šedé chipy — jde jen o čísla tříd. */
export const GRADES: Tag[] = [
  '1.tř.', '2.tř.', '3.tř.', '4.tř.', '5.tř.', '6.tř.', '7.tř.', '8.tř.', '9.tř.', 'SŠ',
].map((label) => ({ label, color: '#64748b' }))

/** Zaměření (WP „Zaměření") — obsahové/předmětové. */
export const FOCUS_AREAS: Tag[] = [
  { label: 'Finanční gramotnost', color: '#ee703d' },
  { label: 'Člověk a jeho svět', color: '#3b6fb0' },
  { label: 'Občanská výchova', color: '#c2568c' },
  { label: 'Environmentální výchova', color: '#15916a' },
  { label: 'Přírodověda', color: '#0e8a8a' },
  { label: 'Člověk a příroda', color: '#15916a' },
  { label: 'Biologie', color: '#0e8a8a' },
  { label: 'Fyzika', color: '#5b5bd6' },
  { label: 'Matematika', color: '#3b6fb0' },
  { label: 'Geometrie', color: '#3b6fb0' },
  { label: 'AI', color: '#d64545' },
  { label: 'IT/Robotika', color: '#7b5ea7' },
  { label: 'Technická tvořivost', color: '#d98a15' },
  { label: 'Pracovní činnosti', color: '#d98a15' },
  { label: 'Cizí jazyky', color: '#0e8a8a' },
  { label: 'Český jazyk', color: '#b04f20' },
  { label: 'Člověk a svět práce', color: '#64748b' },
  { label: 'Architektura', color: '#5b5bd6' },
]

export const levelColor = (l: string) => colorFrom(SCHOOL_LEVELS, l)
export const gradeColor = (_l: string) => '#64748b'
export const focusColor = (l: string) => colorFrom(FOCUS_AREAS, l)

/* ---------- Entita ---------- */
export interface ProgramParam {
  id: string
  name: string
  value: string
}

export interface Program {
  id: string
  /** Autor / správce programu (kdo vytvořil/upravil). */
  author: string
  title: ML
  /** Krátký perex do výpisu. */
  perex: ML
  /** Popis programu (richtext). */
  description: ML
  /** Obsah programu jako bloky (ContentBuilder) — jednotná sekce „Obsah". */
  contentBlocks?: ContentBlock[]
  /** Zveřejněné jazykové mutace. Bez seznamu = živé jsou všechny vyplněné (zpětná kompatibilita). */
  publishedLangs?: LangCode[]
  image: string
  date: string | null
  /** Průřezové štítky (např. Novinka). */
  tags: string[]
  /** Popisek tlačítka rezervace (např. „Rezervace"). */
  reservationLabel: string
  /** URL odkaz vygenerovaný v DOVIS — u každého programu jiný. */
  reservationUrl: string
  /** Stupeň školy. */
  categories: string[]
  /** Ročníky. */
  grades: string[]
  /** Zaměření. */
  focus: string[]
  /** Parametry programu (Délka, Kapacita, Cena…). */
  params: ProgramParam[]
}

function params(rows: [string, string][]): ProgramParam[] {
  return rows.map(([name, value], i) => ({ id: `p-${i}`, name, value }))
}

/* ---------- Mock data (dle původního WP katalogu) ---------- */
type RawProgram = {
  id: string
  title: string
  /** Vyplněné překlady názvu (demo jazykových mutací). Slučuje se přes ml(). */
  titleML?: Partial<ML>
  perex: string
  description: string
  imageSeed: number
  date: string | null
  tags?: string[]
  reservationUrl: string
  categories: string[]
  grades: string[]
  focus: string[]
  params: ProgramParam[]
  /** Explicitní seznam zveřejněných mutací (bez něj = všechny vyplněné). */
  publishedLangs?: LangCode[]
}

const RAW: RawProgram[] = [
  {
    id: 'prg-finance',
    title: 'Co za to stojí',
    // EN nadpis vyplněný, ale mimo publishedLangs → mutace „připraveno, skryté" (amber).
    titleML: { en: 'Worth Every Penny' },
    perex: 'Interaktivní program o penězích, hospodaření a finanční gramotnosti pro malé správce svého majetku.',
    description:
      '<p>Vydejte se s námi do světa, kde peníze ožívají! V programu se z účastníků stanou malí správci svého majetku — vydělávají herní bankovky, nakupují ve fiktivním obchodě, plánují, šetří i utrácejí. Velkým zážitkem je pokus s UV světlem, při kterém odhalují falešné bankovky.</p><p>Celý program vrcholí výrobou vlastní pokladničky, kterou si odnášejí jako připomínku, že hospodařit s penězi lze chytře a zodpovědně.</p>',
    imageSeed: 4,
    date: '2025-08-04',
    tags: ['Novinka'],
    reservationUrl: 'https://vyuka.dolnivitkovice.cz/rezervace/co-za-to-stoji',
    categories: ['Základní školy 1. stupeň', 'Základní školy 2. stupeň'],
    grades: ['2.tř.', '3.tř.', '4.tř.', '5.tř.'],
    focus: ['Finanční gramotnost'],
    params: params([['Délka programu', '90 minut'], ['Kapacita', '10–16 žáků, prosíme o dodržení kapacity a věku'], ['Cena', '2 000,- Kč']]),
    publishedLangs: ['cs'],
  },
  {
    id: 'prg-handicap',
    title: 'Jeden den s handicapem',
    perex: 'Zážitkový program, který přibližuje život lidí se zdravotním postižením a rozvíjí empatii.',
    description: '<p>Žáci si na vlastní kůži vyzkoušejí, jaké to je pohybovat se na vozíku, orientovat se poslepu nebo se domluvit beze slov. Program otevírá témata tolerance, pomoci a respektu.</p>',
    imageSeed: 7,
    date: '2023-02-07',
    tags: ['Novinka'],
    reservationUrl: 'https://vyuka.dolnivitkovice.cz/rezervace/jeden-den-s-handicapem',
    categories: ['Základní školy 1. stupeň', 'Základní školy 2. stupeň', 'Střední školy'],
    grades: ['5.tř.', '6.tř.', '7.tř.', '8.tř.', '9.tř.', 'SŠ'],
    focus: ['Člověk a jeho svět', 'Občanská výchova'],
    params: params([['Délka programu', '120 minut'], ['Kapacita', '10–20 žáků'], ['Cena', '2 200,- Kč']]),
  },
  {
    id: 'prg-podzim',
    title: 'Od podzimu do jara',
    perex: 'Přírodovědný program o proměnách přírody během roku pro nejmenší školáky.',
    description: '<p>Program provede děti proměnami přírody od podzimu do jara — co se děje se stromy, zvířaty i počasím. Plno pozorování, pokusů a tvoření.</p>',
    imageSeed: 5,
    date: '2025-07-01',
    tags: ['Novinka', 'Sezónní'],
    reservationUrl: 'https://vyuka.dolnivitkovice.cz/rezervace/od-podzimu-do-jara',
    categories: ['Základní školy 1. stupeň'],
    grades: ['1.tř.', '2.tř.', '3.tř.'],
    focus: ['Člověk a jeho svět', 'Environmentální výchova', 'Přírodověda'],
    params: params([['Délka programu', '90 minut'], ['Kapacita', '10–16 žáků'], ['Cena', '1 800,- Kč']]),
  },
  {
    id: 'prg-zavodit',
    title: 'A I deme závodit!',
    // EN živě, DE vyplněné, ale mimo publishedLangs → „připraveno, skryté" (amber).
    titleML: { en: "Let's Race with AI!", de: 'Auf zum KI-Rennen!' },
    perex: 'Program o umělé inteligenci a robotice — postav a naprogramuj závodní robot.',
    description: '<p>Žáci se seznámí se základy umělé inteligence a robotiky. Sestaví a naprogramují vlastní robot, který pak vyšlou do závodu.</p>',
    imageSeed: 13,
    date: '2025-08-04',
    tags: ['Novinka', 'Oblíbené'],
    reservationUrl: 'https://vyuka.dolnivitkovice.cz/rezervace/a-i-deme-zavodit',
    categories: ['Základní školy 2. stupeň'],
    grades: ['6.tř.', '7.tř.', '8.tř.', '9.tř.'],
    focus: ['AI', 'Fyzika', 'IT/Robotika'],
    params: params([['Délka programu', '120 minut'], ['Kapacita', '12–16 žáků'], ['Cena', '2 500,- Kč']]),
    publishedLangs: ['cs', 'en'],
  },
  {
    id: 'prg-geometrie',
    title: 'Geometrie v pohybu',
    perex: 'Matematika a geometrie hravě a pohybem — tvary, prostor a měření naživo.',
    description: '<p>Geometrie jinak — žáci si tvary a prostorové vztahy vyzkoušejí pohybem a stavěním. Matematika, která baví.</p>',
    imageSeed: 8,
    date: '2025-09-22',
    tags: ['Novinka'],
    reservationUrl: 'https://vyuka.dolnivitkovice.cz/rezervace/geometrie-v-pohybu',
    categories: ['Základní školy 1. stupeň', 'Základní školy 2. stupeň'],
    grades: ['1.tř.', '2.tř.', '3.tř.', '4.tř.', '5.tř.', '6.tř.', '7.tř.', '8.tř.', '9.tř.'],
    focus: ['Člověk a příroda', 'Člověk a jeho svět', 'Geometrie', 'Matematika'],
    params: params([['Délka programu', '90 minut'], ['Kapacita', '10–24 žáků'], ['Cena', '1 900,- Kč']]),
  },
  {
    id: 'prg-robotovarna',
    title: 'Robotovárna',
    perex: 'Technická tvořivost pro nejmenší — postav si vlastní pohyblivý stroj.',
    description: '<p>Malí konstruktéři si vyzkoušejí technickou tvořivost a jemnou motoriku při stavbě vlastního pohyblivého stroje.</p>',
    imageSeed: 0,
    date: '2025-08-15',
    tags: ['Novinka'],
    reservationUrl: 'https://vyuka.dolnivitkovice.cz/rezervace/robotovarna',
    categories: ['Základní školy 1. stupeň'],
    grades: ['1.tř.', '2.tř.', '3.tř.'],
    focus: ['Pracovní činnosti', 'Technická tvořivost'],
    params: params([['Délka programu', '60 minut'], ['Kapacita', '8–14 žáků'], ['Cena', '1 500,- Kč']]),
  },
]

/** Autoři programů (prototyp — přiřazení deterministicky podle pořadí). */
const PROGRAM_AUTHORS = ['Jana Svobodová', 'Petr Dvořák', 'Martin Kučera']

export const MOCK_PROGRAMS: Program[] = RAW.map((r, i) => ({
  id: r.id,
  author: PROGRAM_AUTHORS[i % PROGRAM_AUTHORS.length],
  title: { ...ml(r.title), ...r.titleML },
  perex: ml(r.perex),
  description: ml(r.description),
  image: `/images/g${(r.imageSeed % 18) + 1}.jpg`,
  date: r.date,
  tags: r.tags ?? [],
  reservationLabel: 'Rezervace',
  reservationUrl: r.reservationUrl,
  categories: r.categories,
  grades: r.grades,
  focus: r.focus,
  params: r.params,
  publishedLangs: r.publishedLangs,
}))

export function blankProgram(): Program {
  return {
    id: 'nový',
    author: 'Jan Voznak',
    title: emptyML(),
    perex: emptyML(),
    description: emptyML(),
    image: '',
    date: null,
    tags: [],
    reservationLabel: 'Rezervace',
    reservationUrl: '',
    categories: [],
    grades: [],
    focus: [],
    params: [
      { id: 'p-0', name: 'Délka programu', value: '' },
      { id: 'p-1', name: 'Kapacita', value: '' },
      { id: 'p-2', name: 'Cena', value: '' },
    ],
  }
}
