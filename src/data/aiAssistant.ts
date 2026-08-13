/**
 * AI asistent administrace — PROTOTYP (bez reálné AI).
 *
 * Řídící princip (viz docs/STANDARDY-MODULU.md §11a): žádné volání modelu, žádné
 * API klíče. Celá „inteligence" je deterministický pattern-matching nad textem
 * uživatele + předstíraná prodleva (typing). Slouží k předvedení UX:
 *   1) nápověda „jak něco udělat" → kanonická odpověď,
 *   2) rychlá akce „vytvoř aktualitu …" → sestaví koncept a předá ho do editoru.
 *
 * Handoff do editoru: asistent uloží koncept do `pendingNewsDraft`, přesměruje na
 * `news/new` a NewsEdit si ho na startu vyzvedne (consumeNewsDraft) a vyplní pole.
 */
import { ref } from 'vue'

/** Koncept aktuality předaný z asistenta do editoru (jen zdrojový jazyk CS —
    ostatní mutace se doplní stávajícím AI překladem, dle standardu). */
export interface NewsDraft {
  title: string
  summary: string
  text: string
  tags: string[]
  categories: string[]
  dateFrom: string | null
}

/** Jedna zpráva v konverzaci. */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** Připojený koncept aktuality (u odpovědi asistenta) → vykreslí se jako karta. */
  draft?: NewsDraft
}

/** Odpověď enginu na zprávu uživatele. */
export interface AssistantReply {
  text: string
  draft?: NewsDraft
}

/** Rychlá akce (chip) — předvyplní vstup a rovnou odešle. */
export interface QuickAction {
  label: string
  icon: string
  prompt: string
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'Vytvořit aktualitu',
    icon: 'sparkles',
    prompt: 'Vytvoř mi novou aktualitu, že se blíží festival Colours of Ostrava 2027.',
  },
  { label: 'Jak zveřejnit obsah?', icon: 'globe', prompt: 'Jak zveřejním obsah na webu?' },
  { label: 'Přeložit do jazyků', icon: 'sync', prompt: 'Jak přeložím aktualitu do dalších jazyků?' },
  { label: 'Přidat fotogalerii', icon: 'gallery', prompt: 'Jak k aktualitě přidám fotogalerii?' },
]

/* ---------------------------------------------------------------------------
   Handoff konceptu do editoru
--------------------------------------------------------------------------- */
const pendingNewsDraft = ref<NewsDraft | null>(null)

/** Asistent připraví koncept pro editor Aktualit. */
export function stageNewsDraft(draft: NewsDraft): void {
  pendingNewsDraft.value = draft
}

/** Editor si koncept vyzvedne (a zároveň ho vyprázdní — jednorázové předání). */
export function consumeNewsDraft(): NewsDraft | null {
  const d = pendingNewsDraft.value
  pendingNewsDraft.value = null
  return d
}

/* ---------------------------------------------------------------------------
   Fake engine
--------------------------------------------------------------------------- */

/** Bezdiakritické malé písmo pro robustní shodu klíčových slov. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

let seq = 0
/** ID zprávy bez Math.random / Date.now (v prototypu deterministicky). */
export function nextId(): string {
  seq += 1
  return `msg-${seq}`
}

/** Odvodí štítky z tématu (jednoduchá heuristika nad klíčovými slovy). */
function inferTags(topic: string): string[] {
  const n = norm(topic)
  if (/festival|colours|concert|koncert|hudb/.test(n)) return ['Festival', 'Akce']
  if (/prohlidk|tour/.test(n)) return ['Prohlídky']
  if (/vystav|expozic|galeri/.test(n)) return ['Výstava']
  if (/rodin|deti|dets|kids/.test(n)) return ['Pro rodiny']
  if (/trh|advent|vanoc|vianoc/.test(n)) return ['Akce', 'Sezónní']
  return ['Akce']
}

/** Z věty uživatele vytáhne „téma" aktuality (odřízne příkazovou část). */
function extractTopic(input: string): string {
  let t = input.trim()
  // odřízni vše po slovo „aktualit… / novink…" včetně
  const m = t.match(/(aktualit\w*|novink\w*)\s*/i)
  if (m && m.index !== undefined) t = t.slice(m.index + m[0].length)
  // odřízni spojovací úvod („že …", „o tom, že …", „:", „o …", „na téma …")
  t = t
    .replace(/^["“„:,\-–\s]+/, '')
    .replace(/^(o tom,?\s*ze|o tom,?\s*že|ze,?\s*|že,?\s*|na tema\s*|na téma\s*|ohledne\s*|ohledně\s*|o\s+)/i, '')
    .replace(/["“”„]+/g, '')
    .trim()
  return t
}

/** Z tématu sestaví lidsky znějící nadpis. */
function craftTitle(topic: string): string {
  let t = topic.replace(/[.!?]+$/, '').trim()
  // „se blíží X" → „Blíží se X" (přirozenější titulek)
  t = t.replace(/^se\s+blizi\s+/i, 'Blíží se ').replace(/^se\s+blíží\s+/i, 'Blíží se ')
  if (!t) return 'Nová aktualita'
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/** Rozpozná, že uživatel chce založit aktualitu. */
function isCreateNewsIntent(n: string): boolean {
  const wantsCreate = /(vytvor|vytvoř|zaloz|založ|napis|napiš|pridej|přidej|udelej|udělej|sepis|sepiš)/.test(n)
  const aboutNews = /(aktualit|novink)/.test(n)
  return wantsCreate && aboutNews
}

/** Rozpozná pokus založit jiný (zatím nepodporovaný) typ obsahu. */
function isCreateOtherIntent(n: string): boolean {
  const wantsCreate = /(vytvor|vytvoř|zaloz|založ|napis|napiš|udelej|udělej)/.test(n)
  const otherEntity = /(akci|udalost|událost|prohlidk|stranku|stránku|galerii|produkt|program|voucher)/.test(n)
  return wantsCreate && otherEntity
}

/** Kanonické nápovědy „jak na to" (bez AI). */
const HELP: { match: RegExp; answer: string }[] = [
  {
    match: /(zverejn|zveřejn|publik|na web|zivo|živo|vydat)/,
    answer:
      'Publikování má dvě roviny. Časové okno OD–DO v kartě „Publikace" (pravý panel) řídí, KDY je záznam živý, ' +
      'a matice „Zobrazit jazyk na webu" řídí, KTERÉ jazykové mutace se zobrazí. Prázdnou mutaci zveřejnit nelze.',
  },
  {
    match: /(preloz|přelož|preklad|překlad|jazyk|mutac|anglic|nemec|němec|polsk)/,
    answer:
      'Napište obsah v češtině a u jazykových pilulek nahoře použijte ✨ „Přeložit z češtiny (DOVík)" — ' +
      'doplní všechny cizí mutace najednou. Jednotlivá pole pak můžete doladit přepnutím jazyka nahoře.',
  },
  {
    match: /(galeri|fotogaleri|fotk|obrazk|obrázk|foto)/,
    answer:
      'V editoru aktuality přepněte na záložku „Fotogalerie" a nahrajte snímky (drag&drop mění pořadí, hvězda označí hlavní obrázek). ' +
      'Rozsáhlejší galerie se spravují v modulu Galerie a připojují se přes vazbu.',
  },
  {
    match: /(stitk|štítk|kategori|tag)/,
    answer:
      'Štítky i kategorie vyberete v pravém panelu detailu. Jsou průřezové (nezávislé na jazyce) — stejný záznam má stejná témata ve všech mutacích. ' +
      'Překlady štítků se spravují centrálně v Nastavení → „Štítky a kategorie".',
  },
]

/** Z textu (téma nebo celá věta) sestaví koncept aktuality. Sdílené DOVíkovým
    chatem i dlaždicí „Založit zrychleně" v editoru Aktualit → stejný výsledek. */
export function newsDraftFromText(input: string): NewsDraft {
  const topic = extractTopic(input)
  const title = craftTitle(topic)
  return {
    title,
    summary: `${title}. Podrobný program a další informace zveřejníme již brzy.`,
    text:
      `<p>${title}. Na tuto událost se můžete těšit v areálu Dolní Vítkovice — ` +
      `sledujte náš web, kde postupně doplníme program, časy a informace ke vstupenkám.</p>`,
    tags: inferTags(topic),
    categories: ['DOV'],
    dateFrom: null,
  }
}

/** Hlavní vstup enginu: text uživatele → odpověď asistenta (fake). */
export function respondTo(input: string): AssistantReply {
  const n = norm(input)

  if (isCreateNewsIntent(n)) {
    const draft = newsDraftFromText(input)
    return {
      text:
        'Připravil jsem koncept aktuality. Zkontrolujte pole níže a otevřete ho v editoru — ' +
        'termín konání jsem nechal prázdný, doplňte ho prosím. Cizí jazyky pak dopřeložíte jedním tlačítkem.',
      draft,
    }
  }

  if (isCreateOtherIntent(n)) {
    return {
      text:
        'Zakládat obsah zatím umím u modulu Aktuality — ostatní moduly (akce, prohlídky, galerie…) připravujeme. ' +
        'Zkuste třeba: „Vytvoř aktualitu, že se blíží festival Colours of Ostrava 2027."',
    }
  }

  for (const h of HELP) {
    if (h.match.test(n)) return { text: h.answer }
  }

  if (/(ahoj|cau|čau|dobry den|dobrý den|zdrav|hello|hi)\b/.test(n)) {
    return {
      text:
        'Dobrý den, jsem DOVík — asistent administrace Dolních Vítkovic. Poradím vám s ovládáním, nebo za vás ' +
        'rovnou založím aktualitu — stačí napsat, o čem má být.',
    }
  }

  return {
    text:
      'Umím dvě věci: poradit s ovládáním administrace (publikování, překlady, galerie, štítky…) a založit za vás ' +
      'aktualitu — napište například „Vytvoř aktualitu, že se blíží festival Colours of Ostrava 2027." ' +
      'Zkuste některou z rychlých akcí níže.',
  }
}
