/** Datový model modulu Aktuality (entita `news`) — dle specifikace. */

export type LangCode = 'cs' | 'en' | 'de' | 'pl'

export interface Lang {
  code: LangCode
  label: string
  flag: string
}

/** Zdrojový jazyk obsahu (z něj se překládá). */
export const SOURCE_LANG: LangCode = 'cs'

export const LANGS: Lang[] = [
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
]

/** Vícejazyčná (ML) pole — hodnota per jazyk. */
export type ML = Record<LangCode, string>

export interface GalleryImage {
  id: string
  /** Zdroj náhledu (v prototypu gradient placeholder nebo data-URL). */
  src: string
  alt: string
  /** Hlavní obrázek = pozice 0 v poli / ručně označená hvězdou. */
  isMain?: boolean
}

export interface Attachment {
  id: string
  name: string
  size: string
  ext: string
  /** Přílohy mohou být specifické pro jazyk (ML). */
  lang: LangCode
}

/** Blok obsahu (ContentBuilder) — grafický vzor. Sdílený napříč moduly;
    v prototypu vizuální zástupka (bez reálného textu, řídí jen náhled). */
export interface ContentBlock {
  id: string
  kind: string
  /** Text bloku rozepsaný DOVíkem (jinak náhled používá zástupný text). */
  text?: string
}
/** Výchozí sada bloků pro nový obsah — ContentBuilder nezačíná prázdný. */
export function defaultContentBlocks(): ContentBlock[] {
  return [
    { id: 'cb-default-hero', kind: 'hero' },
    { id: 'cb-default-lead', kind: 'lead' },
    { id: 'cb-default-text', kind: 'paragraph' },
    { id: 'cb-default-image', kind: 'image' },
  ]
}

export interface NewsItem {
  id: string
  /** Autor aktuality (redaktor). */
  author: string
  /** Nadpis (ML) — v seznamu zobrazujeme CZ. */
  title: ML
  /** Část URL (slug) — ML. Titulek/meta se odvozují automaticky. */
  slug?: ML
  summary: ML
  text: ML
  /** Které jazykové mutace jsou zveřejněné (živě na webu). Publikování je per
      jazyk — společné časové okno (dateFrom/dateTo) řídí, KDY je aktualita živá,
      tento seznam řídí, KTERÉ mutace se zobrazí. Prázdná mutace nemůže být živá.
      Nevyplněno (undefined) = zpětně kompatibilní fallback: všechny vyplněné. */
  publishedLangs?: LangCode[]
  /** Obsah aktuality jako bloky (ContentBuilder) — jednotná sekce „Obsah". */
  contentBlocks?: ContentBlock[]
  videoLink: string
  dateFrom: string | null
  dateTo: string | null
  metaTitle: ML
  metaDescription: ML
  metaKeywords: ML
  ogImage: string | null
  gallery: GalleryImage[]
  attachments: Attachment[]
  /** Štítky (průřezové, nezávislé na jazyce) — z předdefinovaných nebo vlastní. */
  tags: string[]
  /** Kategorie (průřezové, nezávislé na jazyce) — obsahové štítky. */
  categories: string[]
  /** Vazba na objekt v Areálu (ID objektu, '' = nepropojeno). */
  areaId: string
  /** Související prohlídky (ID z modulu Prohlídky). */
  tourIds: string[]
  /** Připojené fotogalerie (ID z modulu Galerie). */
  galleryIds?: string[]
}

/** Předdefinovaný štítek s barvou (barva = hex, kvůli jednoduchosti mimo Tailwind shade). */
export interface Tag {
  label: string
  color: string
}

export type PublishState = 'active' | 'scheduled' | 'expired' | 'draft'
