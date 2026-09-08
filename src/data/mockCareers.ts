import type { ML, ContentBlock, LangCode } from './types'

/* ============================================================
   Modul Kariéra — volné pozice + uchazeči.

   Dva pohledy na tentýž tok: v **Pozicích** redakce popíše nabídku, na webu
   z ní vznikne stránka s CTA formulářem, a co lidé odešlou, spadne do
   **Uchazečů**.

   Klíčové rozhodnutí (stejné jako u schránky formulářů): **přihláška je
   read-only**. Údaje přišly od uchazeče a v CMS se nepřepisují — jinak by se
   ztratilo, co člověk skutečně poslal. Mění se u ní jen stav, kdo ji řeší
   a interní poznámka.

   Druhé rozhodnutí: přihláška si drží **název pozice v době odeslání**
   (`positionTitle`). Pozice se přejmenují nebo smažou, ale přihláška musí
   zůstat čitelná i po roce.
   ============================================================ */

/** „Dnešek" prototypu — shodný s ostatními moduly. */
export const CAREERS_TODAY = '2026-07-28'

/* ---------- Číselníky pozice ---------- */
export const DEPARTMENT_OPTIONS = [
  { value: 'guides', label: 'Průvodcovské služby' },
  { value: 'gastro', label: 'Gastro' },
  { value: 'operations', label: 'Provoz a údržba' },
  { value: 'education', label: 'Vzdělávací programy' },
  { value: 'marketing', label: 'Marketing a PR' },
  { value: 'admin', label: 'Administrativa' },
]

export const EMPLOYMENT_OPTIONS = [
  { value: 'full', label: 'Hlavní pracovní poměr' },
  { value: 'part', label: 'Zkrácený úvazek' },
  { value: 'agreement', label: 'DPP / DPČ' },
  { value: 'internship', label: 'Praxe a stáž' },
  { value: 'seasonal', label: 'Sezónní brigáda' },
]

export const SALARY_UNIT_OPTIONS = [
  { value: 'month', label: 'Kč / měsíc' },
  { value: 'hour', label: 'Kč / hodina' },
]

/** Popisek číselníkové hodnoty (prázdné = nezadáno nebo vlastní hodnota). */
export function optionLabel(opts: { value: string; label: string }[], value: string): string {
  return opts.find((o) => o.value === value)?.label ?? value
}

/* ---------- Pozice ---------- */
export interface JobPosition {
  id: string
  title: ML
  /** Část URL (slug) — ML, auto z názvu. */
  slug?: ML
  /** Krátký úvod do výpisu pozic. */
  perex: ML
  /** Popis pozice (content builder) — náplň práce, co nabízíme, požadavky. */
  contentBlocks?: ContentBlock[]
  /** Úsek (`DEPARTMENT_OPTIONS`, lze i vlastní hodnota). */
  department: string
  /** Typ úvazku (`EMPLOYMENT_OPTIONS`). */
  employment: string
  /** Místo výkonu — objekt v Areálu ('' = celý areál). Vazbu vlastní pozice. */
  areaId: string
  /** Mzdové rozpětí. null = neuvádí se. */
  salaryFrom: number | null
  salaryTo: number | null
  salaryUnit: 'month' | 'hour'
  /** Nástup možný od (ISO datum). null = dohodou. */
  startAt: string | null
  /** Uzávěrka přihlášek (ISO datum). Po ní web formulář nenabídne. */
  deadline: string | null
  /** Kdo pozici řeší — jméno z modulu Uživatelé. Nové přihlášky se mu přiřadí. */
  contactUser: string
  /** Přijímat přihlášky (CTA formulář na webu). Vypnuté = nábor pozastaven. */
  acceptsApplications: boolean
  published: boolean
  /** Které jazykové mutace jdou na web. undefined = všechny vyplněné. */
  publishedLangs?: LangCode[]
}

function ml(cs: string, en = ''): ML {
  return { cs, en, de: '', pl: '' }
}

export const MOCK_POSITIONS: JobPosition[] = [
  {
    id: 'pos-pruvodce',
    title: ml('Průvodce areálem Dolní Vítkovice', 'Guide of the Dolní Vítkovice area'),
    slug: ml('pruvodce-arealem'),
    perex: ml('Provázejte návštěvníky vysokou pecí, koksovnou i Bolt Tower a vyprávějte příběh industriální Ostravy.'),
    department: 'guides',
    employment: 'agreement',
    areaId: 'v-areal',
    salaryFrom: 180,
    salaryTo: 220,
    salaryUnit: 'hour',
    startAt: '2026-09-01',
    deadline: '2026-08-31',
    contactUser: 'Jana Svobodová',
    acceptsApplications: true,
    published: true,
    publishedLangs: ['cs'],
  },
  {
    id: 'pos-lektor',
    title: ml('Lektor vzdělávacích programů'),
    slug: ml('lektor-vzdelavacich-programu'),
    perex: ml('Veďte programy pro školy ve Světě techniky — od pokusů po projektové dny.'),
    department: 'education',
    employment: 'full',
    areaId: 'v-u6',
    salaryFrom: 32000,
    salaryTo: 38000,
    salaryUnit: 'month',
    startAt: null,
    deadline: null,
    contactUser: 'Martin Kučera',
    acceptsApplications: true,
    published: true,
  },
  {
    id: 'pos-udrzbar',
    title: ml('Údržbář technických provozů'),
    slug: ml('udrzbar-technickych-provozu'),
    perex: ml('Starejte se o technologie areálu — od výtahů v Bolt Tower po zázemí Gongu.'),
    department: 'operations',
    employment: 'full',
    areaId: '',
    salaryFrom: 35000,
    salaryTo: null,
    salaryUnit: 'month',
    startAt: '2026-08-15',
    // Uzávěrka už prošla → pozice je na webu, ale přihlášky nepřijímá.
    deadline: '2026-07-15',
    contactUser: 'Jan Voznak',
    acceptsApplications: true,
    published: true,
  },
  {
    id: 'pos-barista',
    title: ml('Barista do Bolt Café'),
    slug: ml('barista-bolt-cafe'),
    perex: ml('Kávu s výhledem z vrcholu vysoké pece. Sezónní úvazek na letní provoz.'),
    department: 'gastro',
    employment: 'seasonal',
    areaId: 'v-bolt',
    salaryFrom: 165,
    salaryTo: null,
    salaryUnit: 'hour',
    startAt: null,
    deadline: null,
    contactUser: 'Petr Dvořák',
    // Nábor pozastaven — místo je obsazené, ale pozici chceme mít připravenou.
    acceptsApplications: false,
    published: true,
  },
  {
    id: 'pos-marketing',
    title: ml('Specialista sociálních sítí'),
    slug: ml('specialista-socialnich-siti'),
    perex: ml('Vezměte si na starost obsah DOV na sítích — od reelů z akcí po komunitu.'),
    department: 'marketing',
    employment: 'part',
    areaId: '',
    salaryFrom: null,
    salaryTo: null,
    salaryUnit: 'month',
    startAt: null,
    deadline: null,
    contactUser: 'Jana Svobodová',
    acceptsApplications: true,
    published: false,
  },
]

/* ---------- Stav pozice (odvozený) ---------- */
export type PositionState = 'draft' | 'open' | 'closed'

export const POSITION_STATE_META: Record<
  PositionState,
  { label: string; hint: string; dot: string; text: string; bg: string }
> = {
  open: {
    label: 'Nabírá',
    hint: 'Pozice je na webu a formulář přijímá přihlášky.',
    dot: 'bg-forge-500',
    text: 'text-forge-600',
    bg: 'bg-forge-500/10',
  },
  closed: {
    label: 'Nábor uzavřen',
    hint: 'Pozice je na webu, ale formulář se nenabízí — prošla uzávěrka, nebo je nábor pozastavený.',
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    bg: 'bg-amber-500/10',
  },
  draft: {
    label: 'Koncept',
    hint: 'Pozice není zveřejněná — na webu ji nikdo nevidí.',
    dot: 'bg-steel-300',
    text: 'text-steel-500',
    bg: 'bg-steel-100',
  },
}

export function positionState(p: JobPosition, today = CAREERS_TODAY): PositionState {
  if (!p.published) return 'draft'
  if (!p.acceptsApplications) return 'closed'
  if (p.deadline && p.deadline < today) return 'closed'
  return 'open'
}

/** Mzda do výpisu i na kartu („od 180 Kč / hodina"). Prázdné = neuvádí se. */
export function salaryLabel(p: JobPosition): string {
  if (p.salaryFrom == null && p.salaryTo == null) return ''
  const unit = p.salaryUnit === 'hour' ? 'Kč / hodina' : 'Kč / měsíc'
  const fmt = (n: number) => n.toLocaleString('cs-CZ')
  if (p.salaryFrom != null && p.salaryTo != null) return `${fmt(p.salaryFrom)}–${fmt(p.salaryTo)} ${unit}`
  return `od ${fmt((p.salaryFrom ?? p.salaryTo) as number)} ${unit}`
}

export function position(id: string): JobPosition | undefined {
  return MOCK_POSITIONS.find((p) => p.id === id)
}

export function blankPosition(): JobPosition {
  return {
    id: 'nová',
    title: ml(''),
    slug: ml(''),
    perex: ml(''),
    department: 'guides',
    employment: 'full',
    areaId: '',
    salaryFrom: null,
    salaryTo: null,
    salaryUnit: 'month',
    startAt: null,
    deadline: null,
    contactUser: 'Jan Voznak',
    acceptsApplications: true,
    published: false,
  }
}

/** Volby pozic pro filtry a výběry. */
export function positionOptions(): { value: string; label: string }[] {
  return MOCK_POSITIONS.map((p) => ({ value: p.id, label: p.title.cs }))
}

/* ============================================================
   Uchazeči — co přišlo z CTA formuláře u pozice.
   ============================================================ */

/** Jedno odeslané pole formuláře — popisek v době odeslání + hodnota.
    Formulář se časem mění; přihláška si drží, na co člověk skutečně odpovídal. */
export interface SubmissionValue {
  label: string
  value: string
}

/** Příloha přihlášky. `kind` řídí ikonu i popisek — CV a motivační dopis
    jsou dvě pole formuláře, ostatní přílohy jsou volitelné. */
export type FileKind = 'cv' | 'letter' | 'other'

export const FILE_KIND_META: Record<FileKind, { label: string; icon: string }> = {
  cv: { label: 'Životopis', icon: 'file' },
  letter: { label: 'Motivační dopis', icon: 'text' },
  other: { label: 'Příloha', icon: 'paperclip' },
}

export interface ApplicantFile {
  id: string
  name: string
  size: string
  ext: string
  kind: FileKind
}

export type ApplicantStatus = 'new' | 'shortlisted' | 'hired' | 'rejected'

export const APPLICANT_STATUS_META: Record<
  ApplicantStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  new: { label: 'Nový', dot: 'bg-brand-500', text: 'text-brand-700', bg: 'bg-brand-50' },
  shortlisted: { label: 'Předvybrán', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-500/10' },
  hired: { label: 'Přijat', dot: 'bg-forge-500', text: 'text-forge-600', bg: 'bg-forge-500/10' },
  // Zamítnutí je běžný konec náboru, ne chyba — proto neutrální šeď, ne červená.
  rejected: { label: 'Zamítnut', dot: 'bg-steel-400', text: 'text-steel-600', bg: 'bg-steel-100' },
}

export const APPLICANT_STATUS_OPTIONS: { value: ApplicantStatus; label: string }[] = [
  { value: 'new', label: 'Nový' },
  { value: 'shortlisted', label: 'Předvybrán' },
  { value: 'hired', label: 'Přijat' },
  { value: 'rejected', label: 'Zamítnut' },
]

export interface Applicant {
  id: string
  /** Pozice, na kterou se hlásí. '' = obecná přihláška (uchazeč poslal životopis bez pozice). */
  positionId: string
  /** Název pozice v době odeslání — drží se i po přejmenování nebo smazání pozice. */
  positionTitle: string
  /** Kdy přihláška přišla (ISO datum a čas). */
  createdAt: string
  name: string
  email: string
  phone: string
  /** Hlavní text z formuláře (motivace) — do náhledu ve výpisu. */
  message: string
  /** Všechna odeslaná pole v pořadí formuláře — zdroj pravdy pro detail. */
  values: SubmissionValue[]
  files: ApplicantFile[]
  status: ApplicantStatus
  /** Kdo přihlášku řeší (jméno z modulu Uživatelé). '' = nepřiřazeno. */
  assignee: string
  /** Interní poznámka — jediné, co se u přihlášky v CMS píše. */
  note: string
  /** Do kdy má uchazeč souhlas se zpracováním údajů (ISO datum).
      Po vypršení je potřeba přihlášku i přílohy smazat. */
  consentUntil: string | null
}

function vals(name: string, email: string, phone: string, message: string, extra: SubmissionValue[] = []): SubmissionValue[] {
  return [
    { label: 'Jméno a příjmení', value: name },
    { label: 'E-mail', value: email },
    { label: 'Telefon', value: phone },
    ...extra,
    { label: 'Proč se hlásíte', value: message },
  ]
}

export const MOCK_APPLICANTS: Applicant[] = [
  {
    id: 'app-1042',
    positionId: 'pos-pruvodce',
    positionTitle: 'Průvodce areálem Dolní Vítkovice',
    createdAt: '2026-07-28T08:41',
    name: 'Tereza Malá',
    email: 'tereza.mala@email.cz',
    phone: '+420 605 118 224',
    message:
      'Studuji historii na OU a poslední dvě sezóny jsem provázela v Landek Parku. Průmyslové dědictví Ostravy je téma, které mě baví vyprávět i o víkendech.',
    values: vals(
      'Tereza Malá',
      'tereza.mala@email.cz',
      '+420 605 118 224',
      'Studuji historii na OU a poslední dvě sezóny jsem provázela v Landek Parku. Průmyslové dědictví Ostravy je téma, které mě baví vyprávět i o víkendech.',
      [{ label: 'Jazyky výkladu', value: 'čeština, angličtina' }],
    ),
    files: [
      { id: 'f1', name: 'tereza-mala-cv.pdf', size: '286 kB', ext: 'pdf', kind: 'cv' },
      { id: 'f2', name: 'motivacni-dopis.pdf', size: '94 kB', ext: 'pdf', kind: 'letter' },
    ],
    status: 'new',
    assignee: 'Jana Svobodová',
    note: '',
    consentUntil: '2027-07-28',
  },
  {
    id: 'app-1041',
    positionId: 'pos-pruvodce',
    positionTitle: 'Průvodce areálem Dolní Vítkovice',
    createdAt: '2026-07-27T19:03',
    name: 'Ondřej Bílek',
    email: 'o.bilek@email.cz',
    phone: '+420 776 330 019',
    message: 'Mám zkušenost z muzea v Kopřivnici, hledám práci na víkendy k práci na hlavní poměr.',
    values: vals(
      'Ondřej Bílek',
      'o.bilek@email.cz',
      '+420 776 330 019',
      'Mám zkušenost z muzea v Kopřivnici, hledám práci na víkendy k práci na hlavní poměr.',
      [{ label: 'Jazyky výkladu', value: 'čeština' }],
    ),
    files: [{ id: 'f3', name: 'zivotopis-bilek.pdf', size: '198 kB', ext: 'pdf', kind: 'cv' }],
    status: 'shortlisted',
    assignee: 'Jana Svobodová',
    note: 'Domluvena schůzka 5. 8. v 10:00, infocentrum.',
    consentUntil: '2027-07-27',
  },
  {
    id: 'app-1040',
    positionId: 'pos-lektor',
    positionTitle: 'Lektor vzdělávacích programů',
    createdAt: '2026-07-25T11:22',
    name: 'Klára Nováková',
    email: 'klara.novakova@email.cz',
    phone: '+420 602 445 781',
    message: 'Učím fyziku na druhém stupni, zajímá mě práce s dětmi mimo klasickou třídu.',
    values: vals(
      'Klára Nováková',
      'klara.novakova@email.cz',
      '+420 602 445 781',
      'Učím fyziku na druhém stupni, zajímá mě práce s dětmi mimo klasickou třídu.',
    ),
    files: [
      { id: 'f4', name: 'cv-novakova.pdf', size: '312 kB', ext: 'pdf', kind: 'cv' },
      { id: 'f5', name: 'reference-zs-poruba.pdf', size: '77 kB', ext: 'pdf', kind: 'other' },
    ],
    status: 'hired',
    assignee: 'Martin Kučera',
    note: 'Nastupuje 1. 9., smlouva podepsaná.',
    consentUntil: '2027-07-25',
  },
  {
    id: 'app-1039',
    positionId: 'pos-lektor',
    positionTitle: 'Lektor vzdělávacích programů',
    createdAt: '2026-07-21T15:47',
    name: 'Filip Hruška',
    email: 'filip.hruska@email.cz',
    phone: '',
    message: 'Dobrý den, posílám životopis, rád bych se dozvěděl víc o náplni práce.',
    values: vals('Filip Hruška', 'filip.hruska@email.cz', '', 'Dobrý den, posílám životopis, rád bych se dozvěděl víc o náplni práce.'),
    files: [{ id: 'f6', name: 'hruska-cv.docx', size: '64 kB', ext: 'docx', kind: 'cv' }],
    status: 'rejected',
    assignee: 'Martin Kučera',
    note: 'Chybí pedagogická praxe, odpovězeno e-mailem.',
    consentUntil: '2027-07-21',
  },
  {
    id: 'app-1038',
    // Obecná přihláška — uchazeč poslal životopis bez konkrétní pozice.
    positionId: '',
    positionTitle: 'Obecná přihláška',
    createdAt: '2026-07-18T09:10',
    name: 'Marek Šindelář',
    email: 'marek.sindelar@email.cz',
    phone: '+420 733 900 145',
    message: 'Elektrikář se zkušeností z těžkého provozu, hledám práci v areálu. Rád se ozvu i na sezónní výpomoc.',
    values: vals(
      'Marek Šindelář',
      'marek.sindelar@email.cz',
      '+420 733 900 145',
      'Elektrikář se zkušeností z těžkého provozu, hledám práci v areálu. Rád se ozvu i na sezónní výpomoc.',
    ),
    files: [{ id: 'f7', name: 'sindelar-zivotopis.pdf', size: '241 kB', ext: 'pdf', kind: 'cv' }],
    status: 'new',
    assignee: '',
    note: '',
    consentUntil: '2027-07-18',
  },
]

/* ---------- Helpery uchazečů ---------- */
export function applicant(id: string): Applicant | undefined {
  return MOCK_APPLICANTS.find((a) => a.id === id)
}
/** Přihlášky na danou pozici (zrcadlo — v detailu pozice jen read-only). */
export function applicantsForPosition(positionId: string): Applicant[] {
  return MOCK_APPLICANTS.filter((a) => a.positionId === positionId)
}
/** Počet nových (nezpracovaných) přihlášek — do výpisu pozic i na nástěnku. */
export function newApplicantCount(positionId: string): number {
  return applicantsForPosition(positionId).filter((a) => a.status === 'new').length
}
/** Vyprší souhlas se zpracováním do 30 dnů? Upozornění v detailu. */
export function consentExpiringSoon(a: Applicant, today = CAREERS_TODAY): boolean {
  if (!a.consentUntil) return false
  const days = (Date.parse(a.consentUntil) - Date.parse(today)) / 86_400_000
  return days >= 0 && days <= 30
}
/** Datum a čas přihlášky do výpisu. */
export function fmtSubmitted(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
