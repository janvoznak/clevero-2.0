<script setup lang="ts">
/**
 * Prstencový graf pro podíl na celku (max ~6 částí).
 * Prstenec nahoře, pod ním legenda s čísly a podíly (karta je rozdělená
 * vodorovně na dvě poloviny) — identita nikdy nestojí jen na barvě.
 * Střed nese celkové číslo, po najetí hodnotu vybrané části.
 */
import { computed, ref } from 'vue'

export interface DonutItem {
  key: string
  label: string
  value: number
  color: string
}

const props = withDefaults(
  defineProps<{
    items: DonutItem[]
    /** Popisek uprostřed prstence (co se sčítá). */
    centerLabel?: string
    format?: (n: number) => string
    /** Průměr prstence v px. */
    size?: number
  }>(),
  { centerLabel: 'Celkem', format: (n: number) => Math.round(n).toLocaleString('cs-CZ'), size: 196 },
)

const STROKE = 22
const GAP = 2 // mezera v barvě plochy mezi částmi (odděluje bez linky navíc)
const radius = computed(() => (props.size - STROKE) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const total = computed(() => props.items.reduce((s, i) => s + i.value, 0))

/** Segmenty prstence — dasharray + offset, mezera se ukrojí z délky části. */
const segments = computed(() => {
  let acc = 0
  return props.items.map((item) => {
    const frac = total.value ? item.value / total.value : 0
    const len = Math.max(0, frac * circumference.value - GAP)
    const seg = { ...item, len, offset: -acc * circumference.value }
    acc += frac
    return seg
  })
})

const active = ref<string | null>(null)
const activeItem = computed(() => props.items.find((i) => i.key === active.value) ?? null)
function share(v: number): string {
  return total.value ? `${((v / total.value) * 100).toFixed(1).replace('.', ',')} %` : '—'
}

/* ---------- Tooltip u kurzoru (hodnota vede, popis je vedlejší) ---------- */
const tip = ref<{ x: number; y: number } | null>(null)
function onSliceMove(key: string, e: PointerEvent) {
  const box = (e.currentTarget as SVGElement).ownerSVGElement?.getBoundingClientRect()
  if (!box) return
  active.value = key
  tip.value = { x: e.clientX - box.left, y: e.clientY - box.top }
}
function onSliceLeave() {
  active.value = null
  tip.value = null
}
/** U horní hrany se tooltip překlopí pod kurzor, aby ho karta neodřízla. */
const tipBelow = computed(() => !!tip.value && tip.value.y < 80)
/** Tooltip drží odstup od okrajů prstence, aby nevylezl z karty. */
const tipStyle = computed(() => {
  if (!tip.value) return {}
  const x = Math.min(Math.max(tip.value.x, 60), props.size - 60)
  return { left: `${x}px`, top: `${tip.value.y + (tipBelow.value ? 14 : -12)}px` }
})
</script>

<template>
  <div class="flex w-full flex-col items-center gap-4">
    <div class="relative shrink-0" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" role="img" :aria-label="centerLabel">
        <g :transform="`rotate(-90 ${size / 2} ${size / 2})`">
          <circle :cx="size / 2" :cy="size / 2" :r="radius" fill="none" stroke="var(--color-steel-100)" :stroke-width="STROKE" />
          <circle
            v-for="s in segments"
            :key="s.key"
            :cx="size / 2"
            :cy="size / 2"
            :r="radius"
            fill="none"
            :stroke="s.color"
            :stroke-width="active === s.key ? STROKE + 4 : STROKE"
            :stroke-dasharray="`${s.len} ${circumference - s.len}`"
            :stroke-dashoffset="s.offset"
            class="pointer-events-none transition-[stroke-width] duration-150"
          />
          <!-- Neviditelná širší dráha jen pro hover — trefit výseč je pak snadné.
               `pointer-events="stroke"` reaguje i na průhlednou linku. -->
          <circle
            v-for="s in segments"
            :key="`hit-${s.key}`"
            :cx="size / 2"
            :cy="size / 2"
            :r="radius"
            fill="none"
            stroke="transparent"
            :stroke-width="STROKE + 14"
            :stroke-dasharray="`${s.len} ${circumference - s.len}`"
            :stroke-dashoffset="s.offset"
            pointer-events="stroke"
            class="cursor-pointer"
            @pointermove="onSliceMove(s.key, $event)"
            @pointerenter="onSliceMove(s.key, $event)"
            @pointerleave="onSliceLeave"
          />
        </g>
      </svg>

      <!-- Tooltip výseče -->
      <div
        v-if="tip && activeItem"
        class="pointer-events-none absolute z-20 -translate-x-1/2 whitespace-nowrap rounded-lg border border-steel-200 bg-white px-3 py-2 shadow-lg"
        :class="tipBelow ? '' : '-translate-y-full'"
        :style="tipStyle"
      >
        <p class="font-display text-[16px] font-700 leading-none text-graphite-900 tabular-nums">{{ format(activeItem.value) }}</p>
        <p class="mt-1 flex items-center gap-1.5 text-[11.5px] text-steel-500">
          <span class="inline-block h-2 w-2 shrink-0 rounded-[2px]" :style="{ backgroundColor: activeItem.color }" />
          {{ activeItem.label }} · {{ share(activeItem.value) }}
        </p>
        <p class="mt-0.5 text-[11px] text-steel-400">z celkových {{ format(total) }}</p>
      </div>
      <!-- Střed: celek, po najetí hodnota vybrané části -->
      <div class="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div>
          <p class="font-display text-[22px] font-800 leading-none text-graphite-900">
            {{ format(activeItem ? activeItem.value : total) }}
          </p>
          <p class="mt-1 max-w-[110px] truncate text-[11px] text-steel-500">
            {{ activeItem ? activeItem.label : centerLabel }}
          </p>
        </div>
      </div>
    </div>

    <!-- Legenda (vždy) — swatch + název + hodnota + podíl -->
    <ul class="w-full max-w-[420px] space-y-1">
      <li
        v-for="item in items"
        :key="item.key"
        class="flex items-center gap-2 rounded-md px-1.5 py-1 outline-none transition-colors hover:bg-steel-50 focus:bg-steel-50"
        tabindex="0"
        @pointerenter="active = item.key"
        @pointerleave="active = null"
        @focus="active = item.key"
        @blur="active = null"
      >
        <span class="h-2.5 w-2.5 shrink-0 rounded-[2px]" :style="{ backgroundColor: item.color }" />
        <span class="min-w-0 flex-1 truncate text-[13px] text-graphite-800">
          <slot name="label" :item="item">{{ item.label }}</slot>
        </span>
        <span class="shrink-0 text-[13px] font-700 text-graphite-900 tabular-nums">{{ format(item.value) }}</span>
        <span class="w-14 shrink-0 text-right text-[12px] text-steel-500 tabular-nums">{{ share(item.value) }}</span>
      </li>
    </ul>
  </div>
</template>
