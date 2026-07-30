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

/** Jednotka šířky okna — přepínač `tmp_value_or_percent`. */
export type WidthUnit = 'px' | 'percent'

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
  /** Zda se šířka udává v px nebo %. */
  widthUnit: WidthUnit
  /** Šířka v px. */
  width: number
  /** Šířka v % (alternativa k px). */
  widthPercent: number
  /** Výška v px. */
  height: number
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
    widthUnit: 'px',
    width: 420,
    widthPercent: 30,
    height: 280,
    from: '2026-07-01T08:00',
    to: '2026-09-30T20:00',
    enabled: true,
    newWindow: false,
    cookieExpiration: 7,
    popupFrame: true,
    createdAt: '2026-06-24T10:15',
  },
  {
    id: 'p-498',
    title: { cs: 'Colours of Ostrava — poslední vstupenky', en: 'Colours of Ostrava — last tickets' },
    titleUrl: 'https://www.colours.cz',
    text: { cs: '<p>Doprodej vstupenek na festival v areálu Dolních Vítkovic.</p>' },
    image: '/images/g5.jpg',
    position: 'center',
    widthUnit: 'percent',
    width: 480,
    widthPercent: 40,
    height: 360,
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
    widthUnit: 'percent',
    width: 600,
    widthPercent: 100,
    height: 120,
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
    widthUnit: 'percent',
    width: 600,
    widthPercent: 100,
    height: 110,
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
    widthUnit: 'px',
    width: 380,
    widthPercent: 28,
    height: 300,
    from: '2026-03-01T09:00',
    to: '2026-03-02T17:00',
    enabled: true,
    newWindow: false,
    cookieExpiration: 5,
    popupFrame: true,
    createdAt: '2026-02-10T08:30',
  },
  {
    id: 'p-480',
    title: { cs: 'Velký svět techniky — nová expozice robotiky' },
    titleUrl: '/aktuality/svet-techniky-robotika',
    text: { cs: '<p>Interaktivní expozice pro celou rodinu je otevřená.</p>' },
    image: '/images/g11.jpg',
    position: 'middle-left',
    widthUnit: 'px',
    width: 400,
    widthPercent: 30,
    height: 320,
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
