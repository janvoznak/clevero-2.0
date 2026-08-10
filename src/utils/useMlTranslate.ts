import { ref } from 'vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode, ML } from '@/data/types'

const TARGET_LANGS = LANGS.filter((l) => l.code !== SOURCE_LANG).map((l) => l.code)

/**
 * AI překlad jazykových mutací (prototyp — reálná AI se nevolá, jen se
 * zkopíruje zdrojová čeština). Jedno sdílené řešení pro všechny editory.
 *
 * @param form reactive objekt formuláře
 * @param mlFields klíče ML polí, která se překládají (ostatní jsou systémová)
 */
export function useMlTranslate<T extends Record<string, unknown>>(form: T, mlFields: (keyof T)[]) {
  /** Kód mutace, která se právě „překládá" (pro pulzující ✨), jinak null. */
  const translating = ref<LangCode | null>(null)
  const toast = ref('')

  function flash(msg: string) {
    toast.value = msg
    window.setTimeout(() => (toast.value = ''), 2800)
  }

  /** Přeloží CELOU mutaci `code` ze zdrojového jazyka (klik na ✨ v liště). */
  function translateLang(code: LangCode) {
    if (code === SOURCE_LANG || translating.value) return
    translating.value = code
    window.setTimeout(() => {
      for (const key of mlFields) {
        const val = form[key] as ML
        if (val[SOURCE_LANG]) val[code] = val[SOURCE_LANG]
      }
      translating.value = null
      const label = LANGS.find((l) => l.code === code)?.label ?? code
      flash(`Přeloženo do: ${label}`)
    }, 1100)
  }

  /** Přeloží JEDNO pole do všech ostatních mutací (klik na ✨ u pole). */
  function translateField(key: keyof T) {
    const val = form[key] as ML
    const src = val[SOURCE_LANG]
    if (!src) return
    for (const t of TARGET_LANGS) val[t] = src
    flash('Pole přeloženo do ostatních mutací')
  }

  return { translating, toast, translateLang, translateField }
}
