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

/** Záznam v kanálu „Poslední aktivita". */
export interface ActivityItem {
  id: string
  icon: string
  /** Barva ikony (Tailwind text-* třída z tokenů). */
  tint: string
  bg: string
  module: string
  action: string
  title: string
  /** Relativní čas (prototyp — statický text). */
  time: string
}

export const ACTIVITY: ActivityItem[] = [
  { id: 'a1', icon: 'popup', tint: 'text-brand-600', bg: 'bg-brand-50', module: 'Pop-up', action: 'upraven', title: 'Letní sleva 20 % na Bolt Tower', time: 'před 8 min' },
  { id: 'a2', icon: 'news', tint: 'text-forge-600', bg: 'bg-forge-500/10', module: 'Aktuality', action: 'publikována', title: 'Bolt Tower otevírá letní vyhlídkovou sezónu', time: 'před 1 h' },
  { id: 'a3', icon: 'gallery', tint: 'text-[#7b5ea7]', bg: 'bg-[#7b5ea7]/10', module: 'Galerie', action: '+12 fotek', title: 'Akce a festivaly', time: 'před 3 h' },
  { id: 'a4', icon: 'faq', tint: 'text-[#0e8a8a]', bg: 'bg-[#0e8a8a]/10', module: 'FAQ', action: 'přidán dotaz', title: 'Kde mohu zaparkovat a kolik parkování stojí?', time: 'včera' },
  { id: 'a5', icon: 'ticket', tint: 'text-amber-600', bg: 'bg-amber-500/10', module: 'Prohlídky', action: 'nové termíny z Colossea', title: 'Vysokopecní okruh', time: 'včera' },
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
