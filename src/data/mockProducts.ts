import { imageFor } from './mockNews'
import type { ML, GalleryImage, LangCode, ContentBlock } from './types'

/* ============================================================
   Modul „Produkty" (e-shop).
   Zboží a vouchery se IMPORTUJÍ z Colossea (ID, název, cena, sklad) —
   tato pole jsou READ-ONLY, tahají se přes API. Přínos je synchronizace
   dostupnosti. Popis (richtext), obrázky (galerie) a členění (naše
   kategorie) se doplňují v CMS, protože Colosseum pro ně nemá pole.
   Přidání do košíku (zboží i voucheru) směruje do Colossea.
   V prototypu jsou to mock data — žádné volání API.
   ============================================================ */

export const PRODUCTS_NOW = new Date('2026-08-05T12:00:00')

function ml(cs: string): ML {
  return { cs, en: '', de: '', pl: '' }
}

/* ---------- Číselník typu zboží (z Colossea) ----------
   Orientační dle číselníku „typ zboží" v Colosseu. Pro chování košíku je
   podstatné jen zboží vs. voucher (kupón) — dokumentace Colossea rozlišuje
   operace „přidání zboží do košíku" a „přidání kuponu (voucher)". */
export type ProductType = 'goods' | 'voucher' | 'publication' | 'souvenir'

export const PRODUCT_TYPE_META: Record<ProductType, { label: string; icon: string; short: string }> = {
  goods: { label: 'Zboží', icon: 'box', short: 'zboží' },
  voucher: { label: 'Voucher', icon: 'tag', short: 'voucher' },
  publication: { label: 'Publikace', icon: 'blog', short: 'publikace' },
  souvenir: { label: 'Suvenýr', icon: 'star', short: 'suvenýr' },
}

export const PRODUCT_TYPE_OPTIONS = [
  { value: 'all', label: 'Všechny typy' },
  ...(Object.keys(PRODUCT_TYPE_META) as ProductType[]).map((t) => ({ value: t, label: PRODUCT_TYPE_META[t].label })),
]

/* ---------- Členění (kategorie produktů, ovládané v CMS) ---------- */
export interface ProductCategory {
  id: string
  name: ML
  /** Popis členění (richtext). */
  description: ML
  image: string
  published: boolean
}

/* ---------- Produkt ---------- */
export interface Product {
  id: string
  /** Typ zboží dle číselníku Colossea. */
  type: ProductType

  /* --- Data z Colossea (read-only, synchronizovaná) --- */
  /** Unikátní ID zboží v Colosseu. */
  colosseumId: string
  /** Název z Colossea (jednojazyčný, needitovatelný). */
  name: string
  /** Cena v Kč (z Colossea). */
  price: number
  /** Počet dostupných kusů na skladě (z Colossea). */
  stock: number
  /** Jediný obrázek z Colossea (Colosseum víc obrázků nemá). */
  colosseumImage: string
  /** Kdy bylo zboží naimportováno z Colossea (ISO). */
  importedAt: string
  /** Poslední synchronizace s Colosseem (ISO). */
  syncedAt: string

  /* --- Obsah doplňovaný v CMS (editovatelné) --- */
  /** Přeložený/upravený název pro web (ML). Prázdné = použije se název z Colossea. */
  nameOverride: ML
  /** Formátovaný popis produktu (richtext, ML). */
  description: ML
  /** Obsah produktu jako bloky (ContentBuilder) — jednotná sekce „Obsah". */
  contentBlocks?: ContentBlock[]
  /** Fotogalerie doplněná v CMS (Colosseum má jen jeden obrázek). */
  gallery: GalleryImage[]
  /** Členění — ID kategorií produktů (naše taxonomie v CMS). */
  categoryIds: string[]
  /** Připojené fotogalerie (ID z modulu Galerie). */
  galleryIds?: string[]
  /** Část URL (slug) — ML. Titulek/meta se odvozují automaticky. */
  slug?: ML
  /** Odkaz do košíku Colossea (websale). Na webu z něj je tlačítko „Do košíku". */
  cartUrl: string
  metaTitle: ML
  metaDescription: ML
  /** Zveřejněno na webu (řídí se v CMS, nezávisle na dostupnosti v Colosseu). */
  published: boolean
}

/* ============================================================
   Mock data
   ============================================================ */
export const MOCK_PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'pc-suvenyry',
    name: ml('Suvenýry'),
    description: ml('<p>Upomínkové předměty z areálu Dolních Vítkovic — magnetky, hrnky, odznaky a další.</p>'),
    image: imageFor(2),
    published: true,
  },
  {
    id: 'pc-publikace',
    name: ml('Knihy a publikace'),
    description: ml('<p>Odborné i populární publikace o historii Vítkovic, hutnictví a industriálním dědictví.</p>'),
    image: imageFor(7),
    published: true,
  },
  {
    id: 'pc-vouchery',
    name: ml('Dárkové vouchery'),
    description: ml('<p>Dárkové poukazy na prohlídky a zážitky v areálu — ideální dárek.</p>'),
    image: imageFor(11),
    published: true,
  },
  {
    id: 'pc-textil',
    name: ml('Textil'),
    description: ml(''),
    image: imageFor(15),
    published: false,
  },
]

type RawProduct = Omit<
  Product,
  'nameOverride' | 'description' | 'metaTitle' | 'metaDescription' | 'gallery'
> & {
  gallery?: GalleryImage[]
  nameOverride?: Partial<Record<LangCode, string>>
  description?: Partial<Record<LangCode, string>>
  metaTitle?: Partial<Record<LangCode, string>>
  metaDescription?: Partial<Record<LangCode, string>>
}

function toML(m?: Partial<Record<LangCode, string>>): ML {
  return { cs: '', en: '', de: '', pl: '', ...(m ?? {}) }
}

const RAW_PRODUCTS: RawProduct[] = [
  {
    id: 'p-magnetka-bolt',
    type: 'souvenir',
    colosseumId: 'COL-GOODS-2071',
    name: 'Magnetka Bolt Tower',
    price: 79,
    stock: 1,
    colosseumImage: imageFor(2),
    importedAt: '2026-03-12T09:00',
    syncedAt: '2026-08-05T06:30',
    nameOverride: { cs: 'Magnetka Bolt Tower' },
    description: {
      cs: '<p>Sběratelská magnetka s dominantou areálu — <strong>Bolt Tower</strong>. Kovová, průměr 55 mm.</p>',
    },
    categoryIds: ['pc-suvenyry'],
    cartUrl: 'https://websale.colosseum.eu/dov/goods/2071',
    published: true,
  },
  {
    id: 'p-hrnek-vysoka-pec',
    type: 'souvenir',
    colosseumId: 'COL-GOODS-2072',
    name: 'Hrnek Vysoká pec č. 1',
    price: 199,
    stock: 0,
    colosseumImage: imageFor(4),
    importedAt: '2026-03-12T09:00',
    syncedAt: '2026-08-05T06:30',
    nameOverride: { cs: 'Hrnek Vysoká pec č. 1' },
    description: {
      cs: '<p>Keramický hrnek s motivem Vysoké pece č. 1. Objem 330 ml, vhodný do myčky.</p>',
    },
    categoryIds: ['pc-suvenyry'],
    cartUrl: 'https://websale.colosseum.eu/dov/goods/2072',
    published: true,
  },
  {
    id: 'p-kniha-vitkovice',
    type: 'publication',
    colosseumId: 'COL-GOODS-2080',
    name: 'Vítkovice — příběh železa',
    price: 450,
    stock: 0,
    colosseumImage: imageFor(7),
    importedAt: '2026-02-01T09:00',
    syncedAt: '2026-08-05T06:30',
    nameOverride: { cs: 'Vítkovice — příběh železa' },
    description: {
      cs: '<p>Reprezentativní obrazová publikace mapující více než 180 let historie vítkovických železáren. 240 stran, pevná vazba.</p>',
    },
    categoryIds: ['pc-publikace'],
    cartUrl: 'https://websale.colosseum.eu/dov/goods/2080',
    published: true,
  },
  {
    id: 'p-voucher-prohlidka',
    type: 'voucher',
    colosseumId: 'COL-VOUCHER-9001',
    name: 'Dárkový voucher — Vysokopecní okruh',
    price: 295,
    stock: 999,
    colosseumImage: imageFor(11),
    importedAt: '2026-04-20T09:00',
    syncedAt: '2026-08-05T06:30',
    nameOverride: { cs: 'Dárkový voucher — Vysokopecní okruh' },
    description: {
      cs: '<p>Darujte zážitek. Voucher lze uplatnit na <strong>Vysokopecní okruh vč. Bolt Tower</strong>. Platnost 12 měsíců od zakoupení.</p>',
    },
    categoryIds: ['pc-vouchery'],
    cartUrl: 'https://websale.colosseum.eu/dov/voucher/9001',
    published: true,
  },
  {
    id: 'p-voucher-hodnotovy',
    type: 'voucher',
    colosseumId: 'COL-VOUCHER-9002',
    name: 'Hodnotový voucher 500 Kč',
    price: 500,
    stock: 999,
    colosseumImage: imageFor(12),
    importedAt: '2026-07-30T09:00',
    syncedAt: '2026-08-05T06:30',
    // Čerstvě importovaný voucher bez popisu → nástěnka.
    categoryIds: [],
    cartUrl: 'https://websale.colosseum.eu/dov/voucher/9002',
    published: false,
  },
  {
    id: 'p-tricko-dov',
    type: 'goods',
    colosseumId: 'COL-GOODS-2091',
    name: 'Tričko DOV — pánské',
    price: 349,
    stock: 0,
    colosseumImage: imageFor(15),
    importedAt: '2026-08-04T09:00',
    syncedAt: '2026-08-05T06:30',
    // Čerstvě importované zboží bez popisu → nástěnka.
    categoryIds: [],
    cartUrl: 'https://websale.colosseum.eu/dov/goods/2091',
    published: false,
  },
  {
    id: 'p-odznak-set',
    type: 'souvenir',
    colosseumId: 'COL-GOODS-2093',
    name: 'Sada odznaků industriál (5 ks)',
    price: 149,
    stock: 0,
    colosseumImage: imageFor(9),
    importedAt: '2026-08-04T09:00',
    syncedAt: '2026-08-05T06:30',
    // Čerstvě importované zboží bez popisu → nástěnka.
    categoryIds: [],
    cartUrl: 'https://websale.colosseum.eu/dov/goods/2093',
    published: false,
  },
  {
    id: 'p-kniha-detska',
    type: 'publication',
    colosseumId: 'COL-GOODS-2085',
    name: 'Jak se rodí železo (dětská)',
    price: 220,
    stock: 0,
    colosseumImage: imageFor(6),
    importedAt: '2026-05-15T09:00',
    syncedAt: '2026-08-05T06:30',
    nameOverride: { cs: 'Jak se rodí železo' },
    description: { cs: '<p>Ilustrovaná dětská knížka, která hravou formou vysvětlí výrobu železa. Pro děti od 6 let.</p>' },
    categoryIds: ['pc-publikace'],
    cartUrl: 'https://websale.colosseum.eu/dov/goods/2085',
    published: true,
  },
  {
    id: 'p-taska-dov',
    type: 'goods',
    colosseumId: 'COL-GOODS-2101',
    name: 'Dárková taška DOV',
    price: 39,
    stock: 40,
    colosseumImage: imageFor(3),
    importedAt: '2026-08-05T08:00',
    syncedAt: '2026-08-06T09:00',
    nameOverride: { cs: 'Dárková taška DOV' },
    description: { cs: '<p>Papírová dárková taška s potiskem industriálního areálu Dolních Vítkovic.</p>' },
    categoryIds: ['pc-suvenyry'],
    cartUrl: '',
    published: true,
  },
]

/** Normalizace raw dat na plný datový model (doplní všechny jazyky + prázdná pole). */
export const MOCK_PRODUCTS: Product[] = RAW_PRODUCTS.map((r) => ({
  ...r,
  gallery: (r.gallery ?? []) as GalleryImage[],
  nameOverride: toML(r.nameOverride),
  description: toML(r.description),
  metaTitle: toML(r.metaTitle),
  metaDescription: toML(r.metaDescription),
}))

/* ============================================================
   Helpers
   ============================================================ */
export function product(id: string): Product | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === id)
}
export function productCategory(id: string): ProductCategory | undefined {
  return MOCK_PRODUCT_CATEGORIES.find((c) => c.id === id)
}
export function productsForCategory(categoryId: string): Product[] {
  return MOCK_PRODUCTS.filter((p) => p.categoryIds.includes(categoryId))
}

/** Zobrazený název na webu — override (CZ), jinak název z Colossea. */
export function displayName(p: Product): string {
  return p.nameOverride.cs.trim() || p.name
}

/** Má produkt vyplněný popis (v češtině)? Bez popisu = kandidát na nástěnku. */
export function hasDescription(p: Product): boolean {
  return p.description.cs.replace(/<[^>]+>/g, '').trim().length > 0
}

/** „Čerstvě importovaný" = naimportováno v posledních 7 dnech. */
export function isFreshImport(p: Product, now = PRODUCTS_NOW): boolean {
  const imported = new Date(p.importedAt).getTime()
  return now.getTime() - imported <= 7 * 86_400_000
}

/** Produkty, na které upozorňuje nástěnka: bez popisu (nejdřív čerstvě importované). */
export function productsNeedingDescription(now = PRODUCTS_NOW): Product[] {
  return MOCK_PRODUCTS.filter((p) => !hasDescription(p)).sort((a, b) => {
    const af = isFreshImport(a, now) ? 0 : 1
    const bf = isFreshImport(b, now) ? 0 : 1
    if (af !== bf) return af - bf
    return b.importedAt.localeCompare(a.importedAt)
  })
}

/* ---------- Dostupnost skladu (odvozeno z Colosseum stock) ---------- */
export type Availability = 'inStock' | 'lastPieces' | 'soldout'
export function availability(p: Product): Availability {
  // Vouchery se generují na míru — nemají reálný sklad (velké číslo = neomezeně).
  if (p.stock >= 500) return 'inStock'
  if (p.stock === 0) return 'soldout'
  if (p.stock <= 5) return 'lastPieces'
  return 'inStock'
}
export const AVAILABILITY_META: Record<Availability, { label: string; dot: string; text: string; bg: string }> = {
  inStock: { label: 'Skladem', dot: 'bg-forge-500', text: 'text-forge-600', bg: 'bg-forge-500/10' },
  lastPieces: { label: 'Poslední kusy', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-500/10' },
  soldout: { label: 'Vyprodáno', dot: 'bg-danger-500', text: 'text-danger-600', bg: 'bg-danger-500/10' },
}

/** Text skladu do tabulky/karty (voucher = neomezeně). */
export function stockLabel(p: Product): string {
  if (p.stock >= 500) return 'neomezeně'
  return `${p.stock} ks`
}

/** Produkt se na webu zobrazuje, pokud je prodejný (není vyprodaný).
    Napojení na Colosseum je vždy — viditelnost řídí jen dostupnost skladu,
    žádné ruční publikování. */
export function productVisible(p: Product): boolean {
  return availability(p) !== 'soldout'
}

/** Kategorie se v navigaci zobrazuje automaticky, pokud má aspoň jeden
    dostupný (prodejný) produkt — bez ručního přepínání. */
export function categoryVisible(categoryId: string): boolean {
  return productsForCategory(categoryId).some((p) => productVisible(p))
}

export function fmtPrice(price: number): string {
  return `${price.toLocaleString('cs-CZ')} Kč`
}

/** Formátování ISO na CZ datum + čas (mono, kompaktní). */
export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Prázdné entity pro zakládání. */
export function blankProductCategory(): ProductCategory {
  return { id: 'nová', name: ml(''), description: ml(''), image: '', published: false }
}

/** Členění pro sdílený RelationPicker (kompatibilní s `RelItem`). */
export function categoryOptionsList(): { id: string; label: string; sub: string; thumb: string }[] {
  return MOCK_PRODUCT_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.name.cs,
    sub: `${productsForCategory(c.id).length} produktů`,
    thumb: c.image,
  }))
}

/** Volby členění pro AppSelect (filtr v seznamu). */
export const CATEGORY_FILTER_OPTIONS = [
  { value: 'all', label: 'Všechna členění' },
  ...MOCK_PRODUCT_CATEGORIES.map((c) => ({ value: c.id, label: c.name.cs })),
]

