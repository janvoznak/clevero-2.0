import type { ML, LangCode } from './types'

/* ============================================================
   Modul Pop-up (entita `popup`) — vyskakovací okna na webu.
   Dle specifikace: jednoduchý (netabovaný) vícejazyčný formulář.
   ============================================================ */

/** 9 poloh na obrazovce — 3×3 mřížka (výběr jedné pozice). */
export type PopupPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'center'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

/** Popisky 9 poloh (dle zadání). */
export const POPUP_POSITION_LABELS: Record<PopupPosition, string> = {
  'top-left': 'Nahoře vlevo',
  'top-center': 'Nahoře uprostřed',
  'top-right': 'Nahoře vpravo',
  'middle-left': 'Vlevo uprostřed',
  center: 'Uprostřed',
  'middle-right': 'Vpravo uprostřed',
  'bottom-left': 'Dole vlevo',
  'bottom-center': 'Dole uprostřed',
  'bottom-right': 'Dole vpravo',
}

export interface PopupItem {
  id: string
  /** Nadpis okna (ML). */
  title: ML
  /** Cíl prokliknutí (volná URL, není ML). */
  titleUrl: string
  /** Obsah okna (ML, richtext). */
  text: ML
  /** Obrázek v okně (prototyp — cesta do public/images nebo null). */
  image: string | null
  /** Poloha na obrazovce. */
  position: PopupPosition
  /** Šířka okna jako % šířky obrazovky (responzivně; výška se dopočítá z obsahu). */
  widthPercent: number
  /** Začátek zobrazování. */
  from: string | null
  /** Konec zobrazování. */
  to: string | null
  /** Aktivní (zobrazovat). */
  enabled: boolean
  /** Odkaz se otevře v novém okně. */
  newWindow: boolean
  /** Po zavření se okno znovu nezobrazí po tolik dní (cookie). */
  cookieExpiration: number
  /** Zobrazit rámeček okna. */
  popupFrame: boolean
  /** Datum vytvoření. */
  createdAt: string
  /** Zveřejněné jazykové mutace (per-jazyk publikace). Bez seznamu = všechny vyplněné. */
  publishedLangs?: LangCode[]
}

/** Efektivní stav zobrazování (z `enabled` + časového okna). */
export type PopupState = 'active' | 'scheduled' | 'expired' | 'disabled'

export function popupState(p: PopupItem, now = new Date('2026-07-28T12:00:00')): PopupState {
  if (!p.enabled) return 'disabled'
  const from = p.from ? new Date(p.from) : null
  const to = p.to ? new Date(p.to) : null
  if (from && from > now) return 'scheduled'
  if (to && to < now) return 'expired'
  return 'active'
}

export const POPUP_STATE_META: Record<PopupState, { label: string; dot: string; text: string; bg: string }> = {
  active: { label: 'Zobrazuje se', dot: 'bg-forge-500', text: 'text-forge-600', bg: 'bg-forge-500/10' },
  scheduled: { label: 'Naplánováno', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-500/10' },
  expired: { label: 'Ukončeno', dot: 'bg-steel-400', text: 'text-steel-600', bg: 'bg-steel-200' },
  disabled: { label: 'Neaktivní', dot: 'bg-steel-300', text: 'text-steel-500', bg: 'bg-steel-100' },
}

/* ---------- Mock data (prototyp) ---------- */
type MLInput = Partial<Record<LangCode, string>>
function toML(m: MLInput): ML {
  return { cs: '', en: '', de: '', pl: '', ...m }
}

type RawPopup = Omit<PopupItem, 'title' | 'text'> & { title: MLInput; text: MLInput }

const RAW: RawPopup[] = [
  {
    id: 'p-501',
    title: { cs: 'Letní sezóna Bolt Tower', en: 'Bolt Tower summer season', de: 'Bolt Tower Sommersaison' },
    titleUrl: '/aktuality/bolt-tower-leto',
    text: {
      cs: '<p>Vyhlídková plošina je otevřená denně 9–20 h. Rezervujte si vstup online.</p>',
      en: '<p>The observation deck is open daily 9am–8pm. Book online.</p>',
    },
    image: '/images/g1.jpg',
    position: 'bottom-right',
    widthPercent: 30,
    from: '2026-07-01T08:00',
    to: '2026-09-30T20:00',
    enabled: true,
    newWindow: false,
    cookieExpiration: 7,
    popupFrame: true,
    createdAt: '2026-06-24T10:15',
    // Němčina je vyplněná, ale schovaná na webu (demo „připraveno" — amber).
    publishedLangs: ['cs', 'en'],
  },
  {
    id: 'p-498',
    title: { cs: 'Colours of Ostrava — poslední vstupenky', en: 'Colours of Ostrava — last tickets' },
    titleUrl: 'https://www.colours.cz',
    text: { cs: '<p>Doprodej vstupenek na festival v areálu Dolních Vítkovic.</p>' },
    image: '/images/g5.jpg',
    position: 'center',
    widthPercent: 40,
    from: '2026-07-10T00:00',
    to: '2026-07-20T23:59',
    enabled: true,
    newWindow: true,
    cookieExpiration: 1,
    popupFrame: true,
    createdAt: '2026-06-30T09:00',
  },
  {
    id: 'p-495',
    title: { cs: 'Novinka: noční prohlídky dolu Hlubina' },
    titleUrl: '/aktuality/nocni-prohlidky-hlubina',
    text: { cs: '<p>Zážitkové prohlídky při svitu lamp. Kapacita omezena.</p>' },
    image: '/images/g8.jpg',
    position: 'top-center',
    widthPercent: 38,
    from: '2026-08-01T00:00',
    to: null,
    enabled: true,
    newWindow: false,
    cookieExpiration: 3,
    popupFrame: false,
    createdAt: '2026-07-18T14:40',
  },
  {
    id: 'p-490',
    title: { cs: 'Adventní trhy — připravujeme' },
    titleUrl: '',
    text: { cs: '<p>Sledujte program vánočních trhů mezi vysokými pecemi.</p>' },
    image: null,
    position: 'bottom-center',
    widthPercent: 40,
    from: '2026-11-15T00:00',
    to: '2026-12-24T23:59',
    enabled: false,
    newWindow: false,
    cookieExpiration: 14,
    popupFrame: false,
    createdAt: '2026-07-05T11:20',
  },
  {
    id: 'p-486',
    title: { cs: 'Den otevřených dveří energetické ústředny', de: 'Tag der offenen Tür' },
    titleUrl: '/aktuality/den-otevrenych-dveri',
    text: { cs: '<p>Komentované prohlídky strojovny. Vstup zdarma.</p>' },
    image: '/images/g3.jpg',
    position: 'top-right',
    widthPercent: 28,
    from: '2026-03-01T09:00',
    to: '2026-03-02T17:00',
    enabled: true,
    newWindow: false,
    cookieExpiration: 5,
    popupFrame: true,
    createdAt: '2026-02-10T08:30',
    // Němčina vyplněná, ale nezveřejněná (demo „připraveno" — amber).
    publishedLangs: ['cs'],
  },
  {
    id: 'p-480',
    title: { cs: 'Velký svět techniky — nová expozice robotiky' },
    titleUrl: '/aktuality/svet-techniky-robotika',
    text: { cs: '<p>Interaktivní expozice pro celou rodinu je otevřená.</p>' },
    image: '/images/g11.jpg',
    position: 'middle-left',
    widthPercent: 30,
    from: '2026-05-10T09:00',
    to: '2026-06-30T18:00',
    enabled: false,
    newWindow: false,
    cookieExpiration: 7,
    popupFrame: true,
    createdAt: '2026-04-22T13:05',
  },
]

export const MOCK_POPUPS: PopupItem[] = RAW.map((r) => ({
  ...r,
  title: toML(r.title),
  text: toML(r.text),
}))

/* ---------- Předdefinované šablony (prototyp — rychlý předvyplňovač) ----------
   Šablona jen předvyplní existující formulářová pole: obsah ve zdrojové CZ
   + doporučené nastavení (poloha, velikost, okno). Žádná nová logika. */
export interface PopupTemplate {
  id: string
  /** Kategorie šablony (label do chipu). */
  category: string
  /** Barva kategorie (hex). */
  categoryColor: string
  name: string
  hint: string
  /** Hodnoty, kterými se předvyplní formulář. */
  apply: {
    title: string
    text: string
    titleUrl?: string
    position?: PopupPosition
    widthPercent?: number
    newWindow?: boolean
    popupFrame?: boolean
    cookieExpiration?: number
  }
}

export const PREDEFINED_TEMPLATES: PopupTemplate[] = [
  {
    id: 'tpl-akce',
    category: 'Akce',
    categoryColor: '#ee703d',
    name: 'Pozvánka na koncert / festival',
    hint: 'Upoutávka na kulturní akci s odkazem na program.',
    apply: {
      title: 'Přijďte na koncert v Gongu',
      text: '<p>Zveme vás na jedinečný hudební zážitek v multifunkční aule Gong. Rezervujte si místa online.</p>',
      titleUrl: '/akce',
      position: 'center',
      widthPercent: 40,
      newWindow: false,
      popupFrame: true,
      cookieExpiration: 3,
    },
  },
  {
    id: 'tpl-oznameni',
    category: 'Oznámení',
    categoryColor: '#3b6fb0',
    name: 'Změna otevírací doby / Uzávěra',
    hint: 'Provozní oznámení přes horní pruh na celou šířku.',
    apply: {
      title: 'Změna otevírací doby',
      text: '<p>Upozorňujeme návštěvníky na dočasnou změnu otevírací doby areálu. Děkujeme za pochopení.</p>',
      titleUrl: '',
      position: 'top-center',
      widthPercent: 100,
      newWindow: false,
      popupFrame: false,
      cookieExpiration: 1,
    },
  },
  {
    id: 'tpl-prodej',
    category: 'Prodej',
    categoryColor: '#15916a',
    name: 'Zvýhodněný balíček vstupenek',
    hint: 'Prodejní nabídka s prokliknutím do e-shopu.',
    apply: {
      title: 'Zvýhodněný balíček vstupenek',
      text: '<p>Kupte si zvýhodněný balíček vstupenek a ušetřete. Nabídka platí jen po omezenou dobu.</p>',
      titleUrl: '/vstupenky',
      position: 'bottom-right',
      widthPercent: 30,
      newWindow: true,
      popupFrame: true,
      cookieExpiration: 7,
    },
  },
  {
    id: 'tpl-edukacni',
    category: 'Edukační',
    categoryColor: '#7b5ea7',
    name: 'Školní výlety a exkurze',
    hint: 'Nabídka vzdělávacích programů pro školy.',
    apply: {
      title: 'Školní výlety a exkurze',
      text: '<p>Připravili jsme vzdělávací programy pro školy všech stupňů. Objednejte termín pro svou třídu.</p>',
      titleUrl: '/pro-skoly',
      position: 'middle-left',
      widthPercent: 30,
      newWindow: false,
      popupFrame: true,
      cookieExpiration: 14,
    },
  },
  {
    id: 'tpl-sber',
    category: 'Sběr',
    categoryColor: '#0e8a8a',
    name: 'Odběr novinek a programu',
    hint: 'Sběr e-mailů pro odběr novinek a programu.',
    apply: {
      title: 'Odebírejte novinky',
      text: '<p>Nechte si zasílat program a novinky z Dolních Vítkovic přímo do e-mailu.</p>',
      titleUrl: '',
      position: 'bottom-right',
      widthPercent: 28,
      newWindow: false,
      popupFrame: true,
      cookieExpiration: 30,
    },
  },
]
