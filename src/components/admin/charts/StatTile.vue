<script setup lang="ts">
/**
 * Číselná dlaždice (KPI) — popisek, hodnota, změna proti minulému období
 * a volitelná sparkline. Vizuálně navazuje na dlaždice na Dashboardu.
 */
import { computed } from 'vue'
import Icon from '@/components/ui/Icon.vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: string
    /** Doplňkový text pod hodnotou (např. „vs. předchozí období"). */
    sub?: string
    /** Změna v % proti srovnávacímu období; null/undefined = nezobrazí se. */
    delta?: number | null
    /** Je růst dobrá zpráva? (u storna apod. je to naopak). */
    deltaGood?: boolean
    icon?: string
    accentBg?: string
    accentText?: string
    /** Hodnoty pro sparkline (průběh za období). */
    spark?: number[]
  }>(),
  { deltaGood: true, accentBg: 'bg-brand-50', accentText: 'text-brand-600' },
)

/** Barva změny = směr × jestli je růst žádoucí. Nula je neutrální. */
const deltaTone = computed(() => {
  if (props.delta === undefined || props.delta === null || props.delta === 0) return 'text-steel-500'
  const up = props.delta > 0
  return up === props.deltaGood ? 'text-forge-600' : 'text-danger-600'
})

/* Sparkline — 2px linka + jemný wash, poslední bod zvýrazněný. */
const geom = computed(() => {
  const data = props.spark ?? []
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 30 - ((v - min) / span) * 24
    return [Number(x.toFixed(1)), Number(y.toFixed(1))] as const
  })
  const line = pts.map((p) => p.join(',')).join(' ')
  return { line, area: `0,32 ${line} 100,32`, last: pts[pts.length - 1] }
})
</script>

<template>
  <div class="rounded-xl border border-steel-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
    <div class="flex items-center justify-between gap-2">
      <span class="min-w-0 truncate font-mono text-[10.5px] uppercase tracking-wider text-steel-500">{{ label }}</span>
      <span v-if="icon" class="grid h-8 w-8 shrink-0 place-items-center rounded-lg" :class="[accentBg, accentText]">
        <Icon :name="icon" :size="16" />
      </span>
    </div>
    <div class="mt-3 flex items-end justify-between gap-2">
      <div class="min-w-0">
        <!-- Velké číslo: proporcionální číslice (tabular-nums patří do sloupců tabulek). -->
        <p class="font-display text-[26px] font-800 leading-none text-graphite-900">{{ value }}</p>
        <p class="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[11.5px]">
          <span v-if="delta !== undefined && delta !== null" class="inline-flex items-center gap-0.5 font-600" :class="deltaTone">
            {{ delta > 0 ? '▲' : delta < 0 ? '▼' : '▬' }} {{ Math.abs(delta) }} %
          </span>
          <span v-if="sub" class="truncate text-steel-400">{{ sub }}</span>
        </p>
      </div>
      <svg v-if="geom" viewBox="0 0 100 32" class="h-10 w-24 shrink-0" preserveAspectRatio="none" aria-hidden="true">
        <polygon :points="geom.area" fill="var(--color-chart-1)" opacity="0.10" />
        <polyline :points="geom.line" fill="none" stroke="var(--color-chart-1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
        <circle :cx="geom.last[0]" :cy="geom.last[1]" r="2.6" fill="var(--color-chart-1)" />
      </svg>
    </div>
  </div>
</template>
