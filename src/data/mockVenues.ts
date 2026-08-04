import { imageFor, TAG_PALETTE } from './mockNews'
import { defaultOpeningHours } from './mockPages'
import type { ML, Tag, GalleryImage } from './types'
import type { OpeningDay } from './mockPages'
import type { ContentBlock } from './mockPages'

/* ============================================================
   Modul „Areál" — objekty/místa v areálu Dolních Vítkovic.
   Kanonický seznam MÍST v areálu: slouží zároveň jako obsahová stránka
   objektu i jako místo konání akcí (kalendář barví řádky podle objektu).
   Propojení s moduly Kalendář akcí, Galerie, Novinky.
   ============================================================ */

/** Štítky objektů areálu (dle zadání) — sdílený `TagPicker`/`TagChip`. */
export const PREDEFINED_AREA_TAGS: Tag[] = [
  { label: 'Gastro', color: '#e0a52a' },
  { label: 'Atraktivity', color: '#ee703d' },
  { label: 'Ubytování', color: '#7b5ea7' },
]

/** Barva štítku areálu — z předdefinovaných, jinak stabilní z palety
    (stejná logika jako `tagColor` v Aktualitách → shodné barvy všude). */
export function areaTagColor(label: string): string {
  const f = PREDEFINED_AREA_TAGS.find((t) => t.label.toLowerCase() === label.toLowerCase())
  if (f) return f.color
  let h = 0
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0
  return TAG_PALETTE[h % TAG_PALETTE.length]
}

/** Provozní stav objektu. */
export type OpenState = 'open' | 'closed' | 'seasonal'
export const OPEN_STATE_META: Record<OpenState, { label: string; dot: string; text: string; bg: string }> = {
  open: { label: 'Otevřeno', dot: 'bg-forge-500', text: 'text-forge-600', bg: 'bg-forge-500/10' },
  closed: { label: 'Zavřeno', dot: 'bg-danger-500', text: 'text-danger-600', bg: 'bg-danger-500/10' },
  seasonal: { label: 'Sezónně', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-500/10' },
}
export const OPEN_STATE_OPTIONS = [
  { value: 'open', label: 'Otevřeno' },
  { value: 'closed', label: 'Zavřeno' },
  { value: 'seasonal', label: 'Sezónně' },
]

/** Zajímavé číslo (statistika budovy) — hodnota + popisek. */
export interface VenueStat {
  id: string
  value: string
  label: string
}

export interface AreaObject {
  id: string
  /** Název objektu (ML). */
  title: ML
  /** Krátký popis / perex (ML). */
  summary: ML
  /** Popis budovy skládaný z bloků (blokový editor jako Stránky). */
  contentBlocks: ContentBlock[]
  /** Zajímavá čísla / statistiky. */
  stats: VenueStat[]
  /** Hlavní obrázek objektu. */
  image: string
  /** Barva místa (řádek/pruh v kalendáři akcí). */
  color: string
  /** Klíč siluety budovy (VenueSilhouette): areal|bolt|gong|galerie|technika|hlubina|hopjump|lezecka. */
  silhouette: string
  /** Štítky (Gastro / Atraktivity / Ubytování / vlastní). */
  tags: string[]
  /** Základní fotky objektu (inline galerie — statické, mění se málo). */
  photos: GalleryImage[]
  /** Nabízené prohlídky (ID z modulu Prohlídky). */
  tourIds: string[]
  /** Bezbariérový přístup. */
  accessible: boolean
  openState: OpenState
  openingHours: OpeningDay[]
  showOpeningHours: boolean
  published: boolean
}

function ml(cs: string): ML {
  return { cs, en: '', de: '', pl: '' }
}
function stat(value: string, label: string): VenueStat {
  return { id: `${value}-${label}`, value, label }
}

type RawVenue = {
  id: string
  title: string
  summary: string
  image: string
  color: string
  silhouette: string
  tags: string[]
  accessible: boolean
  openState: OpenState
  showOpeningHours: boolean
  published: boolean
  stats?: VenueStat[]
  tourIds?: string[]
  photos?: GalleryImage[]
}

/** Základní fotky objektu (prototyp — placeholdery přes imageFor). */
function vphotos(n: number, offset: number): GalleryImage[] {
  return Array.from({ length: n }, (_, i) => ({ id: `ph-${offset}-${i}`, src: imageFor(offset + i), alt: `Foto ${i + 1}`, isMain: i === 0 }))
}

const RAW: RawVenue[] = [
  {
    id: 'v-areal',
    title: 'Areál DOV',
    summary: 'Industriální areál Dolních Vítkovic jako celek — festivaly a akce napříč celým prostorem.',
    image: imageFor(1),
    color: '#64748b',
    silhouette: 'areal',
    tags: ['Atraktivity'],
    accessible: true,
    openState: 'open',
    showOpeningHours: false,
    published: true,
  },
  {
    id: 'v-bolt',
    title: 'Bolt Tower',
    summary: 'Vyhlídková nástavba na vrcholu vysoké pece č. 1 s kavárnou a jedinečným výhledem na celý areál i Ostravu.',
    image: imageFor(0),
    color: '#ee703d',
    silhouette: 'bolt',
    tags: ['Atraktivity', 'Gastro'],
    tourIds: ['t-vysokopecni'], photos: vphotos(4, 0),
    accessible: true,
    openState: 'open',
    showOpeningHours: true,
    published: true,
    stats: [stat('78 m', 'výška vyhlídky'), stat('2015', 'rok otevření')],
  },
  {
    id: 'v-gong',
    title: 'Multifunkční aula Gong',
    summary: 'Bývalý plynojem přeměněný v multifunkční aulu pro koncerty, konference a společenské akce.',
    image: imageFor(8),
    color: '#7b5ea7',
    silhouette: 'gong',
    tags: ['Atraktivity'],
    tourIds: ['t-plynojem'],
    accessible: true,
    openState: 'open',
    showOpeningHours: false,
    published: true,
    stats: [stat('1 500', 'míst k sezení')],
  },
  {
    id: 'v-galerie',
    title: 'Galerie Gong',
    summary: 'Galerijní prostor v horní části plynojemu — výstavy současného umění.',
    image: imageFor(3),
    color: '#c2568c',
    silhouette: 'galerie',
    tags: ['Atraktivity'],
    accessible: true,
    openState: 'open',
    showOpeningHours: true,
    published: true,
  },
  {
    id: 'v-u6',
    title: 'Malý svět techniky U6',
    summary:
      'Interaktivní expozice s exponáty na motivy Julese Verna. U6 v novém kabátu láká na desítky pokusů, které si návštěvníci vyzkouší na vlastní kůži.',
    image: imageFor(4),
    color: '#3b6fb0',
    silhouette: 'technika',
    tags: ['Atraktivity'],
    photos: vphotos(4, 4),
    accessible: true,
    openState: 'open',
    showOpeningHours: true,
    published: true,
    stats: [stat('12 m', 'výška vyhlídkové plošiny'), stat('1938', 'rok dokončení stavby'), stat('900 t', 'váha dmychadel'), stat('900 m²', 'rozloha expozice')],
  },
  {
    id: 'v-hlubina',
    title: 'Důl Hlubina',
    summary: 'Národní kulturní památka — bývalý černouhelný důl s autentickými prostorami a zážitkovými prohlídkami.',
    image: imageFor(5),
    color: '#b04f20',
    silhouette: 'hlubina',
    tags: ['Atraktivity'],
    tourIds: ['t-hlubina-den', 't-hlubina-nocni'], photos: vphotos(3, 5),
    accessible: false,
    openState: 'seasonal',
    showOpeningHours: true,
    published: true,
    stats: [stat('1852', 'rok založení dolu')],
  },
  {
    id: 'v-hopjump',
    title: 'HopJump',
    summary: 'Trampolínová hala pro všechny věkové kategorie — zábava i pohyb pod jednou střechou.',
    image: imageFor(9),
    color: '#15916a',
    silhouette: 'hopjump',
    tags: ['Atraktivity'],
    accessible: true,
    openState: 'open',
    showOpeningHours: true,
    published: true,
  },
  {
    id: 'v-lezecka',
    title: 'Lezecká stěna',
    summary: 'Venkovní i vnitřní lezecká stěna pro začátečníky i pokročilé.',
    image: imageFor(10),
    color: '#0e8a8a',
    silhouette: 'lezecka',
    tags: ['Atraktivity'],
    accessible: false,
    openState: 'seasonal',
    showOpeningHours: true,
    published: true,
  },
  {
    id: 'v-marycka',
    title: 'Restaurace Maryčka',
    summary: 'Restaurace s industriální atmosférou přímo v areálu — regionální kuchyně a domácí pivo.',
    image: imageFor(6),
    color: '#e0a52a',
    silhouette: 'areal',
    tags: ['Gastro'],
    accessible: true,
    openState: 'open',
    showOpeningHours: true,
    published: true,
  },
  {
    id: 'v-hotel',
    title: 'Ubytování v areálu',
    summary: 'Designové ubytování v srdci industriálního areálu — ideální pro víkendový pobyt i firemní akce.',
    image: imageFor(7),
    color: '#5b5bd6',
    silhouette: 'areal',
    tags: ['Ubytování'],
    accessible: true,
    openState: 'seasonal',
    showOpeningHours: false,
    published: false,
  },
]

export const MOCK_VENUES: AreaObject[] = RAW.map((r) => ({
  id: r.id,
  title: ml(r.title),
  summary: ml(r.summary),
  contentBlocks: [],
  stats: r.stats ?? [],
  image: r.image,
  color: r.color,
  silhouette: r.silhouette,
  tags: r.tags,
  photos: r.photos ?? [],
  tourIds: r.tourIds ?? [],
  accessible: r.accessible,
  openState: r.openState,
  openingHours: defaultOpeningHours(),
  showOpeningHours: r.showOpeningHours,
  published: r.published,
}))

/** Vyhledání místa/objektu podle ID (pro kalendář, výpisy, detaily akcí). */
export function areaPlace(id: string): AreaObject | undefined {
  return MOCK_VENUES.find((v) => v.id === id)
}

/** Volby míst pro výběr v jiných modulech (Kalendář akcí). */
export const PLACE_OPTIONS = MOCK_VENUES.map((v) => ({ value: v.id, label: v.title.cs }))

/** Výchozí místo pro nové akce (celý areál). */
export const DEFAULT_PLACE_ID = 'v-areal'

/** Prázdný objekt pro zakládání. */
export function blankVenue(): AreaObject {
  return {
    id: 'nový',
    title: { cs: '', en: '', de: '', pl: '' },
    summary: { cs: '', en: '', de: '', pl: '' },
    contentBlocks: [],
    stats: [],
    image: '',
    color: '#64748b',
    silhouette: 'areal',
    tags: [],
    photos: [],
    tourIds: [],
    accessible: false,
    openState: 'open',
    openingHours: defaultOpeningHours(),
    showOpeningHours: true,
    published: false,
  }
}
