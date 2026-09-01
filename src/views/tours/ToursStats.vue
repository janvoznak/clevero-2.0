<script setup lang="ts">
/**
 * Prohlídky → Statistiky (podmodul).
 *
 * Manažerský přehled prodeje vstupenek: kolik se prodalo, za kolik, které
 * prohlídky táhnou, v jaké jazykové mutaci se kupuje a kdy lidé kupují.
 * Data jsou READ-ONLY projekce Colossea (v prototypu mock) — v adminu se
 * nic needituje.
 */
import { computed, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ClearFiltersButton from '@/components/ui/ClearFiltersButton.vue'
import LangFlag from '@/components/admin/LangFlag.vue'
import ChartCard from '@/components/admin/charts/ChartCard.vue'
import StatTile from '@/components/admin/charts/StatTile.vue'
import TrendAreaChart from '@/components/admin/charts/TrendAreaChart.vue'
import BarListChart from '@/components/admin/charts/BarListChart.vue'
import DonutChart from '@/components/admin/charts/DonutChart.vue'
import { MOCK_CATEGORIES, MOCK_TOURS, category, tour } from '@/data/mockTours'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import {
  DEFAULT_RANGE,
  RANGE_PRESETS,
  STATS_NOW,
  byLang,
  byTour,
  deltaPct,
  filterSales,
  fmtCompact,
  fmtCzk,
  fmtInt,
  grainFor,
  langColor,
  previousRange,
  rangeOf,
  totals,
  trendSeries,
} from '@/data/mockTourStats'

/* ============================================================
   Filtry — jeden řádek nad grafy, scopují všechno pod sebou.
   ============================================================ */
const rangeKey = ref(DEFAULT_RANGE)
const filterCategory = ref('all')
const filterTour = ref('all')
const filterLang = ref('all')

const rangeOptions = RANGE_PRESETS.map((r) => ({ value: r.value, label: r.label }))
const categoryOptions = [{ value: 'all', label: 'Všechny kategorie' }, ...MOCK_CATEGORIES.map((c) => ({ value: c.id, label: c.name.cs }))]
const tourOptions = computed(() => [
  { value: 'all', label: 'Všechny prohlídky' },
  ...MOCK_TOURS.filter((t) => filterCategory.value === 'all' || t.categoryId === filterCategory.value).map((t) => ({ value: t.id, label: t.title.cs })),
])
const langOptions = [{ value: 'all', label: 'Všechny mutace' }, ...LANGS.map((l) => ({ value: l.code, label: l.labelCs }))]

/** Změna kategorie zruší výběr prohlídky, která do ní nepatří. */
function onCategoryChange() {
  if (filterTour.value !== 'all' && tour(filterTour.value)?.categoryId !== filterCategory.value && filterCategory.value !== 'all') {
    filterTour.value = 'all'
  }
}
const hasFilters = computed(
  () => rangeKey.value !== DEFAULT_RANGE || filterCategory.value !== 'all' || filterTour.value !== 'all' || filterLang.value !== 'all',
)
function clearFilters() {
  rangeKey.value = DEFAULT_RANGE
  filterCategory.value = 'all'
  filterTour.value = 'all'
  filterLang.value = 'all'
}

/* ============================================================
   Datový řez — aktuální období + stejně dlouhé předchozí (na srovnání).
   ============================================================ */
const range = computed(() => rangeOf(rangeKey.value))
const prevRange = computed(() => previousRange(range.value))
const baseFilter = computed(() => ({ categoryId: filterCategory.value, tourId: filterTour.value, lang: filterLang.value }))

const sales = computed(() => filterSales({ ...baseFilter.value, range: range.value }))
const prevSales = computed(() => filterSales({ ...baseFilter.value, range: prevRange.value }))
const sum = computed(() => totals(sales.value))
const prevSum = computed(() => totals(prevSales.value))

function fmtDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
}
const rangeLabel = computed(() => `${fmtDate(range.value.from)} – ${fmtDate(range.value.to)}`)
const grainLabel = computed(() => ({ day: 'po dnech', week: 'po týdnech', month: 'po měsících' })[grainFor(range.value.days)])

/* ---------- KPI dlaždice ---------- */
const avgTicket = computed(() => (sum.value.tickets ? sum.value.revenue / sum.value.tickets : 0))
const prevAvgTicket = computed(() => (prevSum.value.tickets ? prevSum.value.revenue / prevSum.value.tickets : 0))
const trend = computed(() => trendSeries(sales.value, range.value))
const kpiSpark = computed(() => trend.value.map((p) => p.tickets))

/* ---------- Vývoj v čase (přepínač veličiny — nikdy dvě osy) ---------- */
type Metric = 'tickets' | 'revenue'
const metric = ref<Metric>('tickets')
const METRICS: { v: Metric; label: string; icon: string }[] = [
  { v: 'tickets', label: 'Vstupenky', icon: 'ticket' },
  { v: 'revenue', label: 'Tržba', icon: 'grant' },
]
const trendPoints = computed(() =>
  trend.value.map((p) => ({ key: p.key, label: p.label, full: p.full, value: metric.value === 'tickets' ? p.tickets : p.revenue })),
)
const metricColor = computed(() => (metric.value === 'tickets' ? 'var(--color-chart-1)' : 'var(--color-chart-3)'))
const metricFormat = computed(() => (metric.value === 'tickets' ? fmtInt : fmtCzk))
const metricCompact = computed(() => (metric.value === 'tickets' ? fmtCompact : (n: number) => `${fmtCompact(n)} Kč`))

/* ---------- Prodej podle prohlídky (top 8 + Ostatní) ---------- */
const TOP_N = 8
const tourRows = computed(() => {
  const rows = byTour(sales.value)
  const head = rows.slice(0, TOP_N).map((r) => ({
    key: r.key,
    label: r.label,
    sub: category(tour(r.key)?.categoryId ?? '')?.name.cs,
    value: r.tickets,
    secondary: r.revenue,
  }))
  const tail = rows.slice(TOP_N)
  if (tail.length) {
    head.push({
      key: 'other',
      label: `Ostatní prohlídky (${tail.length})`,
      sub: undefined,
      value: tail.reduce((s, r) => s + r.tickets, 0),
      secondary: tail.reduce((s, r) => s + r.revenue, 0),
    })
  }
  return head
})

/* ---------- Jazykové mutace ---------- */
const langRows = computed(() =>
  byLang(sales.value).map((r) => ({ key: r.key, label: r.label, value: r.tickets, color: langColor(r.key) })),
)

/* ---------- Manažerské shrnutí pod grafem (co si z grafu odnést) ---------- */
/** Podíl cizojazyčných mutací — kolik prodeje jde mimo češtinu. */
const foreignShare = computed(() => {
  const foreign = langRows.value.filter((r) => r.key !== 'cs').reduce((acc, r) => acc + r.value, 0)
  return sum.value.tickets ? (foreign / sum.value.tickets) * 100 : 0
})
function pct(n: number): string {
  return `${n.toFixed(1).replace('.', ',')} %`
}
</script>

<template>
  <div class="px-8 py-6">
    <!-- Header -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">tour-stats</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/tours/stats</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">Statistiky</h1>
      </div>
      <!-- prototyp — nefunkční -->
      <AppButton variant="secondary" size="icon" title="Exportovat do Excelu" aria-label="Exportovat do Excelu">
        <Icon name="sheet" :size="17" />
      </AppButton>
    </div>

    <!-- Filtry: jeden řádek nad grafy, období první -->
    <div class="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-steel-200 bg-white px-4 py-3 shadow-sm">
      <Icon name="filter" :size="15" class="text-steel-400" />
      <AppSelect v-model="rangeKey" :options="rangeOptions" class="w-52" />
      <AppSelect v-model="filterCategory" :options="categoryOptions" class="w-52" @update:model-value="onCategoryChange" />
      <AppSelect v-model="filterTour" :options="tourOptions" class="w-64" />
      <AppSelect v-model="filterLang" :options="langOptions" class="w-44" />
      <ClearFiltersButton :visible="hasFilters" @clear="clearFilters" />
      <span class="ml-auto flex items-center gap-1.5 text-[12px] text-steel-500">
        <Icon name="calendar" :size="14" class="text-steel-400" />
        {{ rangeLabel }}
      </span>
    </div>

    <!-- KPI -->
    <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        label="Prodané vstupenky"
        :value="fmtInt(sum.tickets)"
        :delta="deltaPct(sum.tickets, prevSum.tickets)"
        sub="vs. předchozí období"
        icon="ticket"
        accent-bg="bg-brand-50"
        accent-text="text-brand-600"
        :spark="kpiSpark"
      />
      <StatTile
        label="Tržba"
        :value="fmtCzk(sum.revenue)"
        :delta="deltaPct(sum.revenue, prevSum.revenue)"
        sub="vs. předchozí období"
        icon="grant"
        accent-bg="bg-forge-500/10"
        accent-text="text-forge-600"
      />
      <StatTile
        label="Objednávky"
        :value="fmtInt(sum.orders)"
        :delta="deltaPct(sum.orders, prevSum.orders)"
        sub="vs. předchozí období"
        icon="cart"
        accent-bg="bg-amber-500/10"
        accent-text="text-amber-600"
      />
      <StatTile
        label="Průměrná cena vstupenky"
        :value="fmtCzk(avgTicket)"
        :delta="deltaPct(avgTicket, prevAvgTicket)"
        sub="vs. předchozí období"
        icon="box"
        accent-bg="bg-steel-100"
        accent-text="text-graphite-700"
      />
    </div>

    <!-- Vývoj prodeje v čase -->
    <ChartCard
      class="mb-4"
      title="Vývoj prodeje"
      :hint="`Zvolené období ${grainLabel} · ${rangeLabel}`"
      tag="tour-stats-trend"
      icon="chart"
    >
      <template #actions>
        <!-- Přepínač veličiny (nikdy dvě osy v jednom grafu) -->
        <div class="flex gap-0.5 rounded-lg border border-steel-200 bg-steel-50 p-0.5" role="group" aria-label="Zobrazená veličina">
          <button
            v-for="m in METRICS"
            :key="m.v"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-600 outline-none transition-colors"
            :class="metric === m.v ? 'bg-white text-graphite-900 shadow-sm' : 'text-steel-500 hover:text-graphite-800'"
            :aria-pressed="metric === m.v"
            @click="metric = m.v"
          >
            <Icon :name="m.icon" :size="14" /> {{ m.label }}
          </button>
        </div>
      </template>

      <TrendAreaChart
        :points="trendPoints"
        :color="metricColor"
        :series-label="metric === 'tickets' ? 'Vstupenky' : 'Tržba'"
        :format="metricCompact"
        :height="260"
      />
      <template #footer>
        <p class="text-[12px] text-steel-500">
          Celkem za období:
          <span class="font-700 text-graphite-900 tabular-nums">{{ metricFormat(metric === 'tickets' ? sum.tickets : sum.revenue) }}</span>
          · průměrně
          <span class="font-600 text-graphite-800 tabular-nums">
            {{ metricFormat((metric === 'tickets' ? sum.tickets : sum.revenue) / Math.max(1, trendPoints.length)) }}
          </span>
          {{ grainLabel === 'po dnech' ? 'na den' : grainLabel === 'po týdnech' ? 'na týden' : 'na měsíc' }}
        </p>
      </template>
    </ChartCard>

    <!-- Prohlídky + jazykové mutace -->
    <div class="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
      <ChartCard
        class="xl:col-span-2"
        title="Prodej podle prohlídky"
        hint="Počet prodaných vstupenek; po najetí se ukáže podíl a tržba."
        tag="tour-stats-tours"
        icon="ticket"
      >
        <BarListChart :items="tourRows" :format="fmtInt" :secondary-format="fmtCzk" secondary-label="Tržba" />
      </ChartCard>

      <ChartCard title="Jazykové mutace" hint="V jakém jazyce si lidé prohlídky kupují." tag="tour-stats-langs" icon="globe">
        <div class="flex h-full items-center">
          <DonutChart :items="langRows" center-label="Vstupenek celkem" :format="fmtInt">
            <template #label="{ item }">
              <span class="flex items-center gap-1.5">
                <LangFlag :lang="(item.key as LangCode)" :size="13" />
                {{ item.label }}
              </span>
            </template>
          </DonutChart>
        </div>
        <template #footer>
          <p class="text-[12px] text-steel-500">
            Cizojazyčné mutace tvoří <span class="font-700 text-graphite-900 tabular-nums">{{ pct(foreignShare) }}</span> prodaných vstupenek.
          </p>
        </template>
      </ChartCard>
    </div>

    <p class="mt-4 flex items-center gap-1.5 text-[11.5px] text-steel-400">
      <Icon name="sync" :size="13" />
      Zdroj dat: Colosseum (prodej vstupenek) · stav k {{ fmtDate(STATS_NOW.toISOString().slice(0, 10)) }} — prototyp, čísla jsou ukázková.
    </p>
  </div>
</template>
