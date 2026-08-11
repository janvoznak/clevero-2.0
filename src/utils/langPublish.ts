import { LANGS } from '@/data/types'
import type { LangCode, ML } from '@/data/types'

/* ============================================================
   Sdílené publikování per jazyk — jednotné napříč moduly.

   Princip (rozhodnutí v Aktualitách, sjednoceno všude):
   - Časové okno / stav záznamu řídí, KDY je záznam živý.
   - `publishedLangs` řídí, KTERÉ jazykové mutace se na webu zobrazí.
   - Prázdnou mutaci (bez obsahu) nelze zveřejnit.
   - `publishedLangs === undefined` = zpětně kompatibilní fallback: živé jsou
     všechny vyplněné mutace.
   ============================================================ */

export type LangPublishState = 'live' | 'ready' | 'empty'

export const LANG_PUBLISH_META: Record<LangPublishState, { label: string; dot: string; chip: string }> = {
  live: { label: 'Zveřejněno na webu', dot: 'bg-forge-500', chip: 'bg-forge-500/10 text-forge-600' },
  ready: { label: 'Vyplněno, ale skryté na webu', dot: 'bg-amber-500', chip: 'bg-amber-500/10 text-amber-600' },
  empty: { label: 'Prázdné (nelze zveřejnit)', dot: 'bg-steel-300', chip: 'bg-steel-100 text-steel-400' },
}

/** Vyplněné mutace podle ML pole (typicky nadpis/název). */
export function filledLangsOf(title: ML): LangCode[] {
  return LANGS.filter((l) => title[l.code].trim().length > 0).map((l) => l.code)
}

/** Zveřejněné mutace — explicitní seznam ∩ vyplněné; bez seznamu = všechny vyplněné. */
export function publishedLangsOf(filled: LangCode[], explicit?: LangCode[]): LangCode[] {
  if (!explicit) return filled
  return explicit.filter((c) => filled.includes(c))
}

/** Stav jedné mutace pro UI: živě / připraveno (skryté) / prázdné. */
export function langPublishState(lang: LangCode, filled: LangCode[], explicit?: LangCode[]): LangPublishState {
  if (!filled.includes(lang)) return 'empty'
  return publishedLangsOf(filled, explicit).includes(lang) ? 'live' : 'ready'
}

/** Přepnutí zveřejnění jedné mutace → nový seznam (v pořadí LANGS). Prázdnou nelze. */
export function toggleLangPublish(explicit: LangCode[] | undefined, filled: LangCode[], lang: LangCode): LangCode[] {
  if (!filled.includes(lang)) return (explicit ?? filled).slice()
  const set = new Set(explicit ?? filled)
  set.has(lang) ? set.delete(lang) : set.add(lang)
  return LANGS.filter((l) => set.has(l.code)).map((l) => l.code)
}

/** Řádek matice „Zobrazit jazyk na webu" pro PublishCard. */
export interface PublishLangRow {
  code: LangCode
  label: string
  flag: string
  state: LangPublishState
}

/** Řádky pro PublishCard z ML nadpisu + explicitního seznamu. */
export function publishLangRows(title: ML, explicit?: LangCode[]): PublishLangRow[] {
  const filled = filledLangsOf(title)
  return LANGS.map((l) => ({
    code: l.code,
    label: l.label,
    flag: l.flag,
    state: langPublishState(l.code, filled, explicit),
  }))
}
