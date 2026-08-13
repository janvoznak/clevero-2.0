<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
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
import { MOCK_VENUES, OPEN_STATE_META, type OpenState } from '@/data/mockVenues'
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

/* ============================================================
   Provoz budov — přehled otevřeno/zavřeno + hlídání kolize s akcí.
   Když v budově probíhá akce, která ji obsazuje (closesVenue), budova by
   měla být zavřená pro veřejnost; po skončení akce ji zase otevřít.
   Klient přepíná ručně — dashboard jen upozorní a nabídne akci na klik.
   ============================================================ */
interface VenueRow {
  id: string
  title: string
  openState: OpenState
  closureReason?: 'event' | 'maintenance'
  closureEventId?: string
}
const venues = reactive<VenueRow[]>(
  MOCK_VENUES.map((v) => ({
    id: v.id,
    title: v.title.cs,
    openState: v.openState,
    closureReason: v.closureReason,
    closureEventId: v.closureEventId,
  })),
)
/** Akce, která právě obsazuje budovu (probíhá a uzavírá ji pro veřejnost). */
function activeClosingEvent(venueId: string) {
  return MOCK_EVENTS.find((e) => e.areaId === venueId && e.closesVenue && eventStatus(e, EVENTS_NOW) === 'ongoing')
}
function eventById(id?: string) {
  return id ? MOCK_EVENTS.find((e) => e.id === id) : undefined
}
type VenueOpsKind = 'needs-close' | 'needs-reopen' | 'closed-event' | 'closed-other' | 'seasonal' | 'open'
interface VenueOps {
  v: VenueRow
  kind: VenueOpsKind
  eventTitle?: string
}
const venueOps = computed<VenueOps[]>(() =>
  venues.map((v) => {
    const closing = activeClosingEvent(v.id)
    // Otevřená budova s probíhající obsazující akcí → má se zavřít.
    if (v.openState !== 'closed' && closing) return { v, kind: 'needs-close', eventTitle: closing.title.cs }
    // Zavřená kvůli akci — po jejím skončení nabídnout otevřít.
    if (v.openState === 'closed' && v.closureReason === 'event') {
      const ev = eventById(v.closureEventId)
      const running = !!ev && eventStatus(ev, EVENTS_NOW) === 'ongoing'
      return running ? { v, kind: 'closed-event', eventTitle: ev?.title.cs } : { v, kind: 'needs-reopen', eventTitle: ev?.title.cs }
    }
    if (v.openState === 'closed') return { v, kind: 'closed-other' }
    if (v.openState === 'seasonal') return { v, kind: 'seasonal' }
    return { v, kind: 'open' }
  }),
)
const venueAlerts = computed(() => venueOps.value.filter((o) => o.kind === 'needs-close' || o.kind === 'needs-reopen'))
const venueRest = computed(() => venueOps.value.filter((o) => o.kind !== 'needs-close' && o.kind !== 'needs-reopen'))
/** Widget stav budovy NEPŘEPÍNÁ (nebezpečné na překlik) — jen upozorní a navede
    klienta do detailu budovy, kde provozní stav vědomě přepne. */
function goVenue(id: string) {
  router.push({ name: 'area-edit', params: { id } })
}

/* Rychlé akce (zkratky do editorů modulů). */
const quickActions = [
  { label: 'Nová aktualita', icon: 'news', route: 'news-new' },
  { label: 'Nový pop-up', icon: 'popup', route: 'popup-new' },
  { label: 'Nový dotaz FAQ', icon: 'faq', route: 'faq-new' },
  { label: 'Nová galerie', icon: 'gallery', route: 'gallery-new' },
  { label: 'Nová prohlídka', icon: 'ticket', route: 'tour-new' },
  { label: 'Nová akce', icon: 'calendar', route: 'event-new' },
]

/* ============================================================
   Widgety dashboardu — pořadí + drag&drop řazení (prototyp).
   Sekce s čísly je jeden widget. Přesun tažením za úchyt.
   ============================================================ */
const widgets = ref<string[]>(['attention', 'venues', 'stats', 'calendar', 'recent'])
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

    <!-- ============ Rychlé akce (hero — zkratky do editorů modulů) ============ -->
    <section
      class="relative overflow-hidden rounded-2xl px-7 py-8 text-white shadow-lg sm:px-9 sm:py-9"
      style="background: linear-gradient(120deg, #7a331c 0%, #a34a29 44%, #d95e2e 100%)"
    >
      <!-- Dekorativní vrstvy (vodoznak + prstenec) -->
      <Icon name="plus" :size="240" class="pointer-events-none absolute -right-8 -top-14 text-white/10" />
      <span class="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full border border-white/10" />
      <span class="pointer-events-none absolute -bottom-32 right-6 h-64 w-64 rounded-full border border-white/10" />

      <div class="relative">
        <p class="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/70">
          <span class="inline-block h-1.5 w-1.5 rounded-full bg-white/80" /> Vítejte zpět, Jane · Dolní Vítkovice
        </p>
        <h1 class="mt-3 flex items-center gap-2.5 font-display text-[30px] font-800 leading-[1.05] tracking-tight sm:text-[34px]">
          Rychlé akce
        </h1>
        <p class="mt-2 max-w-xl text-[14px] leading-relaxed text-white/85">
          Založte nový obsah jedním kliknutím — rovnou v editoru příslušného modulu.
        </p>

        <div class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <button
            v-for="q in quickActions"
            :key="q.route"
            class="group flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-3 text-left text-white ring-1 ring-white/15 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white hover:text-brand-700 hover:shadow-lg focus-visible:ring-4 focus-visible:ring-white/40"
            @click="router.push({ name: q.route })"
          >
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 text-white transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
              <Icon :name="q.icon" :size="18" />
            </span>
            <span class="min-w-0 text-[12.5px] font-700 leading-tight">{{ q.label }}</span>
          </button>
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
        <span class="flex items-center gap-1 font-mono text-[10.5px] text-steel-400"><Icon name="sparkles" :size="11" class="text-brand-500" /> DOVík</span>
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
                  <span><span class="font-700 text-brand-700">DOVík radí:</span> {{ a.ai }}</span>
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

    <!-- Widget: Provoz budov (otevřeno/zavřeno + kolize s akcemi) -->
    <section
      class="overflow-hidden rounded-2xl border border-steel-200 bg-white shadow-sm transition-[box-shadow,opacity]"
      :style="{ order: widgets.indexOf('venues') }"
      :class="[overKey === 'venues' && dragKey && dragKey !== 'venues' ? 'ring-2 ring-brand-400' : '', dragKey === 'venues' ? 'opacity-40' : '']"
      @dragenter.prevent="dragKey && (overKey = 'venues')"
      @dragover.prevent
      @drop="onWidgetDrop('venues')"
      @dragend="onWidgetDragEnd"
    >
      <header class="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-steel-100 px-5 py-3.5">
        <button draggable="true" class="grid h-6 w-6 shrink-0 cursor-grab place-items-center rounded text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-700 active:cursor-grabbing" aria-label="Přesunout widget" @dragstart="onWidgetDragStart('venues')" @click.stop><Icon name="grip" :size="15" /></button>
        <h2 class="flex items-center gap-2 font-display text-[15px] font-700 text-graphite-900"><Icon name="home" :size="17" class="text-steel-400" /> Provoz budov</h2>
        <span v-if="venueAlerts.length" class="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10.5px] font-700 text-amber-600">{{ venueAlerts.length }} vyžaduje akci</span>
        <button class="ml-auto inline-flex items-center gap-1 text-[12.5px] font-600 text-steel-500 transition-colors hover:text-brand-600" @click="router.push({ name: 'area-list' })">
          Otevřít Areál <Icon name="chevronRight" :size="14" />
        </button>
      </header>

      <!-- Upozornění: zavřít / otevřít -->
      <ul v-if="venueAlerts.length" class="divide-y divide-steel-100">
        <li
          v-for="o in venueAlerts"
          :key="o.v.id"
          class="flex flex-wrap items-center gap-3 px-5 py-3"
          :class="o.kind === 'needs-close' ? 'bg-amber-50/50' : 'bg-brand-50/40'"
        >
          <span
            class="grid h-8 w-8 shrink-0 place-items-center rounded-md"
            :class="o.kind === 'needs-close' ? 'bg-amber-500/15 text-amber-600' : 'bg-brand-500/15 text-brand-600'"
          >
            <Icon :name="o.kind === 'needs-close' ? 'bell' : 'check'" :size="16" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[13.5px] font-700 text-graphite-900">{{ o.v.title }}</p>
            <p class="text-[12px] leading-relaxed text-steel-500">
              <template v-if="o.kind === 'needs-close'">Probíhá akce „{{ o.eventTitle }}" — zavřete budovu pro veřejnost na webu.</template>
              <template v-else>Akce „{{ o.eventTitle }}" skončila — budovu je potřeba znovu otevřít pro veřejnost.</template>
            </p>
          </div>
          <AppButton variant="secondary" size="sm" @click="goVenue(o.v.id)">
            Přejít na budovu <Icon name="chevronRight" :size="14" />
          </AppButton>
        </li>
      </ul>
      <div v-else class="flex items-center gap-2 border-b border-steel-100 px-5 py-3 text-[12.5px] text-steel-500">
        <Icon name="check" :size="15" class="text-forge-500" /> Všechny budovy jsou ve správném stavu — žádná kolize s akcemi.
      </div>

      <!-- Přehled všech budov + stav -->
      <div class="grid grid-cols-1 gap-x-6 gap-y-0.5 px-5 py-3 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="o in venueRest"
          :key="o.v.id"
          type="button"
          class="group flex items-center gap-2 rounded border-b border-steel-50 py-1.5 text-left outline-none transition-colors last:border-0 hover:text-brand-600"
          @click="goVenue(o.v.id)"
        >
          <span class="h-2 w-2 shrink-0 rounded-full" :class="OPEN_STATE_META[o.v.openState].dot" />
          <span class="min-w-0 flex-1 truncate text-[12.5px] text-graphite-700 group-hover:text-brand-600">{{ o.v.title }}</span>
          <span class="shrink-0 text-[11px] font-600" :class="OPEN_STATE_META[o.v.openState].text">{{ OPEN_STATE_META[o.v.openState].label }}</span>
        </button>
      </div>
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

    </div>
    <!-- /widgety -->
  </div>
</template>
