import { LANGS } from './types'
import type { ML, LangCode } from './types'

/* ============================================================
   Modul Dotační projekty.

   Na webu (dolnivitkovice.cz/projekty) je to jedna stránka: tři záložky podle
   fáze projektu a v každé projekty seskupené podle poskytovatele dotace —
   u skupiny logo poskytovatele, u projektu název, termín řešení, registrační
   číslo a anotace. Žádný detail, žádné přílohy.

   Tomu odpovídá i modul. Jsou to **povinně zveřejňované údaje**, ne
   marketingový obsah — takže žádné SEO, žádné URL, žádný obsah po blocích
   u jednotlivého projektu. Přidaná hodnota by tu byla na obtíž.

   Dvě rozhodnutí:
   - **Logo patří poskytovateli, ne projektu.** Je to povinná publicita, která
     se opakuje u všech projektů téhož poskytovatele — nahraje se jednou.
   - **Úvodní text stránky se píše v modulu Stránky** (content builder), ne tady.
     Modul dodává jen výpis projektů, který se do stránky vloží.

   Data jsou mock — registrační čísla i částky jsou zástupná.
   ============================================================ */

/** „Dnešek" prototypu — shodný s ostatními moduly. */
export const GRANTS_TODAY = '2026-07-28'

/* ---------- Poskytovatel dotace ---------- */
export interface GrantProvider {
  id: string
  /** Oficiální název poskytovatele nebo programu. Vlastní jméno se nepřekládá
      (stejná úvaha jako u kategorií aktualit) — u povinné publicity navíc musí
      název i logo zůstat v předepsané podobě. */
  name: string
  /** Logo do hlavičky skupiny (povinná publicita). null = zatím nenahrané. */
  logo: string | null
  /** Web poskytovatele — na výpisu se z loga stane odkaz. */
  url: string
}

export const MOCK_PROVIDERS: GrantProvider[] = [
  { id: 'interreg', name: 'Interreg V-A Česká republika – Polsko', logo: null, url: 'https://www.cz-pl.eu/' },
  { id: 'msk', name: 'Moravskoslezský kraj', logo: null, url: 'https://www.msk.cz/' },
  { id: 'opava', name: 'Statutární město Opava', logo: null, url: 'https://www.opava-city.cz/' },
  { id: 'ostrava', name: 'Statutární město Ostrava', logo: null, url: 'https://www.ostrava.cz/' },
]

export function provider(id: string): GrantProvider | undefined {
  return MOCK_PROVIDERS.find((p) => p.id === id)
}
export function providerOptions(): { value: string; label: string }[] {
  return MOCK_PROVIDERS.map((p) => ({ value: p.id, label: p.name }))
}
export function blankProvider(): GrantProvider {
  return { id: '', name: '', logo: null, url: '' }
}

/* ---------- Fáze projektu ----------
   Tři záložky na webu. Fáze se **volí ručně**: „udržitelnost" je právní stav
   po skončení projektu, který z termínu řešení nevyplývá. Admin ale hlídá, když
   termín prošel a projekt zůstal mezi aktuálně čerpanými (viz `phaseMismatch`). */
export type GrantPhase = 'active' | 'sustainability' | 'finished'

export const GRANT_PHASE_OPTIONS: { value: GrantPhase; label: string }[] = [
  { value: 'active', label: 'Aktuálně čerpaný dotační titul' },
  { value: 'sustainability', label: 'Projekt v udržitelnosti' },
  { value: 'finished', label: 'Ukončený projekt' },
]

export const GRANT_PHASE_META: Record<GrantPhase, { label: string; short: string; dot: string; text: string; bg: string }> = {
  active: {
    label: 'Aktuálně čerpaný dotační titul',
    short: 'Aktuálně čerpaný',
    dot: 'bg-forge-500',
    text: 'text-forge-600',
    bg: 'bg-forge-500/10',
  },
  sustainability: {
    label: 'Projekt v udržitelnosti',
    short: 'V udržitelnosti',
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    bg: 'bg-amber-500/10',
  },
  finished: {
    label: 'Ukončený projekt',
    short: 'Ukončený',
    dot: 'bg-steel-400',
    text: 'text-steel-600',
    bg: 'bg-steel-200',
  },
}

/* ---------- Projekt ---------- */
export interface GrantProject {
  id: string
  /** Poskytovatel dotace — určuje skupinu i logo ve výpisu. */
  providerId: string
  /** Název projektu tak, jak je v rozhodnutí o dotaci. */
  title: ML
  /** Anotace — obsah a cíle projektu (na webu odstavec pod názvem). */
  annotation: ML
  /** Registrační číslo projektu (povinný údaj). */
  regNumber: string
  /** Termín řešení od–do (ISO datum). `to` null = zatím neukončeno. */
  from: string
  to: string | null
  phase: GrantPhase
  published: boolean
  /** Které jazykové mutace jdou na web. undefined = všechny vyplněné. */
  publishedLangs?: LangCode[]
}

function ml(cs: string): ML {
  return { cs, en: '', de: '', pl: '' }
}

export const MOCK_GRANTS: GrantProject[] = [
  {
    id: 'g-msk-arealy-2026',
    providerId: 'msk',
    title: ml('Podpora turistických areálů spadajících pod Dolní oblast VÍTKOVICE, z.s. v roce 2026'),
    annotation: ml(
      'Projekt financuje provoz národní kulturní památky, rozšíření návštěvnického zázemí a zvýšení komfortu návštěvníků areálu.',
    ),
    regNumber: '00116/2026/RRC',
    from: '2026-01-01',
    to: '2026-10-31',
    phase: 'active',
    published: true,
  },
  {
    id: 'g-msk-vzdelavani-2026',
    providerId: 'msk',
    title: ml('Vzdělávací programy pro školy v Malém světě techniky U6'),
    annotation: ml(
      'Podpora přípravy a realizace vzdělávacích programů pro základní a střední školy Moravskoslezského kraje.',
    ),
    regNumber: '00348/2026/RRC',
    from: '2026-02-01',
    to: '2026-12-31',
    phase: 'active',
    published: true,
  },
  {
    id: 'g-ostrava-provoz-2026',
    providerId: 'ostrava',
    title: ml('Provoz a údržba areálu Dolních Vítkovic v roce 2026'),
    annotation: ml('Zajištění celoročního provozu areálu, údržby veřejných prostor a bezpečnosti návštěvníků.'),
    regNumber: '0451/2026/OK',
    from: '2026-01-01',
    to: '2026-12-31',
    phase: 'active',
    published: true,
  },
  {
    id: 'g-ostrava-kultura-2026',
    providerId: 'ostrava',
    title: ml('Kulturní program v Gongu a Trojhalí 2026'),
    annotation: ml('Dramaturgie a produkce koncertů, festivalů a doprovodných programů pro veřejnost.'),
    regNumber: '0512/2026/OK',
    from: '2026-03-01',
    to: '2026-11-30',
    phase: 'active',
    published: true,
  },
  {
    id: 'g-opava-expozice',
    providerId: 'opava',
    title: ml('Putovní expozice industriálního dědictví'),
    annotation: ml('Příprava putovní expozice o průmyslové historii regionu pro školy a kulturní instituce.'),
    regNumber: '2026/0087/OPA',
    from: '2026-04-01',
    to: '2026-09-30',
    phase: 'active',
    published: true,
  },
  {
    id: 'g-interreg-cesty',
    providerId: 'interreg',
    title: ml('Společné cesty industriálním dědictvím CZ–PL'),
    annotation: ml(
      'Přeshraniční spolupráce při propagaci industriálních památek, společné turistické trasy a dvojjazyčné materiály.',
    ),
    regNumber: 'CZ.11.2.45/0.0/0.0/22_030/0003118',
    from: '2024-01-01',
    to: '2025-12-31',
    phase: 'sustainability',
    published: true,
  },
  {
    id: 'g-ostrava-bolt-2024',
    providerId: 'ostrava',
    title: ml('Zpřístupnění Bolt Tower pro handicapované návštěvníky'),
    annotation: ml('Úprava přístupových tras a instalace pomůcek pro návštěvníky s omezenou schopností pohybu.'),
    regNumber: '0298/2024/OK',
    from: '2024-05-01',
    to: '2024-12-31',
    phase: 'finished',
    published: true,
  },
  {
    id: 'g-msk-navstevnost-2025',
    providerId: 'msk',
    title: ml('Podpora návštěvnosti areálu v roce 2025'),
    annotation: ml('Marketingová podpora návštěvnosti a rozvoj služeb infocentra.'),
    regNumber: '00204/2025/RRC',
    from: '2025-01-01',
    // Termín prošel, ale projekt zůstal mezi aktuálně čerpanými — admin na to upozorní.
    to: '2025-12-31',
    phase: 'active',
    published: false,
  },
]

/* ---------- Helpery ---------- */
export function grant(id: string): GrantProject | undefined {
  return MOCK_GRANTS.find((g) => g.id === id)
}
export function grantsForProvider(providerId: string): GrantProject[] {
  return MOCK_GRANTS.filter((g) => g.providerId === providerId)
}
/** Sedí zvolená fáze s termínem řešení? Ne = měkké upozornění, ne blokace. */
export function phaseMismatch(g: GrantProject, today = GRANTS_TODAY): boolean {
  return g.phase === 'active' && !!g.to && g.to < today
}
/** Termín řešení do výpisu („1. 1. 2026 – 31. 10. 2026"). */
export function termLabel(g: GrantProject): string {
  const f = (iso: string | null) => {
    if (!iso) return 'zatím neukončeno'
    const [y, m, d] = iso.split('-')
    return `${Number(d)}. ${Number(m)}. ${y}`
  }
  return `${f(g.from)} – ${f(g.to)}`
}
export function blankGrant(): GrantProject {
  return {
    id: 'nový',
    providerId: MOCK_PROVIDERS[0]?.id ?? '',
    title: ml(''),
    annotation: ml(''),
    regNumber: '',
    from: '',
    to: null,
    phase: 'active',
    published: false,
    publishedLangs: LANGS.map((l) => l.code),
  }
}
