/** Datový model modulu Aktuality (entita `news`) — dle specifikace. */

export type LangCode = 'cs' | 'en' | 'de'

export interface Lang {
  code: LangCode
  label: string
  flag: string
}

export const LANGS: Lang[] = [
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
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
}

export type PublishState = 'active' | 'scheduled' | 'expired' | 'draft'
