<script setup lang="ts">
import { computed, reactive, ref, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import {
  VISITS_SPARK,
  VISITS_TODAY,
  VISITS_TREND,
  TICKETS_WEEK,
  TICKETS_TREND,
  ESHOP_PRODUCTS_WEEK,
  ESHOP_PRODUCTS_TREND,
  REVENUE_WEEK,
  REVENUE_TREND,
  RECENT,
  ATTENTION,
  ATTENTION_SEVERITY,
  type AttentionItem,
} from '@/data/mockDashboard'
import { MOCK_EVENTS, eventStatus, EVENTS_NOW } from '@/data/mockEvents'
import EventTimeline from '@/components/admin/calendar/EventTimeline.vue'

const router = useRouter()

/* ============================================================
   KPI dlaždice — provozní metriky (návštěvnost, vstupenky, e-shop).
   ============================================================ */
const kpis = computed(() => [
  { key: 'visits', label: 'Návštěvy dnes', value: VISITS_TODAY.toLocaleString('cs-CZ'), trend: VISITS_TREND, icon: 'dashboard', accentBg: 'bg-brand-50', accentText: 'text-brand-600', spark: true },
  { key: 'tickets', label: 'Prodané vstupenky', value: TICKETS_WEEK.toLocaleString('cs-CZ'), trend: TICKETS_TREND, sub: 'tento týden', icon: 'ticket', accentBg: 'bg-forge-500/10', accentText: 'text-forge-600' },
  { key: 'eshop', label: 'Prodané produkty', value: ESHOP_PRODUCTS_WEEK.toLocaleString('cs-CZ'), trend: ESHOP_PRODUCTS_TREND, sub: 'e-shop · tento týden', icon: 'box', accentBg: 'bg-amber-500/10', accentText: 'text-amber-600' },
  { key: 'revenue', label: 'Tržby', value: `${REVENUE_WEEK.toLocaleString('cs-CZ')} Kč`, trend: REVENUE_TREND, sub: 'e-shop + vstupenky · 7 dní', icon: 'grant', accentBg: 'bg-steel-100', accentText: 'text-graphite-700' },
])

/* Sparkline (inline SVG — prototyp, statická vizualizace návštěv za 7 dní). */
const sparkGeom = computed(() => {
  const min = Math.min(...VISITS_SPARK)
  const max = Math.max(...VISITS_SPARK)
  const span = max - min || 1
  const pts = VISITS_SPARK.map((v, i) => {
    const x = (i / (VISITS_SPARK.length - 1)) * 100
    const y = 30 - ((v - min) / span) * 24
    return [Number(x.toFixed(1)), Number(y.toFixed(1))] as const
  })
  const line = pts.map((p) => p.join(',')).join(' ')
  const area = `0,32 ${line} 100,32`
  return { line, area, last: pts.at(-1)! }
})

/* ============================================================
   AI agent — otevírá se tlačítkem jako fokusovaný dialog.
   Prototyp: žádná reálná AI. Podle klíčových slov „rozpozná záměr"
   a připraví koncept (např. pop-up okno) + odkaz do editoru.
   ============================================================ */
interface AgentAction {
  icon: string
  module: string
  title: string
  desc: string
  route: string
  params?: Record<string, string>
  popup?: { title: string; text: string; cta: string }
}
interface AgentMessage {
  id: number
  role: 'user' | 'agent'
  text: string
  action?: AgentAction
}

const agentOpen = ref(false)
const messages = reactive<AgentMessage[]>([])
const input = ref('')
const thinking = ref(false)
let seq = 0

const suggestions = [
  { label: 'Pop-up okno', icon: 'popup', prompt: 'Vytvoř pop-up okno k letní slevě 20 % na Bolt Tower' },
  { label: 'Aktualitu', icon: 'news', prompt: 'Napiš aktualitu o zahájení letní sezóny' },
  { label: 'Dotaz do FAQ', icon: 'faq', prompt: 'Přidej do FAQ dotaz o parkování v areálu' },
  { label: 'Prohlídku', icon: 'ticket', prompt: 'Založ novou prohlídku dolu Hlubina' },
]

const STOPWORDS = new Set([
  'vytvoř', 'vytvor', 'založ', 'zaloz', 'připrav', 'priprav', 'udělej', 'udelej', 'vygeneruj',
  'napiš', 'napis', 'přidej', 'pridej', 'nový', 'nova', 'nové', 'novou', 'mi', 'nám', 'nam',
  'prosím', 'prosim', 'popup', 'pop-up', 'okno', 'vyskakovací', 'vyskakovaci',
  'aktualitu', 'aktualita', 'aktualitě', 'dotaz', 'faq', 'prohlídku', 'prohlidku', 'prohlídka',
  'galerii', 'galerie', 'událost', 'udalost', 'akci', 'akce',
  'o', 'k', 'ke', 'na', 'pro', 'do', 'se', 's', 'v', 've', 'a',
])
function topicOf(q: string): string {
  return q
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w.toLowerCase().replace(/[.,!?]$/, '')))
    .join(' ')
    .trim()
}
function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}

function resolve(q: string): { reply: string; action: AgentAction } {
  const label = cap(topicOf(q)) || 'Novinka v Dolních Vítkovicích'
  if (/pop.?up|vyskakov|okno|banner/i.test(q)) {
    return {
      reply: 'Rozumím. Připravil jsem koncept pop-up okna podle zadání — zkontrolujte texty a otevřete v editoru.',
      action: {
        icon: 'popup', module: 'Pop-up', title: label, route: 'popup-new-canvas',
        desc: 'Návrh vyskakovacího okna s nadpisem, textem a tlačítkem. V editoru Plátno doladíte vzhled i cílení.',
        popup: { title: label, text: 'Nenechte si ujít naši nabídku — platí po omezenou dobu.', cta: 'Zjistit víc' },
      },
    }
  }
  if (/aktualit|novink|článek|clanek|příspěv|prispev/i.test(q)) {
    return { reply: 'Připravil jsem koncept aktuality — nadpis a perex jsou předvyplněné, text i překlady doladíte v editoru.', action: { icon: 'news', module: 'Aktuality', title: label, route: 'news-new', desc: 'Koncept aktuality s nadpisem a perexem. V editoru přidáte text, fotogalerii a nastavíte publikaci.' } }
  }
  if (/faq|dotaz|otázk|otazk|nejčast|nejcast/i.test(q)) {
    return { reply: 'Připravil jsem nový dotaz do FAQ. Koncept odpovědi můžete nechat dogenerovat přímo v editoru dotazu.', action: { icon: 'faq', module: 'FAQ', title: label, route: 'faq-new', desc: 'Nový dotaz do znalostní báze. V editoru navrhne AI i koncept odpovědi z otázky.' } }
  }
  if (/prohlídk|prohlidk|vstupenk|okruh|tour/i.test(q)) {
    return { reply: 'Založil jsem koncept prohlídky. Doplňte popis, ceník a napojení na Colosseum v editoru.', action: { icon: 'ticket', module: 'Prohlídky', title: label, route: 'tour-new', desc: 'Koncept prohlídky s názvem a zařazením. Termíny a vstupenky se tahají z Colossea.' } }
  }
  if (/galeri|fotk|fotogaleri|album|snímk|snimk/i.test(q)) {
    return { reply: 'Připravil jsem novou galerii. Fotky nahrajete a seřadíte přímo v editoru.', action: { icon: 'gallery', module: 'Galerie', title: label, route: 'gallery-new', desc: 'Nové album fotografií. V editoru nahrajete fotky, vyberete hlavní a zařadíte do sekce.' } }
  }
  if (/událost|udalost|akce|koncert|festival|program/i.test(q)) {
    return { reply: 'Přidal jsem koncept akce do kalendáře. Termín, místo a program doplníte v editoru.', action: { icon: 'calendar', module: 'Kalendář akcí', title: label, route: 'event-new', desc: 'Koncept akce v kalendáři. V editoru nastavíte termín, místo konání a související prohlídky.' } }
  }
  return { reply: 'Nejsem si jistý, který obsah chcete vytvořit — připravil jsem koncept aktuality. Nebo zkuste některý z návrhů.', action: { icon: 'news', module: 'Aktuality', title: label, route: 'news-new', desc: 'Obecný koncept obsahu. V editoru upřesníte typ a doplníte detaily.' } }
}

const scroller = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)

function submit() {
  const q = input.value.trim()
  if (!q || thinking.value) return
  messages.push({ id: ++seq, role: 'user', text: q })
  input.value = ''
  thinking.value = true
  nextTick(() => scroller.value?.scrollTo({ top: scroller.value.scrollHeight }))
  window.setTimeout(() => {
    const { reply, action } = resolve(q)
    messages.push({ id: ++seq, role: 'agent', text: reply, action })
    thinking.value = false
    nextTick(() => scroller.value?.scrollTo({ top: scroller.value!.scrollHeight, behavior: 'smooth' }))
  }, 1300)
}
function openAgent(prompt?: string) {
  agentOpen.value = true
  if (prompt) nextTick(() => { input.value = prompt; submit() })
}
watch(agentOpen, (v) => { if (v) nextTick(() => inputEl.value?.focus()) })
function openAction(a: AgentAction) {
  agentOpen.value = false
  router.push({ name: a.route, params: a.params })
}
function dismiss(m: AgentMessage) {
  m.action = undefined
}
function resetChat() {
  messages.splice(0, messages.length)
}

/* ============================================================
   „Vyžaduje pozornost" — akcentovaná sekce s podněty od AI.
   ============================================================ */
const attention = reactive<AttentionItem[]>([...ATTENTION])
const actionCount = computed(() => attention.filter((a) => a.severity === 'action').length)

/** Kompaktní seznam: defaultně jen několik, zbytek za „zobrazit vše". */
const ATTENTION_LIMIT = 4
const showAllAttention = ref(false)
const visibleAttention = computed(() =>
  showAllAttention.value ? attention : attention.slice(0, ATTENTION_LIMIT),
)
/** Rozbalená položka (detail + AI návrh + barometr). Jen jedna naráz. */
const expandedAttention = ref<string | null>(null)
function toggleAttention(id: string) {
  expandedAttention.value = expandedAttention.value === id ? null : id
}
function openAttention(a: AttentionItem) {
  router.push(a.to)
}
function hideAttention(a: AttentionItem) {
  const i = attention.findIndex((x) => x.id === a.id)
  if (i >= 0) attention.splice(i, 1)
}
function healthBar(s: number): string {
  return s < 50 ? 'bg-danger-500' : s < 80 ? 'bg-amber-500' : 'bg-forge-500'
}
function healthText(s: number): string {
  return s < 50 ? 'text-danger-600' : s < 80 ? 'text-amber-600' : 'text-forge-600'
}

/** Iniciály uživatele pro avatar v aktivitě. */
function initials(name: string): string {
  const clean = name.replace(/^Systém.*/i, 'S')
  return clean
    .split(/[\s·]+/)
    .filter(Boolean)
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/* ============================================================
   Kalendář akcí — timeline „co běží teď a co se blíží".
   Ganttovský přehled: řádek = akce, pruh = její trvání, svislice = dnes.
   Barva pruhu podle objektu (Areál), stav přes eventStatus.
   ============================================================ */
const CAL_DAYS = 14
const CAL_START_MS = new Date(EVENTS_NOW.getFullYear(), EVENTS_NOW.getMonth(), EVENTS_NOW.getDate()).getTime()
const CAL_END_MS = CAL_START_MS + CAL_DAYS * 86_400_000

/** Akce viditelné v okně kalendáře (pro počty v legendě). */
const calEvents = computed(() =>
  MOCK_EVENTS.filter((e) => {
    const from = new Date(e.from + 'T00:00:00').getTime()
    const to = new Date(e.to + 'T23:59:59').getTime()
    return to >= CAL_START_MS && from <= CAL_END_MS && eventStatus(e, EVENTS_NOW) !== 'past'
  }),
)
const ongoingCount = computed(() => calEvents.value.filter((e) => eventStatus(e, EVENTS_NOW) === 'ongoing').length)
const upcomingCount = computed(() => calEvents.value.filter((e) => eventStatus(e, EVENTS_NOW) === 'upcoming').length)
function openEvent(e: { id: string }) {
  router.push(`/admin/events/${e.id}`)
}

/* Rychlé akce (zkratky do editorů modulů). */
const quickActions = [
  { label: 'Nová aktualita', icon: 'news', route: 'news-new' },
  { label: 'Nový pop-up', icon: 'popup', route: 'popup-new-canvas' },
  { label: 'Nový dotaz FAQ', icon: 'faq', route: 'faq-new' },
  { label: 'Nová galerie', icon: 'gallery', route: 'gallery-new' },
  { label: 'Nová prohlídka', icon: 'ticket', route: 'tour-new' },
  { label: 'Nová akce', icon: 'calendar', route: 'event-new' },
]

/* ============================================================
   Widgety dashboardu — pořadí + drag&drop řazení (prototyp).
   Sekce s čísly je jeden widget. Přesun tažením za úchyt.
   ============================================================ */
const widgets = ref<string[]>(['attention', 'stats', 'calendar', 'recent', 'quick'])
const dragKey = ref<string | null>(null)
const overKey = ref<string | null>(null)
function onWidgetDragStart(key: string) {
  dragKey.value = key
}
function onWidgetDrop(target: string) {
  if (dragKey.value && dragKey.value !== target) {
    const arr = widgets.value.filter((k) => k !== dragKey.value)
    arr.splice(arr.indexOf(target), 0, dragKey.value)
    widgets.value = arr
  }
  dragKey.value = null
  overKey.value = null
}
function onWidgetDragEnd() {
  dragKey.value = null
  overKey.value = null
}
</script>

<template>
  <div class="space-y-6 px-8 py-6">
    <!-- Kontext (field-tag) -->
    <div class="flex items-center gap-2">
      <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">dashboard</span>
      <span class="font-mono text-[11px] text-steel-400">/admin/dashboard</span>
    </div>

    <!-- ============ HERO + spouštěč AI agenta (signature) ============ -->
    <section
      class="relative overflow-hidden rounded-2xl px-7 py-8 text-white shadow-lg sm:px-9 sm:py-10"
      style="background: linear-gradient(120deg, #7a331c 0%, #a34a29 44%, #d95e2e 100%)"
    >
      <!-- Dekorativní vrstvy (vodoznak + prstenec) -->
      <Icon name="sparkles" :size="260" class="pointer-events-none absolute -right-10 -top-16 text-white/10" />
      <span class="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full border border-white/10" />
      <span class="pointer-events-none absolute -bottom-32 right-6 h-64 w-64 rounded-full border border-white/10" />

      <div class="relative max-w-2xl">
        <p class="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/70">
          <span class="inline-block h-1.5 w-1.5 rounded-full bg-white/80" /> Vítejte zpět, Jane · Dolní Vítkovice
        </p>
        <h1 class="mt-3 font-display text-[32px] font-800 leading-[1.05] tracking-tight sm:text-[38px]">
          Co dnes vytvoříme?
        </h1>
        <p class="mt-2.5 max-w-xl text-[14.5px] leading-relaxed text-white/85">
          Řekněte asistentovi, co potřebujete — připraví pop-up okno, aktualitu, dotaz i prohlídku.
          Vy už jen zkontrolujete a zveřejníte.
        </p>

        <div class="mt-6 flex flex-wrap items-center gap-3">
          <button
            class="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[14px] font-700 text-brand-700 shadow-md transition-transform hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-4 focus-visible:ring-white/40"
            @click="openAgent()"
          >
            <Icon name="sparkles" :size="18" /> Spustit asistenta
          </button>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[12.5px] text-white/60">nebo rovnou:</span>
            <button
              v-for="s in suggestions"
              :key="s.label"
              class="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[12.5px] font-600 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
              @click="openAgent(s.prompt)"
            >
              <Icon :name="s.icon" :size="14" /> {{ s.label }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ Widgety dashboardu (drag&drop řazení přes úchyt) ============ -->
    <div class="flex flex-col gap-6">

    <!-- Widget: Vyžaduje pozornost -->
    <section
      v-if="attention.length"
      class="overflow-hidden rounded-2xl border border-amber-500/40 bg-white shadow-md ring-1 ring-amber-500/10 transition-[box-shadow,opacity]"
      :style="{ order: widgets.indexOf('attention') }"
      :class="[overKey === 'attention' && dragKey && dragKey !== 'attention' ? 'ring-2 ring-brand-400' : '', dragKey === 'attention' ? 'opacity-40' : '']"
      @dragenter.prevent="dragKey && (overKey = 'attention')"
      @dragover.prevent
      @drop="onWidgetDrop('attention')"
      @dragend="onWidgetDragEnd"
    >
      <header class="flex items-center gap-2.5 border-b border-amber-500/20 bg-amber-50/70 px-4 py-2.5">
        <button draggable="true" class="grid h-6 w-6 shrink-0 cursor-grab place-items-center rounded text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700 active:cursor-grabbing" aria-label="Přesunout widget" @dragstart="onWidgetDragStart('attention')" @click.stop><Icon name="grip" :size="15" /></button>
        <span class="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-amber-500/15 text-amber-600"><Icon name="bell" :size="15" /></span>
        <h2 class="font-display text-[14px] font-700 text-graphite-900">Vyžaduje pozornost</h2>
        <span class="flex items-center gap-1 font-mono text-[10.5px] text-steel-400"><Icon name="sparkles" :size="11" class="text-brand-500" /> AI</span>
        <span class="ml-auto flex items-center gap-2">
          <span v-if="actionCount" class="inline-flex items-center rounded-full bg-danger-500/10 px-2 py-0.5 text-[10.5px] font-700 text-danger-600">{{ actionCount }} nutné</span>
          <span class="font-mono text-[11px] text-steel-400">{{ attention.length }}</span>
        </span>
      </header>

      <ul class="divide-y divide-steel-100">
        <li v-for="a in visibleAttention" :key="a.id" class="border-l-[3px]" :class="ATTENTION_SEVERITY[a.severity].rail">
          <!-- Kompaktní řádek (celý je přepínač rozbalení) -->
          <div class="flex items-center gap-3 px-4 py-2.5">
            <button class="flex min-w-0 flex-1 items-center gap-3 text-left" @click="toggleAttention(a.id)">
              <span class="h-2 w-2 shrink-0 rounded-full" :class="ATTENTION_SEVERITY[a.severity].dot" />
              <Icon :name="a.icon" :size="16" class="shrink-0 text-steel-400" />
              <span class="truncate text-[13px] font-600 text-graphite-900">{{ a.title }}</span>
              <span class="hidden shrink-0 font-mono text-[10px] uppercase tracking-wide text-steel-400 md:inline">{{ a.source }}</span>
            </button>
            <AppButton variant="primary" size="sm" @click="openAttention(a)">{{ a.actionLabel }}</AppButton>
            <button
              class="grid h-7 w-7 shrink-0 place-items-center rounded-md text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700"
              :aria-label="expandedAttention === a.id ? 'Sbalit' : 'Rozbalit'"
              @click="toggleAttention(a.id)"
            >
              <Icon name="chevronDown" :size="16" class="transition-transform" :class="expandedAttention === a.id && 'rotate-180'" />
            </button>
          </div>

          <!-- Detail (rozbalený): popis + barometr + AI návrh -->
          <Transition
            enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 -translate-y-1"
            leave-active-class="transition duration-100 ease-in" leave-to-class="opacity-0"
          >
            <div v-show="expandedAttention === a.id" class="px-4 pb-3.5 pl-[38px]">
              <p class="text-[12.5px] leading-relaxed text-steel-500">{{ a.detail }}</p>

              <div v-if="a.health" class="mt-2 max-w-sm">
                <div class="flex items-center justify-between text-[11px]">
                  <span class="text-steel-500">Připravenost k publikaci</span>
                  <span class="font-mono font-700" :class="healthText(a.health.score)">{{ a.health.score }} %</span>
                </div>
                <div class="mt-1 h-2 overflow-hidden rounded-full bg-steel-100">
                  <div class="h-full rounded-full transition-all" :class="healthBar(a.health.score)" :style="{ width: a.health.score + '%' }" />
                </div>
                <div class="mt-2 flex flex-wrap items-center gap-1.5">
                  <span class="text-[11px] text-steel-500">Chybí:</span>
                  <span v-for="m in a.health.missing" :key="m" class="inline-flex items-center gap-1 rounded bg-steel-100 px-1.5 py-0.5 text-[10.5px] text-steel-600">
                    <Icon name="x" :size="10" class="text-danger-500" /> {{ m }}
                  </span>
                </div>
              </div>

              <div class="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                <p class="inline-flex items-start gap-1.5 rounded-md bg-brand-50 px-2.5 py-1.5 text-[12px] leading-relaxed text-graphite-700">
                  <Icon name="sparkles" :size="14" class="mt-0.5 shrink-0 text-brand-500" />
                  <span><span class="font-700 text-brand-700">AI návrh:</span> {{ a.ai }}</span>
                </p>
                <button class="text-[11.5px] font-500 text-steel-400 transition-colors hover:text-steel-600" @click="hideAttention(a)">Skrýt podnět</button>
              </div>
            </div>
          </Transition>
        </li>
      </ul>

      <!-- Přepínač zobrazení zbytku -->
      <button
        v-if="attention.length > ATTENTION_LIMIT"
        class="flex w-full items-center justify-center gap-1.5 border-t border-steel-100 py-2.5 text-[12.5px] font-600 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800"
        @click="showAllAttention = !showAllAttention"
      >
        <Icon :name="showAllAttention ? 'chevronLeft' : 'chevronDown'" :size="14" />
        {{ showAllAttention ? 'Zobrazit méně' : `Zobrazit vše (${attention.length})` }}
      </button>
    </section>

    <!-- Widget: Klíčová čísla (celý blok = jeden widget) -->
    <section
      class="transition-opacity"
      :style="{ order: widgets.indexOf('stats') }"
      :class="[overKey === 'stats' && dragKey && dragKey !== 'stats' ? 'rounded-2xl ring-2 ring-brand-400' : '', dragKey === 'stats' ? 'opacity-40' : '']"
      @dragenter.prevent="dragKey && (overKey = 'stats')"
      @dragover.prevent
      @drop="onWidgetDrop('stats')"
      @dragend="onWidgetDragEnd"
    >
      <div class="mb-3 flex items-center gap-2 px-1">
        <button draggable="true" class="grid h-6 w-6 shrink-0 cursor-grab place-items-center rounded text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700 active:cursor-grabbing" aria-label="Přesunout widget" @dragstart="onWidgetDragStart('stats')" @click.stop><Icon name="grip" :size="15" /></button>
        <Icon name="dashboard" :size="16" class="text-steel-400" />
        <h2 class="font-display text-[15px] font-700 text-graphite-900">Klíčová čísla</h2>
      </div>
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div
        v-for="k in kpis"
        :key="k.key"
        class="rounded-xl border border-steel-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div class="flex items-center justify-between">
          <span class="font-mono text-[10.5px] uppercase tracking-wider text-steel-500">{{ k.label }}</span>
          <span class="grid h-8 w-8 place-items-center rounded-lg" :class="[k.accentBg, k.accentText]"><Icon :name="k.icon" :size="16" /></span>
        </div>
        <div class="mt-3 flex items-end justify-between gap-2">
          <div class="min-w-0">
            <p class="font-display text-[28px] font-800 leading-none text-graphite-900 tabular-nums">{{ k.value }}</p>
            <p class="mt-1.5 flex items-center gap-1.5 text-[11.5px]">
              <span v-if="k.trend !== undefined" class="inline-flex items-center gap-0.5 font-600 text-forge-600">▲ {{ k.trend }} %</span>
              <span v-if="k.sub" class="truncate text-steel-400">{{ k.sub }}</span>
              <span v-else class="text-steel-400">vs. minulý týden</span>
            </p>
          </div>
          <svg v-if="k.spark" viewBox="0 0 100 32" class="h-10 w-24 shrink-0" preserveAspectRatio="none">
            <polygon :points="sparkGeom.area" fill="var(--color-brand-500)" opacity="0.10" />
            <polyline :points="sparkGeom.line" fill="none" stroke="var(--color-brand-500)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <circle :cx="sparkGeom.last[0]" :cy="sparkGeom.last[1]" r="2.6" fill="var(--color-brand-500)" />
          </svg>
        </div>
      </div>
      </div>
    </section>

    <!-- Widget: Kalendář akcí -->
    <section
      class="overflow-hidden rounded-2xl border border-steel-200 bg-white shadow-sm transition-[box-shadow,opacity]"
      :style="{ order: widgets.indexOf('calendar') }"
      :class="[overKey === 'calendar' && dragKey && dragKey !== 'calendar' ? 'ring-2 ring-brand-400' : '', dragKey === 'calendar' ? 'opacity-40' : '']"
      @dragenter.prevent="dragKey && (overKey = 'calendar')"
      @dragover.prevent
      @drop="onWidgetDrop('calendar')"
      @dragend="onWidgetDragEnd"
    >
      <header class="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-steel-100 px-5 py-3.5">
        <button draggable="true" class="grid h-6 w-6 shrink-0 cursor-grab place-items-center rounded text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700 active:cursor-grabbing" aria-label="Přesunout widget" @dragstart="onWidgetDragStart('calendar')" @click.stop><Icon name="grip" :size="15" /></button>
        <h2 class="flex items-center gap-2 font-display text-[15px] font-700 text-graphite-900"><Icon name="calendar" :size="17" class="text-steel-400" /> Kalendář akcí</h2>
        <div class="flex items-center gap-3 text-[11.5px] font-600">
          <span class="inline-flex items-center gap-1.5 text-forge-600"><span class="h-2 w-2 rounded-full bg-forge-500" /> {{ ongoingCount }} probíhá</span>
          <span class="inline-flex items-center gap-1.5 text-brand-600"><span class="h-2 w-2 rounded-full bg-brand-500" /> {{ upcomingCount }} se blíží</span>
        </div>
        <button class="ml-auto inline-flex items-center gap-1 text-[12.5px] font-600 text-steel-500 transition-colors hover:text-brand-600" @click="router.push({ name: 'events-list' })">
          Otevřít kalendář <Icon name="chevronRight" :size="14" />
        </button>
      </header>

      <div class="px-5 py-4">
        <EventTimeline :events="MOCK_EVENTS" :window-days="CAL_DAYS" compact @select="openEvent" />
      </div>
    </section>

    <!-- Widget: Naposledy vytvořeno (autor vlastní sloupec, plná šířka) -->
    <section
      class="overflow-hidden rounded-2xl border border-steel-200 bg-white shadow-sm transition-[box-shadow,opacity]"
      :style="{ order: widgets.indexOf('recent') }"
      :class="[overKey === 'recent' && dragKey && dragKey !== 'recent' ? 'ring-2 ring-brand-400' : '', dragKey === 'recent' ? 'opacity-40' : '']"
      @dragenter.prevent="dragKey && (overKey = 'recent')"
      @dragover.prevent
      @drop="onWidgetDrop('recent')"
      @dragend="onWidgetDragEnd"
    >
      <header class="flex items-center gap-2.5 border-b border-steel-100 px-5 py-3.5">
        <button draggable="true" class="grid h-6 w-6 shrink-0 cursor-grab place-items-center rounded text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700 active:cursor-grabbing" aria-label="Přesunout widget" @dragstart="onWidgetDragStart('recent')" @click.stop><Icon name="grip" :size="15" /></button>
        <h2 class="flex items-center gap-2 font-display text-[15px] font-700 text-graphite-900"><Icon name="clock" :size="17" class="text-steel-400" /> Naposledy vytvořeno</h2>
        <span class="ml-auto font-mono text-[11px] text-steel-400">{{ RECENT.length }}</span>
      </header>
      <!-- záhlaví sloupců -->
      <div class="hidden grid-cols-[minmax(0,1fr)_220px_150px_28px] gap-3 border-b border-steel-100 px-5 py-2 font-mono text-[10px] uppercase tracking-wide text-steel-400 sm:grid">
        <span>Obsah</span>
        <span>Autor</span>
        <span>Vytvořeno</span>
        <span></span>
      </div>
      <ul>
        <li v-for="r in RECENT" :key="r.id">
          <button class="group grid w-full grid-cols-[minmax(0,1fr)_220px_150px_28px] items-center gap-3 border-b border-steel-50 px-5 py-3 text-left transition-colors last:border-0 hover:bg-steel-50/60" @click="router.push(r.to)">
            <span class="flex min-w-0 items-center gap-3">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg" :class="[r.bg, r.tint]"><Icon :name="r.icon" :size="17" /></span>
              <span class="min-w-0">
                <span class="block truncate text-[13.5px] font-600 text-graphite-900 group-hover:text-brand-600">{{ r.title }}</span>
                <span class="block truncate text-[11.5px] font-600 text-steel-500">{{ r.module }}</span>
              </span>
            </span>
            <span class="flex min-w-0 items-center gap-2">
              <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-steel-200 text-[9px] font-700 text-steel-600">{{ initials(r.user) }}</span>
              <span class="truncate text-[12.5px] text-graphite-700">{{ r.user }}</span>
            </span>
            <span class="font-mono text-[11.5px] text-steel-400">{{ r.date }}</span>
            <Icon name="chevronRight" :size="15" class="justify-self-end text-steel-300 transition-colors group-hover:text-brand-500" />
          </button>
        </li>
      </ul>
    </section>

    <!-- Widget: Rychlé akce (úzký pás, dlaždice v řadě) -->
    <section
      class="rounded-2xl border border-steel-200 bg-white px-4 py-3 shadow-sm transition-[box-shadow,opacity]"
      :style="{ order: widgets.indexOf('quick') }"
      :class="[overKey === 'quick' && dragKey && dragKey !== 'quick' ? 'ring-2 ring-brand-400' : '', dragKey === 'quick' ? 'opacity-40' : '']"
      @dragenter.prevent="dragKey && (overKey = 'quick')"
      @dragover.prevent
      @drop="onWidgetDrop('quick')"
      @dragend="onWidgetDragEnd"
    >
      <div class="flex flex-wrap items-center gap-2">
        <button draggable="true" class="grid h-6 w-6 shrink-0 cursor-grab place-items-center rounded text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700 active:cursor-grabbing" aria-label="Přesunout widget" @dragstart="onWidgetDragStart('quick')" @click.stop><Icon name="grip" :size="15" /></button>
        <span class="mr-1 flex items-center gap-1.5 text-[13px] font-700 text-graphite-900"><Icon name="plus" :size="15" class="text-steel-400" /> Rychlé akce</span>
        <button
          v-for="q in quickActions"
          :key="q.route"
          class="inline-flex items-center gap-2 rounded-lg border border-steel-200 px-3 py-2 text-[12.5px] font-600 text-graphite-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          @click="router.push({ name: q.route })"
        >
          <Icon :name="q.icon" :size="16" class="shrink-0 text-brand-500" /> {{ q.label }}
        </button>
      </div>
    </section>

    </div>
    <!-- /widgety -->

    <!-- ============ AI agent — dialog (defaultně zavřený) ============ -->
    <DialogRoot v-model:open="agentOpen">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/50 backdrop-blur-[2px]" />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 flex max-h-[86vh] w-[660px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-steel-200 bg-white shadow-2xl"
        >
          <!-- Hlavička -->
          <div class="flex items-center gap-3 border-b border-steel-200 px-5 py-4">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-500 text-white shadow-sm"><Icon name="sparkles" :size="20" /></span>
            <div class="min-w-0 flex-1">
              <DialogTitle class="flex items-center gap-2 font-display text-[16px] font-700 text-graphite-900">
                AI asistent <span class="rounded bg-brand-50 px-1.5 py-0.5 font-mono text-[10px] text-brand-600">AGENT</span>
              </DialogTitle>
              <DialogDescription class="text-[12px] text-steel-500">Zadejte požadavek — připravím koncept obsahu k úpravě.</DialogDescription>
            </div>
            <button v-if="messages.length" class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-500 text-steel-500 transition-colors hover:bg-steel-100 hover:text-graphite-800" @click="resetChat">
              <Icon name="x" :size="14" /> Nová
            </button>
            <DialogClose class="grid h-8 w-8 place-items-center rounded-md text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-800"><Icon name="x" :size="18" /></DialogClose>
          </div>

          <!-- Tělo: prázdný stav nebo konverzace -->
          <div ref="scroller" class="flex-1 overflow-y-auto px-5 py-4">
            <!-- Prázdný stav -->
            <div v-if="!messages.length && !thinking" class="py-6 text-center">
              <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-500"><Icon name="sparkles" :size="28" /></span>
              <p class="mt-3 font-display text-[16px] font-700 text-graphite-900">Co mám připravit?</p>
              <p class="mx-auto mt-1 max-w-sm text-[13px] text-steel-500">Napište požadavek vlastními slovy, nebo si vyberte:</p>
              <div class="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  v-for="s in suggestions"
                  :key="s.label"
                  class="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-[12.5px] font-600 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
                  @click="openAgent(s.prompt)"
                >
                  <Icon :name="s.icon" :size="14" class="text-brand-500" /> {{ s.label }}
                </button>
              </div>
            </div>

            <!-- Konverzace -->
            <div v-else class="space-y-4">
              <template v-for="m in messages" :key="m.id">
                <div v-if="m.role === 'user'" class="flex justify-end">
                  <div class="max-w-[80%] rounded-2xl rounded-br-sm bg-graphite-900 px-3.5 py-2 text-[13px] text-white">{{ m.text }}</div>
                </div>
                <div v-else class="flex gap-2.5">
                  <span class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-500 text-white"><Icon name="sparkles" :size="14" /></span>
                  <div class="min-w-0 flex-1">
                    <div class="inline-block rounded-2xl rounded-tl-sm bg-steel-50 px-3.5 py-2 text-[13px] text-graphite-800">{{ m.text }}</div>
                    <div v-if="m.action" class="mt-2.5 rounded-xl border border-steel-200 bg-white p-3.5 shadow-sm">
                      <div class="flex items-center gap-2.5">
                        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon :name="m.action.icon" :size="18" /></span>
                        <div class="min-w-0">
                          <div class="flex items-center gap-2">
                            <span class="rounded bg-steel-100 px-1.5 py-0.5 font-mono text-[10px] text-steel-500">{{ m.action.module }}</span>
                            <span class="inline-flex items-center gap-1 text-[11px] font-600 text-forge-600"><Icon name="check" :size="12" /> koncept připraven</span>
                          </div>
                          <p class="mt-0.5 truncate text-[14px] font-700 text-graphite-900">{{ m.action.title }}</p>
                        </div>
                      </div>
                      <p class="mt-2 text-[12.5px] leading-relaxed text-steel-500">{{ m.action.desc }}</p>

                      <div v-if="m.action.popup" class="mt-3 rounded-lg border border-steel-200 bg-steel-50 p-4">
                        <p class="mb-2 flex items-center gap-1.5 field-tag"><Icon name="eye" :size="13" /> Náhled pop-up okna</p>
                        <div class="relative mx-auto max-w-[260px] rounded-xl border border-steel-200 bg-white p-4 text-center shadow-lg">
                          <span class="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-steel-100 text-steel-400"><Icon name="x" :size="12" /></span>
                          <p class="font-display text-[15px] font-700 text-graphite-900">{{ m.action.popup.title }}</p>
                          <p class="mt-1 text-[12px] leading-relaxed text-steel-600">{{ m.action.popup.text }}</p>
                          <span class="mt-3 inline-flex items-center rounded-md bg-brand-500 px-3.5 py-1.5 text-[12px] font-600 text-white">{{ m.action.popup.cta }}</span>
                        </div>
                      </div>

                      <div class="mt-3 flex items-center gap-2">
                        <AppButton variant="primary" size="sm" @click="openAction(m.action)"><Icon name="edit" :size="15" /> Otevřít v editoru</AppButton>
                        <AppButton variant="ghost" size="sm" @click="dismiss(m)">Zahodit</AppButton>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <!-- Přemýšlí -->
              <div v-if="thinking" class="flex gap-2.5">
                <span class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-500 text-white"><Icon name="sparkles" :size="14" class="animate-pulse" /></span>
                <div class="inline-flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-steel-50 px-3.5 py-2.5 text-[13px] text-steel-500">
                  <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400" style="animation-delay:0ms" />
                  <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400" style="animation-delay:150ms" />
                  <span class="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400" style="animation-delay:300ms" />
                  <span class="ml-1">Připravuji…</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Vstup -->
          <div class="border-t border-steel-200 bg-steel-50/60 px-5 py-4">
            <div class="flex items-center gap-2 rounded-xl border border-steel-200 bg-white px-3 py-2 shadow-sm focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10">
              <Icon name="sparkles" :size="17" class="shrink-0 text-brand-500" />
              <input
                ref="inputEl"
                v-model="input"
                type="text"
                placeholder="Např. „Vytvoř pop-up okno k letní slevě 20 % na Bolt Tower""
                class="h-8 min-w-0 flex-1 bg-transparent text-[14px] text-graphite-900 placeholder:text-steel-400 focus:outline-none"
                @keydown.enter.prevent="submit"
              />
              <AppButton variant="primary" size="sm" :disabled="!input.trim() || thinking" @click="submit">
                <Icon name="sparkles" :size="15" :class="thinking && 'animate-pulse'" />
                {{ thinking ? 'Pracuji…' : 'Odeslat' }}
              </AppButton>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
