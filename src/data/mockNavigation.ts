import type { ML, LangCode } from './types'

/* ============================================================
   Modul Navigace — menu webu.

   Převzato z řešení v Clevero 2.0 a upraveno pro DOV.

   Položka menu **neukládá URL, ale odkaz na entitu**: u stránky drží její ID,
   u modulového výpisu klíč modulu. Odkaz se tím nerozbije, když se stránce
   změní slug nebo se přepíše routing webu. Hotová URL se zadává jen
   u externího odkazu, kde nic jiného nedává smysl.

   Hierarchie je záměrně jen **dvouúrovňová** — hlubší menu se na webu neovládá
   myší ani na mobilu.

   Položky jsou uložené **naplocho** (`parentId` + `order`), ne zanořené do
   `children`: výpis je pak obyčejný strom se stejným přetahováním jako
   v modulu Stránky, takže se redakce neučí druhé ovládání.

   Proti Clevero 2.0 jedna změna: **popisky jsou vícejazyčné** (`ML`). Web DOV
   běží v CZ/EN/DE/PL a menu je to první, co se překládá (STANDARDY §6).
   ============================================================ */

/** Typ cíle položky menu. */
export type NavTargetKind = 'page' | 'module' | 'url'

/** Modulové výpisy, na které se dá odkázat — stabilní cíle na webu. */
export const NAV_MODULE_OPTIONS: { value: string; label: string }[] = [
  { value: 'events', label: 'Kalendář akcí — výpis' },
  { value: 'tours', label: 'Prohlídky — výpis' },
  { value: 'area', label: 'Areál — mapa a objekty' },
  { value: 'galleries', label: 'Galerie — výpis' },
  { value: 'news', label: 'Aktuality — výpis' },
  { value: 'products', label: 'E-shop — výpis zboží' },
  { value: 'education', label: 'Vzdělávací programy — výpis' },
  { value: 'grants', label: 'Dotační projekty' },
  { value: 'positions', label: 'Kariéra — volné pozice' },
  { value: 'faq', label: 'Časté dotazy' },
]

/** Odkaz — sdílený tvar pro menu i patičku. */
export interface NavItem {
  id: string
  /** Popisek v menu (ML). */
  label: ML
  kind: NavTargetKind
  /** Cíl podle `kind`: ID stránky / klíč modulu / URL. */
  target: string
  /** Otevřít v novém okně. Má smysl hlavně u externích odkazů. */
  newWindow: boolean
}

/** Položka menu = odkaz + místo ve stromu. Plochá struktura, viz hlavička. */
export interface MenuItem extends NavItem {
  /** Do které nabídky patří. */
  menuId: string
  /** Nadřazená položka (null = první úroveň). */
  parentId: string | null
  /** Pořadí mezi sourozenci. */
  order: number
}

/** Nabídka webu — víc nezávislých menu. */
export interface NavMenu {
  id: string
  name: string
  /** K čemu menu na webu slouží. */
  purpose: string
}

/** Kolik úrovní menu snese. Hlubší se na webu neovládá. */
export const MENU_MAX_DEPTH = 2

export const MOCK_MENUS: NavMenu[] = [
  { id: 'main', name: 'Hlavní menu', purpose: 'Vodorovné menu v hlavičce webu' },
  { id: 'top', name: 'Servisní pruh', purpose: 'Drobné odkazy nad hlavičkou, vedle přepínače jazyků' },
]

function ml(cs: string, en = '', de = '', pl = ''): ML {
  return { cs, en, de, pl }
}

type RawItem = {
  id: string
  menuId: string
  label: ML
  kind: NavTargetKind
  target: string
  parentId?: string | null
  order: number
  newWindow?: boolean
}

/* Sada odpovídá dnešnímu menu na dolnivitkovice.cz. */
const RAW_ITEMS: RawItem[] = [
  /* Hlavní menu */
  { id: 'nav-1', menuId: 'main', label: ml('Co dělat v DOV', 'What to do in DOV'), kind: 'page', target: 'pg-onas', order: 1 },
  { id: 'nav-1-1', menuId: 'main', label: ml('Prohlídky', 'Guided tours'), kind: 'module', target: 'tours', parentId: 'nav-1', order: 1 },
  { id: 'nav-1-2', menuId: 'main', label: ml('Vzdělávací programy'), kind: 'module', target: 'education', parentId: 'nav-1', order: 2 },
  { id: 'nav-2', menuId: 'main', label: ml('Kalendář akcí', 'Events'), kind: 'module', target: 'events', order: 2 },
  { id: 'nav-3', menuId: 'main', label: ml('Mapa areálu', 'Area map'), kind: 'module', target: 'area', order: 3 },
  { id: 'nav-4', menuId: 'main', label: ml('Galerie', 'Gallery'), kind: 'module', target: 'galleries', order: 4 },
  // Stránka Pronájem prostor v prototypu není (nález 04/01) → položka bez cíle.
  { id: 'nav-5', menuId: 'main', label: ml('Pronájem prostor'), kind: 'page', target: '', order: 5 },
  { id: 'nav-6', menuId: 'main', label: ml('Kontakty', 'Contact'), kind: 'page', target: 'pg-kontakty', order: 6 },

  /* Servisní pruh */
  { id: 'nav-t1', menuId: 'top', label: ml('E-shop'), kind: 'module', target: 'products', order: 1 },
  { id: 'nav-t2', menuId: 'top', label: ml('Pro školy'), kind: 'page', target: 'pg-skoly', order: 2 },
  {
    id: 'nav-t3',
    menuId: 'top',
    label: ml('Virtuální prohlídka'),
    kind: 'url',
    target: 'https://www.dolnivitkovice.cz/virtualni-prohlidka/',
    order: 3,
    newWindow: true,
  },
]

export const MOCK_MENU_ITEMS: MenuItem[] = RAW_ITEMS.map((r) => ({
  id: r.id,
  menuId: r.menuId,
  label: r.label,
  kind: r.kind,
  target: r.target,
  parentId: r.parentId ?? null,
  order: r.order,
  newWindow: r.newWindow ?? false,
}))

/** Prázdný odkaz (pro menu i patičku). */
export function blankNavItem(id: string): NavItem {
  return { id, label: ml(''), kind: 'page', target: '', newWindow: false }
}

let itemSeq = 0
/** Nová položka menu na konec dané úrovně. */
export function blankMenuItem(menuId: string, parentId: string | null, order: number): MenuItem {
  itemSeq += 1
  return { ...blankNavItem(`nav-new-${itemSeq}`), menuId, parentId, order }
}

/* ============================================================
   Kam odkaz vede — JEDEN výběr, ne dva.

   Typ cíle a cíl samotný je jedno rozhodnutí rozsekané na dva kroky: redakce
   nechce zvolit „typ", chce zvolit stránku. Typ se z volby odvodí.
   Hodnota se kóduje jako `page:<id>` / `module:<klíč>` / `url`.
   ============================================================ */

/** Sentinel pro „nevybráno" — Reka Select nepovolí prázdnou hodnotu. */
export const NAV_NO_TARGET = '__none__'
/** Volba „externí odkaz" — URL se pak zadává zvlášť. */
export const NAV_URL_CHOICE = 'url'

/** Hodnota pro select podle položky. */
export function targetChoice(item: NavItem): string {
  if (item.kind === 'url') return NAV_URL_CHOICE
  return item.target ? `${item.kind}:${item.target}` : NAV_NO_TARGET
}

/** Zapíše volbu ze selectu do položky (typ se odvodí z volby). */
export function applyTargetChoice(item: NavItem, choice: string): void {
  if (choice === NAV_URL_CHOICE) {
    // Zachovat dosud zadanou URL, ať se nesmaže jen přepnutím.
    item.kind = 'url'
    if (item.target.startsWith('http')) return
    item.target = ''
    item.newWindow = true
    return
  }
  if (choice === NAV_NO_TARGET) {
    item.target = ''
    return
  }
  const [kind, ...rest] = choice.split(':')
  item.kind = kind as NavTargetKind
  item.target = rest.join(':')
  item.newWindow = false
}

/** Popisek cíle do výpisu — co položka na webu otevře. */
export function navTargetLabel(item: NavItem, pageTitle: (id: string) => string): string {
  if (item.kind === 'url') return item.target || '— bez odkazu —'
  if (item.kind === 'module') {
    return NAV_MODULE_OPTIONS.find((m) => m.value === item.target)?.label ?? '— nevybráno —'
  }
  return item.target ? pageTitle(item.target) : '— nevybráno —'
}

/** Chybí položce cíl? Do výpisu jako varování — odkaz by nikam nevedl. */
export function navItemIncomplete(item: NavItem): boolean {
  return !item.target.trim()
}

/** Popisek položky v dané mutaci (fallback na češtinu). */
export function navLabel(item: NavItem, lang: LangCode): string {
  return item.label[lang].trim() || item.label.cs.trim()
}
