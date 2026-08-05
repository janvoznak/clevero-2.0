/* ============================================================
   Dashboard — mock data (přehledová data + aktivita + plán).
   KPI se počítají ve view z reálných mock polí modulů; tady jsou
   doplňkové zástupné údaje (návštěvnost, aktivita, plán).
   Vše je prototyp — žádná reálná analytika ani události.
   ============================================================ */

/** Návštěvy za posledních 7 dní (pro sparkline v KPI dlaždici). */
export const VISITS_SPARK = [820, 910, 760, 1180, 1040, 1520, 1360]
export const VISITS_TODAY = 1360
export const VISITS_TREND = 12 // % oproti minulému týdnu

/* Byznys metriky za tento týden (prototyp — zástupná čísla).
   Vstupenky = z Colossea, produkty a tržby = z e-shopu. */
export const TICKETS_WEEK = 842
export const TICKETS_TREND = 9
export const ESHOP_PRODUCTS_WEEK = 128
export const ESHOP_PRODUCTS_TREND = 14
export const REVENUE_WEEK = 214500 // Kč (e-shop + vstupenky)
export const REVENUE_TREND = 6

/** Naposledy vytvořený obsah (příspěvky napříč moduly).
    Jen vznik obsahu (nová aktualita, stránka, akce, prohlídka, galerie) —
    ne mikroakce. Každý s autorem, časem vytvoření a proklikem na detail. */
export interface RecentItem {
  id: string
  icon: string
  /** Barva ikony (Tailwind třídy z tokenů). */
  tint: string
  bg: string
  /** Modul, do kterého obsah patří. */
  module: string
  title: string
  /** Kdo obsah vytvořil. */
  user: string
  /** Kdy byl vytvořen (prototyp — statický text). */
  date: string
  /** Proklik na detail / editor záznamu. */
  to: string
}

export const RECENT: RecentItem[] = [
  { id: 'r1', icon: 'news', tint: 'text-forge-600', bg: 'bg-forge-500/10', module: 'Aktuality', title: 'Bolt Tower otevírá letní vyhlídkovou sezónu', user: 'Jana Svobodová', date: 'dnes 09:14', to: '/admin/news/n-2041/edit' },
  { id: 'r2', icon: 'calendar', tint: 'text-brand-600', bg: 'bg-brand-50', module: 'Kalendář akcí', title: 'Krištof Kintera: Neuropolis', user: 'Petr Dvořák', date: 'dnes 08:02', to: '/admin/events/e-neuropolis' },
  { id: 'r3', icon: 'ticket', tint: 'text-amber-600', bg: 'bg-amber-500/10', module: 'Prohlídky', title: 'Vysokopecní okruh vč. návštěvy Bolt Tower', user: 'Martin Kučera', date: 'včera 16:40', to: '/admin/tours/t-vysokopecni/edit' },
  { id: 'r4', icon: 'page', tint: 'text-graphite-700', bg: 'bg-steel-100', module: 'Stránky', title: 'Historie areálu', user: 'Jana Svobodová', date: 'včera 11:20', to: '/admin/pages/pg-historie/edit' },
  { id: 'r5', icon: 'gallery', tint: 'text-[#7b5ea7]', bg: 'bg-[#7b5ea7]/10', module: 'Galerie', title: 'Akce a festivaly', user: 'Petr Dvořák', date: '3. 8. · 15:05', to: '/admin/galleries/g-akce/edit' },
  { id: 'r6', icon: 'news', tint: 'text-forge-600', bg: 'bg-forge-500/10', module: 'Aktuality', title: 'Noční prohlídky Dolu Hlubina', user: 'Jana Svobodová', date: '3. 8. · 09:30', to: '/admin/news/n-2035/edit' },
]

/** Naplánovaná / nadcházející položka. */
export interface ScheduledItem {
  id: string
  icon: string
  title: string
  module: string
  date: string
  /** 'scheduled' = čeká na start, 'ending' = brzy končí. */
  kind: 'scheduled' | 'ending'
}

export const SCHEDULED: ScheduledItem[] = [
  { id: 's1', icon: 'news', title: 'Colours of Ostrava 2026 — program v Gongu', module: 'Aktuality', date: '15. 7. 2026', kind: 'scheduled' },
  { id: 's2', icon: 'popup', title: 'Vánoční trhy v areálu', module: 'Pop-up', date: '1. 12. 2026', kind: 'scheduled' },
  { id: 's3', icon: 'news', title: 'Bolt Tower — letní sezóna', module: 'Aktuality', date: '30. 9. 2026', kind: 'ending' },
]

/* ============================================================
   „Vyžaduje pozornost" — položky, které si žádají zásah klienta.
   Vyhodnocuje je (v ostrém CMS) AI asistent: integrace, formuláře,
   objednávky i stav obsahu (barometr připravenosti článku).
   Prototyp — statická data, „AI návrh" je zástupný text.
   ============================================================ */
export type AttentionSeverity = 'action' | 'review' | 'tip'

export const ATTENTION_SEVERITY: Record<
  AttentionSeverity,
  { label: string; dot: string; text: string; bg: string; rail: string }
> = {
  action: { label: 'Nutná akce', dot: 'bg-danger-500', text: 'text-danger-600', bg: 'bg-danger-500/10', rail: 'border-danger-500' },
  review: { label: 'Ke kontrole', dot: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-500/10', rail: 'border-amber-500' },
  tip: { label: 'AI tip', dot: 'bg-brand-500', text: 'text-brand-600', bg: 'bg-brand-50', rail: 'border-brand-400' },
}

export interface AttentionItem {
  id: string
  severity: AttentionSeverity
  icon: string
  /** Zdroj / modul, odkud podnět přišel. */
  source: string
  title: string
  detail: string
  /** Návrh řešení od AI asistenta. */
  ai: string
  /** Popisek tlačítka akce. */
  actionLabel: string
  /** Cíl prokliku (cesta v administraci). */
  to: string
  /** Barometr připravenosti obsahu (jen u obsahových položek). */
  health?: { score: number; missing: string[] }
}

export const ATTENTION: AttentionItem[] = [
  {
    id: 'at-colosseum-product',
    severity: 'action',
    icon: 'integration',
    source: 'Colosseum',
    title: 'Nový produkt čeká na propojení',
    detail: 'V Colosseu přibylo „Rodinné vstupné U6". Zatím není propojené s žádným produktem v administraci.',
    ai: 'Spárovat s produktem „Vstupné U6" — shoduje se název i cena.',
    actionLabel: 'Propojit produkt',
    to: '/admin/integrations/colosseum',
  },
  {
    id: 'at-contact-form',
    severity: 'action',
    icon: 'mail',
    source: 'Kontaktní formulář',
    title: 'Nový vyplněný formulář',
    detail: 'Poptávka firemní akce od Marie Svobodové (marie.s@example.cz) — čeká na odpověď.',
    ai: 'Připravit odpověď a přeposlat na obchodní oddělení.',
    actionLabel: 'Zobrazit formulář',
    to: '/admin/contacts',
  },
  {
    id: 'at-colosseum-order',
    severity: 'review',
    icon: 'ticket',
    source: 'Colosseum',
    title: 'Nová objednávka vstupenek',
    detail: 'Objednávka #4821 — 4× Vysokopecní okruh, celkem 2 340 Kč (zaplaceno).',
    ai: 'Objednávka je uhrazená — stačí zkontrolovat a nechat proběhnout.',
    actionLabel: 'Otevřít objednávku',
    to: '/admin/tickets',
  },
  {
    id: 'at-article-health',
    severity: 'tip',
    icon: 'news',
    source: 'Aktuality · kontrola AI',
    title: 'Článek není připravený k publikaci',
    detail: '„Adventní trhy v areálu" — hlavní obrázek chybí a text je příliš krátký.',
    ai: 'Doplním chybějící části: navrhnu obrázek, rozšířím text a přeložím do EN/DE/PL.',
    actionLabel: 'Doplnit článek',
    to: '/admin/news/n-2024/edit',
    health: { score: 45, missing: ['hlavní obrázek', 'delší text', 'překlady EN/DE/PL'] },
  },
]
