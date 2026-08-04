import { imageFor } from './mockNews'
import type { ML, GalleryImage } from './types'

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
  /** Popis sekce (richtext) — úvodní text nad výpisem alb. */
  description: ML
  /** Náhledový obrázek sekce. */
  cover: string
  published: boolean
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
  name: ML
  /** Popis alba (richtext). */
  description: ML
  /** Datum pořízení / konání (nejazykové). null = neuvedeno. */
  date: string | null
  photos: GalleryImage[]
  published: boolean
  /** Průřezové štítky (sdílí paletu s Aktualitami). */
  tags: string[]
  /* SEO (ML) */
  metaTitle: ML
  metaDescription: ML
  metaKeywords: ML
  ogImage: string | null
}

/* ---------- Mock: sekce ---------- */
type RawSection = Omit<GallerySection, 'name' | 'description'> & {
  name: ML
  description: ML
}

const RAW_SECTIONS: RawSection[] = [
  {
    id: 'sec-atraktivity',
    name: ml('Fotografie atraktivit'),
    description: ml('<p>Prohlídkové okruhy, expozice a dominanty areálu Dolní Vítkovice na fotografiích.</p>'),
    cover: imageFor(4),
    published: true,
    order: 1,
  },
  {
    id: 'sec-akce',
    name: ml('Fotografie z akcí'),
    description: ml('<p>Festivaly, koncerty a doprovodný program v areálu.</p>'),
    cover: imageFor(7),
    published: true,
    order: 2,
  },
  {
    id: 'sec-areal',
    name: ml('Areál z výšky'),
    description: ml('<p>Letecké a panoramatické snímky celého areálu.</p>'),
    cover: imageFor(1),
    published: true,
    order: 3,
  },
  {
    id: 'sec-sluzby',
    name: ml('Ubytování a gastronomie'),
    description: ml('<p>Restaurace, kavárny a ubytovací kapacity v areálu.</p>'),
    cover: imageFor(9),
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
  name: string
  count: number
  seed: number
  published?: boolean
  date?: string | null
  tags?: string[]
}

const RAW_GALLERIES: RawGallery[] = [
  { id: 'g-u6', sectionId: 'sec-atraktivity', areaId: 'v-u6', name: 'Malý svět techniky U6', count: 24, seed: 4, date: '2026-05-18', tags: ['Pro rodiny'] },
  { id: 'g-bolt', sectionId: 'sec-atraktivity', areaId: 'v-bolt', name: 'Bolt Tower', count: 18, seed: 0, date: '2026-06-02', tags: ['Sezónní'] },
  { id: 'g-hlubina', sectionId: 'sec-atraktivity', areaId: 'v-hlubina', name: 'Důl Hlubina', count: 31, seed: 5, date: '2026-04-11', tags: ['Prohlídky'] },
  { id: 'g-gong', sectionId: 'sec-atraktivity', areaId: 'v-gong', name: 'Gong — multifunkční aula', count: 15, seed: 8, date: '2026-03-22' },
  { id: 'g-technika', sectionId: 'sec-atraktivity', areaId: 'v-u6', name: 'Velký svět techniky', count: 27, seed: 13, date: '2026-05-30', tags: ['Pro rodiny', 'Výstava'] },
  { id: 'g-galerie', sectionId: 'sec-akce', areaId: 'v-galerie', name: 'Galerie Gong — výstavy', count: 20, seed: 3, date: '2026-06-14', tags: ['Výstava'] },
  { id: 'g-akce', sectionId: 'sec-akce', areaId: 'v-areal', name: 'Akce a festivaly', count: 56, seed: 7, date: '2026-07-19', tags: ['Festival', 'Akce'] },
  { id: 'g-areal', sectionId: 'sec-areal', areaId: 'v-areal', name: 'Areál DOV — letecké snímky', count: 42, seed: 1, date: '2026-05-05' },
  { id: 'g-hotel', sectionId: 'sec-sluzby', areaId: 'v-hotel', name: 'Ubytování v areálu', count: 12, seed: 6, published: false, date: null },
  { id: 'g-gastro', sectionId: 'sec-sluzby', areaId: 'v-marycka', name: 'Restaurace a kavárny', count: 19, seed: 9, date: '2026-04-28' },
]

export const MOCK_GALLERIES: Gallery[] = RAW_GALLERIES.map((r) => ({
  id: r.id,
  sectionId: r.sectionId,
  areaId: r.areaId ?? '',
  name: ml(r.name),
  description: emptyML(),
  date: r.date === undefined ? null : r.date,
  photos: makePhotos(r.count, r.seed),
  published: r.published ?? true,
  tags: r.tags ?? [],
  metaTitle: emptyML(),
  metaDescription: emptyML(),
  metaKeywords: emptyML(),
  ogImage: null,
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

/* ---------- Prázdné entity (Nová sekce / Nové album) ---------- */
export function blankSection(): GallerySection {
  return {
    id: 'nová',
    name: emptyML(),
    description: emptyML(),
    cover: '',
    published: false,
    order: MOCK_SECTIONS.length + 1,
  }
}
export function blankGallery(sectionId = ''): Gallery {
  return {
    id: 'nové',
    sectionId: sectionId || MOCK_SECTIONS[0]?.id || '',
    areaId: '',
    name: emptyML(),
    description: emptyML(),
    date: null,
    photos: [],
    published: false,
    tags: [],
    metaTitle: emptyML(),
    metaDescription: emptyML(),
    metaKeywords: emptyML(),
    ogImage: null,
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
