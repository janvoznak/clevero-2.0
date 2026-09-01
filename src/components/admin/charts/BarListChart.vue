<script setup lang="ts">
/**
 * Vodorovný pruhový graf (žebříček) — pro srovnání velikostí mezi položkami.
 * Hodnota je popsaná přímo u pruhu; hover/fokus doplní podíl a druhé číslo.
 */
import { computed, ref } from 'vue'

export interface BarListItem {
  key: string
  label: string
  value: number
  /** Barva pruhu (token grafové palety). Bez barvy = jednotná barva řady. */
  color?: string
  /** Druhé číslo do tooltipu (např. tržba k počtu vstupenek). */
  secondary?: number
  /** Doplňující popisek pod názvem (např. kategorie prohlídky). */
  sub?: string
}

const props = withDefaults(
  defineProps<{
    items: BarListItem[]
    format?: (n: number) => string
    secondaryFormat?: (n: number) => string
    /** Popisek druhého čísla v tooltipu. */
    secondaryLabel?: string
    /** Jednotná barva, když položky nemají vlastní. */
    color?: string
  }>(),
  {
    format: (n: number) => Math.round(n).toLocaleString('cs-CZ'),
    secondaryFormat: (n: number) => Math.round(n).toLocaleString('cs-CZ'),
    secondaryLabel: 'Tržba',
    color: 'var(--color-chart-1)',
  },
)

const max = computed(() => Math.max(...props.items.map((i) => i.value), 1))
const total = computed(() => props.items.reduce((s, i) => s + i.value, 0))
function widthOf(v: number): string {
  return `${Math.max(1.5, (v / max.value) * 100)}%`
}
function shareOf(v: number): string {
  return total.value ? `${((v / total.value) * 100).toFixed(1).replace('.', ',')} %` : '—'
}
const active = ref<string | null>(null)
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <div
      v-for="item in items"
      :key="item.key"
      class="group relative rounded-md px-1.5 py-1 outline-none transition-colors hover:bg-steel-50 focus:bg-steel-50"
      tabindex="0"
      @pointerenter="active = item.key"
      @pointerleave="active = null"
      @focus="active = item.key"
      @blur="active = null"
    >
      <div class="flex items-baseline justify-between gap-3">
        <span class="min-w-0 truncate text-[12.5px] text-graphite-800">
          {{ item.label }}
          <span v-if="item.sub" class="ml-1.5 text-[11px] text-steel-400">{{ item.sub }}</span>
        </span>
        <span class="shrink-0 text-[12.5px] font-700 text-graphite-900 tabular-nums">{{ format(item.value) }}</span>
      </div>
      <!-- Pruh: tenký, zaoblený konec, roste z jedné základny -->
      <div class="mt-1.5 h-2.5 w-full overflow-hidden rounded-l-[2px] bg-steel-100">
        <div
          class="h-full transition-[width] duration-300"
          :style="{ width: widthOf(item.value), backgroundColor: item.color ?? color, borderRadius: '2px 4px 4px 2px' }"
        />
      </div>

      <!-- Tooltip: hodnota vede, popisky jsou vedlejší -->
      <div
        v-if="active === item.key"
        class="pointer-events-none absolute -top-1 right-2 z-10 -translate-y-full rounded-lg border border-steel-200 bg-white px-3 py-2 shadow-lg"
      >
        <p class="font-display text-[15px] font-700 leading-none text-graphite-900 tabular-nums">{{ format(item.value) }}</p>
        <p class="mt-1 flex items-center gap-1.5 whitespace-nowrap text-[11.5px] text-steel-500">
          <span class="inline-block h-2 w-2 shrink-0 rounded-[2px]" :style="{ backgroundColor: item.color ?? color }" />
          {{ item.label }} · podíl {{ shareOf(item.value) }}
        </p>
        <p v-if="item.secondary !== undefined" class="mt-0.5 whitespace-nowrap text-[11.5px] text-steel-500">
          {{ secondaryLabel }}: <span class="font-600 text-graphite-800 tabular-nums">{{ secondaryFormat(item.secondary) }}</span>
        </p>
      </div>
    </div>

    <p v-if="!items.length" class="py-6 text-center text-[12.5px] text-steel-400">Ve zvoleném období nejsou žádná data.</p>
  </div>
</template>
