import { reactive } from 'vue'
import { LANGS } from './types'
import type { ML, LangCode, Tag } from './types'

/* ============================================================
   Modul FAQ (časté dotazy).
   Plochý seznam otázek a odpovědí; každý dotaz patří do jedné kategorie.
   Otázka i odpověď jsou vícejazyčné (ML) — jde o obsah pro web.
   AI umí z otázky připravit koncept odpovědi (viz FaqEdit → AiPanel).
   ============================================================ */

export const FAQ_NOW = new Date('2026-07-28T12:00:00')

function ml(cs: string, rest: Partial<Record<LangCode, string>> = {}): ML {
  return { cs, en: '', de: '', pl: '', ...rest }
}
function emptyML(): ML {
  return { cs: '', en: '', de: '', pl: '' }
}

/* ---------- Kategorie dotazů (sdílí vzhled se štítky) ----------
   Reaktivní seznam — nové kategorie lze přidat rovnou z detailu FAQ
   (viz `registerFaqCategory`), projeví se ve výpisu i ve filtrech. */
export const FAQ_CATEGORIES = reactive<Tag[]>([
  { label: 'Vstupenky a rezervace', color: '#ee703d' },
  { label: 'Otevírací doba', color: '#3b6fb0' },
  { label: 'Doprava a parkování', color: '#15916a' },
  { label: 'Prohlídky', color: '#7b5ea7' },
  { label: 'Akce a program', color: '#d98a15' },
  { label: 'Služby a zázemí', color: '#0e8a8a' },
])

/** Stabilní paleta pro barvu nově vytvořených kategorií (nezávislá na délce seznamu). */
const CATEGORY_PALETTE = ['#ee703d', '#3b6fb0', '#15916a', '#7b5ea7', '#d98a15', '#0e8a8a', '#b5573b', '#2f6f9e']

/** Barva kategorie — z registrovaných, jinak stabilní fallback z palety. */
export function faqCategoryColor(label: string): string {
  const found = FAQ_CATEGORIES.find((c) => c.label.toLowerCase() === label.toLowerCase())
  if (found) return found.color
  let h = 0
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0
  return CATEGORY_PALETTE[h % CATEGORY_PALETTE.length]
}

/** Zaregistruje novou kategorii (z detailu FAQ). Idempotentní — case-insensitive. */
export function registerFaqCategory(label: string): void {
  const name = label.trim()
  if (!name) return
  if (FAQ_CATEGORIES.some((c) => c.label.toLowerCase() === name.toLowerCase())) return
  FAQ_CATEGORIES.push({ label: name, color: faqCategoryColor(name) })
}

/* ---------- Entita ---------- */
export interface FaqItem {
  id: string
  question: ML
  /** Odpověď (richtext). */
  answer: ML
  /** Kategorie (jedna z FAQ_CATEGORIES). */
  category: string
  published: boolean
  /** Které jazykové mutace jsou na webu viditelné. undefined = všechny vyplněné. */
  publishedLangs?: LangCode[]
  /** Pořadí ve výpisu na webu (nižší = dřív). */
  order: number
}

/* ---------- Mock data ---------- */
type RawFaq = {
  id: string
  question: ML
  answer: ML
  category: string
  published?: boolean
  publishedLangs?: LangCode[]
  order: number
}

const RAW: RawFaq[] = [
  {
    id: 'faq-tickets-online',
    question: ml('Musím si koupit vstupenku předem, nebo ji koupím na místě?', {
      en: 'Do I need to buy a ticket in advance, or can I buy it on site?',
    }),
    answer: ml(
      '<p>Vstupenky na běžnou prohlídku koupíte i na místě v pokladně. U oblíbených termínů a o víkendech ale doporučujeme <strong>rezervaci online</strong> — vyhnete se frontě a máte jistotu volného místa.</p>',
      { en: '<p>You can buy tickets on site at the box office. For popular time slots we recommend booking online in advance.</p>' },
    ),
    category: 'Vstupenky a rezervace',
    // Anglická mutace je vyplněná, ale zatím skrytá na webu (ukázka stavu „připraveno").
    publishedLangs: ['cs'],
    order: 1,
  },
  {
    id: 'faq-tickets-discount',
    question: ml('Na jaké slevy mám nárok?'),
    answer: ml(
      '<p>Zvýhodněné vstupné platí pro děti, studenty, seniory a držitele průkazu ZTP. Nabízíme také <strong>rodinné vstupné</strong>. Konkrétní ceny najdete u každé prohlídky.</p>',
    ),
    category: 'Vstupenky a rezervace',
    order: 2,
  },
  {
    id: 'faq-open-hours',
    question: ml('Jaká je otevírací doba areálu?', {
      en: 'What are the opening hours of the complex?',
    }),
    answer: ml(
      '<p>Areál je přístupný celoročně. Jednotlivé atraktivity mají vlastní otevírací dobu, která se liší podle sezóny — aktuální hodiny najdete u každého objektu.</p>',
    ),
    category: 'Otevírací doba',
    order: 1,
  },
  {
    id: 'faq-open-holidays',
    question: ml('Máte otevřeno o svátcích?'),
    answer: emptyML(),
    category: 'Otevírací doba',
    published: false,
    order: 2,
  },
  {
    id: 'faq-parking',
    question: ml('Kde mohu zaparkovat a kolik parkování stojí?', {
      en: 'Where can I park and how much does it cost?',
    }),
    answer: ml(
      '<p>K dispozici je velké návštěvnické parkoviště přímo u areálu. Parkování je pro návštěvníky <strong>zdarma</strong>. Autobusy a zájezdy prosíme o využití vyhrazených stání.</p>',
    ),
    category: 'Doprava a parkování',
    // Anglická mutace je vyplněná, ale skrytá na webu (ukázka stavu „připraveno").
    publishedLangs: ['cs'],
    order: 1,
  },
  {
    id: 'faq-public-transport',
    question: ml('Jak se k vám dostanu MHD?'),
    answer: ml(
      '<p>Areál je dostupný tramvají i autobusem — vystupte na zastávce v bezprostřední blízkosti hlavního vstupu. Spojení naplánujete přes běžné dopravní vyhledávače.</p>',
    ),
    category: 'Doprava a parkování',
    order: 2,
  },
  {
    id: 'faq-tour-length',
    question: ml('Jak dlouho prohlídka trvá a je vhodná pro děti?'),
    answer: ml(
      '<p>Většina prohlídek trvá 60–100 minut. Trasy jsou uzpůsobené i rodinám s dětmi; u náročnějších okruhů (např. do podzemí) uvádíme doporučený věk přímo u prohlídky.</p>',
    ),
    category: 'Prohlídky',
    order: 1,
  },
  {
    id: 'faq-tour-accessible',
    question: ml('Je areál bezbariérový?'),
    answer: ml(
      '<p>Většina objektů je bezbariérově přístupná. U konkrétních prohlídek uvádíme, zda je trasa vhodná pro návštěvníky s omezenou pohyblivostí — v případě dotazů nás kontaktujte předem.</p>',
    ),
    category: 'Služby a zázemí',
    order: 1,
  },
  {
    id: 'faq-dogs',
    question: ml('Můžu vzít do areálu psa?'),
    answer: ml(
      '<p>Do venkovních prostor areálu můžete se psem na vodítku. Do interiérů expozic a na komentované prohlídky bohužel vstup se zvířaty není možný (výjimkou jsou asistenční psi).</p>',
    ),
    category: 'Služby a zázemí',
    order: 2,
  },
]

export const MOCK_FAQ: FaqItem[] = RAW.map((r) => ({
  id: r.id,
  question: r.question,
  answer: r.answer,
  category: r.category,
  published: r.published ?? true,
  publishedLangs: r.publishedLangs,
  order: r.order,
}))

/* ---------- Stav zveřejnění (odznak) ---------- */
export type FaqState = 'published' | 'draft'
export const FAQ_STATE_META: Record<FaqState, { label: string; dot: string; text: string; bg: string }> = {
  published: { label: 'Zveřejněno', dot: 'bg-forge-500', text: 'text-forge-600', bg: 'bg-forge-500/10' },
  draft: { label: 'Koncept', dot: 'bg-steel-300', text: 'text-steel-500', bg: 'bg-steel-100' },
}
export function faqState(item: FaqItem): FaqState {
  return item.published ? 'published' : 'draft'
}

/* ---------- Prázdná entita ---------- */
export function blankFaqItem(): FaqItem {
  return {
    id: 'nový',
    question: emptyML(),
    answer: emptyML(),
    category: FAQ_CATEGORIES[0].label,
    published: false,
    // Nový dotaz: každá mutace půjde živě, jakmile dostane obsah.
    publishedLangs: LANGS.map((l) => l.code),
    order: MOCK_FAQ.length + 1,
  }
}
