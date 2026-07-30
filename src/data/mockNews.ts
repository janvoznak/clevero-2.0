import type { NewsItem, GalleryImage, PublishState, LangCode, ML, Tag } from './types'

/** Základní paleta barev štítků — uživatel z ní vybírá při vytvoření nového. */
export const TAG_PALETTE = [
  '#ee703d', // oranžová (brand)
  '#d64545', // červená
  '#d98a15', // jantarová
  '#15916a', // zelená
  '#0e8a8a', // tyrkysová
  '#3b6fb0', // modrá
  '#5b5bd6', // indigo
  '#7b5ea7', // fialová
  '#c2568c', // růžová
  '#64748b', // šedá
] as const

/** Předdefinovaný seznam štítků (uživatel může přidat i vlastní). */
export const PREDEFINED_TAGS: Tag[] = [
  { label: 'Akce', color: '#ee703d' },
  { label: 'Prohlídky', color: '#15916a' },
  { label: 'Festival', color: '#d98a15' },
  { label: 'Výstava', color: '#7b5ea7' },
  { label: 'Pro rodiny', color: '#3b6fb0' },
  { label: 'Sezónní', color: '#0e8a8a' },
  { label: 'Tisková zpráva', color: '#64748b' },
]

/** Barva štítku — z předdefinovaných, jinak fallback z palety (dle názvu). */
export function tagColor(label: string): string {
  const found = PREDEFINED_TAGS.find((t) => t.label.toLowerCase() === label.toLowerCase())
  if (found) return found.color
  let h = 0
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0
  return TAG_PALETTE[h % TAG_PALETTE.length]
}

/** Předdefinovaný seznam kategorií (uživatel může přidat i vlastní).
    Kategorie se chová stejně jako štítky — stejné UI (TagPicker/TagChip) i barevná paleta. */
export const PREDEFINED_CATEGORIES: Tag[] = [
  { label: 'DOV', color: '#ee703d' },
  { label: 'Ateliéry Hlubina', color: '#5b5bd6' },
  { label: 'Bolt Café', color: '#d98a15' },
  { label: 'Brickhouse', color: '#d64545' },
  { label: 'Bufet U Karla', color: '#15916a' },
  { label: 'Cineport', color: '#3b6fb0' },
]

/** Barva kategorie — z předdefinovaných, jinak fallback z palety (dle názvu). */
export function categoryColor(label: string): string {
  const found = PREDEFINED_CATEGORIES.find((c) => c.label.toLowerCase() === label.toLowerCase())
  if (found) return found.color
  let h = 0
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0
  return TAG_PALETTE[h % TAG_PALETTE.length]
}

/** Reálné obrázky (lokálně v public/images). Prototyp — obsah je zástupný. */
const IMAGE_COUNT = 18
export function imageFor(seed: number): string {
  return `/images/g${(((seed % IMAGE_COUNT) + IMAGE_COUNT) % IMAGE_COUNT) + 1}.jpg`
}

function makeGallery(count: number, offset = 0): GalleryImage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `img-${offset}-${i}`,
    src: imageFor(offset * 3 + i),
    alt: `Fotografie ${i + 1}`,
    isMain: i === 0,
  }))
}

/** Vstupní (raw) ML — v mock datech stačí uvést jen některé jazyky; zbytek doplní toML. */
type MLInput = Partial<Record<LangCode, string>>
type RawNews = Omit<
  NewsItem,
  'title' | 'summary' | 'text' | 'metaTitle' | 'metaDescription' | 'metaKeywords'
> & {
  title: MLInput
  summary: MLInput
  text: MLInput
  metaTitle: MLInput
  metaDescription: MLInput
  metaKeywords: MLInput
}

/** Doplní všechny jazyky (chybějící = prázdný řetězec). */
function toML(m: MLInput): ML {
  return { cs: '', en: '', de: '', pl: '', ...m }
}

const empty: MLInput = { cs: '', en: '', de: '' }

const RAW: RawNews[] = [
  {
    id: 'n-2041',
    author: 'Jana Svobodová',
    title: {
      cs: 'Bolt Tower otevírá letní vyhlídkovou sezónu',
      en: 'Bolt Tower opens the summer viewing season',
      de: 'Bolt Tower eröffnet die Sommer-Aussichtssaison',
    },
    summary: {
      cs: 'Nová vyhlídková plošina na vrcholu vysoké pece nabízí výhled na celou Ostravu.',
      en: 'The new observation deck atop the blast furnace offers a view of all of Ostrava.',
      de: '',
    },
    text: {
      cs: '<p>Od 1. července se návštěvníkům otevírá <strong>Bolt Tower</strong> s prodlouženou otevírací dobou.</p>',
      en: '',
      de: '',
    },
    videoLink: 'https://www.youtube.com/watch?v=dov-bolt-tower',
    dateFrom: '2026-07-01T08:00',
    dateTo: '2026-09-30T20:00',
    metaTitle: { cs: 'Bolt Tower — letní sezóna | Dolní Vítkovice', en: '', de: '' },
    metaDescription: { cs: 'Vyhlídka z vrcholu vysoké pece č. 1 v areálu Dolní Vítkovice.', en: '', de: '' },
    metaKeywords: { cs: 'Bolt Tower, vyhlídka, Ostrava, vysoká pec', en: '', de: '' },
    ogImage: null,
    gallery: makeGallery(6, 0),
    attachments: [
      { id: 'a1', name: 'tiskova-zprava-bolt-tower.pdf', size: '248 kB', ext: 'pdf', lang: 'cs' },
      { id: 'a2', name: 'oteviraci-doba-leto.pdf', size: '96 kB', ext: 'pdf', lang: 'cs' },
    ],
    tags: ['Prohlídky', 'Sezónní', 'Tisková zpráva'],
    categories: ['DOV', 'Bolt Café'],
  },
  {
    id: 'n-2038',
    author: 'Petr Dvořák',
    title: {
      cs: 'Colours of Ostrava 2026 — program v Gongu',
      en: 'Colours of Ostrava 2026 — programme at the Gong',
      de: '',
    },
    summary: { cs: 'Doprovodný program festivalu se letos přesouvá do multifunkční auly Gong.', en: '', de: '' },
    text: { cs: '<p>Multifunkční aula <strong>Gong</strong> hostí přednášky a diskuze.</p>', en: '', de: '' },
    videoLink: '',
    dateFrom: '2026-07-15T00:00',
    dateTo: '2026-07-20T23:59',
    metaTitle: empty,
    metaDescription: empty,
    metaKeywords: empty,
    ogImage: null,
    gallery: makeGallery(4, 2),
    attachments: [{ id: 'a3', name: 'program-gong.pdf', size: '512 kB', ext: 'pdf', lang: 'cs' }],
    tags: ['Festival', 'Akce'],
    categories: ['DOV', 'Cineport'],
  },
  {
    id: 'n-2035',
    author: 'Jana Svobodová',
    title: { cs: 'Noční prohlídky Dolu Hlubina', en: 'Night tours of the Hlubina Mine', de: '' },
    summary: { cs: 'Zážitkové prohlídky bývalého černouhelného dolu při svitu lamp.', en: '', de: '' },
    text: { cs: '', en: '', de: '' },
    videoLink: '',
    dateFrom: '2026-08-01T18:00',
    dateTo: null,
    metaTitle: empty,
    metaDescription: empty,
    metaKeywords: empty,
    ogImage: null,
    gallery: makeGallery(3, 1),
    attachments: [],
    tags: ['Prohlídky', 'Akce'],
    categories: ['Ateliéry Hlubina'],
  },
  {
    id: 'n-2030',
    author: 'Martin Kučera',
    title: { cs: 'Velký svět techniky — nová interaktivní expozice', en: '', de: '' },
    summary: { cs: 'Science and technology centrum U6 rozšiřuje expozici o robotiku.', en: '', de: '' },
    text: { cs: '', en: '', de: '' },
    videoLink: '',
    dateFrom: '2026-05-10T09:00',
    dateTo: '2026-06-30T18:00',
    metaTitle: empty,
    metaDescription: empty,
    metaKeywords: empty,
    ogImage: null,
    gallery: makeGallery(5, 3),
    attachments: [],
    tags: ['Výstava', 'Pro rodiny'],
    categories: ['DOV', 'Bufet U Karla'],
  },
  {
    id: 'n-2024',
    author: 'Petr Dvořák',
    title: { cs: 'Adventní trhy v areálu — připravujeme', en: '', de: '' },
    summary: { cs: 'Rozpracovaný koncept vánočních trhů mezi vysokými pecemi.', en: '', de: '' },
    text: { cs: '', en: '', de: '' },
    videoLink: '',
    dateFrom: null,
    dateTo: null,
    metaTitle: empty,
    metaDescription: empty,
    metaKeywords: empty,
    ogImage: null,
    gallery: [],
    attachments: [],
    tags: ['Akce', 'Sezónní'],
    categories: ['Brickhouse', 'DOV'],
  },
  {
    id: 'n-2019',
    author: 'Martin Kučera',
    title: { cs: 'Den otevřených dveří energetické ústředny', en: '', de: '' },
    summary: { cs: 'Komentované prohlídky strojovny a dmychadel.', en: '', de: '' },
    text: { cs: '', en: '', de: '' },
    videoLink: '',
    dateFrom: '2026-03-01T10:00',
    dateTo: '2026-03-02T17:00',
    metaTitle: empty,
    metaDescription: empty,
    metaKeywords: empty,
    ogImage: null,
    gallery: makeGallery(2, 4),
    attachments: [],
    tags: ['Akce', 'Prohlídky'],
    categories: [],
  },
]

/** Normalizace raw dat na plný datový model (doplní všechny jazyky). */
export const MOCK_NEWS: NewsItem[] = RAW.map((r) => ({
  ...r,
  title: toML(r.title),
  summary: toML(r.summary),
  text: toML(r.text),
  metaTitle: toML(r.metaTitle),
  metaDescription: toML(r.metaDescription),
  metaKeywords: toML(r.metaKeywords),
}))

/** Odvození stavu publikace z časového okna OD–DO vůči „dnešku" prototypu. */
export function publishState(item: NewsItem, now = new Date('2026-07-28T12:00:00')): PublishState {
  const from = item.dateFrom ? new Date(item.dateFrom) : null
  const to = item.dateTo ? new Date(item.dateTo) : null
  if (!from && !to) return 'draft'
  if (from && from > now) return 'scheduled'
  if (to && to < now) return 'expired'
  return 'active'
}

export const STATE_META: Record<PublishState, { label: string; dot: string; text: string; bg: string }> = {
  active: { label: 'Publikováno', dot: 'bg-forge-500', text: 'text-forge-600', bg: 'bg-forge-500/10' },
  scheduled: { label: 'Naplánováno', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-500/10' },
  expired: { label: 'Ukončeno', dot: 'bg-steel-400', text: 'text-steel-600', bg: 'bg-steel-200' },
  draft: { label: 'Koncept', dot: 'bg-steel-300', text: 'text-steel-500', bg: 'bg-steel-100' },
}
