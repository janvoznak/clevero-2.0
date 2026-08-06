<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CheckboxRoot,
  CheckboxIndicator,
  PaginationRoot,
  PaginationList,
  PaginationListItem,
  PaginationPrev,
  PaginationNext,
  PaginationEllipsis,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import TagChip from '@/components/ui/TagChip.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import {
  MOCK_PRODUCTS,
  MOCK_PRODUCT_CATEGORIES,
  PRODUCT_TYPE_META,
  PRODUCT_TYPE_OPTIONS,
  CATEGORY_FILTER_OPTIONS,
  PAIRING_FILTER_OPTIONS,
  AVAILABILITY_META,
  availability,
  productCategory,
  displayName,
  hasDescription,
  isFreshImport,
  isPaired,
  productsNeedingDescription,
  stockLabel,
  fmtPrice,
  fmtDateTime,
  type Product,
} from '@/data/mockProducts'

const router = useRouter()
const route = useRoute()

/* ---------- Filtry ---------- */
const filterType = ref('all')
const filterCategory = ref('all')
const filterAvail = ref('all')
const filterPairing = ref('all')
// Aktivováno z nástěnky nebo z dashboardu (?filter=no-description).
const filterDesc = ref(route.query.filter === 'no-description' ? 'missing' : 'all')
const sortBy = ref('newest')

const availOptions = [
  { value: 'all', label: 'Vše skladem i vyprodané' },
  { value: 'inStock', label: 'Skladem' },
  { value: 'lastPieces', label: 'Poslední kusy' },
  { value: 'soldout', label: 'Vyprodáno' },
]
const descOptions = [
  { value: 'all', label: 'Popis: vše' },
  { value: 'missing', label: 'Bez popisu' },
  { value: 'present', label: 'S popisem' },
]
const sortOptions = [
  { value: 'newest', label: 'Nejnověji importované' },
  { value: 'name', label: 'Podle názvu (A–Z)' },
  { value: 'priceAsc', label: 'Cena vzestupně' },
  { value: 'priceDesc', label: 'Cena sestupně' },
]

const hasFilters = computed(
  () =>
    filterType.value !== 'all' ||
    filterCategory.value !== 'all' ||
    filterAvail.value !== 'all' ||
    filterDesc.value !== 'all' ||
    filterPairing.value !== 'all' ||
    sortBy.value !== 'newest',
)
function clearFilters() {
  filterType.value = 'all'
  filterCategory.value = 'all'
  filterAvail.value = 'all'
  filterDesc.value = 'all'
  filterPairing.value = 'all'
  sortBy.value = 'newest'
}

/* ---------- Data (prototyp — jen lokální stav) ---------- */
const rows = ref<Product[]>([...MOCK_PRODUCTS])

const visible = computed(() => {
  const list = rows.value.filter((p) => {
    const matchesType = filterType.value === 'all' || p.type === filterType.value
    const matchesCat = filterCategory.value === 'all' || p.categoryIds.includes(filterCategory.value)
    const matchesAvail = filterAvail.value === 'all' || availability(p) === filterAvail.value
    const matchesDesc =
      filterDesc.value === 'all' ||
      (filterDesc.value === 'missing' ? !hasDescription(p) : hasDescription(p))
    const matchesPairing =
      filterPairing.value === 'all' ||
      (filterPairing.value === 'paired' ? isPaired(p) : !isPaired(p))
    return matchesType && matchesCat && matchesAvail && matchesDesc && matchesPairing
  })
  return [...list].sort((a, b) => {
    if (sortBy.value === 'name') return displayName(a).localeCompare(displayName(b), 'cs')
    if (sortBy.value === 'priceAsc') return a.price - b.price
    if (sortBy.value === 'priceDesc') return b.price - a.price
    return b.importedAt.localeCompare(a.importedAt)
  })
})

/* ---------- Nástěnka: čerstvě importované produkty bez popisu ---------- */
const needsDescription = computed(() => productsNeedingDescription())
function showOnlyMissing() {
  clearFilters()
  filterDesc.value = 'missing'
}

/* ---------- Synchronizace s Colosseem (prototyp — jen toast) ---------- */
const syncing = ref(false)
const toast = ref('')
function syncColosseum() {
  if (syncing.value) return
  syncing.value = true
  // prototyp — nefunkční: předstíráme dotažení dostupnosti z Colossea
  window.setTimeout(() => {
    syncing.value = false
    toast.value = 'Synchronizováno s Colosseem — cena a dostupnost jsou aktuální.'
    window.setTimeout(() => (toast.value = ''), 3000)
  }, 1400)
}
const lastSync = computed(() =>
  rows.value.reduce((latest, p) => (p.syncedAt > latest ? p.syncedAt : latest), rows.value[0]?.syncedAt ?? ''),
)

/* ---------- Výběr / hromadné akce (nad viditelnými řádky) ---------- */
const selected = ref<Set<string>>(new Set())
const allSelected = computed(
  () => visible.value.length > 0 && visible.value.every((p) => selected.value.has(p.id)),
)
function toggleAll(v: boolean | 'indeterminate') {
  const next = new Set(selected.value)
  if (v === true) visible.value.forEach((p) => next.add(p.id))
  else visible.value.forEach((p) => next.delete(p.id))
  selected.value = next
}
function toggleOne(id: string, v: boolean | 'indeterminate') {
  const next = new Set(selected.value)
  if (v === true) next.add(id)
  else next.delete(id)
  selected.value = next
}
/** Hromadné zveřejnění / skrytí (prototyp — lokální stav). Colosseum se needituje. */
function bulkPublish(state: boolean) {
  rows.value = rows.value.map((p) => (selected.value.has(p.id) ? { ...p, published: state } : p))
  selected.value = new Set()
}

/* ---------- Akce nad řádkem ---------- */
const rowActions = [
  { key: 'edit', label: 'Doplnit obsah produktu', icon: 'edit' },
  { key: 'preview', label: 'Náhled na webu', icon: 'eye' },
  { key: 'colosseum', label: 'Otevřít v Colosseu', icon: 'externalLink' },
]
function goEdit(id: string) {
  router.push({ name: 'product-edit', params: { id } })
}
function onRowAction(key: string, p: Product) {
  if (key === 'edit') goEdit(p.id)
  // 'preview' i 'colosseum' — prototyp: mrtvé odkazy, nic se neděje
}

function langFilled(p: Product, code: LangCode): boolean {
  return p.description[code].replace(/<[^>]+>/g, '').trim().length > 0
}

/* ---------- Stránkování (Reka Pagination) — dataset simulovaný ---------- */
const page = ref(1)
const perPage = 24
const totalItems = 64
const rangeStart = computed(() => (page.value - 1) * perPage + 1)
const rangeEnd = computed(() => Math.min(page.value * perPage, totalItems))
</script>

<template>
  <div class="px-8 py-6">
    <!-- Page header -->
    <div class="mb-4 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">products</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/products</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">Produkty</h1>
        <p class="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-steel-500">
          <Icon name="integration" :size="14" class="text-brand-500" />
          E-shop — zboží a vouchery z Colossea. Cena a dostupnost se načítají automaticky (jen čtení); popis, obrázky a členění doplníte zde.
        </p>
      </div>
      <AppButton variant="primary" :disabled="syncing" @click="syncColosseum">
        <Icon name="sync" :size="16" :class="syncing && 'animate-spin'" />
        {{ syncing ? 'Synchronizuji…' : 'Synchronizovat s Colosseem' }}
      </AppButton>
    </div>

    <!-- Nástěnka: čerstvě importované produkty bez popisu -->
    <div
      v-if="needsDescription.length"
      class="mb-4 overflow-hidden rounded-lg border border-amber-500/40 bg-amber-50/70 ring-1 ring-amber-500/10"
    >
      <div class="flex flex-wrap items-start gap-3 px-4 py-3">
        <span class="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-amber-500/15 text-amber-600">
          <Icon name="bell" :size="18" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="flex flex-wrap items-center gap-2 text-[13.5px] font-700 text-graphite-900">
            {{ needsDescription.length }}
            {{ needsDescription.length === 1 ? 'produkt čeká na doplnění popisu' : 'produkty čekají na doplnění popisu' }}
            <span class="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[10px] font-600 text-amber-700">
              <Icon name="integration" :size="11" /> import z Colossea
            </span>
          </p>
          <p class="mt-0.5 text-[12.5px] leading-relaxed text-steel-600">
            Colosseum popisy neeviduje — doplňte je v administraci, aby produkt vypadal na webu dobře.
          </p>
          <ul class="mt-2 flex flex-wrap gap-1.5">
            <li v-for="p in needsDescription.slice(0, 6)" :key="p.id">
              <button
                class="group inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-white px-2 py-1 text-[12px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:text-brand-600"
                @click="goEdit(p.id)"
              >
                <Icon :name="PRODUCT_TYPE_META[p.type].icon" :size="13" class="text-steel-400 group-hover:text-brand-500" />
                {{ displayName(p) }}
                <span v-if="isFreshImport(p)" class="rounded bg-amber-500/15 px-1 font-mono text-[9px] font-700 uppercase text-amber-700">nový</span>
              </button>
            </li>
            <li v-if="needsDescription.length > 6" class="inline-flex items-center px-1 text-[12px] text-steel-500">
              +{{ needsDescription.length - 6 }} dalších
            </li>
          </ul>
        </div>
        <AppButton variant="secondary" size="sm" @click="showOnlyMissing">
          <Icon name="filter" :size="14" /> Zobrazit jen bez popisu
        </AppButton>
      </div>
    </div>

    <!-- Filter bar -->
    <div class="mb-4 rounded-lg border border-steel-200 bg-white p-3">
      <div class="flex flex-wrap items-end gap-x-3 gap-y-3">
        <div>
          <label class="mb-1 block field-tag">Typ zboží</label>
          <AppSelect v-model="filterType" :options="PRODUCT_TYPE_OPTIONS" />
        </div>
        <div>
          <label class="mb-1 block field-tag">Členění</label>
          <AppSelect v-model="filterCategory" :options="CATEGORY_FILTER_OPTIONS" />
        </div>
        <div>
          <label class="mb-1 block field-tag">Dostupnost</label>
          <AppSelect v-model="filterAvail" :options="availOptions" />
        </div>
        <div>
          <label class="mb-1 block field-tag">Popis</label>
          <AppSelect v-model="filterDesc" :options="descOptions" />
        </div>
        <div>
          <label class="mb-1 block field-tag">Párování</label>
          <AppSelect v-model="filterPairing" :options="PAIRING_FILTER_OPTIONS" />
        </div>
        <div class="ml-auto">
          <label class="mb-1 block field-tag">Řazení</label>
          <AppSelect v-model="sortBy" :options="sortOptions" />
        </div>
        <button
          v-if="hasFilters"
          class="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-500 text-steel-500 transition-colors hover:bg-steel-100 hover:text-graphite-800"
          @click="clearFilters"
        >
          <Icon name="x" :size="14" /> Zrušit filtry
        </button>
      </div>
    </div>

    <!-- Bulk action bar -->
    <Transition
      enter-active-class="transition duration-150"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="selected.size > 0"
        class="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-500/30 bg-brand-50 px-4 py-2.5"
      >
        <span class="text-[13px] font-600 text-brand-700">
          Vybráno {{ selected.size }} {{ selected.size === 1 ? 'produkt' : 'produktů' }}
        </span>
        <div class="flex items-center gap-2">
          <button class="text-[12.5px] font-500 text-steel-500 hover:text-graphite-800" @click="selected = new Set()">
            Zrušit výběr
          </button>
          <AppButton variant="secondary" size="sm" @click="bulkPublish(false)">
            <Icon name="eye" :size="15" /> Skrýt na webu
          </AppButton>
          <AppButton variant="primary" size="sm" @click="bulkPublish(true)">
            <Icon name="check" :size="15" /> Zveřejnit
          </AppButton>
        </div>
      </div>
    </Transition>

    <!-- Table -->
    <div class="overflow-hidden rounded-lg border border-steel-200 bg-white">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
            <th class="w-11 px-4 py-3">
              <CheckboxRoot
                :model-value="allSelected"
                class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
                @update:model-value="toggleAll"
              >
                <CheckboxIndicator class="text-white"><Icon name="check" :size="12" /></CheckboxIndicator>
              </CheckboxRoot>
            </th>
            <th class="px-2 py-3 font-600">Produkt</th>
            <th class="px-2 py-3 font-600">Členění</th>
            <th class="w-28 px-2 py-3 text-right font-600">Cena</th>
            <th class="w-36 px-2 py-3 font-600">Sklad</th>
            <th class="w-40 px-2 py-3 font-600">Popis</th>
            <th class="w-28 px-2 py-3 font-600">Web</th>
            <th class="w-16 px-3 py-3 text-right font-600">Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in visible"
            :key="p.id"
            class="group border-b border-steel-100 transition-colors last:border-0 hover:bg-steel-50/60"
            :class="selected.has(p.id) && 'bg-brand-50/40'"
          >
            <!-- Výběr -->
            <td class="px-4 py-3 align-middle">
              <CheckboxRoot
                :model-value="selected.has(p.id)"
                class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
                @update:model-value="(v) => toggleOne(p.id, v)"
              >
                <CheckboxIndicator class="text-white"><Icon name="check" :size="12" /></CheckboxIndicator>
              </CheckboxRoot>
            </td>

            <!-- Produkt -->
            <td class="px-2 py-3 align-middle">
              <button class="flex items-center gap-3 text-left" @click="goEdit(p.id)">
                <span class="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md bg-steel-100 text-steel-400">
                  <img v-if="p.gallery[0] || p.colosseumImage" :src="p.gallery[0]?.src || p.colosseumImage" :alt="displayName(p)" class="h-full w-full object-cover" />
                  <Icon v-else name="image" :size="16" />
                </span>
                <span class="min-w-0">
                  <span class="block truncate text-[14px] font-600 text-graphite-900 group-hover:text-brand-600">
                    {{ displayName(p) }}
                  </span>
                  <span class="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span class="inline-flex items-center gap-1 rounded bg-steel-100 px-1.5 py-0.5 text-[10.5px] font-600 text-steel-600">
                      <Icon :name="PRODUCT_TYPE_META[p.type].icon" :size="11" /> {{ PRODUCT_TYPE_META[p.type].label }}
                    </span>
                    <template v-if="isPaired(p)">
                      <span class="font-mono text-[10.5px] text-steel-400">{{ p.colosseumId }}</span>
                      <span v-if="isFreshImport(p)" class="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9.5px] font-700 uppercase text-amber-700">
                        nový import
                      </span>
                    </template>
                    <span v-else class="inline-flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9.5px] font-700 uppercase text-amber-700" title="Produkt zatím není spárovaný s Colosseem">
                      nespárováno
                    </span>
                  </span>
                </span>
              </button>
            </td>

            <!-- Členění -->
            <td class="px-2 py-3 align-middle">
              <div v-if="p.categoryIds.length" class="flex max-w-[200px] flex-wrap items-center gap-1.5">
                <TagChip v-for="cid in p.categoryIds" :key="cid" :label="productCategory(cid)?.name.cs ?? cid" color="#64748b" />
              </div>
              <span v-else class="text-[11px] text-steel-400">Bez členění</span>
            </td>

            <!-- Cena -->
            <td class="px-2 py-3 text-right align-middle">
              <span class="text-[13.5px] font-700 text-graphite-900 tabular-nums">{{ fmtPrice(p.price) }}</span>
            </td>

            <!-- Sklad (z Colossea) -->
            <td class="px-2 py-3 align-middle">
              <template v-if="isPaired(p)">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-600"
                  :class="[AVAILABILITY_META[availability(p)].bg, AVAILABILITY_META[availability(p)].text]"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="AVAILABILITY_META[availability(p)].dot" />
                  {{ AVAILABILITY_META[availability(p)].label }}
                </span>
                <span class="mt-0.5 block font-mono text-[10.5px] text-steel-400">{{ stockLabel(p) }}</span>
              </template>
              <span v-else class="inline-flex items-center gap-1.5 text-[12px] text-steel-400" title="Bez párování se sklad z Colossea nenačítá">
                <Icon name="x" :size="13" /> bez dat
              </span>
            </td>

            <!-- Popis + jazykové mutace -->
            <td class="px-2 py-3 align-middle">
              <span
                v-if="hasDescription(p)"
                class="inline-flex items-center gap-1.5 text-[12px] font-600 text-forge-600"
              >
                <Icon name="check" :size="14" /> Vyplněn
              </span>
              <span v-else class="inline-flex items-center gap-1.5 text-[12px] font-600 text-amber-600">
                <Icon name="x" :size="14" /> Chybí popis
              </span>
              <div class="mt-1 flex flex-wrap items-center gap-1">
                <span
                  v-for="l in LANGS"
                  :key="l.code"
                  :title="langFilled(p, l.code) ? `${l.label} — vyplněno` : `${l.label} — chybí`"
                  class="rounded px-1 py-0.5 text-[9.5px] font-700 uppercase tabular-nums"
                  :class="langFilled(p, l.code) ? 'bg-forge-500/10 text-forge-600' : 'bg-steel-100 text-steel-400'"
                >
                  {{ l.code }}
                </span>
              </div>
            </td>

            <!-- Stav na webu -->
            <td class="px-2 py-3 align-middle">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-600"
                :class="p.published ? 'bg-forge-500/10 text-forge-600' : 'bg-steel-100 text-steel-500'"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="p.published ? 'bg-forge-500' : 'bg-steel-300'" />
                {{ p.published ? 'Zveřejněno' : 'Skryto' }}
              </span>
            </td>

            <!-- Akce -->
            <td class="px-3 py-3 align-middle">
              <div class="flex justify-end">
                <RowActionsMenu :actions="rowActions" label="Akce s produktem" @select="(key) => onRowAction(key, p)" />
              </div>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-if="visible.length === 0">
            <td colspan="8" class="px-4 py-16 text-center">
              <div class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-steel-100 text-steel-400">
                <Icon name="box" :size="24" />
              </div>
              <p class="mt-3 text-[14px] font-600 text-graphite-800">Žádné produkty</p>
              <p class="mt-1 text-[13px] text-steel-500">
                {{ hasFilters ? 'Zkuste upravit filtry.' : 'Zboží se importuje z Colossea — spusťte synchronizaci.' }}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Colosseum info + pagination -->
    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="flex items-center gap-1.5 text-[12px] text-steel-500">
        <Icon name="integration" :size="13" class="text-brand-500" />
        Data z Colossea (jen čtení) · naposledy synchronizováno
        <span class="font-mono text-steel-600">{{ lastSync ? fmtDateTime(lastSync) : '—' }}</span>
      </p>
      <div class="flex items-center gap-3">
        <p class="text-[12.5px] text-steel-500">
          Zobrazeno <span class="font-600 text-graphite-800">{{ rangeStart }}–{{ rangeEnd }}</span> z {{ totalItems }}
        </p>
        <PaginationRoot v-model:page="page" :total="totalItems" :items-per-page="perPage" :sibling-count="1" show-edges>
          <PaginationList v-slot="{ items }" class="flex items-center gap-1">
            <PaginationPrev class="grid h-8 w-8 place-items-center rounded-md border border-steel-200 text-graphite-700 transition-colors hover:bg-steel-50 disabled:cursor-not-allowed disabled:border-steel-100 disabled:text-steel-300">
              <Icon name="chevronLeft" :size="15" />
            </PaginationPrev>
            <template v-for="(item, i) in items" :key="i">
              <PaginationListItem
                v-if="item.type === 'page'"
                :value="item.value"
                class="grid h-8 min-w-8 place-items-center rounded-md px-2 text-[13px] font-500 outline-none transition-colors data-[selected]:bg-graphite-900 data-[selected]:font-600 data-[selected]:text-white"
                :class="item.value !== page && 'border border-steel-200 text-graphite-700 hover:bg-steel-50'"
              >
                {{ item.value }}
              </PaginationListItem>
              <PaginationEllipsis v-else class="grid h-8 w-8 place-items-center text-steel-400">…</PaginationEllipsis>
            </template>
            <PaginationNext class="grid h-8 w-8 place-items-center rounded-md border border-steel-200 text-graphite-700 transition-colors hover:bg-steel-50 disabled:cursor-not-allowed disabled:border-steel-100 disabled:text-steel-300">
              <Icon name="chevronRight" :size="15" />
            </PaginationNext>
          </PaginationList>
        </PaginationRoot>
      </div>
    </div>

    <!-- Toast (potvrzení synchronizace) -->
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="toast"
        class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl"
      >
        <Icon name="sync" :size="16" class="text-brand-400" />
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
