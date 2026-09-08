import type { ML } from './types'

/* ============================================================
   Modul Kontakty — kontaktní údaje organizace.

   Převzato z Clevero 2.0 a upraveno pro DOV.

   **Jeden záznam za web**, ne výpis: organizace má jednu identitu. Sídlo,
   IČO, číslo účtu ani datová schránka se nepřekládají — vícejazyčné je jen to,
   co je text ke čtení (název skupiny, popis, poznámka).

   Proti předloze dvě změny:

   — **Vypadl přepínač flat/groups.** Clevero ho má kvůli živnostníkovi, který
     nechce oddělení. Kontakty DOV mají čtyři skupiny (Pro návštěvníky,
     Pronájem prostor, Ostatní, Vedení) a jinak než po skupinách se ta stránka
     číst nedá — přepínač by byl volba, kterou nikdo nikdy nepřepne.

   — **Skupina může místo lidí zrcadlit objekty z Areálu.** Skupina „Pro
     návštěvníky" je na webu seznam míst s otevírací dobou a kontaktem —
     a ty už se spravují v Areálu. Přepisovat je sem znamená dva zdroje pravdy
     (přesně ten nález, kvůli kterému vznikla celá revize). Skupina si proto
     jen vybere objekty a jejich údaje se zrcadlí read-only (STANDARDY §14a).

   Otevírací doba tu ze stejného důvodu není vůbec: patří objektu v Areálu.
   ============================================================ */

/** Osoba v kontaktech. */
export interface ContactPerson {
  id: string
  name: string
  /** Pozice / agenda — podle ní si návštěvník vybírá, na koho se obrátit. */
  role: ML
  email: string
  phone: string
  /** Krátká poznámka: čemu se věnuje, kdy je k zastižení. */
  note: ML
  /** Fotka (prototyp — cesta do `public/avatars/`, prázdné = monogram). */
  photo: string
  /** Zobrazit na webu. Skrytá osoba zůstane uložená. */
  published: boolean
}

/** Čím je skupina naplněná. */
export type ContactGroupKind = 'people' | 'venues'

export const CONTACT_GROUP_KIND_OPTIONS: { value: ContactGroupKind; label: string }[] = [
  { value: 'people', label: 'Lidé — jména a kontakty' },
  { value: 'venues', label: 'Objekty z Areálu — automaticky' },
]

/** Skupina kontaktů. Kontakt na celou skupinu (infocentrum@) má smysl vedle
    lidí — část návštěvníků nechce psát konkrétnímu člověku. */
export interface ContactGroup {
  id: string
  name: ML
  description: ML
  kind: ContactGroupKind
  /** Kontakt na skupinu jako celek (jen u skupiny lidí). */
  email: string
  phone: string
  /** Skrytá skupina schová i to, co je v ní — viditelnost se dědí. */
  published: boolean
  /** Lidé ve skupině (`kind: 'people'`). */
  people: ContactPerson[]
  /** Vybrané objekty z Areálu (`kind: 'venues'`) — jen ID, údaje se zrcadlí. */
  venueIds: string[]
}

export interface ContactsConfig {
  /* ---------- Identita ---------- */
  organizationName: string
  /** Doplněk k názvu na webu. */
  tagline: ML
  /* ---------- Sídlo ---------- */
  street: string
  city: string
  zip: string
  country: string
  /* ---------- Identifikační a fakturační údaje ---------- */
  regNo: string
  vatNo: string
  bankAccount: string
  bankName: string
  /** ID datové schránky. */
  dataBox: string
  /** Zápis v rejstříku — větný text, proto ML. */
  registryNote: ML
  /* ---------- Spojení ---------- */
  email: string
  phone: string
  /** Odkaz na mapu — na webu z něj je tlačítko „Navigovat". */
  mapUrl: string
  /* ---------- Skupiny ---------- */
  groups: ContactGroup[]
}

function ml(cs: string, en = ''): ML {
  return { cs, en, de: '', pl: '' }
}

function person(
  id: string,
  name: string,
  role: string,
  email: string,
  phone = '',
  note = '',
  photo = '',
): ContactPerson {
  return { id, name, role: ml(role), email, phone, note: ml(note), photo, published: true }
}

/* Skupiny odpovídají dnešní stránce kontaktů na dolnivitkovice.cz. */
export const MOCK_CONTACTS: ContactsConfig = {
  organizationName: 'Dolní oblast VÍTKOVICE, z.s.',
  tagline: ml('Národní kulturní památka a centrum kultury, vzdělávání a zábavy'),
  street: 'Vítkovice 3004',
  city: 'Ostrava',
  zip: '703 00',
  country: 'Česká republika',
  regNo: '75125285',
  vatNo: 'CZ75125285',
  bankAccount: '5899880036/5500',
  bankName: 'Raiffeisenbank a.s.',
  dataBox: 'r2q9v5j',
  registryNote: ml('Zapsáno ve spolkovém rejstříku vedeném Krajským soudem v Ostravě.'),
  email: 'infocentrum@dolnivitkovice.cz',
  phone: '+420 724 955 121',
  mapUrl: 'https://mapy.cz/s/dolni-vitkovice',
  groups: [
    {
      id: 'cg-navstevnici',
      name: ml('Pro návštěvníky', 'For visitors'),
      description: ml('Otevírací doby a kontakty jednotlivých objektů v areálu.'),
      kind: 'venues',
      email: '',
      phone: '',
      published: true,
      people: [],
      venueIds: ['v-infocentrum', 'v-u6', 'v-bolt', 'v-galerie', 'v-hlubina'],
    },
    {
      id: 'cg-pronajem',
      name: ml('Pronájem prostor'),
      description: ml('Krátkodobé i dlouhodobé pronájmy sálů, ateliérů a kanceláří.'),
      kind: 'people',
      email: 'pronajem@dolnivitkovice.cz',
      phone: '+420 727 966 010',
      published: true,
      venueIds: [],
      people: [
        person(
          'cp-1',
          'Petr Dvořák',
          'Krátkodobé pronájmy',
          'petr.dvorak@dolnivitkovice.cz',
          '+420 603 456 789',
          'Konference, koncerty a firemní akce v Gongu a Trojhalí.',
          '/avatars/petr-dvorak.jpg',
        ),
        person(
          'cp-2',
          'Jana Svobodová',
          'Dlouhodobé pronájmy a nemovitosti',
          'jana.svobodova@dolnivitkovice.cz',
          '+420 601 234 567',
          'Ateliéry, zkušebny a kanceláře v areálu.',
          '/avatars/jana-svobodova.jpg',
        ),
      ],
    },
    {
      id: 'cg-ostatni',
      name: ml('Ostatní'),
      description: ml(''),
      kind: 'people',
      email: '',
      phone: '',
      published: true,
      venueIds: [],
      people: [
        person(
          'cp-3',
          'Martin Kučera',
          'Marketing a PR',
          'martin.kucera@dolnivitkovice.cz',
          '+420 602 345 678',
          '',
          '/avatars/martin-kucera.jpg',
        ),
        person('cp-4', 'Lucie Zemanová', 'Personální oddělení', 'kariera@dolnivitkovice.cz', '', ''),
        person('cp-5', 'Pověřenec pro ochranu osobních údajů', 'GDPR', 'gdpr@dolnivitkovice.cz', '', ''),
      ],
    },
    {
      id: 'cg-vedeni',
      name: ml('Vedení DOV', 'Management'),
      description: ml('Výkonné vedení spolku.'),
      kind: 'people',
      email: '',
      phone: '',
      published: true,
      venueIds: [],
      people: [
        person('cp-6', 'Jan Voznak', 'Výkonný ředitel', 'jan.voznak@dolnivitkovice.cz', '', '', '/avatars/jan-voznak.jpg'),
        person('cp-7', 'Eva Krátká', 'Ředitelka finančního úseku', 'finance@dolnivitkovice.cz', '', ''),
        person('cp-8', 'Tomáš Bartoš', 'Ředitel obchodního úseku', 'obchod@dolnivitkovice.cz', '', ''),
      ],
    },
  ],
}

let groupSeq = 0
export function blankContactGroup(): ContactGroup {
  groupSeq += 1
  return {
    id: `cg-new-${groupSeq}`,
    name: ml(''),
    description: ml(''),
    kind: 'people',
    email: '',
    phone: '',
    published: true,
    people: [],
    venueIds: [],
  }
}
let personSeq = 0
export function blankContactPerson(): ContactPerson {
  personSeq += 1
  return {
    id: `cp-new-${personSeq}`,
    name: '',
    role: ml(''),
    email: '',
    phone: '',
    note: ml(''),
    photo: '',
    published: true,
  }
}

/** Kolik kontaktů skupina na webu ukáže — do hlavičky skupiny. */
export function groupSize(g: ContactGroup): number {
  return g.kind === 'venues' ? g.venueIds.length : g.people.filter((p) => p.published).length
}
