<script setup lang="ts">
/**
 * Sdílená časová osa akcí (Gantt) — jeden vizuál pro dashboard i modul
 * Kalendář akcí (princip 0b: jeden prvek = jedna komponenta).
 * Řádek = objekt v areálu, pruh = akce v čase; název je VŽDY uvnitř pruhu
 * (zalomí se max na 2 řádky, extrémně dlouhý se ořízne).
 * Krátké denní okno (výchozí 14 dní) → i jednodenní akce má čitelně široký pruh.
 * - Dashboard: pevné okno od dneška, jen náhled.
 * - Modul: `navigable` → posun po oknech (‹ Dnes ›).
 */
import { computed, ref } from 'vue'
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipPortal, TooltipContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import VenueSilhouette from '@/components/ui/VenueSilhouette.vue'
import { parseISO, sameDay } from '@/utils/calendar'
import { EVENTS_NOW, eventStatus, EVENT_STATE_META, type DovEvent } from '@/data/mockEvents'
import { MOCK_VENUES } from '@/data/mockVenues'

const props = withDefaults(
  defineProps<{
    events: DovEvent[]
    /** Délka okna ve dnech. */
    windowDays?: number
    /** Posun oknem (‹ Dnes ›). */
    navigable?: boolean
    /** Kompaktní režim (menší řádky/popisky). */
    compact?: boolean
    /** Vysvětlivka pod osou. */
    showHint?: boolean
  }>(),
  { windowDays: 14, navigable: false, compact: false, showHint: false },
)
const emit = defineEmits<{ select: [DovEvent] }>()

const DAY = 86_400_000
const WD = ['P', 'Ú', 'S', 'Č', 'P', 'S', 'N']
const now = EVENTS_NOW
const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
const offset = ref(0) // počet oken od dneška (jen navigable)

const labelW = computed(() => (props.compact ? 168 : 188))
const laneH = computed(() => (props.compact ? 48 : 54)) // výška dráhy (vejde se až 3řádkový název)

const win = computed(() => {
  const days = props.windowDays
  const startMs = todayStart + offset.value * days * DAY
  return { startMs, days, endMs: startMs + days * DAY }
})
const rangeLabel = computed(() => {
  const a = new Date(win.value.startMs).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })
  const b = new Date(win.value.startMs + (win.value.days - 1) * DAY).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
  return `${a} – ${b}`
})

/** Denní buňky osy (víkend / dnešek). */
const dayCells = computed(() =>
  Array.from({ length: win.value.days }, (_, i) => {
    const d = new Date(win.value.startMs + i * DAY)
    const wd = (d.getDay() + 6) % 7
    return { dayNum: d.getDate(), wd: WD[wd], isToday: sameDay(d, now), isWeekend: wd >= 5 }
  }),
)

interface Seg {
  item: DovEvent
  leftPct: number
  widthPct: number
  lane: number
  continuesLeft: boolean
  continuesRight: boolean
  status: ReturnType<typeof eventStatus>
  /** Pomocné: pozice začátku/konce ve dnech od začátku okna (řazení + dráhy). */
  _s: number
  _en: number
}
interface Row {
  id: string
  label: string
  color: string
  silhouette: string
  segs: Seg[]
  lanes: number
}

const rows = computed<Row[]>(() => {
  const { startMs, days, endMs } = win.value
  const out: Row[] = []
  for (const v of MOCK_VENUES) {
    const evs = props.events.filter(
      (e) => e.areaIds.includes(v.id) && parseISO(e.to).getTime() >= startMs && parseISO(e.from).getTime() <= endMs,
    )
    if (!evs.length) continue
    const segs: Seg[] = evs
      .map((e) => {
        const fromMs = parseISO(e.from).getTime()
        const toMs = parseISO(e.to).getTime() + (DAY - 1)
        const s = Math.max(0, (fromMs - startMs) / DAY)
        const en = Math.min(days, (toMs - startMs) / DAY)
        return {
          item: e,
          leftPct: (s / days) * 100,
          widthPct: Math.max(100 / days, ((en - s) / days) * 100),
          lane: 0,
          continuesLeft: fromMs < startMs,
          continuesRight: toMs > endMs,
          status: eventStatus(e, now),
          _en: en,
          _s: s,
        }
      })
      .sort((a, b) => a._s - b._s || b._en - a._en)
    // Dráhy jen podle časového překryvu (sousední akce v jiných dnech = stejná dráha).
    const laneEnd: number[] = []
    for (const seg of segs) {
      let lane = 0
      while (lane < laneEnd.length && laneEnd[lane] > seg._s + 0.001) lane++
      seg.lane = lane
      laneEnd[lane] = seg._en
    }
    out.push({ id: v.id, label: v.title.cs, color: v.color, silhouette: v.silhouette, segs, lanes: Math.max(1, laneEnd.length) })
  }
  return out
})

function fmtRange(e: DovEvent): string {
  const f = parseISO(e.from).toLocaleDateString('cs-CZ')
  return e.from === e.to ? f : `${f} – ${parseISO(e.to).toLocaleDateString('cs-CZ')}`
}
</script>

<template>
  <div>
    <!-- Navigace (jen navigable) — „Dnes" (transparentní) + rozmezí MEZI šipkami -->
    <div v-if="navigable" class="mb-4 flex items-center justify-end gap-2">
      <button
        class="h-9 rounded-md px-3 text-[13px] font-600 text-steel-500 transition-colors hover:bg-steel-100 hover:text-graphite-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-steel-500"
        :disabled="offset === 0"
        @click="offset = 0"
      >
        Dnes
      </button>
      <div class="flex items-center gap-1">
        <button class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-graphite-700 transition-colors hover:bg-steel-50" aria-label="Předchozí období" @click="offset--"><Icon name="chevronLeft" :size="16" /></button>
        <span class="min-w-[152px] text-center font-mono text-[12.5px] font-600 tabular-nums text-graphite-700">{{ rangeLabel }}</span>
        <button class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-graphite-700 transition-colors hover:bg-steel-50" aria-label="Následující období" @click="offset++"><Icon name="chevronRight" :size="16" /></button>
      </div>
    </div>

    <TooltipProvider :delay-duration="150" :disable-hoverable-content="true">
      <div class="overflow-x-auto rounded-xl border border-steel-200 bg-white shadow-sm">
        <div :style="{ minWidth: labelW + win.days * 44 + 'px' }">
          <!-- Hlavička dnů -->
          <div class="flex border-b border-steel-200 bg-steel-50/50">
            <div class="shrink-0 border-r border-steel-200 px-4 py-2 text-[11px] font-600 uppercase tracking-wide text-steel-400" :style="{ width: labelW + 'px' }">Místo</div>
            <div class="flex flex-1">
              <div
                v-for="(d, i) in dayCells"
                :key="i"
                class="flex-1 border-r border-steel-100 py-1.5 text-center last:border-0"
                :class="d.isToday ? 'bg-brand-50' : d.isWeekend ? 'bg-steel-100/60' : ''"
              >
                <div class="text-[9px] font-600 uppercase leading-none" :class="d.isWeekend ? 'text-steel-400' : 'text-steel-300'">{{ d.wd }}</div>
                <div class="mx-auto mt-1 grid h-5 w-5 place-items-center rounded-full text-[11.5px] font-500 tabular-nums" :class="d.isToday ? 'bg-brand-500 font-700 text-white' : d.isWeekend ? 'text-steel-400' : 'text-graphite-700'">{{ d.dayNum }}</div>
              </div>
            </div>
          </div>

          <!-- Řádky objektů -->
          <div v-for="row in rows" :key="row.id" class="flex border-b border-steel-100 last:border-0">
            <!-- Popisek objektu -->
            <div class="relative flex shrink-0 items-center gap-2.5 border-r border-steel-200 py-2.5 pl-4 pr-3" :style="{ width: labelW + 'px' }">
              <span class="absolute left-0 top-0 h-full w-[3px]" :style="{ backgroundColor: row.color }" />
              <VenueSilhouette :venue-id="row.silhouette" :color="row.color" :size="compact ? 20 : 24" class="shrink-0" />
              <span class="break-words text-[12.5px] font-600 leading-tight text-graphite-800">{{ row.label }}</span>
            </div>
            <!-- Dráhy s pruhy -->
            <div class="relative flex-1" :style="{ height: row.lanes * laneH + 6 + 'px' }">
              <!-- podklad: víkendy / dnešek -->
              <div class="pointer-events-none absolute inset-0 flex">
                <div v-for="(d, i) in dayCells" :key="'bg' + i" class="flex-1 border-r border-steel-100 last:border-0" :class="d.isToday ? 'bg-brand-50/60' : d.isWeekend ? 'bg-steel-50' : ''" />
              </div>
              <!-- pruhy -->
              <TooltipRoot v-for="(s, si) in row.segs" :key="si">
                <TooltipTrigger as-child>
                  <button
                    class="group absolute grid place-items-center overflow-hidden rounded-md px-1.5 text-center text-white shadow-sm outline-none transition-[filter] hover:brightness-95"
                    :class="s.status === 'upcoming' && 'opacity-90'"
                    :style="{
                      left: `calc(${s.leftPct}% + 2px)`,
                      width: `calc(${s.widthPct}% - 4px)`,
                      top: s.lane * laneH + 3 + 'px',
                      height: laneH - 6 + 'px',
                      backgroundColor: row.color,
                    }"
                    @click="emit('select', s.item)"
                  >
                    <span class="line-clamp-3 text-[11px] font-600 leading-[1.2]">{{ s.item.title.cs }}</span>
                    <span v-if="s.continuesLeft" class="absolute left-0.5 top-1/2 -translate-y-1/2 text-[10px] text-white/70">‹</span>
                    <span v-if="s.continuesRight" class="absolute right-0.5 top-1/2 -translate-y-1/2 text-[10px] text-white/70">›</span>
                    <span v-if="s.status === 'ongoing'" class="absolute right-1 top-1 h-1.5 w-1.5 animate-pulse rounded-full bg-white/90" />
                  </button>
                </TooltipTrigger>
                <TooltipPortal>
                  <TooltipContent side="top" :side-offset="6" class="z-50 max-w-[250px] rounded-lg bg-graphite-900 px-3 py-2 shadow-xl">
                    <div class="text-[12.5px] font-700 leading-snug text-white">{{ s.item.title.cs }}</div>
                    <div class="mt-1 flex items-center gap-1.5 text-[11px] text-white/75">
                      <span class="h-2 w-2 rounded-sm" :style="{ backgroundColor: row.color }" />
                      {{ row.label }} · {{ fmtRange(s.item) }}
                    </div>
                    <div class="mt-0.5 flex items-center gap-1.5 text-[11px]">
                      <span class="rounded px-1.5 py-0.5 font-600" :class="[EVENT_STATE_META[s.status].bg, EVENT_STATE_META[s.status].text]">{{ EVENT_STATE_META[s.status].label }}</span>
                      <span class="text-white/45">{{ s.item.type }}</span>
                    </div>
                  </TooltipContent>
                </TooltipPortal>
              </TooltipRoot>
            </div>
          </div>

          <!-- Prázdný stav -->
          <div v-if="!rows.length" class="px-5 py-10 text-center text-[13px] text-steel-500">
            V tomto období nejsou žádné akce.
          </div>
        </div>
      </div>
    </TooltipProvider>

    <p v-if="showHint" class="mt-3 flex items-center gap-1.5 text-[12px] text-steel-500">
      <Icon name="calendar" :size="13" class="text-steel-400" />
      Řádek = místo (objekt v areálu), pruh = akce v čase. Souběžné akce na jednom místě jsou nad sebou.
    </p>
  </div>
</template>
