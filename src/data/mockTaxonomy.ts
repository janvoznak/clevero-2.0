import type { ML, LangCode } from './types'

/* ============================================================
   Centrální taxonomie (štítky a kategorie) — vícejazyčná.

   Rozhodnutí (STANDARDY §): taxonomie se překládá JEDNOU a CENTRÁLNĚ tady,
   ne v pravém panelu detailu. V záznamech (aktuality, galerie) se pojem
   referencuje stabilním českým názvem (`label.cs`); ostatní jazyky jsou jen
   pro zobrazení na webu. Výběr štítku v detailu je tak jazykově nezávislý.
   ============================================================ */

/** Jeden pojem taxonomie — vícejazyčný název + barva. */
export interface TaxonomyTerm {
  /** Stabilní klíč (slug). Identita pojmu nezávislá na překladu. */
  id: string
  /** Název pojmu v jednotlivých jazycích (CS je zdroj/identita v záznamech). */
  label: ML
  /** Barva chipu (sdílená napříč mutacemi). */
  color: string
}

function ml(cs: string, en = '', de = '', pl = ''): ML {
  return { cs, en, de, pl }
}

/** Štítky aktualit (průřezové, sdílené napříč obsahem). */
export const NEWS_TAGS: TaxonomyTerm[] = [
  { id: 'akce', label: ml('Akce', 'Events', 'Veranstaltungen', 'Wydarzenia'), color: '#ee703d' },
  { id: 'prohlidky', label: ml('Prohlídky', 'Tours', 'Führungen', 'Zwiedzanie'), color: '#15916a' },
  { id: 'festival', label: ml('Festival', 'Festival', 'Festival', 'Festiwal'), color: '#d98a15' },
  { id: 'vystava', label: ml('Výstava', 'Exhibition', 'Ausstellung', 'Wystawa'), color: '#7b5ea7' },
  { id: 'pro-rodiny', label: ml('Pro rodiny', 'For families', 'Für Familien', 'Dla rodzin'), color: '#3b6fb0' },
  { id: 'sezonni', label: ml('Sezónní', 'Seasonal', 'Saisonal', 'Sezonowe'), color: '#0e8a8a' },
  // Záměrně nepřeložené (ukázka „chybí překlad" v centrální správě).
  { id: 'tiskova-zprava', label: ml('Tisková zpráva'), color: '#64748b' },
]

/** Kategorie aktualit (obsahové zařazení). Vlastní jména se nepřekládají. */
export const NEWS_CATEGORIES: TaxonomyTerm[] = [
  { id: 'dov', label: ml('DOV', 'DOV', 'DOV', 'DOV'), color: '#ee703d' },
  { id: 'ateliery-hlubina', label: ml('Ateliéry Hlubina', 'Hlubina Studios', 'Hlubina-Ateliers', 'Atelier Hlubina'), color: '#5b5bd6' },
  { id: 'bolt-cafe', label: ml('Bolt Café'), color: '#d98a15' },
  { id: 'brickhouse', label: ml('Brickhouse'), color: '#d64545' },
  { id: 'bufet-u-karla', label: ml('Bufet U Karla'), color: '#15916a' },
  { id: 'cineport', label: ml('Cineport'), color: '#3b6fb0' },
]

/** Název pojmu v daném jazyce (fallback na češtinu, když překlad chybí). */
export function termLabel(term: TaxonomyTerm, lang: LangCode): string {
  return term.label[lang].trim() || term.label.cs
}

/** Prázdný nový pojem (pro přidání ve správě). */
export function blankTerm(): TaxonomyTerm {
  return { id: '', label: ml(''), color: '#64748b' }
}
