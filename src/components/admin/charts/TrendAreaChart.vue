<script setup lang="ts">
/**
 * Vývoj jedné veličiny v čase (plošný graf s linkou).
 *
 * Jedna osa, jedna řada — druhá veličina se přepíná nad grafem, nikdy se
 * nekreslí na druhou osu. Hover i klávesnice ukazují stejné hodnoty.
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export interface TrendChartPoint {
  key: string
  /** Krátký popisek na osu X. */
  label: string
  /** Delší popisek do tooltipu. */
  full?: string
  value: number
}

const props = withDefaults(
  defineProps<{
    points: TrendChartPoint[]
    /** Barva řady (token grafové palety). */
    color?: string
    /** Název veličiny do tooltipu (např. „Vstupenky"). */
    seriesLabel?: string
    /** Formátování hodnot (osa + tooltip). */
    format?: (n: number) => string
    height?: number
  }>(),
  {
    color: 'var(--color-chart-1)',
    seriesLabel: 'Hodnota',
    format: (n: number) => Math.round(n).toLocaleString('cs-CZ'),
    height: 260,
  },
)

/* ---------- Rozměry (měřené, ne škálované viewBoxem — text zůstane ostrý) ---------- */
const wrap = ref<HTMLElement | null>(null)
const width = ref(760)
let ro: ResizeObserver | null = null
onMounted(() => {
  if (!wrap.value) return
  ro = new ResizeObserver(([entry]) => {
    width.value = Math.max(320, entry.contentRect.width)
  })
  ro.observe(wrap.value)
  width.value = Math.max(320, wrap.value.clientWidth)
})
onBeforeUnmount(() => ro?.disconnect())

const PAD = { top: 14, right: 18, bottom: 26 }
/** Levý okraj se odvozuje z nejdelšího popisku osy Y (např. „120 tis. Kč"),
    aby text nikdy nevylezl z plochy grafu. */
const padLeft = computed(() => {
  const longest = ticks.value.reduce((max, t) => Math.max(max, props.format(t).length), 1)
  return Math.min(110, Math.max(40, longest * 6.4 + 14))
})
const innerW = computed(() => Math.max(10, width.value - padLeft.value - PAD.right))
const innerH = computed(() => Math.max(10, props.height - PAD.top - PAD.bottom))

/* Osa Y: „hezký" krok, aby popisky byly kulatá čísla (0 / 25 / 50 …)
   a nad nejvyšší hodnotou zůstal jen malý vzduch. */
const NICE_STEPS = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
function niceStep(v: number): number {
  if (v <= 0) return 1
  const mag = Math.pow(10, Math.floor(Math.log10(v)))
  const norm = v / mag
  return (NICE_STEPS.find((c) => c >= norm) ?? 10) * mag
}
const TICK_COUNT = 4
const step = computed(() => niceStep((Math.max(...props.points.map((p) => p.value), 1) * 1.05) / TICK_COUNT))
const maxValue = computed(() => step.value * TICK_COUNT)
const ticks = computed(() => Array.from({ length: TICK_COUNT + 1 }, (_, i) => i * step.value))

function x(i: number): number {
  const n = props.points.length
  return padLeft.value + (n <= 1 ? innerW.value / 2 : (i / (n - 1)) * innerW.value)
}
function y(v: number): number {
  return PAD.top + innerH.value - (v / maxValue.value) * innerH.value
}

/* Křivka: monotónní kubická interpolace (Fritsch–Carlson) — linka je oblá,
   ale nikdy „nepřestřelí" pod nulu ani nad naměřenou hodnotu, takže graf
   pořád ukazuje skutečná čísla. */
function smoothPath(pts: [number, number][]): string {
  const n = pts.length
  if (n === 0) return ''
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`
  const dx: number[] = []
  const slope: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0]
    slope[i] = (pts[i + 1][1] - pts[i][1]) / (dx[i] || 1)
  }
  // Tečny v bodech: průměr sousedních sklonů, v lokálním extrému nula.
  const m: number[] = [slope[0]]
  for (let i = 1; i < n - 1; i++) m[i] = slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2
  m[n - 1] = slope[n - 2]
  // Omezení tečen, aby křivka zůstala monotónní mezi body.
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) {
      m[i] = 0
      m[i + 1] = 0
      continue
    }
    const a = m[i] / slope[i]
    const b = m[i + 1] / slope[i]
    const h = Math.hypot(a, b)
    if (h > 3) {
      m[i] = ((3 / h) * a) * slope[i]
      m[i + 1] = ((3 / h) * b) * slope[i]
    }
  }
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const third = dx[i] / 3
    const c1x = pts[i][0] + third
    const c1y = pts[i][1] + m[i] * third
    const c2x = pts[i + 1][0] - third
    const c2y = pts[i + 1][1] - m[i + 1] * third
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${pts[i + 1][0].toFixed(1)},${pts[i + 1][1].toFixed(1)}`
  }
  return d
}

const coords = computed<[number, number][]>(() => props.points.map((p, i) => [x(i), y(p.value)]))
const linePath = computed(() => smoothPath(coords.value))
const areaPath = computed(() => {
  if (props.points.length < 2) return ''
  const base = PAD.top + innerH.value
  const first = coords.value[0]
  const last = coords.value[coords.value.length - 1]
  return `${linePath.value} L${last[0].toFixed(1)},${base} L${first[0].toFixed(1)},${base} Z`
})

/** Popisky osy X se prořídí, aby se nepřekrývaly. */
const labelStep = computed(() => {
  const perLabel = 64
  return Math.max(1, Math.ceil(props.points.length / Math.max(1, Math.floor(innerW.value / perLabel))))
})
function showLabel(i: number): boolean {
  return i % labelStep.value === 0 || i === props.points.length - 1
}

/* ---------- Hover / klávesnice ---------- */
const active = ref<number | null>(null)
function onMove(e: PointerEvent) {
  const rect = (e.currentTarget as SVGElement).getBoundingClientRect()
  const px = e.clientX - rect.left
  const n = props.points.length
  if (n < 2) {
    active.value = n ? 0 : null
    return
  }
  const ratio = (px - padLeft.value) / innerW.value
  active.value = Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1))))
}
function onKey(e: KeyboardEvent) {
  const n = props.points.length
  if (!n) return
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    e.preventDefault()
    const dir = e.key === 'ArrowRight' ? 1 : -1
    active.value = Math.min(n - 1, Math.max(0, (active.value ?? n - 1) + dir))
  } else if (e.key === 'Escape') {
    active.value = null
  }
}
const activePoint = computed(() => (active.value === null ? null : props.points[active.value]))
/** Tooltip drží odstup od okrajů, aby nevylezl z karty. */
const tooltipStyle = computed(() => {
  if (active.value === null) return {}
  const px = x(active.value)
  const clamped = Math.min(Math.max(px, 90), width.value - 90)
  return { left: `${clamped}px`, top: `${Math.max(0, y(props.points[active.value].value) - 12)}px` }
})

const lastIndex = computed(() => props.points.length - 1)
</script>

<template>
  <div ref="wrap" class="relative w-full">
    <svg
      :width="width"
      :height="height"
      class="block w-full outline-none"
      tabindex="0"
      role="img"
      :aria-label="`${seriesLabel} v čase`"
      @pointermove="onMove"
      @pointerleave="active = null"
      @focus="active = lastIndex"
      @blur="active = null"
      @keydown="onKey"
    >
      <!-- Mřížka + osa Y (vlásková, plná, potlačená) -->
      <g>
        <template v-for="(t, i) in ticks" :key="`t-${i}`">
          <line :x1="padLeft" :x2="width - PAD.right" :y1="y(t)" :y2="y(t)" stroke="var(--color-steel-100)" stroke-width="1" />
          <text :x="padLeft - 10" :y="y(t) + 4" text-anchor="end" class="fill-steel-400 text-[10.5px] tabular-nums">{{ format(t) }}</text>
        </template>
      </g>

      <!-- Plocha + linka (oblá křivka) -->
      <path v-if="points.length > 1" :d="areaPath" :fill="color" opacity="0.1" />
      <path v-if="points.length > 1" :d="linePath" fill="none" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />

      <!-- Popisky osy X -->
      <g>
        <template v-for="(p, i) in points" :key="p.key">
          <text v-if="showLabel(i)" :x="x(i)" :y="height - 8" text-anchor="middle" class="fill-steel-400 text-[10.5px]">{{ p.label }}</text>
        </template>
      </g>

      <!-- Koncový bod s přímým popiskem (jediná přímo popsaná hodnota) -->
      <template v-if="points.length">
        <circle :cx="x(lastIndex)" :cy="y(points[lastIndex].value)" r="4.5" :fill="color" stroke="#fff" stroke-width="2" />
      </template>

      <!-- Zaměřovač (hairline) + aktivní bod -->
      <g v-if="active !== null && points.length">
        <line :x1="x(active)" :x2="x(active)" :y1="PAD.top" :y2="PAD.top + innerH" stroke="var(--color-steel-300)" stroke-width="1" />
        <circle :cx="x(active)" :cy="y(points[active].value)" r="5" :fill="color" stroke="#fff" stroke-width="2" />
      </g>
    </svg>

    <!-- Tooltip: hodnota vede, název řady je vedlejší -->
    <div
      v-if="activePoint"
      class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-steel-200 bg-white px-3 py-2 shadow-lg"
      :style="tooltipStyle"
    >
      <p class="font-display text-[15px] font-700 leading-none text-graphite-900 tabular-nums">{{ format(activePoint.value) }}</p>
      <p class="mt-1 flex items-center gap-1.5 whitespace-nowrap text-[11.5px] text-steel-500">
        <span class="inline-block h-0.5 w-3 rounded-full" :style="{ backgroundColor: color }" />
        {{ seriesLabel }} · {{ activePoint.full ?? activePoint.label }}
      </p>
    </div>
  </div>
</template>
