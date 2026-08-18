<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  CheckboxRoot,
  CheckboxIndicator,
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
  PaginationRoot,
  PaginationList,
  PaginationListItem,
  PaginationPrev,
  PaginationNext,
  PaginationEllipsis,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ClearFiltersButton from '@/components/ui/ClearFiltersButton.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'
import { MOCK_POPUPS, popupState, POPUP_STATE_META } from '@/data/mockPopups'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import type { PopupItem } from '@/data/mockPopups'
import { langPublishState, LANG_PUBLISH_META, filledLangsOf } from '@/utils/langPublish'

const router = useRouter()

/** Zobrazení výpisu: dlaždice / tabulka. */
const view = ref<'grid' | 'table'>('grid')

/* ---------- Data + mazání/přepínání (prototyp — jen lokální stav) ---------- */
const rows = ref<PopupItem[]>([...MOCK_POPUPS])
const deleteTarget = ref<PopupItem | null>(null)

/* ---------- Filtry (jednotné s ostatními moduly) ---------- */
const search = ref('')
const filterStatus = ref('all')
const filterLang = ref('all')
const statusOptions = [
  { value: 'all', label: 'Všechny stavy' },
  { value: 'active', label: POPUP_STATE_META.active.label },
  { value: 'scheduled', label: POPUP_STATE_META.scheduled.label },
  { value: 'expired', label: POPUP_STATE_META.expired.label },
  { value: 'disabled', label: POPUP_STATE_META.disabled.label },
]
const langOptions = [
  { value: 'all', label: 'Všechny mutace' },
  ...LANGS.map((l) => ({ value: l.code, label: l.label })),
]
/** Diakritiku-nezávislé porovnání (např. „muzeum" najde „múzeum"). */
function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
const hasFilters = computed(
  () => search.value.trim() !== '' || filterStatus.value !== 'all' || filterLang.value !== 'all',
)
function clearFilters() {
  search.value = ''
  filterStatus.value = 'all'
  filterLang.value = 'all'
}

const visible = computed(() => {
  const q = norm(search.value.trim())
  return rows.value
    .filter((p) => {
      const mStatus = filterStatus.value === 'all' || popupState(p) === filterStatus.value
      const mLang = filterLang.value === 'all' || p.title[filterLang.value as LangCode].trim() !== ''
      const mSearch = q === '' || LANGS.some((l) => norm(p.title[l.code]).includes(q))
      return mStatus && mLang && mSearch
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
})

/** Stav jedné jazykové mutace pro chip ve výpisu (živě / připraveno / prázdné). */
function lps(row: PopupItem, code: LangCode) {
  return langPublishState(code, filledLangsOf(row.title), row.publishedLangs)
}

function toggleEnabled(p: PopupItem, v: boolean) {
  p.enabled = v // prototyp — jen lokální stav
}

function confirmDeleteOne() {
  if (!deleteTarget.value) return
  const id = deleteTarget.value.id
  rows.value = rows.value.filter((p) => p.id !== id)
  const next = new Set(selected.value)
  next.delete(id)
  selected.value = next
  deleteTarget.value = null
}
function confirmDeleteBulk() {
  rows.value = rows.value.filter((p) => !selected.value.has(p.id))
  selected.value = new Set()
}
/** Hromadné povolit/zakázat nad vybranými (prototyp — lokální stav). */
function bulkSetEnabled(v: boolean) {
  rows.value.forEach((p) => {
    if (selected.value.has(p.id)) p.enabled = v
  })
}

/* ---------- Výběr / hromadné akce ---------- */
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

/* ---------- Formátování datumu ---------- */
function fmt(dt: string | null): string {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
}
function fmtTime(dt: string | null): string {
  if (!dt) return ''
  return new Date(dt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
}

function goNew() {
  router.push({ name: 'popup-new' })
}
function goEdit(id: string) {
  router.push({ name: 'popup-edit', params: { id } })
}

/* ---------- Akce nad řádkem (kontextové menu ⋮) ---------- */
const rowActions = [
  { key: 'edit', label: 'Editovat pop-up', icon: 'edit' },
  { key: 'delete', label: 'Smazat pop-up', icon: 'trash', danger: true },
]
function onRowAction(key: string, p: PopupItem) {
  if (key === 'edit') goEdit(p.id)
  else if (key === 'delete') deleteTarget.value = p
}

/* ---------- Stránkování (Reka Pagination) — prototyp: simulovaný počet ---------- */
const page = ref(1)
const perPage = 20
const totalItems = 42
const rangeStart = computed(() => (page.value - 1) * perPage + 1)
const rangeEnd = computed(() => Math.min(page.value * perPage, totalItems))
</script>

<template>
  <div class="px-8 py-6">
    <!-- Page header -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">popup</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/popups/list</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">
          Pop-up okna
        </h1>
        <p class="mt-1.5 text-[13.5px] text-steel-500">
          {{ visible.length }} {{ visible.length === 1 ? 'okno' : 'oken' }} · vyskakovací okna zobrazovaná
          návštěvníkům webu
        </p>
      </div>
      <AppButton variant="primary" @click="goNew">
        <Icon name="plus" :size="17" />
        Nové pop-up okno
      </AppButton>
    </div>

    <TabsRoot v-model="view">
      <!-- Filtry (jednotné s ostatními moduly) + přepínač zobrazení -->
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3 rounded-lg border border-steel-200 bg-white p-3">
        <div class="flex flex-wrap items-end gap-x-3 gap-y-3">
          <div class="min-w-[220px] flex-1 sm:max-w-xs">
            <label class="mb-1 block field-tag">Hledat</label>
            <div class="relative">
              <Icon name="search" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
              <input
                v-model="search"
                type="text"
                placeholder="Hledat podle nadpisu…"
                class="h-9 w-full rounded-md border border-steel-200 pl-9 pr-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label class="mb-1 block field-tag">Stav</label>
            <AppSelect v-model="filterStatus" :options="statusOptions" />
          </div>
          <div>
            <label class="mb-1 block field-tag">Jazyková mutace</label>
            <AppSelect v-model="filterLang" :options="langOptions" />
          </div>
          <ClearFiltersButton :visible="hasFilters" @clear="clearFilters" />
        </div>

        <TabsList class="inline-flex items-center gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1" aria-label="Zobrazení výpisu">
          <TabsTrigger
            value="grid"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors hover:text-graphite-800 data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm"
          >
            <Icon name="dashboard" :size="15" /> Dlaždice
          </TabsTrigger>
          <TabsTrigger
            value="table"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors hover:text-graphite-800 data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm"
          >
            <Icon name="reference" :size="15" /> Tabulka
          </TabsTrigger>
        </TabsList>
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
          Vybráno {{ selected.size }} {{ selected.size === 1 ? 'okno' : 'oken' }}
        </span>
        <div class="flex items-center gap-2">
          <button
            class="text-[12.5px] font-500 text-steel-500 hover:text-graphite-800"
            @click="selected = new Set()"
          >
            Zrušit výběr
          </button>
          <AppButton variant="secondary" size="sm" @click="bulkSetEnabled(true)">
            <Icon name="check" :size="15" /> Povolit
          </AppButton>
          <AppButton variant="secondary" size="sm" @click="bulkSetEnabled(false)">
            <Icon name="x" :size="15" /> Zakázat
          </AppButton>
          <DialogRoot>
            <DialogTrigger as-child>
              <AppButton variant="danger" size="sm">
                <Icon name="trash" :size="15" /> Smazat vybrané
              </AppButton>
            </DialogTrigger>
            <DialogPortal>
              <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
              <DialogContent
                class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl"
              >
                <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500">
                  <Icon name="trash" :size="22" />
                </div>
                <DialogTitle class="font-display text-lg font-700 text-graphite-900">
                  Smazat {{ selected.size }} {{ selected.size === 1 ? 'okno' : 'oken' }}?
                </DialogTitle>
                <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
                  Tato akce je nevratná. Vybraná pop-up okna se odstraní.
                </DialogDescription>
                <div class="mt-5 flex justify-end gap-2">
                  <DialogClose as-child>
                    <AppButton variant="secondary">Zrušit</AppButton>
                  </DialogClose>
                  <DialogClose as-child>
                    <AppButton variant="danger" @click="confirmDeleteBulk">Smazat</AppButton>
                  </DialogClose>
                </div>
              </DialogContent>
            </DialogPortal>
          </DialogRoot>
        </div>
      </div>
    </Transition>

    <!-- DLAŽDICE -->
    <TabsContent value="grid" class="outline-none">
      <div v-if="visible.length" class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        <div
          v-for="p in visible"
          :key="p.id"
          class="group relative flex flex-col overflow-hidden rounded-xl border bg-white transition-shadow hover:shadow-md"
          :class="selected.has(p.id) ? 'border-brand-500 ring-1 ring-brand-500' : 'border-steel-200'"
        >
          <!-- výběr -->
          <CheckboxRoot
            :model-value="selected.has(p.id)"
            class="absolute left-2.5 top-2.5 z-10 grid h-5 w-5 place-items-center rounded border border-steel-300 bg-white/90 shadow-sm backdrop-blur data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
            :aria-label="`Vybrat ${p.title.cs}`"
            @update:model-value="(v) => toggleOne(p.id, v)"
          >
            <CheckboxIndicator class="text-white"><Icon name="check" :size="12" /></CheckboxIndicator>
          </CheckboxRoot>

          <!-- obrázek = ústřední prvek -->
          <button class="relative block aspect-[16/10] w-full overflow-hidden bg-steel-100" @click="goEdit(p.id)">
            <img
              v-if="p.image"
              :src="p.image"
              :alt="p.title.cs"
              class="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            />
            <span v-else class="grid h-full w-full place-items-center text-steel-300"><Icon name="popup" :size="34" /></span>
            <span
              class="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10.5px] font-600 shadow-sm backdrop-blur"
              :class="POPUP_STATE_META[popupState(p)].text"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="POPUP_STATE_META[popupState(p)].dot" />
              {{ POPUP_STATE_META[popupState(p)].label }}
            </span>
          </button>

          <!-- tělo -->
          <div class="flex flex-1 flex-col p-3.5">
            <div class="flex items-start justify-between gap-2">
              <button class="min-w-0 flex-1 text-left" @click="goEdit(p.id)">
                <h3 class="truncate text-[14px] font-600 text-graphite-900 group-hover:text-brand-600">
                  {{ p.title.cs || 'Bez názvu' }}
                </h3>
              </button>
              <RowActionsMenu :actions="rowActions" label="Akce s pop-up oknem" @select="(key) => onRowAction(key, p)" />
            </div>

            <dl class="mt-2.5 space-y-1.5 text-[12px]">
              <div class="flex items-center justify-between gap-2">
                <dt class="text-steel-500">Vytvořeno</dt>
                <dd class="tabular-nums text-graphite-700">{{ fmt(p.createdAt) }}</dd>
              </div>
              <div class="flex items-center justify-between gap-2">
                <dt class="text-steel-500">Zobrazení</dt>
                <dd class="tabular-nums text-graphite-700">{{ fmt(p.from) }} → {{ fmt(p.to) }}</dd>
              </div>
            </dl>

            <div class="mt-3 flex items-center justify-between gap-2 border-t border-steel-100 pt-3">
              <AppSwitch
                :model-value="p.enabled"
                label="Zobrazovat"
                :aria-label="`Zobrazovat ${p.title.cs}`"
                @update:model-value="(v) => toggleEnabled(p, v)"
              />
              <div class="flex flex-wrap items-center justify-end gap-1">
                <span
                  v-for="l in LANGS"
                  :key="l.code"
                  class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-700 uppercase tabular-nums"
                  :class="LANG_PUBLISH_META[lps(p, l.code)].chip"
                  :title="`${l.label} — ${LANG_PUBLISH_META[lps(p, l.code)].label}`"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="LANG_PUBLISH_META[lps(p, l.code)].dot" />
                  {{ l.code }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="rounded-xl border border-steel-200 bg-white px-4 py-16 text-center">
        <div class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-steel-100 text-steel-400"><Icon name="popup" :size="24" /></div>
        <p class="mt-3 text-[14px] font-600 text-graphite-800">Žádná pop-up okna</p>
        <p class="mt-1 text-[13px] text-steel-500">{{ hasFilters ? 'Zkuste upravit filtry.' : 'Vytvořte první pop-up okno.' }}</p>
      </div>
    </TabsContent>

    <!-- TABULKA -->
    <TabsContent value="table" class="outline-none">
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
                <CheckboxIndicator class="text-white">
                  <Icon name="check" :size="12" />
                </CheckboxIndicator>
              </CheckboxRoot>
            </th>
            <th class="px-2 py-3 font-600">Název (nadpis)</th>
            <th class="px-2 py-3 font-600">Vytvořeno</th>
            <th class="px-2 py-3 font-600">Od</th>
            <th class="px-2 py-3 font-600">Do</th>
            <th class="px-2 py-3 font-600">Zobrazovat</th>
            <th class="px-2 py-3 font-600">Jazykové mutace</th>
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
            <td class="px-4 py-3 align-middle">
              <CheckboxRoot
                :model-value="selected.has(p.id)"
                class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
                @update:model-value="(v) => toggleOne(p.id, v)"
              >
                <CheckboxIndicator class="text-white">
                  <Icon name="check" :size="12" />
                </CheckboxIndicator>
              </CheckboxRoot>
            </td>
            <td class="px-2 py-3 align-middle">
              <button class="flex items-center gap-3 text-left" @click="goEdit(p.id)">
                <span class="grid h-10 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-steel-100 text-steel-400">
                  <img v-if="p.image" :src="p.image" :alt="p.title.cs" class="h-full w-full object-cover" />
                  <Icon v-else name="popup" :size="16" />
                </span>
                <span class="min-w-0">
                  <span class="block truncate text-[14px] font-600 text-graphite-900 group-hover:text-brand-600">
                    {{ p.title.cs || 'Bez názvu' }}
                  </span>
                  <span class="mt-1 flex items-center gap-2">
                    <span
                      class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-600"
                      :class="[POPUP_STATE_META[popupState(p)].bg, POPUP_STATE_META[popupState(p)].text]"
                    >
                      <span class="h-1.5 w-1.5 rounded-full" :class="POPUP_STATE_META[popupState(p)].dot" />
                      {{ POPUP_STATE_META[popupState(p)].label }}
                    </span>
                  </span>
                </span>
              </button>
            </td>
            <td class="px-2 py-3 align-middle">
              <div class="text-[13px] text-graphite-700 tabular-nums">{{ fmt(p.createdAt) }}</div>
              <div class="font-mono text-[10.5px] text-steel-400">{{ fmtTime(p.createdAt) }}</div>
            </td>
            <td class="px-2 py-3 align-middle">
              <div class="text-[13px] text-graphite-700 tabular-nums">{{ fmt(p.from) }}</div>
              <div v-if="p.from" class="font-mono text-[10.5px] text-steel-400">{{ fmtTime(p.from) }}</div>
            </td>
            <td class="px-2 py-3 align-middle">
              <div class="text-[13px] tabular-nums" :class="p.to ? 'text-graphite-700' : 'text-steel-400'">
                {{ fmt(p.to) }}
              </div>
              <div v-if="p.to" class="font-mono text-[10.5px] text-steel-400">{{ fmtTime(p.to) }}</div>
            </td>
            <td class="px-2 py-3 align-middle">
              <AppSwitch
                :model-value="p.enabled"
                :aria-label="`Zobrazovat ${p.title.cs}`"
                @update:model-value="(v) => toggleEnabled(p, v)"
              />
            </td>
            <td class="px-2 py-3 align-middle">
              <div class="flex flex-wrap items-center gap-1">
                <span
                  v-for="l in LANGS"
                  :key="l.code"
                  class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-700 uppercase tabular-nums"
                  :class="LANG_PUBLISH_META[lps(p, l.code)].chip"
                  :title="`${l.label} — ${LANG_PUBLISH_META[lps(p, l.code)].label}`"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="LANG_PUBLISH_META[lps(p, l.code)].dot" />
                  {{ l.code }}
                </span>
              </div>
            </td>
            <td class="px-3 py-3 align-middle">
              <div class="flex justify-end">
                <RowActionsMenu
                  :actions="rowActions"
                  label="Akce s pop-up oknem"
                  @select="(key) => onRowAction(key, p)"
                />
              </div>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-if="visible.length === 0">
            <td colspan="8" class="px-4 py-16 text-center">
              <div class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-steel-100 text-steel-400">
                <Icon name="popup" :size="24" />
              </div>
              <p class="mt-3 text-[14px] font-600 text-graphite-800">Žádná pop-up okna</p>
              <p class="mt-1 text-[13px] text-steel-500">{{ hasFilters ? 'Zkuste upravit filtry.' : 'Vytvořte první pop-up okno.' }}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </TabsContent>

    <!-- Pagination (Reka Pagination) -->
    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-[12.5px] text-steel-500">
        Zobrazeno <span class="font-600 text-graphite-800">{{ rangeStart }}–{{ rangeEnd }}</span> z {{ totalItems }}
      </p>
      <PaginationRoot v-model:page="page" :total="totalItems" :items-per-page="perPage" :sibling-count="1" show-edges>
        <PaginationList v-slot="{ items }" class="flex items-center gap-1">
          <PaginationPrev
            class="grid h-8 w-8 place-items-center rounded-md border border-steel-200 text-graphite-700 transition-colors hover:bg-steel-50 disabled:cursor-not-allowed disabled:border-steel-100 disabled:text-steel-300"
          >
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
          <PaginationNext
            class="grid h-8 w-8 place-items-center rounded-md border border-steel-200 text-graphite-700 transition-colors hover:bg-steel-50 disabled:cursor-not-allowed disabled:border-steel-100 disabled:text-steel-300"
          >
            <Icon name="chevronRight" :size="15" />
          </PaginationNext>
        </PaginationList>
      </PaginationRoot>
    </div>
    </TabsRoot>

    <!-- Single delete dialog -->
    <DialogRoot :open="!!deleteTarget" @update:open="(v) => !v && (deleteTarget = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl"
        >
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500">
            <Icon name="trash" :size="22" />
          </div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">Smazat pop-up okno?</DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
            Chystáte se smazat <span class="font-600 text-graphite-800">„{{ deleteTarget?.title.cs }}"</span>.
            Tato akce je nevratná.
          </DialogDescription>
          <div class="mt-5 flex justify-end gap-2">
            <AppButton variant="secondary" @click="deleteTarget = null">Zrušit</AppButton>
            <AppButton variant="danger" @click="confirmDeleteOne">Smazat</AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
