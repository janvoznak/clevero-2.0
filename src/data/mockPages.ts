import type { ML, LangCode, GalleryImage, Attachment } from './types'

/* ============================================================
   Modul Stránky (entita `page`) — statické stránky webu.
   Vícejazyčnost (ML) + hierarchie (strom) přes parentId.
   ============================================================ */

/** Sloupec patičky (0 = nezobrazovat). Uloženo jako string kvůli AppSelect. */
export type FooterCol = '0' | '1' | '2' | '3'
export type InquiryFormType = 'none' | 'basic' | 'full'
export type ContactFormType = 'none' | 'email_msg' | 'email_msg_phone' | 'email_msg_file' | 'full_contact'

export interface PageItem {
  id: string
  /** Nadřazená stránka (null = kořen). */
  parentId: string | null
  title: ML
  /** Část URL (slug) — ML. */
  slug: ML
  perex: ML
  text: ML
  allowMenu: boolean
  allowFooter: FooterCol
  allowHp: boolean
  priority: number
  enabled: boolean
  /* Formuláře */
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
  perex: {} as MLInput,
  text: {} as MLInput,
  allowMenu: false,
  allowFooter: '0' as FooterCol,
  allowHp: false,
  priority: 0,
  enabled: true,
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
    dynamicFormId: 'df-general',
  },
  {
    ...base,
    id: 'pg-rad',
    parentId: null,
    title: { cs: 'Návštěvní řád' },
    slug: { cs: 'navstevni-rad' },
    allowFooter: '3',
    priority: 4,
    enabled: false,
    allowIndexing: false,
  },
  {
    ...base,
    id: 'pg-cookies',
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
  const byParent = new Map<string | null, PageItem[]>()
  for (const p of pages) {
    const key = p.parentId
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
