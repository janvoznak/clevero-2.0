import { watch } from 'vue'
import { slugify } from './slug'
import type { LangCode, ML } from '@/data/types'

const LANGS: LangCode[] = ['cs', 'en', 'de', 'pl']

/**
 * Drží slug (ML) automaticky odvozený z titulku (ML). URL se generuje živě
 * z nadpisu; jakmile ji uživatel pro danou jazykovou mutaci ručně upraví,
 * auto-generování se pro ni zastaví (zavolej `markManual(lang)`).
 * Existující ručně nastavený slug (neodpovídá odvození z titulku) se nepřepisuje.
 * Prototyp.
 */
export function useAutoSlug(title: () => ML, slug: () => ML) {
  const manual = new Set<LangCode>()
  for (const l of LANGS) {
    const cur = slug()[l]
    if (cur && cur !== slugify(title()[l] || '')) manual.add(l)
  }
  watch(
    () => LANGS.map((l) => title()[l]),
    (now) => {
      LANGS.forEach((l, i) => {
        if (!manual.has(l)) slug()[l] = slugify(now[i] || '')
      })
    },
    { immediate: true },
  )
  return { markManual: (l: LangCode) => manual.add(l) }
}
