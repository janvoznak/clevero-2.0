<script setup lang="ts">
import { computed, ref } from 'vue'
import { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipPortal, TooltipContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import VenueSilhouette from '@/components/ui/VenueSilhouette.vue'
import { shiftMonth, monthLabel, daysInMonth, parseISO, dayDiff, addDays, sameDay } from '@/utils/calendar'
import { EVENTS_NOW, VENUES, venue, type DovEvent } from '@/data/mockEvents'

function rangeLabel(e: DovEvent): string {
  const f = parseISO(e.from).toLocaleDateString('cs-CZ')
  return e.from === e.to ? f : `${f} – ${parseISO(e.to).toLocaleDateString('cs-CZ')}`
}

const props = defineProps<{ events: DovEvent[] }>()
const emit = defineEmits<{ select: [DovEvent] }>()

const offset = ref(0)
const cur = computed(() => shiftMonth(EVENTS_NOW.getFullYear(), EVENTS_NOW.getMonth(), offset.value))
const WD = ['P', 'Ú', 'S', 'Č', 'P', 'S', 'N']

interface Seg {
  item: DovEvent
  startCol: number
  span: number
  lane: number
  continuesLeft: boolean
  continuesRight: boolean
}
interface Row {
  venueId: string
  label: string
  color: string
  segs: Seg[]
  lanes: number
}

const model = computed(() => {
  const { y, m } = cur.value
  const n = daysInMonth(y, m)
  const monthStart = new Date(y, m, 1)
  const monthEnd = new Date(y, m, n)

  const dayHeaders = Array.from({ length: n }, (_, i) => {
    const d = addDays(monthStart, i)
    const wd = (d.getDay() + 6) % 7
    return { num: i + 1, wd: WD[wd], isToday: sameDay(d, EVENTS_NOW), isWeekend: wd >= 5 }
  })

  const rows: Row[] = []
  for (const v of VENUES) {
    const evs = props.events.filter(
      (e) => e.venueId === v.id && parseISO(e.to) >= monthStart && parseISO(e.from) <= monthEnd,
    )
    if (!evs.length) continue
    const segs: Seg[] = evs.map((e) => {
      const f = parseISO(e.from)
      const t = parseISO(e.to)
      const s = f < monthStart ? monthStart : f
      const en = t > monthEnd ? monthEnd : t
      const startCol = dayDiff(s, monthStart)
      return {
        item: e,
        startCol,
        span: dayDiff(en, monthStart) - startCol + 1,
        lane: 0,
        continuesLeft: f < monthStart,
        continuesRight: t > monthEnd,
      }
    })
    segs.sort((a, b) => a.startCol - b.startCol || b.span - a.span)
    const laneEnd: number[] = []
    for (const s of segs) {
      let lane = 0
      while (lane < laneEnd.length && laneEnd[lane] >= s.startCol) lane++
      s.lane = lane
      laneEnd[lane] = s.startCol + s.span - 1
    }
    rows.push({ venueId: v.id, label: v.label, color: v.color, segs, lanes: Math.max(1, laneEnd.length) })
  }
  return { label: monthLabel(y, m), n, dayHeaders, rows }
})
</script>

<template>
  <div>
    <!-- Navigace -->
    <div class="mb-4 flex items-center justify-between gap-3">
      <h3 class="font-display text-[17px] font-700 tracking-tight text-graphite-900">{{ model.label }}</h3>
      <div class="flex items-center gap-1.5">
        <button class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-graphite-700 outline-none transition-colors hover:bg-steel-50" aria-label="Předchozí měsíc" @click="offset--"><Icon name="chevronLeft" :size="16" /></button>
        <button class="h-9 rounded-md border border-steel-200 px-3.5 text-[13px] font-600 text-graphite-700 outline-none transition-colors hover:bg-steel-50 disabled:opacity-45 disabled:hover:bg-transparent" :disabled="offset === 0" @click="offset = 0">Dnes</button>
        <button class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-graphite-700 outline-none transition-colors hover:bg-steel-50" aria-label="Následující měsíc" @click="offset++"><Icon name="chevronRight" :size="16" /></button>
      </div>
    </div>

    <TooltipProvider :delay-duration="150" :disable-hoverable-content="true">
    <div class="overflow-x-auto rounded-xl border border-steel-200 bg-white shadow-sm">
      <div :style="{ minWidth: 176 + model.n * 30 + 'px' }">
        <!-- hlavička dnů -->
        <div class="flex border-b border-steel-200 bg-steel-50/50">
          <div class="w-44 shrink-0 border-r border-steel-200 px-4 py-2 text-[11px] font-600 uppercase tracking-wide text-steel-400">Budova</div>
          <div class="grid flex-1" :style="{ gridTemplateColumns: `repeat(${model.n}, minmax(0,1fr))` }">
            <div
              v-for="(d, i) in model.dayHeaders"
              :key="i"
              class="border-r border-steel-100 py-1.5 text-center last:border-0"
              :class="d.isToday ? 'bg-brand-50' : d.isWeekend ? 'bg-steel-100/60' : ''"
            >
              <div class="text-[9px] font-600 uppercase leading-none" :class="d.isWeekend ? 'text-steel-400' : 'text-steel-300'">{{ d.wd }}</div>
              <div class="mx-auto mt-1 grid h-5 w-5 place-items-center rounded-full text-[11.5px] font-500 tabular-nums" :class="d.isToday ? 'bg-brand-500 font-700 text-white' : d.isWeekend ? 'text-steel-400' : 'text-graphite-700'">{{ d.num }}</div>
            </div>
          </div>
        </div>

        <!-- řádky budov -->
        <div v-for="row in model.rows" :key="row.venueId" class="flex border-b border-steel-100 last:border-0">
          <div class="relative flex w-44 shrink-0 items-center gap-2.5 border-r border-steel-200 py-2.5 pl-4 pr-3">
            <span class="absolute left-0 top-0 h-full w-[3px]" :style="{ backgroundColor: row.color }" />
            <VenueSilhouette :venue-id="row.venueId" :color="row.color" :size="24" class="shrink-0" />
            <span class="truncate text-[13px] font-600 text-graphite-800">{{ row.label }}</span>
          </div>
          <div
            class="relative grid flex-1"
            :style="{ gridTemplateColumns: `repeat(${model.n}, minmax(0,1fr))`, gridAutoRows: '28px', rowGap: '3px', padding: '5px 0' }"
          >
            <!-- podklad: víkendy / dnešek / gridlines -->
            <div
              v-for="(d, i) in model.dayHeaders"
              :key="'bg' + i"
              class="border-r border-steel-100 last:border-0"
              :class="d.isToday ? 'bg-brand-50/70' : d.isWeekend ? 'bg-steel-50' : ''"
              :style="{ gridColumn: `${i + 1}`, gridRow: `1 / span ${row.lanes}` }"
            />
            <!-- pruhy událostí -->
            <TooltipRoot v-for="(s, si) in row.segs" :key="si">
              <TooltipTrigger as-child>
                <button
                  class="z-10 mx-0.5 flex items-center gap-1.5 overflow-hidden rounded-md text-left text-[11.5px] font-600 leading-none outline-none ring-1 ring-inset transition-[filter] hover:brightness-95"
                  :class="s.span > 1 ? 'justify-start px-2' : 'justify-center px-0'"
                  :style="{
                    gridColumn: `${s.startCol + 1} / span ${s.span}`,
                    gridRow: String(s.lane + 1),
                    backgroundColor: row.color + '1f',
                    boxShadow: `inset 3px 0 0 ${row.color}`,
                    '--tw-ring-color': row.color + '33',
                    color: row.color,
                  }"
                  @click="emit('select', s.item)"
                >
                  <template v-if="s.span > 1">
                    <span v-if="s.continuesLeft" class="opacity-60">‹</span>
                    <span class="truncate text-graphite-800">{{ s.item.title.cs }}</span>
                    <span v-if="s.continuesRight" class="ml-auto opacity-60">›</span>
                  </template>
                  <span v-else class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: row.color }" />
                </button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent
                  side="top"
                  :side-offset="6"
                  class="z-50 max-w-[250px] rounded-lg bg-graphite-900 px-3 py-2 shadow-xl"
                >
                  <div class="text-[12.5px] font-700 leading-snug text-white">{{ s.item.title.cs }}</div>
                  <div class="mt-1 flex items-center gap-1.5 text-[11px] text-white/75">
                    <span class="h-2 w-2 rounded-sm" :style="{ backgroundColor: row.color }" />
                    {{ row.label }} · {{ rangeLabel(s.item) }}<template v-if="s.item.time"> · {{ s.item.time }}</template>
                  </div>
                  <div class="mt-0.5 text-[11px] text-white/45">{{ s.item.type }}</div>
                </TooltipContent>
              </TooltipPortal>
            </TooltipRoot>
          </div>
        </div>
      </div>
    </div>
    </TooltipProvider>

    <p class="mt-3 flex items-center gap-1.5 text-[12px] text-steel-500">
      <Icon name="calendar" :size="13" class="text-steel-400" />
      Řádek = budova, pruh = akce v čase. Vícedenní akce se táhnou přes dny, souběžné akce v jedné budově jsou nad sebou.
    </p>
  </div>
</template>
