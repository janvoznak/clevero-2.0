import type { ML, LangCode, GalleryImage, Attachment } from './types'

/* ============================================================
   Modul Stránky (entita `page`) — statické stránky webu.
   Vícejazyčnost (ML) + hierarchie (strom) přes parentId.
   ============================================================ */

/** Sekce, do které stránka v administraci patří. */
export type PageSection = 'menu' | 'other' | 'client'
export const PAGE_SECTIONS: { key: PageSection; label: string; desc: string; icon: string }[] = [
  { key: 'menu', label: 'Menu', desc: 'Hlavní stránky v menu a jejich hierarchie', icon: 'reference' },
  { key: 'other', label: 'Ostatní stránky', desc: 'Stránky mimo menu i mega menu, ale dostupné na webu', icon: 'page' },
  { key: 'client', label: 'Klientská sekce', desc: 'Právní dokumenty', icon: 'file' },
]

/** Jeden den otevírací doby. */
export interface OpeningDay {
  day: string
  open: boolean
  hours: string
}
const OPENING_DAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']
/** Výchozí otevírací doba (Po–Pá 9:00–17:00, víkend zavřeno). */
export function defaultOpeningHours(): OpeningDay[] {
  return OPENING_DAYS.map((day, i) => ({ day, open: i < 5, hours: i < 5 ? '9:00–17:00' : '' }))
}

/** Sloupec patičky (0 = nezobrazovat). Uloženo jako string kvůli AppSelect. */
export type FooterCol = '0' | '1' | '2' | '3'
export type InquiryFormType = 'none' | 'basic' | 'full'
export type ContactFormType = 'none' | 'email_msg' | 'email_msg_phone' | 'email_msg_file' | 'full_contact'

export interface PageItem {
  id: string
  /** Sekce v administraci (Menu / Ostatní / Klientská). */
  section: PageSection
  /** Nadřazená stránka (null = kořen). */
  parentId: string | null
  title: ML
  /** Část URL (slug) — ML. */
  slug: ML
  perex: ML
  text: ML
  /** Skladba obsahu z bloků (content builder — prototyp). */
  contentBlocks: ContentBlock[]
  allowMenu: boolean
  allowFooter: FooterCol
  allowHp: boolean
  priority: number
  enabled: boolean
  /* Formuláře */
  formTemplateId: string
  dynamicFormId: string
  inquiryFormType: InquiryFormType
  contactForm: ContactFormType
  contactFormText: ML
  /* Marketing & SEO */
  metaTitle: ML
  metaDescription: ML
  metaKeywords: ML
  canonicalUrl: ML
  allowIndexing: boolean
  /* Média */
  gallery: GalleryImage[]
  attachments: Attachment[]
  /* Měřící kódy & cookies */
  jsCodes: string
  usedCookies: string[]
  /* Otevírací doba (per den). */
  openingHours: OpeningDay[]
}

/* ---------- Číselníky (pro AppSelect / checkboxy) ---------- */
export const FOOTER_OPTIONS = [
  { value: '0', label: 'Nezobrazovat' },
  { value: '1', label: 'Sloupec č. 1' },
  { value: '2', label: 'Sloupec č. 2' },
  { value: '3', label: 'Sloupec č. 3' },
]
export const DYNAMIC_FORM_OPTIONS = [
  { value: '', label: '— Žádný —' },
  { value: 'df-general', label: 'Všeobecná poptávka' },
  { value: 'df-career', label: 'Kariérní dotazník' },
  { value: 'df-event', label: 'Registrace na akci' },
]
export const INQUIRY_OPTIONS = [
  { value: 'none', label: 'Žádný' },
  { value: 'basic', label: 'Základní (e-mail, jméno, telefon, zpráva)' },
  { value: 'full', label: 'Rozšířený (+ místo, příloha)' },
]
export const CONTACT_OPTIONS = [
  { value: 'none', label: 'Žádný' },
  { value: 'email_msg', label: 'E-mail + zpráva' },
  { value: 'email_msg_phone', label: 'E-mail + zpráva + telefon' },
  { value: 'email_msg_file', label: 'E-mail + zpráva + příloha' },
  { value: 'full_contact', label: 'Kompletní kontakt' },
]
export const COOKIE_CATEGORIES = [
  { value: 'analytics', label: 'Analytické' },
  { value: 'marketing', label: 'Marketingové' },
  { value: 'preferences', label: 'Preferenční' },
]

/* ---------- Content builder — grafické vzory (prototyp, vizuální zástupka) ----------
   Stránka se skládá z hotových „grafických vzorů" (jako ContentBuilder.js).
   Vzor je vizuální šablona úseku stránky (hero, odstavec, obrázek, CTA…),
   `kind` řídí náhled. Reálný obsah vzoru vyplní editor — tady jen zástupka. */
export interface ContentBlock {
  id: string
  /** Druh grafického vzoru (řídí náhled). */
  kind: string
}
export interface PatternDef {
  kind: string
  name: string
}
export const GRAPHIC_PATTERN_GROUPS: { category: string; patterns: PatternDef[] }[] = [
  {
    category: 'Základní',
    patterns: [
      { kind: 'hero', name: 'Úvodní nadpis' },
      { kind: 'paragraph', name: 'Odstavec textu' },
      { kind: 'h1-text', name: 'Nadpis 1 + text' },
      { kind: 'h2-text', name: 'Nadpis 2 + text' },
      { kind: 'image', name: 'Obrázek' },
      { kind: 'about', name: 'O nás' },
      { kind: 'two-col', name: 'Dva sloupce textu' },
    ],
  },
  {
    category: 'Článek',
    patterns: [
      { kind: 'lead', name: 'Perex' },
      { kind: 'text-image', name: 'Text s obrázkem' },
      { kind: 'quote', name: 'Citace' },
      { kind: 'two-col', name: 'Dva sloupce textu' },
    ],
  },
  {
    category: 'Nadpis',
    patterns: [
      { kind: 'hero', name: 'Velký nadpis' },
      { kind: 'h1-text', name: 'Nadpis 1' },
      { kind: 'h2-text', name: 'Nadpis 2' },
    ],
  },
  {
    category: 'Tlačítka',
    patterns: [
      { kind: 'button', name: 'Tlačítko' },
      { kind: 'button-pair', name: 'Dvě tlačítka' },
      { kind: 'cta', name: 'CTA banner' },
    ],
  },
  {
    category: 'Fotky',
    patterns: [
      { kind: 'image', name: 'Obrázek' },
      { kind: 'gallery', name: 'Galerie' },
      { kind: 'image-wide', name: 'Obrázek na šířku' },
    ],
  },
  {
    category: 'Profil',
    patterns: [
      { kind: 'team', name: 'Tým' },
      { kind: 'testimonial', name: 'Reference' },
    ],
  },
  {
    category: 'Kontakt',
    patterns: [
      { kind: 'contact', name: 'Kontaktní údaje' },
      { kind: 'map', name: 'Mapa' },
      { kind: 'hours', name: 'Otevírací doba' },
    ],
  },
  {
    category: 'Více',
    patterns: [
      { kind: 'video', name: 'Video' },
      { kind: 'faq', name: 'FAQ / akordeon' },
      { kind: 'divider', name: 'Oddělovač' },
    ],
  },
]

/* ---------- Formulářové šablony (prototyp — vizuální „content builder") ---------- */
export type FormFieldType = 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox' | 'file'
export interface FormField {
  label: string
  type: FormFieldType
}
export interface FormTemplate {
  id: string
  name: string
  desc: string
  fields: FormField[]
}

/** Předdefinované formuláře relevantní pro web Dolních Vítkovic. */
export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'ft-kontakt',
    name: 'Kontaktní formulář',
    desc: 'Obecný dotaz od návštěvníka webu.',
    fields: [
      { label: 'Jméno a příjmení', type: 'text' },
      { label: 'E-mail', type: 'email' },
      { label: 'Telefon', type: 'tel' },
      { label: 'Zpráva', type: 'textarea' },
    ],
  },
  {
    id: 'ft-prohlidka',
    name: 'Rezervace prohlídky',
    desc: 'Objednávka komentované prohlídky areálu.',
    fields: [
      { label: 'Jméno a příjmení', type: 'text' },
      { label: 'E-mail', type: 'email' },
      { label: 'Telefon', type: 'tel' },
      { label: 'Termín', type: 'date' },
      { label: 'Počet osob', type: 'number' },
      { label: 'Poznámka', type: 'textarea' },
    ],
  },
  {
    id: 'ft-skoly',
    name: 'Školní exkurze',
    desc: 'Objednávka vzdělávacího programu pro školy.',
    fields: [
      { label: 'Škola', type: 'text' },
      { label: 'Kontaktní osoba', type: 'text' },
      { label: 'E-mail', type: 'email' },
      { label: 'Telefon', type: 'tel' },
      { label: 'Stupeň školy', type: 'select' },
      { label: 'Termín', type: 'date' },
      { label: 'Počet žáků', type: 'number' },
      { label: 'Poznámka', type: 'textarea' },
    ],
  },
  {
    id: 'ft-akce',
    name: 'Registrace na akci',
    desc: 'Přihlášení na festival, koncert nebo akci.',
    fields: [
      { label: 'Jméno a příjmení', type: 'text' },
      { label: 'E-mail', type: 'email' },
      { label: 'Telefon', type: 'tel' },
      { label: 'Počet vstupenek', type: 'number' },
      { label: 'Souhlasím s podmínkami', type: 'checkbox' },
    ],
  },
  {
    id: 'ft-pronajem',
    name: 'Poptávka pronájmu prostor',
    desc: 'Firemní akce, konference, teambuilding.',
    fields: [
      { label: 'Jméno / firma', type: 'text' },
      { label: 'E-mail', type: 'email' },
      { label: 'Telefon', type: 'tel' },
      { label: 'Typ akce', type: 'select' },
      { label: 'Předpokládaný termín', type: 'date' },
      { label: 'Počet hostů', type: 'number' },
      { label: 'Popis akce', type: 'textarea' },
    ],
  },
  {
    id: 'ft-newsletter',
    name: 'Odběr novinek',
    desc: 'Přihlášení k odběru programu a novinek.',
    fields: [
      { label: 'E-mail', type: 'email' },
      { label: 'Souhlas se zpracováním údajů', type: 'checkbox' },
    ],
  },
]

/* ---------- Stav (odvozený z enabled) ---------- */
export type PageState = 'active' | 'inactive'
export const PAGE_STATE_META: Record<PageState, { label: string; dot: string; text: string; bg: string }> = {
  active: { label: 'Aktivní', dot: 'bg-forge-500', text: 'text-forge-600', bg: 'bg-forge-500/10' },
  inactive: { label: 'Neaktivní', dot: 'bg-steel-300', text: 'text-steel-500', bg: 'bg-steel-100' },
}
export function pageState(p: PageItem): PageState {
  return p.enabled ? 'active' : 'inactive'
}

/* ---------- Mock data (strom) ---------- */
type MLInput = Partial<Record<LangCode, string>>
function toML(m: MLInput): ML {
  return { cs: '', en: '', de: '', pl: '', ...m }
}

type RawPage = Omit<
  PageItem,
  'title' | 'slug' | 'perex' | 'text' | 'contactFormText' | 'metaTitle' | 'metaDescription' | 'metaKeywords' | 'canonicalUrl'
> & {
  title: MLInput
  slug: MLInput
  perex: MLInput
  text: MLInput
  contactFormText: MLInput
  metaTitle: MLInput
  metaDescription: MLInput
  metaKeywords: MLInput
  canonicalUrl: MLInput
}

/** Výchozí (prázdné) hodnoty společné mock stránkám — zkrátí literály. */
const base = {
  section: 'menu' as PageSection,
  perex: {} as MLInput,
  text: {} as MLInput,
  contentBlocks: [] as ContentBlock[],
  allowMenu: false,
  allowFooter: '0' as FooterCol,
  allowHp: false,
  priority: 0,
  enabled: true,
  formTemplateId: '',
  dynamicFormId: '',
  inquiryFormType: 'none' as InquiryFormType,
  contactForm: 'none' as ContactFormType,
  contactFormText: {} as MLInput,
  metaTitle: {} as MLInput,
  metaDescription: {} as MLInput,
  metaKeywords: {} as MLInput,
  canonicalUrl: {} as MLInput,
  allowIndexing: true,
  gallery: [] as GalleryImage[],
  attachments: [] as Attachment[],
  jsCodes: '',
  usedCookies: [] as string[],
  openingHours: [] as OpeningDay[],
}

const RAW: RawPage[] = [
  {
    ...base,
    id: 'pg-onas',
    parentId: null,
    title: { cs: 'O nás', en: 'About us', de: 'Über uns' },
    slug: { cs: 'o-nas', en: 'about-us', de: 'ueber-uns' },
    perex: { cs: 'Dolní Vítkovice — národní kulturní památka a živé centrum kultury.' },
    text: { cs: '<p>Areál Dolních Vítkovic patří k unikátním průmyslovým památkám Evropy.</p>' },
    contentBlocks: [
      { id: 'cb-onas-1', kind: 'hero' },
      { id: 'cb-onas-2', kind: 'lead' },
      { id: 'cb-onas-3', kind: 'text-image' },
      { id: 'cb-onas-4', kind: 'gallery' },
      { id: 'cb-onas-5', kind: 'cta' },
    ],
    allowMenu: true,
    allowFooter: '1',
    priority: 1,
  },
  {
    ...base,
    id: 'pg-historie',
    parentId: 'pg-onas',
    title: { cs: 'Historie areálu', en: 'History' },
    slug: { cs: 'historie', en: 'history' },
    perex: { cs: 'Od těžby uhlí a výroby železa po kulturní centrum.' },
    allowMenu: true,
    priority: 1,
  },
  {
    ...base,
    id: 'pg-kariera',
    parentId: 'pg-onas',
    title: { cs: 'Kariéra' },
    slug: { cs: 'kariera' },
    perex: { cs: 'Přidejte se k našemu týmu.' },
    allowMenu: true,
    priority: 2,
    dynamicFormId: 'df-career',
  },
  {
    ...base,
    id: 'pg-pozice',
    parentId: 'pg-kariera',
    title: { cs: 'Volné pozice' },
    slug: { cs: 'volne-pozice' },
    priority: 1,
    inquiryFormType: 'full',
  },
  {
    ...base,
    id: 'pg-kontakty',
    parentId: null,
    title: { cs: 'Kontakty', en: 'Contact', de: 'Kontakt' },
    slug: { cs: 'kontakty', en: 'contact', de: 'kontakt' },
    perex: { cs: 'Napište nám nebo se stavte osobně.' },
    allowMenu: true,
    allowFooter: '2',
    priority: 2,
    formTemplateId: 'ft-kontakt',
    contactForm: 'full_contact',
    contactFormText: { cs: 'Ozveme se vám do dvou pracovních dnů.' },
    usedCookies: ['preferences'],
  },
  {
    ...base,
    id: 'pg-skoly',
    parentId: null,
    title: { cs: 'Pro školy' },
    slug: { cs: 'pro-skoly' },
    perex: { cs: 'Vzdělávací programy a exkurze pro školní skupiny.' },
    allowMenu: true,
    allowHp: true,
    priority: 3,
    formTemplateId: 'ft-skoly',
    dynamicFormId: 'df-general',
  },
  {
    ...base,
    id: 'pg-partneri',
    section: 'other',
    parentId: null,
    title: { cs: 'Poděkování partnerům' },
    slug: { cs: 'podekovani-partnerum' },
    perex: { cs: 'Stránka mimo menu, odkazovaná z paty článků.' },
    priority: 1,
  },
  {
    ...base,
    id: 'pg-archiv',
    section: 'other',
    parentId: null,
    title: { cs: 'Archiv akcí 2023' },
    slug: { cs: 'archiv-akci-2023' },
    priority: 2,
    allowIndexing: false,
  },
  {
    ...base,
    id: 'pg-rad',
    section: 'client',
    parentId: null,
    title: { cs: 'Návštěvní řád' },
    slug: { cs: 'navstevni-rad' },
    allowFooter: '3',
    priority: 1,
    enabled: false,
    allowIndexing: false,
  },
  {
    ...base,
    id: 'pg-cookies',
    section: 'client',
    parentId: 'pg-rad',
    title: { cs: 'Zásady cookies' },
    slug: { cs: 'zasady-cookies' },
    allowFooter: '3',
    priority: 1,
    usedCookies: ['analytics', 'marketing', 'preferences'],
  },
]

export const MOCK_PAGES: PageItem[] = RAW.map((r) => ({
  ...r,
  title: toML(r.title),
  slug: toML(r.slug),
  perex: toML(r.perex),
  text: toML(r.text),
  contactFormText: toML(r.contactFormText),
  metaTitle: toML(r.metaTitle),
  metaDescription: toML(r.metaDescription),
  metaKeywords: toML(r.metaKeywords),
  canonicalUrl: toML(r.canonicalUrl),
  openingHours: defaultOpeningHours(),
}))

/* ---------- Odvozovací helpery nad stromem ---------- */

/** Má stránka potomky? */
export function hasChildren(pages: PageItem[], id: string): boolean {
  return pages.some((p) => p.parentId === id)
}

/** Řetěz předků (od kořene k rodiči). */
export function ancestors(pages: PageItem[], id: string): PageItem[] {
  const byId = new Map(pages.map((p) => [p.id, p]))
  const chain: PageItem[] = []
  let cur = byId.get(id)?.parentId ?? null
  while (cur) {
    const p = byId.get(cur)
    if (!p) break
    chain.unshift(p)
    cur = p.parentId
  }
  return chain
}

/** Je některý předek neaktivní? (na frontendu by pak byla stránka nedostupná) */
export function ancestorDisabled(pages: PageItem[], id: string): boolean {
  return ancestors(pages, id).some((a) => !a.enabled)
}

/** Hierarchická URL cesta (slug rodičů + vlastní), v daném jazyce. */
export function slugPath(pages: PageItem[], p: PageItem, lang: LangCode = 'cs'): string {
  const parts = [...ancestors(pages, p.id), p].map((n) => n.slug[lang] || n.slug.cs).filter(Boolean)
  return '/' + parts.join('/')
}

/** Ploché pořadí stromu (DFS, řazeno dle priority) s hloubkou — pro výpis. */
export interface TreeRow {
  page: PageItem
  depth: number
  hasKids: boolean
}
export function treeRows(pages: PageItem[], collapsed: Set<string>): TreeRow[] {
  const ids = new Set(pages.map((p) => p.id))
  const byParent = new Map<string | null, PageItem[]>()
  for (const p of pages) {
    // Rodič mimo předanou množinu (např. jiná sekce) → bereme jako kořen.
    const key = p.parentId && ids.has(p.parentId) ? p.parentId : null
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key)!.push(p)
  }
  for (const list of byParent.values()) list.sort((a, b) => a.priority - b.priority)

  const out: TreeRow[] = []
  const walk = (parentId: string | null, depth: number) => {
    for (const p of byParent.get(parentId) ?? []) {
      const kids = byParent.get(p.id) ?? []
      out.push({ page: p, depth, hasKids: kids.length > 0 })
      if (kids.length && !collapsed.has(p.id)) walk(p.id, depth + 1)
    }
  }
  walk(null, 0)
  return out
}

/** Volby pro výběr nadřazené stránky (odsazené dle hloubky), vynechává sebe + potomky. */
export function parentOptions(pages: PageItem[], excludeId?: string): { value: string; label: string }[] {
  const excluded = new Set<string>()
  if (excludeId) {
    excluded.add(excludeId)
    let changed = true
    while (changed) {
      changed = false
      for (const p of pages) {
        if (p.parentId && excluded.has(p.parentId) && !excluded.has(p.id)) {
          excluded.add(p.id)
          changed = true
        }
      }
    }
  }
  const opts = [{ value: '', label: '— Kořenová úroveň —' }]
  for (const row of treeRows(pages, new Set())) {
    if (excluded.has(row.page.id)) continue
    opts.push({ value: row.page.id, label: `${'  '.repeat(row.depth)}${row.page.title.cs || 'Bez názvu'}` })
  }
  return opts
}
