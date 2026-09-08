import type { ML } from './types'
import { blankNavItem, type NavItem, type NavTargetKind } from './mockNavigation'

/* ============================================================
   Modul Patička — obsah patičky webu.

   Odkazy v patičce používají **stejný model cíle jako Navigace** (`NavItem`:
   odkaz na entitu, ne hotová URL), takže se nerozbijí při změně slugu.
   Sloupce jsou obsahová věc, ne strukturní — nadpis sloupce je proto volitelný
   a sloupců může být, kolik si redakce udělá.

   Proti Clevero 2.0 přibylo to, co má patička DOV navíc a co by jinak neměl
   kdo spravovat: kontaktní údaje, přihlášení k newsletteru, loga partnerů
   a spodní řádek s copyrightem.
   ============================================================ */

export interface FooterColumn {
  id: string
  /** Nadpis sloupce (ML). Prázdný = sloupec bez nadpisu. */
  heading: ML
  items: NavItem[]
}

/** Odkaz na sociální síť — ikona z `Icon.vue` + URL. */
export interface SocialLink {
  id: string
  /** Klíč ikony (viz `SOCIAL_ICON_OPTIONS`). */
  icon: string
  /** Název sítě pro `aria-label` a tooltip. */
  name: string
  url: string
}

/** Ikony nabízené pro sociální sítě — z dostupné sady `Icon.vue`. */
export const SOCIAL_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'video', label: 'YouTube / video' },
  { value: 'image', label: 'Instagram / foto' },
  { value: 'chat', label: 'Síť s diskusí' },
  { value: 'globe', label: 'Web / ostatní' },
  { value: 'share', label: 'Sdílení' },
]

/** Partner s logem v patičce. Web jich dnes ukazuje přes šedesát. */
export interface FooterPartner {
  id: string
  name: string
  /** Logo (prototyp — null = zástupný rámeček s názvem). */
  logo: string | null
  url: string
}

export interface FooterConfig {
  columns: FooterColumn[]
  /** Krátký text o organizaci pod logem. */
  about: ML
  /** Kontakt v patičce — na webu z něj jsou odkazy tel: a mailto:. */
  contactPhone: string
  contactEmail: string
  social: SocialLink[]
  /** Přihlášení k odběru novinek (blok s GDPR souhlasem). */
  newsletterEnabled: boolean
  newsletterText: ML
  partners: FooterPartner[]
  /** Spodní řádek. Rok se na webu doplní automaticky. */
  copyright: ML
}

function ml(cs: string, en = '', de = '', pl = ''): ML {
  return { cs, en, de, pl }
}
function link(id: string, cs: string, kind: NavTargetKind, target: string, en = ''): NavItem {
  return { ...blankNavItem(id), label: ml(cs, en), kind, target, newWindow: kind === 'url' }
}

/* Sloupce odpovídají dnešní patičce na dolnivitkovice.cz. */
export const MOCK_FOOTER: FooterConfig = {
  columns: [
    {
      id: 'fc-1',
      heading: ml('O nás', 'About us'),
      items: [
        link('fl-1', 'O Dolních Vítkovicích', 'page', 'pg-onas', 'About Dolní Vítkovice'),
        link('fl-2', 'Historie areálu', 'page', 'pg-historie'),
        link('fl-3', 'Kontakty', 'page', 'pg-kontakty', 'Contact'),
        link('fl-4', 'Kariéra', 'page', 'pg-kariera'),
        link('fl-5', 'Časté dotazy', 'module', 'faq'),
      ],
    },
    {
      id: 'fc-2',
      heading: ml('Ke stažení'),
      items: [
        link('fl-6', 'Tiskové zprávy', 'module', 'news'),
        // Oficiální soubory zatím nemají v prototypu stránku → položka bez cíle.
        link('fl-7', 'Oficiální soubory', 'page', ''),
      ],
    },
    {
      id: 'fc-3',
      heading: ml('Ostatní'),
      items: [
        link('fl-8', 'E-shop', 'module', 'products'),
        link('fl-9', 'Pro školy', 'page', 'pg-skoly'),
        link('fl-10', 'Poděkování partnerům', 'page', 'pg-partneri'),
        link('fl-11', 'Návštěvní řád', 'page', 'pg-rad'),
        link('fl-12', 'Zásady cookies', 'page', 'pg-cookies'),
        link('fl-13', 'Dotační projekty', 'page', 'pg-projekty'),
      ],
    },
  ],
  about: ml(
    'Dolní oblast VÍTKOVICE — národní kulturní památka a živé centrum kultury, vzdělávání a zábavy v srdci Ostravy.',
  ),
  contactPhone: '+420 724 955 121',
  contactEmail: 'infocentrum@dolnivitkovice.cz',
  social: [
    { id: 'so-1', icon: 'facebook', name: 'Facebook', url: 'https://www.facebook.com/dolnivitkovice' },
    { id: 'so-2', icon: 'video', name: 'YouTube', url: 'https://www.youtube.com/@dolnivitkovice' },
    { id: 'so-3', icon: 'image', name: 'Instagram', url: 'https://www.instagram.com/dolnivitkovice/' },
    { id: 'so-4', icon: 'globe', name: 'TripAdvisor', url: 'https://www.tripadvisor.com/' },
    { id: 'so-5', icon: 'globe', name: 'LinkedIn', url: 'https://www.linkedin.com/company/dolni-vitkovice/' },
  ],
  newsletterEnabled: true,
  newsletterText: ml('Přihlaste se k odběru novinek a nezmeškáte žádnou akci v areálu.'),
  partners: [
    { id: 'pa-1', name: 'Moravskoslezský kraj', logo: null, url: 'https://www.msk.cz/' },
    { id: 'pa-2', name: 'Statutární město Ostrava', logo: null, url: 'https://www.ostrava.cz/' },
    { id: 'pa-3', name: 'Ministerstvo kultury ČR', logo: null, url: 'https://www.mkcr.cz/' },
    { id: 'pa-4', name: 'Vítkovice, a.s.', logo: null, url: '' },
  ],
  copyright: ml('Dolní oblast VÍTKOVICE, z.s.'),
}

let colSeq = 0
export function blankFooterColumn(): FooterColumn {
  colSeq += 1
  return { id: `fc-new-${colSeq}`, heading: ml(''), items: [] }
}
let linkSeq = 0
export function blankFooterLink(): NavItem {
  linkSeq += 1
  return blankNavItem(`fl-new-${linkSeq}`)
}
let socialSeq = 0
export function blankSocialLink(): SocialLink {
  socialSeq += 1
  return { id: `so-new-${socialSeq}`, icon: 'globe', name: '', url: '' }
}
let partnerSeq = 0
export function blankPartner(): FooterPartner {
  partnerSeq += 1
  return { id: `pa-new-${partnerSeq}`, name: '', logo: null, url: '' }
}
