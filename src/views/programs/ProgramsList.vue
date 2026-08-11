<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  CheckboxRoot, CheckboxIndicator,
  DialogRoot, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose,
  PaginationRoot, PaginationList, PaginationListItem, PaginationPrev, PaginationNext, PaginationEllipsis,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ClearFiltersButton from '@/components/ui/ClearFiltersButton.vue'
import TagChip from '@/components/ui/TagChip.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'
import {
  MOCK_PROGRAMS, SCHOOL_LEVELS, GRADES, FOCUS_AREAS,
  levelColor, focusColor, tagColor,
  type Program,
} from '@/data/mockPrograms'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import { langPublishState, LANG_PUBLISH_META, filledLangsOf } from '@/utils/langPublish'

const router = useRouter()

/** Stav jedné jazykové mutace programu pro sloupec „Jazykové mutace". */
function lps(row: Program, code: LangCode) {
  return langPublishState(code, filledLangsOf(row.title), row.publishedLangs)
}

/** Iniciály autora pro avatar (stejně jako v Aktualitách). */
function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).map((w) => w[0] ?? '').slice(0, 2).join('').toUpperCase()
}

/* ---------- Filtry ---------- */
const filterLevel = ref('all')
const filterGrade = ref('all')
const filterFocus = ref('all')
const sortBy = ref('newest')

const levelOptions = [{ value: 'all', label: 'Všechny stupně' }, ...SCHOOL_LEVELS.map((l) => ({ value: l.label, label: l.label }))]
const gradeOptions = [{ value: 'all', label: 'Všechny ročníky' }, ...GRADES.map((g) => ({ value: g.label, label: g.label }))]
const focusOptions = [{ value: 'all', label: 'Všechna zaměření' }, ...FOCUS_AREAS.map((f) => ({ value: f.label, label: f.label }))]
const sortOptions = [
  { value: 'newest', label: 'Nejnovější' },
  { value: 'title', label: 'Podle názvu (A–Z)' },
]

const hasFilters = computed(
  () => filterLevel.value !== 'all' || filterGrade.value !== 'all' || filterFocus.value !== 'all' || sortBy.value !== 'newest',
)
function clearFilters() {
  filterLevel.value = 'all'; filterGrade.value = 'all'; filterFocus.value = 'all'; sortBy.value = 'newest'
}

/* ---------- Data + mazání (prototyp) ---------- */
const rows = ref<Program[]>([...MOCK_PROGRAMS])
const deleteTarget = ref<Program | null>(null)

const visible = computed(() => {
  const list = rows.value.filter((p) => {
    const mLevel = filterLevel.value === 'all' || p.categories.includes(filterLevel.value)
    const mGrade = filterGrade.value === 'all' || p.grades.includes(filterGrade.value)
    const mFocus = filterFocus.value === 'all' || p.focus.includes(filterFocus.value)
    return mLevel && mGrade && mFocus
  })
  return [...list].sort((a, b) => {
    if (sortBy.value === 'title') return a.title.cs.localeCompare(b.title.cs, 'cs')
    const ta = a.date ? new Date(a.date).getTime() : 0
    const tb = b.date ? new Date(b.date).getTime() : 0
    return tb - ta
  })
})

function confirmDeleteOne() {
  if (!deleteTarget.value) return
  const id = deleteTarget.value.id
  rows.value = rows.value.filter((p) => p.id !== id)
  const next = new Set(selected.value); next.delete(id); selected.value = next
  deleteTarget.value = null
}
function confirmDeleteBulk() {
  rows.value = rows.value.filter((p) => !selected.value.has(p.id))
  selected.value = new Set()
}

/* ---------- Výběr ---------- */
const selected = ref<Set<string>>(new Set())
const allSelected = computed(() => visible.value.length > 0 && visible.value.every((p) => selected.value.has(p.id)))
function toggleAll(v: boolean | 'indeterminate') {
  const next = new Set(selected.value)
  if (v === true) visible.value.forEach((p) => next.add(p.id))
  else visible.value.forEach((p) => next.delete(p.id))
  selected.value = next
}
function toggleOne(id: string, v: boolean | 'indeterminate') {
  const next = new Set(selected.value)
  if (v === true) next.add(id); else next.delete(id)
  selected.value = next
}

function goNew() { router.push({ name: 'program-new' }) }
function goEdit(id: string) { router.push({ name: 'program-edit', params: { id } }) }

const rowActions = [
  { key: 'preview', label: 'Náhled na webu', icon: 'eye' },
  { key: 'edit', label: 'Editovat program', icon: 'edit' },
  { key: 'delete', label: 'Smazat program', icon: 'trash', danger: true },
]
function onRowAction(key: string, p: Program) {
  if (key === 'edit') goEdit(p.id)
  else if (key === 'delete') deleteTarget.value = p
}

/* ---------- Stránkování (prototyp) ---------- */
const page = ref(1)
const perPage = 24
const totalItems = 107
const rangeStart = computed(() => (page.value - 1) * perPage + 1)
const rangeEnd = computed(() => Math.min(page.value * perPage, totalItems))
</script>

<template>
  <div class="px-8 py-6">
    <!-- Header -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">programs</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/education</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">Vzdělávací programy</h1>
        <p class="mt-1.5 text-[13.5px] text-steel-500">
          {{ visible.length }} {{ visible.length === 1 ? 'program' : 'programů' }} · rezervace přes DOVIS
        </p>
      </div>
      <AppButton variant="primary" @click="goNew"><Icon name="plus" :size="17" /> Nový program</AppButton>
    </div>

    <!-- Filter bar -->
    <div class="mb-4 rounded-lg border border-steel-200 bg-white p-3">
      <div class="flex flex-wrap items-end gap-x-3 gap-y-3">
        <div>
          <label class="mb-1 block field-tag">Stupeň školy</label>
          <AppSelect v-model="filterLevel" :options="levelOptions" />
        </div>
        <div>
          <label class="mb-1 block field-tag">Ročník</label>
          <AppSelect v-model="filterGrade" :options="gradeOptions" />
        </div>
        <div>
          <label class="mb-1 block field-tag">Zaměření</label>
          <AppSelect v-model="filterFocus" :options="focusOptions" />
        </div>
        <div class="ml-auto">
          <label class="mb-1 block field-tag">Řazení</label>
          <AppSelect v-model="sortBy" :options="sortOptions" />
        </div>
        <ClearFiltersButton :visible="hasFilters" @clear="clearFilters" />
      </div>
    </div>

    <!-- Bulk action bar -->
    <Transition enter-active-class="transition duration-150" enter-from-class="opacity-0 -translate-y-1" leave-active-class="transition duration-100" leave-to-class="opacity-0">
      <div v-if="selected.size > 0" class="mb-3 flex items-center justify-between rounded-lg border border-brand-500/30 bg-brand-50 px-4 py-2.5">
        <span class="text-[13px] font-600 text-brand-700">Vybráno {{ selected.size }} {{ selected.size === 1 ? 'program' : 'programů' }}</span>
        <div class="flex items-center gap-2">
          <button class="text-[12.5px] font-500 text-steel-500 hover:text-graphite-800" @click="selected = new Set()">Zrušit výběr</button>
          <DialogRoot>
            <DialogTrigger as-child><AppButton variant="danger" size="sm"><Icon name="trash" :size="15" /> Smazat vybrané</AppButton></DialogTrigger>
            <DialogPortal>
              <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
              <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
                <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500"><Icon name="trash" :size="22" /></div>
                <DialogTitle class="font-display text-lg font-700 text-graphite-900">Smazat {{ selected.size }} {{ selected.size === 1 ? 'program' : 'programů' }}?</DialogTitle>
                <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">Tato akce je nevratná.</DialogDescription>
                <div class="mt-5 flex justify-end gap-2">
                  <DialogClose as-child><AppButton variant="secondary">Zrušit</AppButton></DialogClose>
                  <DialogClose as-child><AppButton variant="danger" @click="confirmDeleteBulk">Smazat</AppButton></DialogClose>
                </div>
              </DialogContent>
            </DialogPortal>
          </DialogRoot>
        </div>
      </div>
    </Transition>

    <!-- Table -->
    <div class="overflow-hidden rounded-lg border border-steel-200 bg-white">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
            <th class="w-11 px-4 py-3">
              <CheckboxRoot :model-value="allSelected" class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500" @update:model-value="toggleAll">
                <CheckboxIndicator class="text-white"><Icon name="check" :size="12" /></CheckboxIndicator>
              </CheckboxRoot>
            </th>
            <th class="px-2 py-3 font-600">Program</th>
            <th class="w-52 px-2 py-3 font-600">Stupeň školy</th>
            <th class="w-52 px-2 py-3 font-600">Zaměření</th>
            <th class="w-48 px-2 py-3 font-600">Autor</th>
            <th class="w-40 px-2 py-3 font-600">Jazykové mutace</th>
            <th class="w-16 px-3 py-3 text-right font-600">Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in visible" :key="p.id" class="group border-b border-steel-100 transition-colors last:border-0 hover:bg-steel-50/60" :class="selected.has(p.id) && 'bg-brand-50/40'">
            <td class="px-4 py-3 align-middle">
              <CheckboxRoot :model-value="selected.has(p.id)" class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500" @update:model-value="(v) => toggleOne(p.id, v)">
                <CheckboxIndicator class="text-white"><Icon name="check" :size="12" /></CheckboxIndicator>
              </CheckboxRoot>
            </td>
            <td class="px-2 py-3 align-middle">
              <button class="flex items-start gap-3 text-left" @click="goEdit(p.id)">
                <span class="grid h-11 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-steel-100 text-steel-400">
                  <img v-if="p.image" :src="p.image" :alt="p.title.cs" class="h-full w-full object-cover" />
                  <Icon v-else name="education" :size="18" />
                </span>
                <span class="min-w-0">
                  <span class="block truncate text-[14px] font-600 text-graphite-900 group-hover:text-brand-600">{{ p.title.cs || 'Bez názvu' }}</span>
                  <span v-if="p.tags.length" class="mt-1 flex flex-wrap items-center gap-1">
                    <TagChip v-for="t in p.tags" :key="t" :label="t" :color="tagColor(t)" />
                  </span>
                </span>
              </button>
            </td>
            <td class="px-2 py-3 align-middle">
              <div v-if="p.categories.length" class="flex max-w-[210px] flex-wrap items-center gap-1">
                <TagChip v-for="c in p.categories" :key="c" :label="c" :color="levelColor(c)" />
              </div>
              <span v-else class="text-[11px] text-steel-400">—</span>
            </td>
            <td class="px-2 py-3 align-middle">
              <div v-if="p.focus.length" class="flex max-w-[210px] flex-wrap items-center gap-1">
                <TagChip v-for="f in p.focus" :key="f" :label="f" :color="focusColor(f)" />
              </div>
              <span v-else class="text-[11px] text-steel-400">—</span>
            </td>
            <td class="px-2 py-3 align-middle">
              <div class="flex items-center gap-2">
                <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-steel-100 text-[10.5px] font-700 text-steel-600">{{ initials(p.author) }}</span>
                <span class="text-[13px] text-graphite-700">{{ p.author }}</span>
              </div>
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
              <div class="flex justify-end"><RowActionsMenu :actions="rowActions" label="Akce s programem" @select="(key) => onRowAction(key, p)" /></div>
            </td>
          </tr>

          <tr v-if="visible.length === 0">
            <td colspan="7" class="px-4 py-16 text-center">
              <div class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-steel-100 text-steel-400"><Icon name="education" :size="24" /></div>
              <p class="mt-3 text-[14px] font-600 text-graphite-800">Žádné programy</p>
              <p class="mt-1 text-[13px] text-steel-500">{{ hasFilters ? 'Zkuste upravit filtry.' : 'Vytvořte první program.' }}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-[12.5px] text-steel-500">Zobrazeno <span class="font-600 text-graphite-800">{{ rangeStart }}–{{ rangeEnd }}</span> z {{ totalItems }}</p>
      <PaginationRoot v-model:page="page" :total="totalItems" :items-per-page="perPage" :sibling-count="1" show-edges>
        <PaginationList v-slot="{ items }" class="flex items-center gap-1">
          <PaginationPrev class="grid h-8 w-8 place-items-center rounded-md border border-steel-200 text-graphite-700 transition-colors hover:bg-steel-50 disabled:cursor-not-allowed disabled:border-steel-100 disabled:text-steel-300"><Icon name="chevronLeft" :size="15" /></PaginationPrev>
          <template v-for="(item, i) in items" :key="i">
            <PaginationListItem v-if="item.type === 'page'" :value="item.value" class="grid h-8 min-w-8 place-items-center rounded-md px-2 text-[13px] font-500 outline-none transition-colors data-[selected]:bg-graphite-900 data-[selected]:font-600 data-[selected]:text-white" :class="item.value !== page && 'border border-steel-200 text-graphite-700 hover:bg-steel-50'">{{ item.value }}</PaginationListItem>
            <PaginationEllipsis v-else class="grid h-8 w-8 place-items-center text-steel-400">…</PaginationEllipsis>
          </template>
          <PaginationNext class="grid h-8 w-8 place-items-center rounded-md border border-steel-200 text-graphite-700 transition-colors hover:bg-steel-50 disabled:cursor-not-allowed disabled:border-steel-100 disabled:text-steel-300"><Icon name="chevronRight" :size="15" /></PaginationNext>
        </PaginationList>
      </PaginationRoot>
    </div>

    <!-- Single delete dialog -->
    <DialogRoot :open="!!deleteTarget" @update:open="(v) => !v && (deleteTarget = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500"><Icon name="trash" :size="22" /></div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">Smazat program?</DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">Chystáte se smazat <span class="font-600 text-graphite-800">„{{ deleteTarget?.title.cs }}"</span>. Tato akce je nevratná.</DialogDescription>
          <div class="mt-5 flex justify-end gap-2">
            <AppButton variant="secondary" @click="deleteTarget = null">Zrušit</AppButton>
            <AppButton variant="danger" @click="confirmDeleteOne">Smazat</AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
