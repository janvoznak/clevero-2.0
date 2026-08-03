import { imageFor, TAG_PALETTE, MOCK_NEWS } from './mockNews'
import { MOCK_EVENTS, type DovEvent } from './mockEvents'
import { defaultOpeningHours } from './mockPages'
import type { ML, Tag, NewsItem } from './types'
import type { OpeningDay } from './mockPages'
import type { ContentBlock } from './mockPages'

/* ============================================================
   Modul „Areál" — objekty/místa v areálu Dolních Vítkovic.
   Editace obsahu budovy (popis, čísla, galerie, akce, vstupenky
   přes Colosseum). Propojení s moduly Kalendář akcí, Galerie, Novinky.
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
  /** Štítky (Gastro / Atraktivity / Ubytování / vlastní). */
  tags: string[]
  /** Přiřazené galerie (ID z modulu Galerie). */
  galleryIds: string[]
  /** ID objektu v Colosseum (napojení prodeje vstupenek na prohlídku). */
  colosseumId: string
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
  tags: string[]
  galleryIds: string[]
  colosseumId: string
  accessible: boolean
  openState: OpenState
  showOpeningHours: boolean
  published: boolean
  stats?: VenueStat[]
}

const RAW: RawVenue[] = [
  {
    id: 'v-u6',
    title: 'Malý svět techniky U6',
    summary:
      'Interaktivní expozice s exponáty na motivy Julese Verna. U6 v novém kabátu láká na desítky pokusů, které si návštěvníci vyzkouší na vlastní kůži.',
    image: imageFor(4),
    tags: ['Atraktivity'],
    galleryIds: ['g-u6', 'g-technika'],
    colosseumId: 'COL-U6-1042',
    accessible: true,
    openState: 'open',
    showOpeningHours: true,
    published: true,
    stats: [stat('12 m', 'výška vyhlídkové plošiny'), stat('1938', 'rok dokončení stavby'), stat('900 t', 'váha dmychadel'), stat('900 m²', 'rozloha expozice')],
  },
  {
    id: 'v-bolt',
    title: 'Bolt Tower',
    summary: 'Vyhlídková nástavba na vrcholu vysoké pece č. 1 s kavárnou a jedinečným výhledem na celý areál i Ostravu.',
    image: imageFor(0),
    tags: ['Atraktivity', 'Gastro'],
    galleryIds: ['g-bolt'],
    colosseumId: 'COL-BOLT-2011',
    accessible: true,
    openState: 'open',
    showOpeningHours: true,
    published: true,
    stats: [stat('78 m', 'výška vyhlídky'), stat('2015', 'rok otevření')],
  },
  {
    id: 'v-hlubina',
    title: 'Důl Hlubina',
    summary: 'Národní kulturní památka — bývalý černouhelný důl s autentickými prostorami a zážitkovými prohlídkami.',
    image: imageFor(5),
    tags: ['Atraktivity'],
    galleryIds: ['g-hlubina'],
    colosseumId: 'COL-HLUB-3301',
    accessible: false,
    openState: 'seasonal',
    showOpeningHours: true,
    published: true,
    stats: [stat('1852', 'rok založení dolu')],
  },
  {
    id: 'v-gong',
    title: 'Multifunkční aula Gong',
    summary: 'Bývalý plynojem přeměněný v multifunkční aulu pro koncerty, konference a společenské akce.',
    image: imageFor(8),
    tags: ['Atraktivity'],
    galleryIds: ['g-gong'],
    colosseumId: '',
    accessible: true,
    openState: 'open',
    showOpeningHours: false,
    published: true,
    stats: [stat('1 500', 'míst k sezení')],
  },
  {
    id: 'v-marycka',
    title: 'Restaurace Maryčka',
    summary: 'Restaurace s industriální atmosférou přímo v areálu — regionální kuchyně a domácí pivo.',
    image: imageFor(9),
    tags: ['Gastro'],
    galleryIds: ['g-gastro'],
    colosseumId: '',
    accessible: true,
    openState: 'open',
    showOpeningHours: true,
    published: true,
  },
  {
    id: 'v-hotel',
    title: 'Ubytování v areálu',
    summary: 'Designové ubytování v srdci industriálního areálu — ideální pro víkendový pobyt i firemní akce.',
    image: imageFor(6),
    tags: ['Ubytování'],
    galleryIds: ['g-hotel'],
    colosseumId: '',
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
  tags: r.tags,
  galleryIds: r.galleryIds,
  colosseumId: r.colosseumId,
  accessible: r.accessible,
  openState: r.openState,
  openingHours: defaultOpeningHours(),
  showOpeningHours: r.showOpeningHours,
  published: r.published,
}))

/** Prázdný objekt pro zakládání. */
export function blankVenue(): AreaObject {
  return {
    id: 'nový',
    title: { cs: '', en: '', de: '', pl: '' },
    summary: { cs: '', en: '', de: '', pl: '' },
    contentBlocks: [],
    stats: [],
    image: '',
    tags: [],
    galleryIds: [],
    colosseumId: '',
    accessible: false,
    openState: 'open',
    openingHours: defaultOpeningHours(),
    showOpeningHours: true,
    published: false,
  }
}

/** Akce napojené na objekt (vazba `areaId` z modulu Kalendář akcí).
    Detail objektu je zobrazuje automaticky — vazba se řídí z akce. */
export function eventsForVenue(id: string): DovEvent[] {
  if (!id || id === 'nový') return []
  return MOCK_EVENTS.filter((e) => e.areaId === id)
}

/** Novinky napojené na objekt (vazba `areaId` z modulu Aktuality).
    Automaticky se propíší do detailu objektu. */
export function relatedNews(v: AreaObject): NewsItem[] {
  if (!v.id || v.id === 'nový') return []
  return MOCK_NEWS.filter((n) => n.areaId === v.id).slice(0, 8)
}
