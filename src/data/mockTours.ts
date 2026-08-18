import { imageFor } from './mockNews'
import { LANGS } from './types'
import type { ML, ContentBlock, LangCode, GalleryImage } from './types'

/* ============================================================
   Modul „Prohlídky" (dříve Vstupenky).
   Kategorie prohlídek → prohlídky → (termíny + vstupenky z Colossea).
   Colosseum data (termíny, volná místa, vstupenky) jsou READ-ONLY —
   v adminu se needitují, tahají se přes API. V prototypu jsou to mock data.
   ============================================================ */

export const TOURS_NOW = new Date('2026-07-28T12:00:00')

function ml(cs: string): ML {
  return { cs, en: '', de: '', pl: '' }
}

/* ---------- Kategorie prohlídek ---------- */
export interface TourCategory {
  id: string
  name: ML
  /** Popis kategorie (richtext). */
  description: ML
  /** Fotogalerie kategorie (jediný zdroj fotek); hlavní fotka = cover. */
  photos?: GalleryImage[]
  /** Připojené galerie z modulu Galerie. */
  galleryIds?: string[]
  /** Hlavní obrázek — denormalizovaný odkaz z galerie pro výpisy/karty. */
  image: string
  published: boolean
  /** Které jazykové mutace jdou na web (viz `@/utils/langPublish`).
      undefined = zpětně kompatibilní fallback = všechny vyplněné. */
  publishedLangs?: LangCode[]
}

/* ---------- Prohlídka ---------- */
/** Odrážka „Co vás při prohlídce čeká". */
export interface TourHighlight {
  id: string
  text: ML
}
/** Termín prohlídky z Colossea (read-only). */
export interface TourSlot {
  id: string
  /** ISO datum a čas začátku. */
  datetime: string
  capacity: number
  booked: number
}

export interface Tour {
  id: string
  categoryId: string
  /** Místo konání — objekt v Areálu (kde prohlídka fyzicky probíhá). */
  areaId: string
  title: ML
  /** Část URL (slug) — ML, auto z názvu prohlídky. */
  slug?: ML
  /** Krátký perex do výpisu. */
  perex: ML
  /** Hlavní popis (richtext). */
  description: ML
  /** Obsah prohlídky jako bloky (ContentBuilder) — jednotná sekce „Obsah". */
  contentBlocks?: ContentBlock[]
  /** Fotogalerie prohlídky (jediný zdroj fotek). Hlavní fotka = cover. */
  photos: GalleryImage[]
  /** Připojené galerie z modulu Galerie. */
  galleryIds?: string[]
  /** Hlavní obrázek — denormalizovaný odkaz z galerie pro výpisy/karty. */
  image: string
  /** Délka prohlídky (např. „100 minut"). */
  duration: string
  /** „Co vás při prohlídce čeká" — odrážky. */
  highlights: TourHighlight[]
  /** „Kdy prohlídky začínají" — volný text. */
  scheduleNote: ML
  /** Kontaktní e-mail (alternativa k nákupu). */
  contactEmail: string
  /** Poznámka k platbě (např. platba kartou). */
  paymentNote: ML
  /** Unikátní ID prohlídky v Colosseu (napojení prodeje vstupenek). */
  colosseumId: string
  published: boolean
  /** Které jazykové mutace jdou na web (viz `@/utils/langPublish`).
      undefined = zpětně kompatibilní fallback = všechny vyplněné. */
  publishedLangs?: LangCode[]
  /** Nejbližší termíny z Colossea (read-only). */
  slots: TourSlot[]
}

/* ---------- Vstupenka (podmodul Vstupenky) — z Colossea přes API ----------
   Pozn.: obsazenost termínů (TourSlot.capacity/booked) i vstupenky jsou dvě
   read-only projekce TÉHOŽ zdroje (Colosseum). V adminu se nic nepočítá ani
   needituje — jen zobrazuje; konzistenci drží Colosseum. */
export interface Ticket {
  id: string
  tourId: string
  customer: string
  email: string
  /** Termín prohlídky (ISO) — odpovídá `TourSlot.id` daného termínu. */
  slotDatetime: string
  /** Kdy byla vstupenka zakoupena (ISO). */
  purchasedAt: string
  tierLabel: string
  count: number
  /** Celková částka v Kč. */
  amount: number
}

/* ============================================================
   Mock data
   ============================================================ */
export const MOCK_CATEGORIES: TourCategory[] = [
  {
    id: 'cat-dov',
    // EN název vyplněn, ale záměrně skrytý na webu → ukázka stavu „ready/hidden" (amber).
    name: { cs: 'Dolní Vítkovice', en: 'Lower Vítkovice', de: '', pl: '' },
    description: ml(
      '<p>Komentované prohlídky industriálního areálu Dolních Vítkovic — vysoká pec, Bolt Tower, koksovna a další zákoutí bývalého vysokopecního závodu.</p>',
    ),
    image: imageFor(0),
    published: true,
    publishedLangs: ['cs'],
  },
  {
    id: 'cat-hornicke',
    name: ml('Hornické muzeum Landek Park'),
    description: ml(
      '<p>Fárání do podzemí dolu Anselm, expozice báňského záchranářství a jízda původním důlním vláčkem v největším hornickém muzeu v Česku.</p>',
    ),
    image: imageFor(5),
    published: true,
  },
  {
    id: 'cat-zamek',
    name: ml('Vítkovický zámek'),
    description: ml(
      '<p>Komentované prohlídky vítkovického zámku — proměny jednoho místa a příběhy osobností spjatých s vítkovickými železárnami.</p>',
    ),
    image: imageFor(10),
    published: true,
  },
]

function hl(text: string): TourHighlight {
  return { id: text.slice(0, 16), text: ml(text) }
}
function slot(datetime: string, capacity: number, booked: number): TourSlot {
  return { id: datetime, datetime, capacity, booked }
}

type RawTour = Omit<
  Tour,
  'title' | 'perex' | 'description' | 'scheduleNote' | 'paymentNote' | 'highlights' | 'photos' | 'galleryIds'
> & {
  title: string
  perex: string
  description: string
  scheduleNote: string
  paymentNote: string
  highlights: string[]
  /** Volitelné překlady názvu (ukázka jazykových mutací ve výpisu). */
  titleTr?: Partial<Record<LangCode, string>>
}

const RAW_TOURS: RawTour[] = [
  /* ---------- Dolní Vítkovice ---------- */
  {
    id: 't-vysokopecni',
    categoryId: 'cat-dov',
    areaId: 'v-bolt',
    title: 'Vysokopecní okruh',
    // EN živě, DE vyplněno ale skryté (amber), PL prázdné.
    titleTr: { en: 'Blast Furnace Tour', de: 'Hochofen-Rundgang' },
    publishedLangs: ['cs', 'en'],
    perex: 'Komentovaná prohlídka bývalého vysokopecního závodu — historie Vítkovic a výroba surového železa, včetně výstupu na vysokou pec č. 1.',
    description:
      '<p>Vydejte se po stopách výroby surového železa. Průvodce vás provede areálem bývalého vysokopecního závodu a vysvětlí, jak fungoval jeden z nejdůležitějších provozů Vítkovic.</p>',
    image: imageFor(0),
    duration: '100 minut',
    highlights: [
      'Procházka částí areálu DOV.',
      'Jízda skipovým a skleněným výtahem.',
      'Roštové lávky ve výšce 70 m.',
      'Nahlédnutí do nitra vysoké pece.',
    ],
    scheduleNote:
      'Denně v 10:00, 12:00, 14:00 a 16:00. Max. kapacita skupiny 17 osob; v jeden čas mohou vyjít 2 skupiny. Pro větší skupiny individuální prohlídky dle dohody.',
    contactEmail: 'nkp@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze platit platební kartou.',
    colosseumId: 'COL-TOUR-4401',
    published: true,
    slots: [
      slot('2026-07-30T10:00', 34, 31),
      slot('2026-07-30T12:00', 34, 18),
      slot('2026-07-30T14:00', 34, 34),
      slot('2026-07-31T10:00', 34, 6),
      slot('2026-07-31T16:00', 34, 0),
    ],
  },
  {
    id: 't-bolt-cafe',
    categoryId: 'cat-dov',
    areaId: 'v-bolt',
    title: 'Bolt Café',
    perex: 'Výstup na vrchol vysoké pece do kavárny Bolt Café s jedinečným výhledem na areál i Ostravu.',
    description:
      '<p>Vyjeďte prosklenou nástavbou Bolt Tower do kavárny Bolt Café na vrcholu vysoké pece č. 1 a vychutnejte si panoramatický výhled na celý areál Dolních Vítkovic.</p>',
    image: imageFor(2),
    duration: '45 minut',
    highlights: ['Výjezd na vrchol vysoké pece.', 'Kavárna Bolt Café.', 'Panoramatický výhled na Ostravu.'],
    scheduleNote: 'Denně v provozní době kavárny.',
    contactEmail: 'nkp@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze platit platební kartou.',
    colosseumId: 'COL-TOUR-4403',
    published: true,
    slots: [slot('2026-07-30T13:00', 20, 8)],
  },
  {
    id: 't-vitkovicke-pece',
    categoryId: 'cat-dov',
    areaId: 'v-bolt',
    title: 'Vítkovické pece – příběhy, které utvářely Ostravu',
    perex: 'Komentovaná prohlídka o historii vítkovických pecí a jejich vlivu na podobu města.',
    description:
      '<p>Poznejte příběhy vítkovických pecí, které po generace utvářely Ostravu — od prvních tavieb až po konec výroby.</p>',
    image: imageFor(4),
    duration: '60 minut',
    highlights: ['Historie vítkovických železáren.', 'Vliv průmyslu na podobu Ostravy.'],
    scheduleNote: 'Vybrané termíny, nutná rezervace předem.',
    contactEmail: 'nkp@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze platit platební kartou.',
    colosseumId: 'COL-TOUR-4404',
    published: true,
    slots: [],
  },
  {
    id: 't-cesta-uhli',
    categoryId: 'cat-dov',
    areaId: 'v-bolt',
    title: 'Cesta uhlí – speciál',
    perex: 'Speciální tematická prohlídka sledující cestu uhlí od těžby až po jeho zpracování.',
    description:
      '<p>Tematický okruh, který propojuje těžbu, koksování a vysokopecní výrobu — kompletní „cesta uhlí“ areálem.</p>',
    image: imageFor(6),
    duration: '90 minut',
    highlights: ['Od těžby po zpracování.', 'Provázané provozy areálu.'],
    scheduleNote: 'Vybrané termíny, nutná rezervace předem.',
    contactEmail: 'nkp@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze platit platební kartou.',
    colosseumId: 'COL-TOUR-4405',
    published: true,
    slots: [],
  },
  {
    id: 't-kox',
    categoryId: 'cat-dov',
    areaId: 'v-bolt',
    title: 'KOX',
    perex: 'Prohlídka části bývalé vítkovické koksovny.',
    description:
      '<p>Nahlédněte do prostor bývalé koksovny KOX a poznejte, jak se z uhlí vyráběl koks pro vysoké pece.</p>',
    image: imageFor(7),
    duration: '60 minut',
    highlights: ['Prostory bývalé koksovny.', 'Výroba koksu.'],
    scheduleNote: 'Vybrané termíny, nutná rezervace předem.',
    contactEmail: 'nkp@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze platit platební kartou.',
    colosseumId: 'COL-TOUR-4406',
    published: true,
    slots: [],
  },
  {
    id: 't-vysoka-pec-po-setmeni',
    categoryId: 'cat-dov',
    areaId: 'v-bolt',
    title: 'Vysoká pec po setmění',
    perex: 'Atmosférická večerní prohlídka vysoké pece v nasvícení.',
    description:
      '<p>Zažijte vysokou pec po setmění — nasvícená industriální architektura a jedinečná večerní atmosféra areálu.</p>',
    image: imageFor(13),
    duration: '60 minut',
    highlights: ['Večerní nasvícení pece.', 'Omezená kapacita.'],
    scheduleNote: 'Vybrané večery, nutná rezervace předem.',
    contactEmail: 'nkp@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze platit platební kartou.',
    colosseumId: '',
    published: false,
    slots: [],
  },
  {
    id: 't-vyslap-vysoka-pec',
    categoryId: 'cat-dov',
    areaId: 'v-bolt',
    title: 'Výšlap na vysokou pec s vyhlídkou',
    perex: 'Fyzicky náročnější výstup po schodech na ochozy vysoké pece s výhledem.',
    description:
      '<p>Vystupte pěšky po schodišti na ochozy vysoké pece — odměnou vám bude výhled na celý areál i Ostravu.</p>',
    image: imageFor(9),
    duration: '75 minut',
    highlights: ['Výstup po schodech.', 'Vyhlídkové ochozy.', 'Fyzicky náročnější program.'],
    scheduleNote: 'Vybrané termíny, nutná rezervace předem.',
    contactEmail: 'nkp@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze platit platební kartou.',
    colosseumId: 'COL-TOUR-4407',
    published: true,
    slots: [],
  },
  {
    id: 't-architektura-dov',
    categoryId: 'cat-dov',
    areaId: 'v-areal',
    title: 'Architektura DOV',
    perex: 'Prohlídka zaměřená na architektonické prvky areálu a jejich historii.',
    description:
      '<p>Objevte architekturu Dolních Vítkovic — od industriálních staveb po jejich současné konverze.</p>',
    image: imageFor(11),
    duration: '60 minut',
    highlights: ['Industriální architektura.', 'Konverze industriálních staveb.'],
    scheduleNote: 'Vybrané termíny, nutná rezervace předem.',
    contactEmail: 'nkp@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze platit platební kartou.',
    colosseumId: 'COL-TOUR-4408',
    published: true,
    slots: [],
  },
  /* ---------- Hornické muzeum Landek Park ---------- */
  {
    id: 't-farani-dul',
    categoryId: 'cat-hornicke',
    areaId: 'v-hlubina',
    title: 'Fárání do dolu a báňské záchranářství',
    perex: 'Sfárání do podzemí dolu Anselm, řetízkové šatny a jízda původním důlním vláčkem z 60. let.',
    description:
      '<p>Nejnavštěvovanější program Landek Parku — sfárejte do podzemí nejstarší ostravské šachty, projděte řetízkové šatny a projeďte se historickým důlním vláčkem. Nově i historický tunel z 50. let.</p>',
    image: imageFor(5),
    duration: '90 minut',
    highlights: ['Sfárání do podzemí dolu Anselm.', 'Řetízkové šatny.', 'Jízda důlním vláčkem.', 'Historický tunel z 50. let.'],
    scheduleNote: 'Denně, prohlídky ve stanovených časech; doporučujeme rezervaci předem.',
    contactEmail: 'muzeum@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze platit platební kartou.',
    colosseumId: 'COL-TOUR-4410',
    published: true,
    slots: [slot('2026-07-30T10:00', 20, 12), slot('2026-07-30T13:00', 20, 3), slot('2026-08-01T15:00', 20, 0)],
  },
  {
    id: 't-banske-zachranarstvi',
    categoryId: 'cat-hornicke',
    areaId: 'v-hlubina',
    title: 'Báňské záchranářství',
    perex: 'Expozice báňského záchranářství — technika, výstroj a příběhy záchranných akcí.',
    description:
      '<p>Poznejte práci báňských záchranářů — historickou i současnou techniku, dýchací přístroje a dramatické příběhy záchranných akcí.</p>',
    image: imageFor(14),
    duration: '60 minut',
    highlights: ['Záchranářská technika.', 'Dýchací přístroje.', 'Příběhy záchranných akcí.'],
    scheduleNote: 'Denně v otevírací době muzea.',
    contactEmail: 'muzeum@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze platit platební kartou.',
    colosseumId: 'COL-TOUR-4411',
    published: true,
    slots: [],
  },
  {
    id: 't-farani-stajgr',
    categoryId: 'cat-hornicke',
    areaId: 'v-hlubina',
    title: 'Fárání se štajgrem – zážitkový program',
    perex: 'Zážitkový program se štajgrem — práci horníků si vyzkoušíte na vlastní kůži.',
    description:
      '<p>Interaktivní zážitkový program: pod vedením štajgra si vyzkoušíte hornické nářadí, práci v podzemí a tradice spjaté s fáráním.</p>',
    image: imageFor(15),
    duration: '120 minut',
    highlights: ['Práce se štajgrem.', 'Hornické nářadí a tradice.', 'Interaktivní program.'],
    scheduleNote: 'Vybrané termíny, nutná rezervace předem.',
    contactEmail: 'muzeum@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze platit platební kartou.',
    colosseumId: 'COL-TOUR-4412',
    published: true,
    slots: [],
  },
  {
    id: 't-dulni-vlacek',
    categoryId: 'cat-hornicke',
    areaId: 'v-hlubina',
    title: 'Důlní vláček',
    perex: 'Jízda původním důlním vláčkem areálem Landek Parku.',
    description: '<p>Svezte se původním důlním vláčkem a projeďte areálem Landek Parku pohodlně a s výkladem průvodce.</p>',
    image: imageFor(16),
    duration: '30 minut',
    highlights: ['Jízda původním vláčkem.', 'Výklad průvodce.'],
    scheduleNote: 'Od května denně.',
    contactEmail: 'muzeum@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze platit platební kartou.',
    colosseumId: 'COL-TOUR-4413',
    published: true,
    slots: [slot('2026-07-30T11:00', 30, 10)],
  },
  /* ---------- Vítkovický zámek ---------- */
  {
    id: 't-zamek-promeny',
    categoryId: 'cat-zamek',
    areaId: 'v-areal',
    title: 'Vítkovický zámek – proměny jednoho místa',
    perex: 'Komentovaná prohlídka o historii vítkovického zámku od poloviny 19. století po současnost.',
    description:
      '<p>Seznamte se s rozmanitou historií vítkovického zámku, a to od jeho počátků v polovině 19. století až po jeho současné proměny. Trasa je bezbariérová.</p>',
    image: imageFor(10),
    duration: '45 minut',
    highlights: ['Historie zámku od 19. století.', 'Bezbariérová trasa.'],
    scheduleNote: 'Prohlídky každou celou hodinu; příchod 10 minut předem.',
    contactEmail: 'infocentrum@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze zakoupit online; refundace není možná.',
    colosseumId: 'COL-TOUR-4420',
    published: true,
    slots: [slot('2026-07-30T14:00', 15, 5)],
  },
  {
    id: 't-zamek-obyvatele',
    categoryId: 'cat-zamek',
    areaId: 'v-areal',
    title: 'Vítkovický zámek a jeho obyvatelé',
    perex: 'Tematická prohlídka o osobnostech spjatých s železárnami a generálních ředitelích.',
    description:
      '<p>Prohlídka zaměřená na obyvatele zámku — generální ředitele a osobnosti, jejichž osudy byly svázány s vítkovickými železárnami.</p>',
    image: imageFor(12),
    duration: '45 minut',
    highlights: ['Osobnosti vítkovických železáren.', 'Generální ředitelé.'],
    scheduleNote: 'Prohlídky každou celou hodinu; příchod 10 minut předem.',
    contactEmail: 'infocentrum@dolnivitkovice.cz',
    paymentNote: 'Vstupenky lze zakoupit online; refundace není možná.',
    colosseumId: 'COL-TOUR-4421',
    published: true,
    slots: [],
  },
]

export const MOCK_TOURS: Tour[] = RAW_TOURS.map((r, idx) => ({
  ...r,
  title: { ...ml(r.title), ...r.titleTr },
  perex: ml(r.perex),
  description: ml(r.description),
  scheduleNote: ml(r.scheduleNote),
  paymentNote: ml(r.paymentNote),
  highlights: r.highlights.map(hl),
  // Galerie = jediný zdroj fotek; hlavní (isMain) = cover do výpisů (r.image).
  galleryIds: [],
  photos: r.image
    ? [
        { id: `${r.id}-ph0`, src: r.image, alt: r.title, isMain: true },
        { id: `${r.id}-ph1`, src: imageFor(idx * 3 + 4), alt: '', isMain: false },
        { id: `${r.id}-ph2`, src: imageFor(idx * 3 + 9), alt: '', isMain: false },
      ]
    : [],
}))

export const MOCK_TICKETS: Ticket[] = [
  { id: 'tk-1', tourId: 't-vysokopecni', customer: 'Petr Novák', email: 'p.novak@email.cz', slotDatetime: '2026-07-30T10:00', purchasedAt: '2026-07-24T18:32', tierLabel: 'Dospělí', count: 2, amount: 590 },
  { id: 'tk-2', tourId: 't-vysokopecni', customer: 'Jana Dvořáková', email: 'jana.d@email.cz', slotDatetime: '2026-07-30T10:00', purchasedAt: '2026-07-25T09:10', tierLabel: 'Rodinné vstupné', count: 1, amount: 800 },
  { id: 'tk-3', tourId: 't-vysokopecni', customer: 'ZŠ Ostrava-Poruba', email: 'skola@zsporuba.cz', slotDatetime: '2026-07-31T10:00', purchasedAt: '2026-07-20T11:05', tierLabel: 'Školní skupiny', count: 24, amount: 4080 },
  { id: 'tk-4', tourId: 't-bolt-cafe', customer: 'Tomáš Král', email: 't.kral@email.cz', slotDatetime: '2026-07-30T13:00', purchasedAt: '2026-07-26T14:47', tierLabel: 'Dospělí', count: 3, amount: 540 },
  { id: 'tk-5', tourId: 't-farani-dul', customer: 'Eva Malá', email: 'eva.mala@email.cz', slotDatetime: '2026-07-30T13:00', purchasedAt: '2026-07-27T20:15', tierLabel: 'Snížené', count: 2, amount: 300 },
  { id: 'tk-6', tourId: 't-farani-dul', customer: 'Martin Beneš', email: 'm.benes@email.cz', slotDatetime: '2026-07-30T10:00', purchasedAt: '2026-07-27T21:40', tierLabel: 'Dospělí', count: 2, amount: 440 },
  { id: 'tk-7', tourId: 't-vysokopecni', customer: 'Lucie Horáková', email: 'l.horakova@email.cz', slotDatetime: '2026-07-30T12:00', purchasedAt: '2026-07-28T08:03', tierLabel: 'ZTP/P', count: 2, amount: 440 },
]

/* ============================================================
   Helpers
   ============================================================ */
export function category(id: string): TourCategory | undefined {
  return MOCK_CATEGORIES.find((c) => c.id === id)
}
export function tour(id: string): Tour | undefined {
  return MOCK_TOURS.find((t) => t.id === id)
}

/* ---------- Načtené akce/okruhy z Colossea (read-only katalog pro našeptávač) ----------
   To, co API aktuálně vrací jako dostupné okruhy. Napojení prohlídky se z tohoto
   seznamu vybírá našeptávačem; lze ale zadat i ID zatím nenačtené (naplánované)
   akce — dokud se v Colosseu nezveřejní, nepůjdou koupit vstupenky. */
export interface ColosseumTour {
  id: string
  name: string
  /** Časovaný okruh (má termíny) vs. nečasovaný. */
  timed: boolean
}
export const COLOSSEUM_TOURS: ColosseumTour[] = [
  { id: 'COL-TOUR-4401', name: 'Vysokopecní okruh + Bolt Tower', timed: true },
  { id: 'COL-TOUR-4402', name: 'Plynojem a aula Gong', timed: true },
  { id: 'COL-TOUR-4410', name: 'Důl Hlubina — denní prohlídka', timed: true },
  { id: 'COL-TOUR-4415', name: 'Bolt Tower — vyhlídková plošina', timed: false },
  { id: 'COL-TOUR-4420', name: 'Noční prohlídka dolu Hlubina', timed: true },
  { id: 'COL-TOUR-4433', name: 'Malý svět techniky U6', timed: false },
]
/** Načtený okruh z Colossea podle ID (jinak undefined = zatím nenačteno). */
export function colosseumTourById(id: string): ColosseumTour | undefined {
  return COLOSSEUM_TOURS.find((t) => t.id === id.trim())
}
export function toursForCategory(categoryId: string): Tour[] {
  return MOCK_TOURS.filter((t) => t.categoryId === categoryId)
}
/** Prohlídky „nabízené" u objektu = ty, které tu mají místo konání (`tour.areaId`).
    Odvozeno z Prohlídek — v Areálu se nabízené prohlídky needitují, jen zrcadlí
    (jediný zdroj pravdy je `tour.areaId`, nastavovaný v modulu Prohlídky). */
export function toursForVenue(areaId: string): Tour[] {
  if (!areaId) return []
  return MOCK_TOURS.filter((t) => t.areaId === areaId)
}
export function remaining(s: TourSlot): number {
  return Math.max(0, s.capacity - s.booked)
}
/** Nejbližší budoucí termíny (seřazené). */
export function upcomingSlots(t: Tour, now = TOURS_NOW): TourSlot[] {
  return t.slots
    .filter((s) => new Date(s.datetime) >= now)
    .sort((a, b) => a.datetime.localeCompare(b.datetime))
}
/** Součet volných míst na nejbližších termínech. */
export function freeSeats(t: Tour, now = TOURS_NOW): number {
  return upcomingSlots(t, now).reduce((sum, s) => sum + remaining(s), 0)
}

export type Availability = 'available' | 'lastSpots' | 'soldout' | 'none'
/** Odvozený stav dostupnosti z nejbližších termínů. */
export function availability(t: Tour, now = TOURS_NOW): Availability {
  const up = upcomingSlots(t, now)
  if (!up.length) return 'none'
  const free = up.reduce((sum, s) => sum + remaining(s), 0)
  if (free === 0) return 'soldout'
  if (free <= 10) return 'lastSpots'
  return 'available'
}
export const AVAILABILITY_META: Record<Availability, { label: string; dot: string; text: string; bg: string }> = {
  available: { label: 'Volná místa', dot: 'bg-forge-500', text: 'text-forge-600', bg: 'bg-forge-500/10' },
  lastSpots: { label: 'Poslední místa', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-500/10' },
  soldout: { label: 'Vyprodáno', dot: 'bg-danger-500', text: 'text-danger-600', bg: 'bg-danger-500/10' },
  none: { label: 'Bez termínů', dot: 'bg-steel-400', text: 'text-steel-600', bg: 'bg-steel-200' },
}

export function ticketsForTour(tourId: string): Ticket[] {
  return MOCK_TICKETS.filter((t) => t.tourId === tourId)
}

/** Prázdné entity pro zakládání. */
export function blankCategory(): TourCategory {
  // Nová kategorie: každá mutace půjde živě, jakmile dostane obsah.
  return { id: 'nová', name: ml(''), description: ml(''), photos: [], galleryIds: [], image: '', published: false, publishedLangs: LANGS.map((l) => l.code) }
}
export function blankTour(categoryId = 'cat-dov'): Tour {
  return {
    id: 'nová',
    categoryId,
    areaId: '',
    title: ml(''),
    perex: ml(''),
    description: ml(''),
    photos: [],
    galleryIds: [],
    image: '',
    duration: '',
    highlights: [],
    scheduleNote: ml(''),
    contactEmail: '',
    paymentNote: ml('Vstupenky lze platit platební kartou.'),
    colosseumId: '',
    published: false,
    // Nová prohlídka: každá mutace půjde živě, jakmile dostane obsah.
    publishedLangs: LANGS.map((l) => l.code),
    slots: [],
  }
}

export const CATEGORY_OPTIONS = MOCK_CATEGORIES.map((c) => ({ value: c.id, label: c.name.cs }))

/** Položky pro výběr prohlídek v jiných modulech (Areál, Novinky, Kalendář akcí)
    — kompatibilní s `RelItem` sdílené `RelationPicker`. */
export function tourOptionsList(): { id: string; label: string; sub: string; thumb: string }[] {
  return MOCK_TOURS.map((t) => ({
    id: t.id,
    label: t.title.cs,
    sub: category(t.categoryId)?.name.cs ?? '',
    thumb: t.image,
  }))
}

/** Formátování data/času termínu do CZ. */
export function fmtSlot(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
