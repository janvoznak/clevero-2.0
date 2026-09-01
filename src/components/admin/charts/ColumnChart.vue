<script setup lang="ts">
/**
 * Svislý sloupcový graf pro málo kategorií s pevným pořadím (dny v týdnu,
 * měsíce). Přímo popsaný je jen nejvyšší sloupec, ostatní hodnoty nese hover.
 */
import { computed, ref } from 'vue'

export interface ColumnItem {
  key: string
  label: string
  value: number
  /** Druhé číslo do tooltipu (např. tržba). */
  secondary?: number
}

const props = withDefaults(
  defineProps<{
    items: ColumnItem[]
    format?: (n: number) => string
    secondaryFormat?: (n: number) => string
    secondaryLabel?: string
    color?: string
    height?: number
  }>(),
  {
    format: (n: number) => Math.round(n).toLocaleString('cs-CZ'),
    secondaryFormat: (n: number) => Math.round(n).toLocaleString('cs-CZ'),
    secondaryLabel: 'Tržba',
    color: 'var(--color-chart-1)',
    height: 180,
  },
)

const max = computed(() => Math.max(...props.items.map((i) => i.value), 1))
const peakKey = computed(() => props.items.reduce((best, i) => (i.value > (best?.value ?? -1) ? i : best), props.items[0])?.key)
/** Výška v pixelech (procenta uvnitř flex sloupce nemají definitivní základ).
    Nad sloupci zůstává pruh na přímý popisek nejvyššího sloupce. */
const LABEL_BAND = 20
function heightOf(v: number): string {
  const usable = Math.max(10, props.height - LABEL_BAND)
  return `${Math.max(2, (v / max.value) * usable)}px`
}
const active = ref<string | null>(null)
</script>

<template>
  <div class="w-full">
    <div class="flex items-end justify-between gap-2" :style="{ height: `${height}px` }">
      <div
        v-for="item in items"
        :key="item.key"
        class="relative flex h-full min-w-0 flex-1 flex-col justify-end rounded-md outline-none transition-colors hover:bg-steel-50 focus:bg-steel-50"
        tabindex="0"
        @pointerenter="active = item.key"
        @pointerleave="active = null"
        @focus="active = item.key"
        @blur="active = null"
      >
        <!-- Přímý popisek jen u nejvyššího sloupce -->
        <p v-if="item.key === peakKey" class="mb-1 text-center text-[11px] font-700 text-graphite-800 tabular-nums">{{ format(item.value) }}</p>
        <div class="flex justify-center">
          <div
            class="w-full max-w-[24px] transition-[height] duration-300"
            :style="{ height: heightOf(item.value), backgroundColor: color, borderRadius: '4px 4px 2px 2px', opacity: active && active !== item.key ? 0.55 : 1 }"
          />
        </div>

        <!-- Tooltip -->
        <div
          v-if="active === item.key"
          class="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-steel-200 bg-white px-3 py-2 shadow-lg"
        >
          <p class="font-display text-[15px] font-700 leading-none text-graphite-900 tabular-nums">{{ format(item.value) }}</p>
          <p class="mt-1 flex items-center gap-1.5 text-[11.5px] text-steel-500">
            <span class="inline-block h-2 w-2 rounded-[2px]" :style="{ backgroundColor: color }" />
            {{ item.label }}
          </p>
          <p v-if="item.secondary !== undefined" class="mt-0.5 text-[11.5px] text-steel-500">
            {{ secondaryLabel }}: <span class="font-600 text-graphite-800 tabular-nums">{{ secondaryFormat(item.secondary) }}</span>
          </p>
        </div>
      </div>
    </div>
    <!-- Základna + popisky -->
    <div class="mt-2 flex items-start justify-between gap-2 border-t border-steel-100 pt-2">
      <span v-for="item in items" :key="item.key" class="min-w-0 flex-1 truncate text-center text-[11px] text-steel-500">{{ item.label }}</span>
    </div>
  </div>
</template>
