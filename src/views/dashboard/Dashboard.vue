<script setup lang="ts">
import { computed, reactive, ref, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { MOCK_NEWS, publishState } from '@/data/mockNews'
import { MOCK_POPUPS, popupState } from '@/data/mockPopups'
import { MOCK_FAQ } from '@/data/mockFaq'
import {
  VISITS_SPARK,
  VISITS_TODAY,
  VISITS_TREND,
  ACTIVITY,
  SCHEDULED,
} from '@/data/mockDashboard'

const router = useRouter()

/* ============================================================
   KPI dlaždice — počítané z reálných mock dat modulů.
   ============================================================ */
const newsPublished = computed(() => MOCK_NEWS.filter((n) => publishState(n) === 'active').length)
const popupsActive = computed(() => MOCK_POPUPS.filter((p) => popupState(p) === 'active').length)
const faqPublished = computed(() => MOCK_FAQ.filter((f) => f.published).length)

const kpis = computed(() => [
  { key: 'visits', label: 'Návštěvy dnes', value: VISITS_TODAY.toLocaleString('cs-CZ'), trend: VISITS_TREND, icon: 'dashboard', accentBg: 'bg-brand-50', accentText: 'text-brand-600', spark: true },
  { key: 'news', label: 'Publikované aktuality', value: String(newsPublished.value), sub: `z ${MOCK_NEWS.length} celkem`, icon: 'news', accentBg: 'bg-forge-500/10', accentText: 'text-forge-600' },
  { key: 'popups', label: 'Aktivní pop-up okna', value: String(popupsActive.value), sub: `z ${MOCK_POPUPS.length} celkem`, icon: 'popup', accentBg: 'bg-amber-500/10', accentText: 'text-amber-600' },
  { key: 'faq', label: 'Dotazy ve FAQ', value: String(MOCK_FAQ.length), sub: `${faqPublished.value} zveřejněných`, icon: 'faq', accentBg: 'bg-steel-100', accentText: 'text-graphite-700' },
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

/* Rychlé akce (zkratky do editorů modulů). */
const quickActions = [
  { label: 'Nová aktualita', icon: 'news', route: 'news-new' },
  { label: 'Nový pop-up', icon: 'popup', route: 'popup-new-canvas' },
  { label: 'Nový dotaz FAQ', icon: 'faq', route: 'faq-new' },
  { label: 'Nová galerie', icon: 'gallery', route: 'gallery-new' },
  { label: 'Nová prohlídka', icon: 'ticket', route: 'tour-new' },
  { label: 'Nová akce', icon: 'calendar', route: 'event-new' },
]
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

    <!-- ============ KPI dlaždice ============ -->
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
          <div>
            <p class="font-display text-[30px] font-800 leading-none text-graphite-900 tabular-nums">{{ k.value }}</p>
            <p v-if="k.sub" class="mt-1.5 text-[11.5px] text-steel-400">{{ k.sub }}</p>
            <p v-else-if="k.trend !== undefined" class="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-600 text-forge-600">
              ▲ {{ k.trend }} % <span class="font-400 text-steel-400">vs. minulý týden</span>
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

    <!-- ============ Dvousloupcový obsah ============ -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <!-- Poslední aktivita -->
      <div class="rounded-xl border border-steel-200 bg-white">
        <div class="flex items-center justify-between border-b border-steel-100 px-5 py-3.5">
          <h2 class="flex items-center gap-2 font-display text-[15px] font-700 text-graphite-900"><Icon name="clock" :size="17" class="text-steel-400" /> Poslední aktivita</h2>
          <span class="font-mono text-[11px] text-steel-400">{{ ACTIVITY.length }}</span>
        </div>
        <ul>
          <li v-for="a in ACTIVITY" :key="a.id" class="flex items-center gap-3 border-b border-steel-50 px-5 py-3 last:border-0 hover:bg-steel-50/50">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg" :class="[a.bg, a.tint]"><Icon :name="a.icon" :size="17" /></span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-[13.5px] font-600 text-graphite-900">{{ a.title }}</p>
              <p class="text-[11.5px] text-steel-500"><span class="font-600 text-steel-600">{{ a.module }}</span> · {{ a.action }}</p>
            </div>
            <span class="shrink-0 font-mono text-[11px] text-steel-400">{{ a.time }}</span>
          </li>
        </ul>
      </div>

      <!-- Rail -->
      <aside class="space-y-6">
        <div class="rounded-xl border border-steel-200 bg-white p-4">
          <h2 class="mb-3 flex items-center gap-2 font-display text-[15px] font-700 text-graphite-900"><Icon name="plus" :size="16" class="text-steel-400" /> Rychlé akce</h2>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="q in quickActions"
              :key="q.route"
              class="flex items-center gap-2 rounded-lg border border-steel-200 px-3 py-2.5 text-left text-[12.5px] font-600 text-graphite-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              @click="router.push({ name: q.route })"
            >
              <Icon :name="q.icon" :size="16" class="shrink-0 text-brand-500" /> {{ q.label }}
            </button>
          </div>
        </div>

        <div class="rounded-xl border border-steel-200 bg-white p-4">
          <h2 class="mb-3 flex items-center gap-2 font-display text-[15px] font-700 text-graphite-900"><Icon name="calendar" :size="16" class="text-steel-400" /> Naplánováno</h2>
          <ul class="space-y-2.5">
            <li v-for="s in SCHEDULED" :key="s.id" class="flex items-start gap-2.5">
              <span class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-steel-100 text-steel-500"><Icon :name="s.icon" :size="14" /></span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-[13px] font-600 text-graphite-800">{{ s.title }}</p>
                <p class="mt-0.5 text-[11.5px]">
                  <span class="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-600" :class="s.kind === 'ending' ? 'bg-amber-500/10 text-amber-600' : 'bg-forge-500/10 text-forge-600'">
                    <span class="h-1.5 w-1.5 rounded-full" :class="s.kind === 'ending' ? 'bg-amber-500' : 'bg-forge-500'" />
                    {{ s.kind === 'ending' ? 'končí' : 'start' }} {{ s.date }}
                  </span>
                </p>
              </div>
            </li>
          </ul>
        </div>
      </aside>
    </div>

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
