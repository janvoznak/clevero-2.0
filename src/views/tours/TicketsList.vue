<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { MOCK_TICKETS, MOCK_TOURS, tour, fmtSlot } from '@/data/mockTours'

const tourOptions = [{ value: 'all', label: 'Všechny prohlídky' }, ...MOCK_TOURS.map((t) => ({ value: t.id, label: t.title.cs }))]
const filterTour = ref('all')
const search = ref('')

const rows = computed(() => {
  const q = search.value.trim().toLowerCase()
  return [...MOCK_TICKETS]
    .filter((t) => (filterTour.value === 'all' || t.tourId === filterTour.value) && (!q || t.customer.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)))
    .sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt))
})
const totalRevenue = computed(() => rows.value.reduce((s, t) => s + t.amount, 0))
const totalTickets = computed(() => rows.value.reduce((s, t) => s + t.count, 0))
function tourTitle(id: string): string {
  return tour(id)?.title.cs ?? '—'
}
function fmtPurchased(iso: string): string {
  return new Date(iso).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="px-8 py-6">
    <!-- Header -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">tickets</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/tickets</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">Vstupenky</h1>
        <p class="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-steel-500">
          <Icon name="integration" :size="14" class="text-brand-500" />
          Zakoupené vstupenky — data z Colossea přes API (needitovatelné).
        </p>
      </div>
    </div>

    <!-- Souhrn -->
    <div class="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div class="rounded-lg border border-steel-200 bg-white px-4 py-3">
        <p class="field-tag">Vstupenek</p>
        <p class="mt-0.5 font-display text-[22px] font-700 text-graphite-900 tabular-nums">{{ totalTickets }}</p>
      </div>
      <div class="rounded-lg border border-steel-200 bg-white px-4 py-3">
        <p class="field-tag">Objednávek</p>
        <p class="mt-0.5 font-display text-[22px] font-700 text-graphite-900 tabular-nums">{{ rows.length }}</p>
      </div>
      <div class="rounded-lg border border-steel-200 bg-white px-4 py-3">
        <p class="field-tag">Tržba</p>
        <p class="mt-0.5 font-display text-[22px] font-700 text-brand-600 tabular-nums">{{ totalRevenue.toLocaleString('cs-CZ') }} Kč</p>
      </div>
    </div>

    <!-- Filtr -->
    <div class="mb-4 rounded-lg border border-steel-200 bg-white p-3">
      <div class="flex flex-wrap items-end gap-x-3 gap-y-3">
        <div>
          <label class="mb-1 block field-tag">Prohlídka</label>
          <AppSelect v-model="filterTour" :options="tourOptions" />
        </div>
        <div class="min-w-[240px] flex-1 sm:max-w-sm">
          <label class="mb-1 block field-tag">Hledat zákazníka</label>
          <div class="relative">
            <Icon name="search" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
            <input v-model="search" type="text" placeholder="Jméno nebo e-mail…" class="h-9 w-full rounded-md border border-steel-200 pl-9 pr-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-lg border border-steel-200 bg-white">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
            <th class="px-4 py-3 font-600">Zákazník</th>
            <th class="px-2 py-3 font-600">Prohlídka</th>
            <th class="w-40 px-2 py-3 font-600">Termín</th>
            <th class="w-36 px-2 py-3 font-600">Vstupné</th>
            <th class="w-20 px-2 py-3 text-right font-600">Ks</th>
            <th class="w-28 px-2 py-3 text-right font-600">Částka</th>
            <th class="w-32 px-4 py-3 font-600">Zakoupeno</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in rows" :key="t.id" class="border-b border-steel-100 last:border-0 hover:bg-steel-50/60">
            <td class="px-4 py-3 align-middle">
              <span class="block text-[13.5px] font-600 text-graphite-900">{{ t.customer }}</span>
              <span class="block text-[11.5px] text-steel-500">{{ t.email }}</span>
            </td>
            <td class="px-2 py-3 align-middle text-[13px] text-graphite-700">{{ tourTitle(t.tourId) }}</td>
            <td class="px-2 py-3 align-middle text-[12.5px] text-graphite-700 tabular-nums">{{ fmtSlot(t.slotDatetime) }}</td>
            <td class="px-2 py-3 align-middle">
              <span class="inline-flex items-center rounded-full bg-steel-100 px-2 py-0.5 text-[11.5px] font-600 text-graphite-700">{{ t.tierLabel }}</span>
            </td>
            <td class="px-2 py-3 text-right align-middle text-[13px] tabular-nums text-graphite-700">{{ t.count }}</td>
            <td class="px-2 py-3 text-right align-middle text-[13px] font-700 tabular-nums text-graphite-900">{{ t.amount.toLocaleString('cs-CZ') }} Kč</td>
            <td class="px-4 py-3 align-middle text-[12px] text-steel-500 tabular-nums">{{ fmtPurchased(t.purchasedAt) }}</td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="7" class="px-4 py-16 text-center">
              <div class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-steel-100 text-steel-400"><Icon name="ticket" :size="24" /></div>
              <p class="mt-3 text-[14px] font-600 text-graphite-800">Žádné vstupenky</p>
              <p class="mt-1 text-[13px] text-steel-500">Zkuste upravit filtr nebo hledaný výraz.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
