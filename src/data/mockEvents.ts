import { imageFor, TAG_PALETTE } from './mockNews'
import type { ML, Tag, GalleryImage, ContentBlock, LangCode } from './types'

/** „Dnešek" prototypu — kvůli stavům a zvýraznění v kalendáři. */
export const EVENTS_NOW = new Date('2026-07-28T12:00:00')

/** Typy akcí. „Prohlídka" zde záměrně NENÍ — prohlídky jsou samostatný modul
    Prohlídky (opakované termíny + Colosseum). Viz pravidlo Akce vs Prohlídka
    ve STANDARDY-MODULU.md. */
export const EVENT_TYPES = [
  'Festival',
  'Koncert',
  'Sportovní akce',
  'Výstava',
  'Vzdělávací program',
  'Konference',
  'Stand-up',
]

/** Způsob prodeje vstupenek u akce. Určuje, co operátor u akce vidí a jak se
    akce chová na webu:
    - 'colosseum' → vstupenky přebírá navázaná prohlídka (dostupnost + košík z Colossea),
    - 'external'  → prodej řeší pořadatel/nájemce na vlastním webu (jen odkaz),
    - 'onsite'    → placená akce bez online prodeje — vstupenky jen na místě (pokladna Colossea),
    - 'free'      → vstup zdarma, vstupenky se neprodávají. */
export type TicketMode = 'colosseum' | 'external' | 'onsite' | 'free'

export const TICKET_MODE_OPTIONS: { value: TicketMode; label: string; hint: string; icon: string }[] = [
  { value: 'colosseum', label: 'Přes Colosseum', hint: 'Vyber akci z Colossea (našeptávač) — dostupnost termínů i košík táhne vybraná akce.', icon: 'ticket' },
  { value: 'external', label: 'Externí odkaz', hint: 'Prodej řeší pořadatel / nájemce na svém webu — web jen odkáže.', icon: 'link' },
  { value: 'onsite', label: 'Prodej na místě', hint: 'Placená akce bez online prodeje — vstupenky jen na místě, na pokladně přes Colosseum.', icon: 'map' },
  { value: 'free', label: 'Zdarma', hint: 'Vstup zdarma — vstupenky se neprodávají.', icon: 'check' },
]

/* ---------- Akce dostupné z Colossea (přes API) ----------
   Našeptávač v „Prodej vstupenek → Přes Colosseum". Colosseum posílá název akce
   a termín (datum/čas). Napojení = hlavní způsob prodeje přes Colosseum. */
export interface ColosseumEvent {
  id: string
  name: string
  /** Termín akce z Colossea (datum, případně čas) — pro našeptávač. */
  when: string
  /* --- Data, která Colosseum posílá přes API a použijí se k předvyplnění nové akce --- */
  /** Podnadpis / claim akce. */
  subtitle?: string
  /** Perex / krátké shrnutí. */
  summary?: string
  /** Vstupné (text, např. „od 390 Kč"). */
  price?: string
  /** Termín OD (ISO YYYY-MM-DD). */
  from?: string
  /** Termín DO (ISO YYYY-MM-DD). */
  to?: string
  /** Čas začátku (HH:MM). */
  time?: string
  /** Čas konce (HH:MM). */
  timeTo?: string
  /** Kapacita akce (počet míst). */
  capacity?: number
  /** Aktuálně volných míst. */
  freeSpots?: number
}
export const COLOSSEUM_EVENTS: ColosseumEvent[] = [
  { id: 'COL-EV-9001', name: 'Ostrava v plamenech 2026', when: '1. 8. 2026 · 18:00', subtitle: 'Velkolepá ohňová show nad Dolní oblastí', summary: 'Tradiční letní podívaná plná ohně, hudby a světel v areálu Dolní oblasti Vítkovice.', price: 'od 390 Kč', from: '2026-08-01', to: '2026-08-01', time: '18:00', timeTo: '22:00', capacity: 5000, freeSpots: 1240 },
  { id: 'COL-EV-9002', name: 'Letní koncert v Gongu', when: '7. 8. 2026 · 19:30', subtitle: 'Open-air koncert pod kupolí Gongu', summary: 'Letní hudební večer v jedinečné akustice multifunkční auly Gong.', price: 'od 590 Kč', from: '2026-08-07', to: '2026-08-07', time: '19:30', timeTo: '22:00', capacity: 1500, freeSpots: 320 },
  { id: 'COL-EV-9003', name: 'HIP HOP ŽIJE OSTRAVA', when: '28.–29. 8. 2026', subtitle: 'Dvoudenní festival městské kultury', summary: 'Dva dny beatů, tance a graffiti napříč areálem Dolní oblasti.', price: 'od 890 Kč', from: '2026-08-28', to: '2026-08-29', capacity: 8000, freeSpots: 2600 },
  { id: 'COL-EV-9004', name: 'Festival AFROSTRAVA', when: '14.–15. 8. 2026', subtitle: 'Rytmy Afriky v srdci Ostravy', summary: 'Hudba, tanec, gastro a workshopy oslavující africkou kulturu.', price: 'Vstup zdarma', from: '2026-08-14', to: '2026-08-15', capacity: 3000, freeSpots: 3000 },
  { id: 'COL-EV-9005', name: 'Závody na lezecké stěně', when: '15. 8. 2026 · 10:00', subtitle: 'Regionální přebor v lezení na obtížnost', summary: 'Závodní den pro všechny výkonnostní kategorie na venkovní lezecké stěně.', price: 'od 150 Kč', from: '2026-08-15', to: '2026-08-15', time: '10:00', timeTo: '17:00', capacity: 200, freeSpots: 44 },
  { id: 'COL-EV-9006', name: 'David Macháč: Soukromé ráje (výstava)', when: '19. 3. – 27. 9. 2026', subtitle: 'Komentovaná výstava fotografií', summary: 'Autorská výstava mapující intimní krajiny a zákoutí každodennosti.', price: 'od 120 Kč', from: '2026-03-19', to: '2026-09-27' },
  { id: 'COL-EV-9007', name: 'Krištof Kintera: Neuropolis (výstava)', when: '1. 5. – 31. 12. 2026', subtitle: 'Velká autorská výstava', summary: 'Rozsáhlá instalace propojující město, energii a lidský mozek.', price: 'od 180 Kč', from: '2026-05-01', to: '2026-12-31' },
  { id: 'COL-EV-9008', name: 'Adventní koncert v Gongu', when: '13. 12. 2026 · 18:00', subtitle: 'Adventní podvečer s hudbou', summary: 'Sváteční koncert v adventním čase pod kupolí Gongu.', price: 'od 490 Kč', from: '2026-12-13', to: '2026-12-13', time: '18:00', timeTo: '20:00', capacity: 1500, freeSpots: 210 },
  { id: 'COL-EV-9009', name: 'Silvestrovský ohňostroj', when: '31. 12. 2026 · 23:30', subtitle: 'Přivítejte nový rok pod širým nebem', summary: 'Novoroční ohňostroj nad industriální siluetou Dolní oblasti.', price: 'Vstup zdarma', from: '2026-12-31', to: '2026-12-31', time: '23:30', timeTo: '00:15', capacity: 10000, freeSpots: 7800 },
]
export function colosseumEvent(id: string): ColosseumEvent | undefined {
  return COLOSSEUM_EVENTS.find((e) => e.id === id.trim())
}

/** Předdefinované možnosti věkového omezení (dropdown v detailu akce).
    Prázdná hodnota = bez omezení (řeší se sentinelem v komponentě). */
export const AGE_LIMIT_OPTIONS: { value: string; label: string }[] = [
  { value: 'Od 3 let', label: 'Od 3 let' },
  { value: 'Od 6 let', label: 'Od 6 let' },
  { value: 'Od 12 let', label: 'Od 12 let' },
  { value: 'Od 15 let', label: 'Od 15 let' },
  { value: 'Od 18 let', label: 'Od 18 let' },
]

/** Předdefinované štítky akcí s barvami — stejný model jako v Aktualitách
    (sdílený `TagPicker`). Uživatel může přidat i vlastní. */
export const PREDEFINED_EVENT_TAGS: Tag[] = [
  { label: 'Zdarma', color: '#15916a' },
  { label: 'Rodinné', color: '#ee703d' },
  { label: 'Venku', color: '#3b6fb0' },
  { label: 'Hudba', color: '#7b5ea7' },
  { label: 'Industriál', color: '#b04f20' },
  { label: 'Pro školy', color: '#0e8a8a' },
  { label: 'Noční', color: '#4c545f' },
  { label: 'Sport', color: '#c2568c' },
  { label: 'Komentováno', color: '#6b7480' },
  { label: 'Občerstvení', color: '#e0a52a' },
]

export interface DovEvent {
  id: string
  /** Vícejazyčný název (ML) — v seznamu/kalendáři zobrazujeme CZ. */
  title: ML
  /** Část URL (slug) — ML, auto z názvu akce. */
  slug?: ML
  /** Podnadpis / claim (ML). */
  subtitle: ML
  type: string
  /** Rozsah dat (ISO YYYY-MM-DD). from === to = jednodenní. */
  from: string
  to: string
  /** Volitelný čas začátku (jednodenní akce). */
  time?: string
  /** Volitelný čas konce. */
  timeTo?: string
  /** Vícejazyčný perex / krátké shrnutí do výpisu (ML). */
  summary: ML
  /** Vícejazyčný dlouhý popis (ML, richtext). */
  description: ML
  /** Obsah akce jako bloky (ContentBuilder) — jednotná sekce „Obsah". */
  contentBlocks?: ContentBlock[]
  image: string
  /** Vstupné (krátký text, např. „Vstup zdarma" / „od 390 Kč"). */
  price: string
  /** Odkaz na prodej vstupenek / rezervaci (jen pro `ticketMode === 'external'`). */
  ticketUrl: string
  /** Způsob prodeje vstupenek — řídí, co se u akce edituje i zobrazuje na webu. */
  ticketMode: TicketMode
  /** Věkové omezení (např. „15+"). */
  ageLimit: string
  /** Délka akce (např. „60 min"). */
  duration: string
  /** Účinkující / lektoři (volný text). */
  performers: string
  /** Štítky akce. */
  tags: string[]
  /** Akce se koná v celém areálu DOV (ne v konkrétních budovách). Vylučuje se
      s `areaIds` — když je true, `areaIds` je prázdné a v kalendáři se akce
      zobrazí ve zvláštním pruhu „Celý areál" nad budovami. */
  wholeArea?: boolean
  /** Vazba na objekty v Areálu (IDs objektů). Akce se může konat na více
      místech — v kalendáři se zobrazí v řádku každého z nich. Prázdné, pokud
      `wholeArea` = true. */
  areaIds: string[]
  /** Akce obsazuje budovu — po dobu konání je uzavřena pro širší veřejnost
      (soukromá akce, konference, festival). Řídí upozornění „Provoz budov". */
  closesVenue?: boolean
  /** Související prohlídky (ID z modulu Prohlídky). */
  tourIds: string[]
  /** Napojení na akci v Colosseu (hlavní způsob prodeje vstupenek přes Colosseum).
      Dostupnost termínů i košík táhne tato akce z Colossea. '' = nenapojeno. */
  colosseumEventId?: string
  /** Kapacita akce (počet míst) — typicky přebráno z napojené akce v Colosseu. */
  capacity?: number
  /** Aktuálně volných míst — typicky přebráno z napojené akce v Colosseu. */
  freeSpots?: number
  /** Připojené fotogalerie (ID z modulu Galerie) — např. „fotky z minulého ročníku". */
  galleryIds: string[]
  /** Fotky nahrané přímo k akci (mimo připojené galerie). */
  gallery?: GalleryImage[]
  published: boolean
  /** Které jazykové mutace jsou zveřejněné (živě na webu). Publikování je per
      jazyk — stav záznamu (published) + termín řídí, KDY je akce živá,
      tento seznam řídí, KTERÉ mutace se zobrazí. Prázdná mutace nemůže být živá.
      Nevyplněno (undefined) = zpětně kompatibilní fallback: všechny vyplněné. */
  publishedLangs?: LangCode[]
}

/** Raw varianta — v mock datech píšeme jen CZ, ML doplní normalizace. */
type RawEvent = {
  id: string
  title: string
  type: string
  from: string
  to: string
  time?: string
  timeTo?: string
  summary: string
  image: string
  published: boolean
  /** Volitelné rich údaje (jinak default). */
  subtitle?: string
  description?: string
  price?: string
  ticketUrl?: string
  ticketMode?: TicketMode
  ageLimit?: string
  duration?: string
  performers?: string
  tags?: string[]
  areaIds?: string[]
  /** Akce v celém areálu DOV (vylučuje se s areaIds). */
  wholeArea?: boolean
  /** Akce obsazuje budovu (uzavře ji pro veřejnost po dobu konání). */
  closesVenue?: boolean
  tourIds?: string[]
  colosseumEventId?: string
  galleryIds?: string[]
  /** Volitelné jazykové mutace názvu (mimo CZ) — pro demonstraci stavů publikace. */
  titleLangs?: Partial<Record<LangCode, string>>
  /** Které mutace jsou zveřejněné (živě). Nevyplněno = fallback na všechny vyplněné. */
  publishedLangs?: LangCode[]
}
function ml(cs: string): ML {
  return { cs, en: '', de: '', pl: '' }
}

const RAW_EVENTS: RawEvent[] = [
  // — Dlouhodobé výstavy —
  { id: 'e-neuropolis', title: 'Krištof Kintera: Neuropolis', areaIds: ['v-galerie'], type: 'Výstava', from: '2026-05-01', to: '2026-12-31', summary: 'Rozsáhlá výstava propojující umění a technologie v Galerii Gong.', image: imageFor(3), published: true, price: '250 Kč', ageLimit: '', tags: ['Industriál'] },
  { id: 'e-machac', title: 'David Macháč: Soukromé ráje', wholeArea: true, type: 'Výstava', from: '2026-03-19', to: '2026-09-27', summary: 'Site-specific instalace v prostorách areálu.', image: imageFor(11), published: true },
  { id: 'e-salon', title: 'Letní salón 2', areaIds: ['v-galerie'], type: 'Výstava', from: '2026-06-23', to: '2026-08-28', summary: 'Přehlídka současné regionální tvorby.', image: imageFor(6), published: true },

  // — Vzdělávací programy (konec července) —
  { id: 'e-tabor', areaIds: ['v-u6'], title: 'Letní příměstský tábor U6', type: 'Vzdělávací program', from: '2026-07-27', to: '2026-07-31', summary: 'Týdenní tábor plný experimentů ve Světě techniky.', image: imageFor(4), published: true, price: '2 900 Kč', ageLimit: 'Od 6 let', tags: ['Pro školy', 'Rodinné'], closesVenue: true },
  // — Soukromá akce, která už skončila (budova zůstala omylem zavřená → dashboard nabídne otevřít) —
  { id: 'e-firemniden', areaIds: ['v-marycka'], title: 'Firemní den — ArcelorMittal', type: 'Soukromá akce', from: '2026-07-25', to: '2026-07-27', summary: 'Soukromá firemní akce — prostor uzavřen pro veřejnost.', image: imageFor(6), published: false, closesVenue: true },
  { id: 'e-scienceshow', areaIds: ['v-u6'], title: 'Science Show: Živly', type: 'Vzdělávací program', from: '2026-07-29', to: '2026-07-29', time: '15:00', timeTo: '16:00', summary: 'Interaktivní představení o přírodních živlech.', image: imageFor(13), published: true, price: 'Vstup zdarma', duration: '60 min', tags: ['Rodinné', 'Zdarma'] },
  // — Srpen: festivaly a akce (více budov v jeden den) —
  // CZ živě, EN má vyplněný název, ale drží se skryté (připraveno) → amber stav.
  { id: 'e-plameny', title: 'Ostrava v plamenech 2026', titleLangs: { en: 'Ostrava Ablaze 2026' }, publishedLangs: ['cs'], wholeArea: true, type: 'Festival', from: '2026-08-01', to: '2026-08-01', time: '18:00', summary: 'Ohnivá show a doprovodný program v celém areálu.', image: imageFor(1), published: true, price: 'od 290 Kč', tags: ['Venku', 'Hudba'], galleryIds: ['g-akce'] },
  { id: 'e-race', title: 'Race the Streets', wholeArea: true, type: 'Sportovní akce', from: '2026-08-07', to: '2026-08-08', summary: 'Městské závody napříč industriálním areálem.', image: imageFor(2), published: true, tags: ['Sport', 'Venku'] },
  { id: 'e-gongkoncert', colosseumEventId: 'COL-EV-9002', areaIds: ['v-gong'], title: 'Letní koncert v Gongu', type: 'Koncert', from: '2026-08-07', to: '2026-08-07', time: '19:30', summary: 'Večerní koncert v multifunkční aule.', image: imageFor(8), published: true, price: 'od 490 Kč', tags: ['Hudba'] },
  { id: 'e-hopjump', title: 'HopJump večerní jam', areaIds: ['v-hopjump'], type: 'Sportovní akce', from: '2026-08-08', to: '2026-08-08', time: '20:00', summary: 'Trampolínový večer pro všechny věkové kategorie.', image: imageFor(9), published: true, tags: ['Sport', 'Rodinné'] },
  // CZ + EN živě, DE má vyplněný název, ale zatím skryté (připraveno) → amber stav.
  { id: 'e-afrostrava', colosseumEventId: 'COL-EV-9004', title: 'Festival AFROSTRAVA', titleLangs: { en: 'AFROSTRAVA Festival', de: 'AFROSTRAVA Festival' }, publishedLangs: ['cs', 'en'], wholeArea: true, type: 'Festival', from: '2026-08-14', to: '2026-08-15', summary: 'Přehlídka africké hudby, tance a gastronomie.', image: imageFor(7), published: true, tags: ['Hudba', 'Venku', 'Občerstvení'] },
  { id: 'e-lezecka', colosseumEventId: 'COL-EV-9005', title: 'Závody na lezecké stěně', areaIds: ['v-lezecka'], type: 'Sportovní akce', from: '2026-08-15', to: '2026-08-15', time: '10:00', summary: 'Regionální kolo v lezení na obtížnost.', image: imageFor(10), published: true, tags: ['Sport'] },
  { id: 'e-hiphop', colosseumEventId: 'COL-EV-9003', areaIds: ['v-gong'], title: 'HIP HOP ŽIJE OSTRAVA', type: 'Koncert', from: '2026-08-28', to: '2026-08-29', summary: 'Dvoudenní hip-hopový festival v Gongu.', image: imageFor(12), published: true, tags: ['Hudba'] },
  { id: 'e-konference', title: 'Konference Industry 5.0', areaIds: ['v-u6'], type: 'Konference', from: '2026-08-20', to: '2026-08-21', summary: 'Odborná konference o budoucnosti průmyslu.', image: imageFor(14), published: false, tags: ['Pro školy'], closesVenue: true },
]

/** Odvození způsobu prodeje z dostupných polí, když RawEvent `ticketMode` neurčuje.
    Colosseum má přednost u akcí na něj napojených; jinak je výchozí režim
    „Externí odkaz" (default napříč akcemi). */
function deriveTicketMode(r: RawEvent): TicketMode {
  if (r.colosseumEventId || r.tourIds?.length) return 'colosseum'
  return 'external'
}

/** Normalizace na plný model (ML — vyplněná zatím jen čeština). */
export const MOCK_EVENTS: DovEvent[] = RAW_EVENTS.map((r) => ({
  id: r.id,
  title: { ...ml(r.title), ...(r.titleLangs ?? {}) },
  subtitle: ml(r.subtitle ?? ''),
  type: r.type,
  from: r.from,
  to: r.to,
  time: r.time,
  timeTo: r.timeTo,
  summary: ml(r.summary),
  description: ml(r.description ?? `<p>${r.summary}</p>`),
  image: r.image,
  price: r.price ?? '',
  ticketUrl: r.ticketUrl ?? '',
  ticketMode: r.ticketMode ?? deriveTicketMode(r),
  ageLimit: r.ageLimit ?? '',
  duration: r.duration ?? '',
  performers: r.performers ?? '',
  tags: r.tags ?? [],
  wholeArea: r.wholeArea ?? false,
  areaIds: r.wholeArea ? [] : (r.areaIds ?? []),
  closesVenue: r.closesVenue ?? false,
  tourIds: r.tourIds ?? [],
  colosseumEventId: r.colosseumEventId ?? '',
  galleryIds: r.galleryIds ?? [],
  published: r.published,
  publishedLangs: r.publishedLangs,
}))

/** Barva štítku akce — z předdefinovaných, jinak stabilní z palety (stejná
    logika jako `tagColor` v Aktualitách → shodné barvy v pickeru i výpisu). */
export function eventTagColor(label: string): string {
  const f = PREDEFINED_EVENT_TAGS.find((t) => t.label.toLowerCase() === label.toLowerCase())
  if (f) return f.color
  let h = 0
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0
  return TAG_PALETTE[h % TAG_PALETTE.length]
}

export type EventStatus = 'ongoing' | 'upcoming' | 'past'

/** Odvození stavu z termínu vůči „dnešku". */
export function eventStatus(e: DovEvent, now = EVENTS_NOW): EventStatus {
  const from = new Date(e.from + 'T00:00:00')
  const to = new Date(e.to + 'T23:59:59')
  if (to < now) return 'past'
  if (from > now) return 'upcoming'
  return 'ongoing'
}

export const EVENT_STATE_META: Record<EventStatus, { label: string; dot: string; text: string; bg: string }> = {
  ongoing: { label: 'Probíhá', dot: 'bg-forge-500', text: 'text-forge-600', bg: 'bg-forge-500/10' },
  upcoming: { label: 'Nadcházející', dot: 'bg-brand-500', text: 'text-brand-600', bg: 'bg-brand-50' },
  past: { label: 'Ukončeno', dot: 'bg-steel-400', text: 'text-steel-600', bg: 'bg-steel-200' },
}

/** Je událost vícedenní? */
export function isMultiDay(e: DovEvent): boolean {
  return e.from !== e.to
}

/** Dlouhodobá akce (typicky výstava přes týdny) — pro oddělený „pruh" v kalendáři. */
export function isLongRunning(e: DovEvent, days = 14): boolean {
  const from = new Date(e.from + 'T00:00:00')
  const to = new Date(e.to + 'T00:00:00')
  return (to.getTime() - from.getTime()) / 86400000 >= days
}

/* ============================================================
   AI-first import akce z odkazu (prototyp — bez reálné AI).
   Vloží se URL akce konané v DOV; „AI" z ní připraví kompletní
   obsah (název, popis, termín, vstupné, štítky, plakát…).
   V prototypu je to deterministický mock podle klíčových slov v URL.
   ============================================================ */
export interface EventDraft {
  title: string
  subtitle: string
  summary: string
  description: string
  type: string
  wholeArea: boolean
  areaIds: string[]
  from: string
  to: string
  time: string
  timeTo: string
  price: string
  ticketUrl: string
  ticketMode: TicketMode
  ageLimit: string
  duration: string
  performers: string
  tags: string[]
  image: string
}

export function aiImportFromUrl(url: string): EventDraft {
  const u = url.toLowerCase()

  // Sportovní akce (např. Race the Streets Ostrava)
  if (/race|streets|run|sport|zavod|závod|marat/.test(u)) {
    return {
      title: 'Race the Streets Ostrava 2026',
      subtitle: 'Městský závod v srdci industriálního areálu',
      summary:
        'Adrenalinové městské závody napříč Dolními Vítkovicemi — běh, překážky a jedinečná industriální kulisa vysokých pecí.',
      description:
        '<p>Race the Streets přiváží do Ostravy jedinečný formát městského závodu, který spojuje sport s objevováním města. Trasa vede přímo areálem Dolních Vítkovic — mezi vysokými pecemi, halami a industriálními dominantami.</p>' +
        '<p>Připraveny jsou kategorie pro jednotlivce i týmy, kratší dětská trasa a bohatý doprovodný program s občerstvením.</p>' +
        '<ul><li>Závod jednotlivců i štafet</li><li>Dětská trasa zdarma</li><li>Doprovodný program a food zóna</li></ul>',
      type: 'Sportovní akce',
      wholeArea: true,
      areaIds: [],
      from: '2026-08-07',
      to: '2026-08-08',
      time: '09:00',
      timeTo: '18:00',
      price: 'od 390 Kč',
      ticketUrl: url,
      ticketMode: 'external',
      ageLimit: 'Od 12 let',
      duration: 'celodenní program',
      performers: '',
      tags: ['Sport', 'Venku', 'Industriál', 'Rodinné'],
      image: imageFor(2),
    }
  }

  // Stand-up / komedie
  if (/stojak|stand|komedie|comedy|kocic/.test(u)) {
    return {
      title: 'Na Stojáka! v Dolních Vítkovicích',
      subtitle: 'Večer plný stand-up comedy',
      summary: 'Oblíbená stand-up show přijíždí do industriálního areálu. Nutná rezervace, kapacita omezená.',
      description:
        '<p>Přední čeští komici rozezní halu Dolních Vítkovic. Připravte se na večer plný vtipu, improvizace a nečekaných situací.</p>',
      type: 'Stand-up',
      wholeArea: false,
      areaIds: ['v-gong'],
      from: '2026-08-05',
      to: '2026-08-05',
      time: '19:00',
      timeTo: '20:30',
      price: 'Vstup zdarma (nutná rezervace)',
      ticketUrl: url,
      ticketMode: 'external',
      ageLimit: 'Od 15 let',
      duration: '90 min',
      performers: '',
      tags: ['Komedie', 'Zdarma', 'Noční'],
      image: imageFor(8),
    }
  }

  // Obecná akce (fallback)
  return {
    title: 'Nová akce v Dolních Vítkovicích',
    subtitle: 'Připravili jsme pro vás jedinečný program',
    summary: 'Přijďte zažít výjimečnou akci v industriálním areálu Dolních Vítkovic.',
    description: '<p>Podrobnosti programu doplníme. Sledujte web a rezervujte si vstupenky včas.</p>',
    type: 'Festival',
    wholeArea: true,
    areaIds: [],
    from: '',
    to: '',
    time: '',
    timeTo: '',
    price: '',
    ticketUrl: url,
    ticketMode: 'external',
    ageLimit: '',
    duration: '',
    performers: '',
    tags: ['Novinka'],
    image: imageFor(7),
  }
}
