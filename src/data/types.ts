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

export interface NewsItem {
  id: string
  /** Autor aktuality (redaktor). */
  author: string
  /** Nadpis (ML) — v seznamu zobrazujeme CZ. */
  title: ML
  summary: ML
  text: ML
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
  /** Kategorie (průřezové, nezávislé na jazyce) — chová se stejně jako štítky.
      Zároveň párují aktualitu s objektem v Areálu. */
  categories: string[]
}

/** Předdefinovaný štítek s barvou (barva = hex, kvůli jednoduchosti mimo Tailwind shade). */
export interface Tag {
  label: string
  color: string
}

export type PublishState = 'active' | 'scheduled' | 'expired' | 'draft'
