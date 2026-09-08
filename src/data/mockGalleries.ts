import { imageFor } from './mockNews'
import type { ML, GalleryImage, LangCode } from './types'

/* ============================================================
   Modul Galerie.
   Struktura odpovídá webu (dolnivitkovice.cz/galerie/):
     Sekce (GallerySection)  →  Galerie / album (Gallery)  →  fotky.
   „Fotografie atraktivit" je sekce, „Malý svět techniky U6" je album v ní.

   Vazba Areál → Galerie (venue.galleryIds) míří na ID alba (`Gallery.id`);
   ID se zde proto NEMĚNÍ (g-u6, g-bolt, …), aby zůstala funkční. Vlastníkem
   té vazby je Areál — v tomto modulu se needituje, jen se zrcadlí (read-only).
   ============================================================ */

/** „Dnešek" prototypu — pro odvození stavu zveřejnění alba. */
export const GALLERIES_NOW = new Date('2026-07-28T12:00:00')

function ml(cs: string): ML {
  return { cs, en: '', de: '', pl: '' }
}
function emptyML(): ML {
  return { cs: '', en: '', de: '', pl: '' }
}

/** Fotky alba (prototyp — placeholdery přes imageFor). */
function makePhotos(count: number, seed = 0): GalleryImage[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `gp-${seed}-${i}`,
    src: imageFor(seed * 3 + i),
    alt: `Fotografie ${i + 1}`,
    isMain: i === 0,
  }))
}

/* ---------- Sekce galerie (top-level rubrika) ---------- */
export interface GallerySection {
  id: string
  name: ML
  /* Popis ani náhledový obrázek sekce tu nejsou: sekce je na webu jen
     filtrovací záložka nad výpisem, vlastní stránku nemá (rozhodnutí 00/41,
     nálezy 03/05 a 03/12). Publikace po jazycích zůstává. */
  published: boolean
  /** Které jazykové mutace jdou živě na web (undefined = všechny vyplněné). */
  publishedLangs?: LangCode[]
  /** Pořadí ve výpisu na webu (nižší = dřív). */
  order: number
}

/* ---------- Galerie / album (sada fotografií v sekci) ---------- */
export interface Gallery {
  id: string
  /** Sekce, do níž album patří. */
  sectionId: string
  /** Objekt v Areálu, pro který je galerie určená ('' = nepropojeno).
      Vlastníkem této vazby je modul Galerie (nastavuje se zde) — Areál ji jen
      zrcadlí (read-only). */
  areaId: string
  /** Akce, ze které album je ('' = není z akce). Vazbu vlastní album —
      v Kalendáři akcí se needituje, jen zrcadlí (rozhodnutí 00/44, nález 03/08). */
  eventId: string
  name: ML
  /** Část URL (slug) — ML. Titulek/meta se odvozují automaticky. */
  slug?: ML
  /** Perex albumu — věta pod názvem; web z ní plní i popisek pro vyhledávače
      (rozhodnutí 00/04 a 00/45). Nahradil blokový editor v záložce Obsah. */
  perex: ML
  /** Pořadí ve výpisu sekce na webu (nižší = dřív) — mění se přetažením. */
  order: number
  photos: GalleryImage[]
  published: boolean
  /** Které jazykové mutace jdou živě na web (undefined = všechny vyplněné). */
  publishedLangs?: LangCode[]
  /** Průřezové štítky (sdílí paletu s Aktualitami). */
  tags: string[]
  /* SEO (ML) */
  /* SEO pole tu nejsou — titulek i popisek web odvozuje z názvu a perexu
     (rozhodnutí 00/24, nález 03/13). */
}

/* ---------- Mock: sekce ---------- */
type RawSection = GallerySection

const RAW_SECTIONS: RawSection[] = [
  {
    id: 'sec-atraktivity',
    // EN mutace je vyplněná, ale záměrně skrytá z webu → amber „připraveno".
    name: { cs: 'Fotografie atraktivit', en: 'Photos of attractions', de: '', pl: '' },
    published: true,
    publishedLangs: ['cs'],
    order: 1,
  },
  {
    id: 'sec-akce',
    name: ml('Fotografie z akcí'),
    published: true,
    order: 2,
  },
  {
    id: 'sec-areal',
    name: ml('Areál z výšky'),
    published: true,
    order: 3,
  },
  {
    id: 'sec-sluzby',
    name: ml('Ubytování a gastronomie'),
    published: false,
    order: 4,
  },
]

export const MOCK_SECTIONS: GallerySection[] = RAW_SECTIONS.slice().sort((a, b) => a.order - b.order)

/* ---------- Mock: alba ----------
   ID (g-*) odpovídají hodnotám ve venue.galleryIds — NEMĚNIT. */
type RawGallery = {
  id: string
  sectionId: string
  /** Objekt v Areálu, pro který je galerie určená (viz Gallery.areaId). */
  areaId?: string
  /** Akce, ze které album je (viz Gallery.eventId). */
  eventId?: string
  /** Perex albumu (jen CZ — ostatní mutace doplní překlad). */
  perex?: string
  name: string
  /** Vyplněná anglická mutace názvu (pro demo jazykových mutací). */
  nameEn?: string
  count: number
  seed: number
  published?: boolean
  tags?: string[]
  /** Explicitně zveřejněné mutace (undefined = všechny vyplněné jdou živě). */
  publishedLangs?: LangCode[]
}

const RAW_GALLERIES: RawGallery[] = [
  // EN mutace názvu je vyplněná, ale skrytá z webu (publishedLangs bez 'en') → amber „připraveno".
  { id: 'g-u6', perex: 'Interaktivní expozice v historické VI. energetické ústředně.', sectionId: 'sec-atraktivity', areaId: 'v-u6', name: 'Malý svět techniky U6', nameEn: 'Small World of Technology U6', count: 24, seed: 4, tags: ['Pro rodiny'], publishedLangs: ['cs'] },
  { id: 'g-bolt', perex: 'Nejvyšší vyhlídka v Ostravě — 80 m nad areálem.', sectionId: 'sec-atraktivity', areaId: 'v-bolt', name: 'Bolt Tower', count: 18, seed: 0, tags: ['Sezónní'] },
  { id: 'g-hlubina', perex: 'Původní provozy dolu Hlubina a těžní věž.', sectionId: 'sec-atraktivity', areaId: 'v-hlubina', name: 'Důl Hlubina', count: 31, seed: 5, tags: ['Prohlídky'] },
  { id: 'g-gong', sectionId: 'sec-atraktivity', areaId: 'v-gong', name: 'Gong — multifunkční aula', count: 15, seed: 8 },
  { id: 'g-technika', sectionId: 'sec-atraktivity', areaId: 'v-u6', name: 'Velký svět techniky', count: 27, seed: 13, tags: ['Pro rodiny', 'Výstava'] },
  { id: 'g-galerie', sectionId: 'sec-akce', areaId: 'v-galerie', name: 'Galerie Gong — výstavy', count: 20, seed: 3, tags: ['Výstava'] },
  { id: 'g-akce', eventId: 'e-plameny', perex: 'Fotografie z festivalu Ostrava v plamenech.', sectionId: 'sec-akce', areaId: 'v-areal', name: 'Akce a festivaly', count: 56, seed: 7, tags: ['Festival', 'Akce'] },
  { id: 'g-areal', perex: 'Letecké snímky celého areálu Dolních Vítkovic.', sectionId: 'sec-areal', areaId: 'v-areal', name: 'Areál DOV — letecké snímky', count: 42, seed: 1 },
  { id: 'g-hotel', sectionId: 'sec-sluzby', areaId: 'v-hotel', name: 'Ubytování v areálu', count: 12, seed: 6, published: false },
  { id: 'g-gastro', sectionId: 'sec-sluzby', areaId: 'v-marycka', name: 'Restaurace a kavárny', count: 19, seed: 9 },
]

export const MOCK_GALLERIES: Gallery[] = RAW_GALLERIES.map((r, i) => ({
  id: r.id,
  sectionId: r.sectionId,
  areaId: r.areaId ?? '',
  eventId: r.eventId ?? '',
  name: { cs: r.name, en: r.nameEn ?? '', de: '', pl: '' },
  perex: r.perex ? ml(r.perex) : emptyML(),
  order: i + 1,
  photos: makePhotos(r.count, r.seed),
  published: r.published ?? true,
  publishedLangs: r.publishedLangs,
  tags: r.tags ?? [],
}))

/* ---------- Odvozovací helpery ---------- */
/** Náhledová (hlavní) fotka alba — hvězdička nebo první v pořadí. */
export function galleryCover(g: Gallery): string {
  return (g.photos.find((p) => p.isMain) ?? g.photos[0])?.src ?? ''
}
/** Počet fotek v albu. */
export function galleryCount(g: Gallery): number {
  return g.photos.length
}
/** Alba v dané sekci. */
export function galleriesInSection(sectionId: string): Gallery[] {
  return MOCK_GALLERIES.filter((g) => g.sectionId === sectionId)
}
/** Galerie určené pro daný objekt v Areálu (zrcadlo vazby — Areál je read-only). */
export function galleriesForVenue(venueId: string): Gallery[] {
  return MOCK_GALLERIES.filter((g) => g.areaId === venueId)
}
/** Alba z dané akce (zrcadlo vazby — Kalendář akcí je read-only). */
export function galleriesForEvent(eventId: string): Gallery[] {
  return MOCK_GALLERIES.filter((g) => g.eventId === eventId)
}
export function gallery(id: string): Gallery | undefined {
  return MOCK_GALLERIES.find((g) => g.id === id)
}
export function section(id: string): GallerySection | undefined {
  return MOCK_SECTIONS.find((s) => s.id === id)
}

/** Možnosti pro AppSelect „Zařazení do sekce". */
export function sectionOptions(): { value: string; label: string }[] {
  return MOCK_SECTIONS.map((s) => ({ value: s.id, label: s.name.cs }))
}

/** Položky pro výběr galerií v jiných modulech (Kalendář akcí) —
    kompatibilní s `RelItem` sdílené `RelationPicker`. */
export function galleryOptionsList(): { id: string; label: string; sub: string; thumb: string }[] {
  return MOCK_GALLERIES.map((g) => ({
    id: g.id,
    label: g.name.cs,
    sub: `${galleryCount(g)} fotek${section(g.sectionId)?.name.cs ? ' · ' + section(g.sectionId)!.name.cs : ''}`,
    thumb: galleryCover(g),
  }))
}

/* ---------- Prázdné entity (Nová sekce / Nové album) ---------- */
export function blankSection(): GallerySection {
  return {
    id: 'nová',
    name: emptyML(),
    published: false,
    order: MOCK_SECTIONS.length + 1,
  }
}
export function blankGallery(sectionId = ''): Gallery {
  return {
    id: 'nové',
    sectionId: sectionId || MOCK_SECTIONS[0]?.id || '',
    areaId: '',
    eventId: '',
    name: emptyML(),
    perex: emptyML(),
    order: MOCK_GALLERIES.length + 1,
    photos: [],
    published: false,
    tags: [],
  }
}

/* ---------- Odvození stavu zveřejnění alba (pro odznak v seznamu) ---------- */
export type GalleryState = 'published' | 'draft'
export const GALLERY_STATE_META: Record<GalleryState, { label: string; dot: string; text: string; bg: string }> = {
  published: { label: 'Zveřejněno', dot: 'bg-forge-500', text: 'text-forge-600', bg: 'bg-forge-500/10' },
  draft: { label: 'Koncept', dot: 'bg-steel-300', text: 'text-steel-500', bg: 'bg-steel-100' },
}
export function galleryState(g: Gallery): GalleryState {
  return g.published ? 'published' : 'draft'
}
