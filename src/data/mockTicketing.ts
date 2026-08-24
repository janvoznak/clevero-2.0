/* ============================================================
   Prototyp „Výběr vstupenek" (veřejný web, náhrada nákupní
   stránky Colossea).

   Data jsou MOCK — v ostrém provozu je dodá Colosseum přes API
   (skladba vstupenek, ceny, termíny, jazyky). Ceny a názvy jsou
   opsané z reálných stránek Colossea, jen očištěné:
   — zjevné duplicity rodinného vstupného vyhozené,
   — vstupenky za 0 Kč označené jako „zdarma" místo „0,00 Kč",
   — dlouhý slepenec informací rozsekaný na odrážky.
   ============================================================ */

/** Skupina, do které vstupenka patří ve výpisu. */
export type TicketGroup = 'basic' | 'reduced'

export interface TicketTier {
  id: string
  name: string
  /** Upřesnění pod názvem (věk, podmínka) — krátké, do jednoho řádku. */
  note?: string
  /** Cena za osobu v Kč. */
  price: number
  group: TicketGroup
  /** Max. počet kusů na jednu objednávku. */
  max?: number
}

/** Rodinné vstupné = balíček s pevnou cenou a danou skladbou. */
export interface FamilyPackage {
  id: string
  name: string
  /** Cena za celý balíček v Kč. */
  price: number
  adults: number
  childrenMin: number
  childrenMax: number
  /** Popis dětí v balíčku („děti 6–15 let"). */
  childrenLabel: string
  /** Vstupenky, proti kterým se počítá úspora. */
  compareAdultTierId?: string
  compareChildTierId?: string
}

export interface TicketingItem {
  /** Slug do URL. */
  id: string
  title: string
  /** Objekt v areálu — do meta řádku. */
  venue: string
  /**
   * `date` = vstupenka na volný termín (zákazník volí datum návštěvy),
   * `slot` = pevný termín prohlídky přebraný z Colossea.
   */
  kind: 'date' | 'slot'
  /** Pevný termín (jen u `kind: 'slot'`). */
  slot?: { datetime: string; weekday: string; language: string }
  /** Krátká věta pod nadpisem. */
  perex?: string
  /** Odrážky do panelu „Důležité informace". */
  info: string[]
  tiers: TicketTier[]
  packages: FamilyPackage[]
}

const INFO_ETICKET = [
  'E-vstupenka platí pro jednorázový vstup po dobu 30 dnů ode dne nákupu.',
  'S e-vstupenkou jděte rovnou k turniketu a načtěte čárový kód — nemusíte na pokladnu.',
  'Vstupenku si uschovejte po celou dobu návštěvy.',
  'Před návštěvou si ověřte aktuální otevírací dobu na dolnivitkovice.cz.',
]

export const TICKETING_ITEMS: TicketingItem[] = [
  {
    id: 'svet-techniky-a-maly-svet-u6',
    title: 'Svět techniky a Malý svět U6',
    venue: 'Velký svět techniky + Malý svět techniky U6',
    kind: 'date',
    perex: 'Kombinovaná vstupenka do obou expozic — projdete je v jeden den, nebo kdykoli během 30 dnů.',
    info: [
      ...INFO_ETICKET,
      'Vstupenka platí do Velkého světa techniky i do Malého světa techniky U6.',
      'Otevřeno úterý–neděle 9:00–18:00.',
    ],
    tiers: [
      { id: 'adult', name: 'Dospělý', price: 440, group: 'basic' },
      { id: 'student', name: 'Student', note: '15–26 let, na studentský průkaz', price: 350, group: 'basic' },
      { id: 'senior', name: 'Senior', note: '65+ let', price: 350, group: 'basic' },
      { id: 'child', name: 'Dítě', note: '6–15 let', price: 350, group: 'basic' },
      { id: 'ztp', name: 'ZTP', note: 'Průkaz předložte u vstupu', price: 350, group: 'reduced' },
      { id: 'ztpp', name: 'ZTP/P', note: 'Průvodce vstupuje zdarma', price: 350, group: 'reduced' },
    ],
    packages: [
      {
        id: 'family-2-23',
        name: 'Rodinné vstupné 2+2/3',
        price: 1480,
        adults: 2,
        childrenMin: 2,
        childrenMax: 3,
        childrenLabel: 'děti 6–15 let',
        compareAdultTierId: 'adult',
        compareChildTierId: 'child',
      },
    ],
  },
  {
    id: 'maly-svet-techniky-u6',
    title: 'Malý svět techniky U6',
    venue: 'Malý svět techniky U6',
    kind: 'date',
    perex: 'Expozice v bývalé plynojemové ústředně U6 — od parního stroje po vesmírné technologie.',
    info: [
      ...INFO_ETICKET,
      'Momentálně otevřeno úterý–neděle 9:00–18:00.',
      'V zimních měsících není budova U6 vytápěná, oblečte se tepleji.',
      'U6 disponuje plošinou pro vozíčkáře.',
    ],
    tiers: [
      { id: 'adult', name: 'Dospělý', price: 230, group: 'basic' },
      { id: 'student', name: 'Student', note: '15–26 let, na studentský průkaz', price: 180, group: 'basic' },
      { id: 'senior', name: 'Senior', note: '65+ let', price: 180, group: 'basic' },
      { id: 'child', name: 'Dítě', note: '4–15 let', price: 180, group: 'basic' },
      { id: 'child-free', name: 'Dítě do 4 let', note: 'Vstup zdarma, vstupenku je nutné přidat', price: 0, group: 'reduced' },
      { id: 'ztp', name: 'ZTP', note: 'Průkaz předložte u vstupu', price: 180, group: 'reduced' },
      { id: 'ztpp', name: 'ZTP/P', note: 'Průvodce vstupuje zdarma', price: 65, group: 'reduced' },
    ],
    packages: [
      {
        id: 'family-2-3',
        name: 'Rodinné vstupné 2+3',
        price: 800,
        adults: 2,
        childrenMin: 1,
        childrenMax: 3,
        childrenLabel: 'děti 4–15 let',
        compareAdultTierId: 'adult',
        compareChildTierId: 'child',
      },
      {
        id: 'family-1-3',
        name: 'Rodinné vstupné 1+3',
        price: 580,
        adults: 1,
        childrenMin: 1,
        childrenMax: 3,
        childrenLabel: 'děti 4–15 let',
        compareAdultTierId: 'adult',
        compareChildTierId: 'child',
      },
    ],
  },
  {
    id: 'svet-techniky',
    title: 'Svět techniky',
    venue: 'Velký svět techniky',
    kind: 'date',
    perex: 'Čtyři interaktivní světy — Dětský svět, Svět vědy a objevů, Svět civilizace a Svět přírody.',
    info: [
      ...INFO_ETICKET,
      'Vstupenka vám umožňuje i vstup zdarma do Galerie Gong.',
    ],
    tiers: [
      { id: 'adult', name: 'Dospělý', price: 320, group: 'basic' },
      { id: 'student', name: 'Student', note: '15–26 let, na studentský průkaz', price: 260, group: 'basic' },
      { id: 'senior', name: 'Senior', note: '65+ let', price: 260, group: 'basic' },
      { id: 'child', name: 'Dítě', note: '6–15 let', price: 260, group: 'basic' },
      { id: 'child-free', name: 'Dítě do 6 let', note: 'Vstup zdarma, vstupenku je nutné přidat', price: 0, group: 'reduced' },
      { id: 'ztp', name: 'ZTP', note: 'Průkaz předložte u vstupu', price: 260, group: 'reduced' },
      { id: 'ztpp', name: 'ZTP/P', note: 'Průvodce vstupuje zdarma', price: 95, group: 'reduced' },
    ],
    packages: [
      {
        id: 'family-2-23',
        name: 'Rodinné vstupné 2+2/3',
        price: 1140,
        adults: 2,
        childrenMin: 2,
        childrenMax: 3,
        childrenLabel: 'děti 6–15 let',
        compareAdultTierId: 'adult',
        compareChildTierId: 'child',
      },
      {
        id: 'family-1-23',
        name: 'Rodinné vstupné 1+2/3',
        price: 820,
        adults: 1,
        childrenMin: 2,
        childrenMax: 3,
        childrenLabel: 'děti 6–15 let',
        compareAdultTierId: 'adult',
        compareChildTierId: 'child',
      },
    ],
  },
  {
    id: 'farani-do-dolu',
    title: 'Fárání do DOLU a báňské záchranářství',
    venue: 'Landek Park',
    kind: 'slot',
    slot: { datetime: '2026-08-25T09:00', weekday: 'úterý', language: 'Česky' },
    perex: 'Sfárání do podzemí dolu Anselm s průvodcem a expozice báňského záchranářství.',
    info: [
      'Dostavte se prosím 20 minut před začátkem prohlídky k pokladně Landek Parku.',
      'Prohlídka trvá přibližně 100 minut, v podzemí je celoročně kolem 10 °C.',
      'Vstupenku si uschovejte po celou dobu návštěvy.',
      'Prohlídka není vhodná pro osoby s omezenou pohyblivostí.',
    ],
    tiers: [
      { id: 'adult', name: 'Dospělý', price: 295, group: 'basic' },
      { id: 'student', name: 'Student', note: '15–26 let, na studentský průkaz', price: 220, group: 'basic' },
      { id: 'senior', name: 'Senior', note: '65+ let', price: 220, group: 'basic' },
      { id: 'child', name: 'Dítě', note: '6–15 let', price: 220, group: 'basic' },
      { id: 'child-free', name: 'Dítě do 6 let', note: 'Vstup zdarma, vstupenku je nutné přidat', price: 0, group: 'reduced' },
      { id: 'ztp', name: 'ZTP', note: 'Průkaz předložte u vstupu', price: 220, group: 'reduced' },
      { id: 'ztpp', name: 'ZTP/P', note: 'Průvodce vstupuje zdarma', price: 220, group: 'reduced' },
    ],
    packages: [
      {
        id: 'family-2-23',
        name: 'Rodinné vstupné 2+2/3',
        price: 800,
        adults: 2,
        childrenMin: 2,
        childrenMax: 3,
        childrenLabel: 'děti 6–15 let',
        compareAdultTierId: 'adult',
        compareChildTierId: 'child',
      },
    ],
  },
]

export function ticketingItem(id: string): TicketingItem | undefined {
  return TICKETING_ITEMS.find((i) => i.id === id)
}

/** „1 480 Kč" — mezera po tisících, bez desetin (ceny jsou celé koruny). */
export function czk(value: number): string {
  return `${value.toLocaleString('cs-CZ')} Kč`
}

/** Řádek souhrnu objednávky (co uvidí zákazník v pravém panelu). */
export interface OrderLine {
  id: string
  label: string
  /** Doplněk pod názvem — skladba balíčku, věková hranice. */
  sub?: string
  qty: number
  /** Cena za kus/balíček. */
  unitPrice: number
  total: number
  /** Počet osob, které řádek pokrývá. */
  persons: number
}
