import { LANGS } from './types'
import type { ML, LangCode } from './types'

/* ============================================================
   Podmodul „Informační lišta" (entita `infobar`).

   Web má nad hlavním menu úzký pruh na provozní sdělení („Bolt Tower je
   dnes uzavřen", „Od 1. 10. mimo provoz"). Administrace s ním dosud
   nepočítala — redakce ho nemohla zapnout ani do něj napsat text.

   Lišta je jeden záznam (ne seznam): web zobrazuje nejvýš jednu.
   ============================================================ */

/** „Dnešek" prototypu — pro odvození stavu lišty. */
export const INFO_BAR_NOW = new Date('2026-07-28T12:00:00')

export interface InfoBar {
  /** Zobrazovat lištu na webu. */
  enabled: boolean
  /** Text lišty (ML) — hlavní sdělení. */
  text: ML
  /** Popisek odkazu (ML). Prázdný = lišta je jen text, bez odkazu. */
  linkLabel: ML
  /** Cíl odkazu — jedna adresa pro všechny mutace (stejně jako u přidružených
      odkazů stránky, viz STANDARDY §14a). Prázdné = bez odkazu. */
  linkUrl: string
  /** Odkaz otevřít v novém okně. */
  newWindow: boolean
  /** Naplánované zobrazení — do té doby se lišta neukáže. null = hned. */
  showFrom: string | null
  /** Automatické skrytí — po tomto termínu lišta zmizí. null = bez omezení. */
  hideAt: string | null
  /** Které jazykové mutace se na webu zobrazí (viz `@/utils/langPublish`).
      undefined = fallback: všechny vyplněné. */
  publishedLangs?: LangCode[]
}

function ml(cs: string): ML {
  return { cs, en: '', de: '', pl: '' }
}

/** Mock: lišta s provozním sdělením a odkazem na detail. */
export const MOCK_INFO_BAR: InfoBar = {
  enabled: true,
  text: {
    cs: 'Bolt Tower je od 4. do 8. srpna uzavřen kvůli údržbě výtahu.',
    en: 'Bolt Tower is closed from 4 to 8 August due to lift maintenance.',
    de: '',
    pl: '',
  },
  linkLabel: { cs: 'Více informací', en: 'More information', de: '', pl: '' },
  linkUrl: 'https://www.dolnivitkovice.cz/aktuality/bolt-tower-udrzba/',
  newWindow: false,
  showFrom: null,
  hideAt: '2026-08-08T20:00',
  // EN mutace je vyplněná, ale zatím skrytá → ukázka stavu „připraveno".
  publishedLangs: ['cs'],
}

/** Prázdná lišta (kdyby se zakládala načisto). */
export function blankInfoBar(): InfoBar {
  return {
    enabled: false,
    text: ml(''),
    linkLabel: ml(''),
    linkUrl: '',
    newWindow: false,
    showFrom: null,
    hideAt: null,
    publishedLangs: LANGS.map((l) => l.code),
  }
}

/** Efektivní stav lišty — z přepínače a časového okna. */
export type InfoBarState = 'active' | 'scheduled' | 'expired' | 'disabled'

export function infoBarState(b: InfoBar, now = INFO_BAR_NOW): InfoBarState {
  if (!b.enabled) return 'disabled'
  const from = b.showFrom ? new Date(b.showFrom) : null
  const to = b.hideAt ? new Date(b.hideAt) : null
  if (from && from > now) return 'scheduled'
  if (to && to < now) return 'expired'
  return 'active'
}

export const INFO_BAR_STATE_META: Record<
  InfoBarState,
  { label: string; hint: string; dot: string; text: string; bg: string }
> = {
  active: {
    label: 'Zobrazuje se',
    hint: 'Lišta je na webu vidět nad hlavním menu.',
    dot: 'bg-forge-500',
    text: 'text-forge-600',
    bg: 'bg-forge-500/10',
  },
  scheduled: {
    label: 'Naplánováno',
    hint: 'Lišta se zobrazí až po zadaném termínu.',
    dot: 'bg-amber-500',
    text: 'text-amber-600',
    bg: 'bg-amber-500/10',
  },
  expired: {
    label: 'Automaticky skryto',
    hint: 'Termín automatického skrytí už uplynul — lišta na webu není.',
    dot: 'bg-steel-400',
    text: 'text-steel-600',
    bg: 'bg-steel-200',
  },
  disabled: {
    label: 'Vypnuto',
    hint: 'Lišta je vypnutá a na webu se nezobrazuje.',
    dot: 'bg-steel-300',
    text: 'text-steel-500',
    bg: 'bg-steel-100',
  },
}

/** Má lišta v dané mutaci co ukázat? (prázdný text = není co zobrazit) */
export function hasText(b: InfoBar, code: LangCode): boolean {
  return b.text[code].trim().length > 0
}
