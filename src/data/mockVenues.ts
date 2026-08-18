import { imageFor, TAG_PALETTE } from './mockNews'
import { defaultOpeningHours } from './mockPages'
import { defaultContentBlocks, LANGS } from './types'
import type { ML, Tag, GalleryImage, LangCode } from './types'
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
  /** Část URL (slug) — ML, auto z názvu objektu. */
  slug?: ML
  /** Popis budovy skládaný z bloků (blokový editor jako Stránky). */
  contentBlocks: ContentBlock[]
  /** Zajímavá čísla / statistiky. */
  stats: VenueStat[]
  /** Hlavní obrázek objektu. */
  image: string
  /** Barva místa (řádek/pruh v kalendáři akcí). */
  color: string
  /** Klíč vestavěné siluety (VenueSilhouette): areal|bolt|gong|galerie|technika|hlubina|hopjump|lezecka.
      Použije se jako fallback, když objekt nemá vlastní nahrané SVG (`silhouetteSvg`). */
  silhouette: string
  /** Vlastní nahraná silueta objektu jako sanitizované SVG (má přednost před `silhouette`).
      Prázdné = použije se vestavěný tvar podle `silhouette`. */
  silhouetteSvg?: string
  /** Štítky (Gastro / Atraktivity / Ubytování / vlastní). */
  tags: string[]
  /** Základní fotky objektu (inline galerie — statické, mění se málo). */
  photos: GalleryImage[]
  /** Připojené fotogalerie (ID z modulu Galerie). */
  galleryIds?: string[]
  /** Bezbariérový přístup. */
  accessible: boolean
  /** Provozní stav (nadřazený otevírací době: „closed" = na webu zavřeno). */
  openState: OpenState
  /** Poznámka k provozu zobrazená na webu (ML) — např. „Zavřeno kvůli rekonstrukci do jara 2027". */
  statusNote: ML
  openingHours: OpeningDay[]
  showOpeningHours: boolean
  /** Důvod uzavření (jen když openState = 'closed'): kvůli akci vs. rekonstrukce.
      Rozlišuje, jestli má dashboard nabízet „znovu otevřít" po skončení akce. */
  closureReason?: 'event' | 'maintenance'
  /** ID akce, kvůli které je budova zavřená (openState='closed', closureReason='event'). */
  closureEventId?: string
  published: boolean
  /** Zveřejněné jazykové mutace (které se na webu zobrazí). Bez seznamu = všechny vyplněné. */
  publishedLangs?: LangCode[]
  /** Hlavní přidružená stránka objektu (ID z modulu Stránky). Kořen skupiny
      přidružených stránek (hlavní stránka + podstránky + externí odkazy),
      která se zobrazí jako záložky v detailu budovy. */
  mainPageId?: string
  /** Individuální záložky přidružených stránek (kopírují záložky na FE webu) —
      zobrazí se v detailu budovy za záložkou Galerie. Každá má vlastní obsah
      (blokový editor). Per budova. */
  pageTabs?: AreaPageTab[]
}

/** Jedna přidružená záložka budovy — kopíruje záložku na FE webu; má vlastní obsah. */
export interface AreaPageTab {
  /** Název záložky (např. Expozice, Vstupenky, Pro školy). */
  label: string
  /** Obsah záložky — blokový editor (ContentBuilder). */
  contentBlocks: ContentBlock[]
}

function ml(cs: string, extra?: Partial<Record<LangCode, string>>): ML {
  return { cs, en: '', de: '', pl: '', ...extra }
}
function stat(value: string, label: string): VenueStat {
  return { id: `${value}-${label}`, value, label }
}

type RawVenue = {
  id: string
  title: string
  /** Přeložené názvy (mimo CS) — kvůli ukázce stavu publikace per jazyk. */
  titleI18n?: Partial<Record<LangCode, string>>
  summary: string
  image: string
  color: string
  silhouette: string
  tags: string[]
  accessible: boolean
  openState: OpenState
  statusNote?: string
  showOpeningHours: boolean
  published: boolean
  /** Důvod uzavření (kvůli akci vs. rekonstrukce). */
  closureReason?: 'event' | 'maintenance'
  /** ID akce, kvůli které je budova zavřená. */
  closureEventId?: string
  /** Explicitně zveřejněné mutace (bez seznamu = všechny vyplněné). */
  publishedLangs?: LangCode[]
  stats?: VenueStat[]
  photos?: GalleryImage[]
  /** Hlavní přidružená stránka objektu (ID z modulu Stránky). */
  mainPageId?: string
  /** Individuální záložky přidružených stránek (kopírují jejich názvy). */
  pageTabs?: string[]
}

/** Základní fotky objektu (prototyp — placeholdery přes imageFor). */
function vphotos(n: number, offset: number): GalleryImage[] {
  return Array.from({ length: n }, (_, i) => ({ id: `ph-${offset}-${i}`, src: imageFor(offset + i), alt: `Foto ${i + 1}`, isMain: i === 0 }))
}

/* Seznam budov dle skutečnosti (pořadí = výpis v modulu Areál). ID zachována
   kvůli vazbám z jiných modulů (akce, galerie, novinky, prohlídky). */
const RAW: RawVenue[] = [
  {
    id: 'v-bolt',
    title: 'Bolt Tower',
    titleI18n: { en: 'Bolt Tower', de: 'Bolt Tower' },
    summary: 'Vyhlídková nástavba na vrcholu vysoké pece č. 1 s kavárnou a jedinečným výhledem na celý areál i Ostravu.',
    image: imageFor(0),
    color: '#ee703d',
    silhouette: 'bolt',
    tags: ['Atraktivity', 'Gastro'],
    photos: vphotos(4, 0),
    accessible: true,
    openState: 'open',
    showOpeningHours: true,
    published: true,
    // Němčina je vyplněná, ale zatím skrytá na webu → stav „připraveno" (amber).
    publishedLangs: ['cs', 'en'],
    stats: [stat('78 m', 'výška vyhlídky'), stat('2015', 'rok otevření')],
  },
  {
    id: 'v-areal',
    title: 'Velký svět techniky',
    titleI18n: { en: 'Big World of Technology' },
    summary: 'Science centrum s interaktivními expozicemi — stovky exponátů, kde si vědu a techniku vyzkoušíte na vlastní kůži.',
    image: imageFor(1),
    color: '#1f7a8c',
    silhouette: 'technika',
    tags: ['Atraktivity'],
    accessible: true,
    openState: 'open',
    showOpeningHours: true,
    published: true,
    stats: [stat('14 000 m²', 'plocha expozic'), stat('2014', 'rok otevření')],
  },
  {
    id: 'v-u6',
    title: 'Malý svět techniky U6',
    titleI18n: { en: 'Small World of Technology U6' },
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
    // Angličtina je vyplněná, ale zatím skrytá na webu → stav „připraveno" (amber).
    publishedLangs: ['cs'],
    stats: [stat('12 m', 'výška vyhlídkové plošiny'), stat('1938', 'rok dokončení stavby'), stat('900 t', 'váha dmychadel'), stat('900 m²', 'rozloha expozice')],
  },
  {
    id: 'v-hotel',
    title: 'Dětský svět',
    summary: 'Zábavní a herní prostor pro nejmenší — bezpečné hraní, prolézačky a kreativní koutky přímo v areálu.',
    image: imageFor(7),
    color: '#e0762a',
    silhouette: 'areal',
    tags: ['Atraktivity'],
    accessible: true,
    openState: 'open',
    showOpeningHours: true,
    published: true,
  },
  {
    id: 'v-gong',
    title: 'Gong',
    summary: 'Bývalý plynojem přeměněný v multifunkční aulu pro koncerty, konference a společenské akce.',
    image: imageFor(8),
    color: '#7b5ea7',
    silhouette: 'gong',
    tags: ['Atraktivity'],
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
    id: 'v-hlubina',
    title: 'Hornické muzeum',
    summary: 'Expozice o hornické historii v autentických prostorách bývalého dolu — zážitkové prohlídky s průvodcem.',
    image: imageFor(5),
    color: '#b04f20',
    silhouette: 'hlubina',
    tags: ['Atraktivity'],
    photos: vphotos(3, 5),
    accessible: false,
    openState: 'seasonal',
    statusNote: 'Sezónní provoz duben–říjen. Mimo sezónu jen po předchozí domluvě pro skupiny.',
    showOpeningHours: true,
    published: true,
    stats: [stat('1852', 'rok založení dolu')],
  },
  {
    id: 'v-marycka',
    title: 'Heligonka',
    summary: 'Komorní klubová scéna v areálu — koncerty, besedy a společenské večery v industriální atmosféře.',
    image: imageFor(6),
    color: '#e0a52a',
    silhouette: 'areal',
    tags: ['Atraktivity', 'Gastro'],
    accessible: true,
    // Zůstala omylem zavřená po skončené soukromé akci → dashboard nabídne otevřít.
    openState: 'closed',
    closureReason: 'event',
    closureEventId: 'e-firemniden',
    showOpeningHours: true,
    published: true,
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
    id: 'v-nzm',
    title: 'Národní zemědělské muzeum',
    summary: 'Pobočka Národního zemědělského muzea v areálu — expozice o zemědělství, potravinách a životě na venkově.',
    image: imageFor(2),
    color: '#6a9a3b',
    silhouette: 'technika',
    tags: ['Atraktivity'],
    accessible: true,
    openState: 'open',
    showOpeningHours: true,
    published: true,
  },
  {
    id: 'v-fajnadilna',
    title: 'Fajna Dilna',
    summary: 'Kreativní a řemeslné dílny pro děti i dospělé — tvořivé workshopy a maker space v industriálním prostředí.',
    image: imageFor(11),
    color: '#cf6a4c',
    silhouette: 'areal',
    tags: ['Atraktivity'],
    accessible: true,
    openState: 'open',
    showOpeningHours: true,
    published: true,
  },
  {
    id: 'v-futureum',
    title: 'FUTUREUM',
    summary: 'Interaktivní expozice o budoucnosti, vědě a inovacích — pohled na svět zítřka pro celou rodinu.',
    image: imageFor(12),
    color: '#5b5bd6',
    silhouette: 'technika',
    tags: ['Atraktivity'],
    accessible: true,
    // Zavřeno kvůli dokončování expozice (ne kvůli akci) → dashboard „nehoní".
    openState: 'closed',
    closureReason: 'maintenance',
    statusNote: 'Otevření nové expozice připravujeme.',
    showOpeningHours: true,
    published: false,
  },
]

/** Výchozí záložky přidružených stránek — kopírují záložky na FE webu.
    Stejné pro všechny budovy (lze přepsat per budova polem RawVenue.pageTabs). */
export const DEFAULT_PAGE_TAB_LABELS = ['Expozice', 'Vstupenky', 'Pro školy']
/** Sestaví záložky s vlastní výchozí sadou bloků (unikátní ID přes index). */
function makePageTabs(labels: string[]): AreaPageTab[] {
  return labels.map((label, i) => ({
    label,
    contentBlocks: defaultContentBlocks().map((b) => ({ ...b, id: `${b.id}-pt${i}` })),
  }))
}

export const MOCK_VENUES: AreaObject[] = RAW.map((r) => ({
  id: r.id,
  title: ml(r.title, r.titleI18n),
  summary: ml(r.summary),
  contentBlocks: defaultContentBlocks(),
  stats: r.stats ?? [],
  image: r.image,
  color: r.color,
  silhouette: r.silhouette,
  tags: r.tags,
  photos: r.photos ?? [],
  accessible: r.accessible,
  openState: r.openState,
  statusNote: ml(r.statusNote ?? ''),
  openingHours: defaultOpeningHours(),
  showOpeningHours: r.showOpeningHours,
  published: r.published,
  closureReason: r.closureReason,
  closureEventId: r.closureEventId,
  publishedLangs: r.publishedLangs,
  mainPageId: r.mainPageId,
  // Všechny budovy mají stejné záložky (Expozice/Vstupenky/Pro školy), pokud si
  // budova neurčí vlastní přes RawVenue.pageTabs.
  pageTabs: makePageTabs(r.pageTabs ?? DEFAULT_PAGE_TAB_LABELS),
}))

/** Vyhledání místa/objektu podle ID (pro kalendář, výpisy, detaily akcí). */
export function areaPlace(id: string): AreaObject | undefined {
  return MOCK_VENUES.find((v) => v.id === id)
}

/** Volby míst pro výběr v jiných modulech (Kalendář akcí). */
export const PLACE_OPTIONS = MOCK_VENUES.map((v) => ({ value: v.id, label: v.title.cs }))

/** Položky míst pro multi-výběr (RelationPicker) — s barvou a siluetou objektu. */
export const PLACE_ITEMS = MOCK_VENUES.map((v) => ({ id: v.id, label: v.title.cs, color: v.color, silhouette: v.silhouette, silhouetteSvg: v.silhouetteSvg }))

/** Výchozí místo pro nové akce (celý areál). */
export const DEFAULT_PLACE_ID = 'v-areal'

/** Prázdný objekt pro zakládání. */
export function blankVenue(): AreaObject {
  return {
    id: 'nový',
    title: { cs: '', en: '', de: '', pl: '' },
    summary: { cs: '', en: '', de: '', pl: '' },
    contentBlocks: defaultContentBlocks(),
    stats: [],
    image: '',
    color: '#64748b',
    silhouette: 'areal',
    tags: [],
    photos: [],
    accessible: false,
    openState: 'open',
    statusNote: { cs: '', en: '', de: '', pl: '' },
    openingHours: defaultOpeningHours(),
    showOpeningHours: true,
    published: false,
    // Nový objekt: každá mutace půjde živě, jakmile dostane obsah.
    publishedLangs: LANGS.map((l) => l.code),
    // Nová budova má stejné záložky jako ostatní.
    pageTabs: makePageTabs(DEFAULT_PAGE_TAB_LABELS),
  }
}
