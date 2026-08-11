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
import AppSwitch from '@/components/ui/AppSwitch.vue'
import TagChip from '@/components/ui/TagChip.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'
import { MOCK_FAQ, FAQ_CATEGORY_OPTIONS, faqCategoryColor, faqState, type FaqItem } from '@/data/mockFaq'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import { langPublishState, LANG_PUBLISH_META, filledLangsOf } from '@/utils/langPublish'

const router = useRouter()

/* ---------- Filtry ----------
   Těžiště je fulltext v otázce (a odpovědi) — u FAQ hledá redaktor konkrétní
   dotaz podle znění, ne podle abecedy. Pořadí v rámci kategorie je pevné
   (řídí se polem order v detailu), proto tu žádné „řazení" není. */
const search = ref('')
const filterCategory = ref('all')
const filterStatus = ref('all')

const categoryOptions = [{ value: 'all', label: 'Všechny kategorie' }, ...FAQ_CATEGORY_OPTIONS]
const statusOptions = [
  { value: 'all', label: 'Všechny stavy' },
  { value: 'published', label: 'Zveřejněno' },
  { value: 'draft', label: 'Koncept' },
]

/** Diakritiku-nezávislé porovnání (např. „muzeum" najde „múzeum"). */
function norm(s: string): string {
  // U+0300–U+036F = kombinující diakritická znaménka (odstraníme po NFD rozkladu)
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const hasFilters = computed(
  () => search.value.trim() !== '' || filterCategory.value !== 'all' || filterStatus.value !== 'all',
)
function clearFilters() {
  search.value = ''
  filterCategory.value = 'all'
  filterStatus.value = 'all'
}

/* ---------- Data + mazání (prototyp — jen lokální stav) ---------- */
const rows = ref<FaqItem[]>([...MOCK_FAQ])
const deleteTarget = ref<FaqItem | null>(null)

const visible = computed(() => {
  const q = norm(search.value.trim())
  const list = rows.value.filter((f) => {
    const matchesCategory = filterCategory.value === 'all' || f.category === filterCategory.value
    const matchesStatus = filterStatus.value === 'all' || faqState(f) === filterStatus.value
    // Fulltext: otázka napříč všemi mutacemi + prostý text odpovědi (CS).
    const matchesSearch =
      q === '' ||
      LANGS.some((l) => norm(f.question[l.code as LangCode]).includes(q)) ||
      norm(plain(f.answer.cs)).includes(q)
    return matchesCategory && matchesStatus && matchesSearch
  })
  return [...list].sort((a, b) => a.order - b.order)
})

function setPublished(f: FaqItem, v: boolean) {
  f.published = v
}
function confirmDeleteOne() {
  if (!deleteTarget.value) return
  const id = deleteTarget.value.id
  rows.value = rows.value.filter((f) => f.id !== id)
  const next = new Set(selected.value)
  next.delete(id)
  selected.value = next
  deleteTarget.value = null
}
function confirmDeleteBulk() {
  rows.value = rows.value.filter((f) => !selected.value.has(f.id))
  selected.value = new Set()
}

/* ---------- Výběr / hromadné akce ---------- */
const selected = ref<Set<string>>(new Set())
const allSelected = computed(
  () => visible.value.length > 0 && visible.value.every((f) => selected.value.has(f.id)),
)
function toggleAll(v: boolean | 'indeterminate') {
  const next = new Set(selected.value)
  if (v === true) visible.value.forEach((f) => next.add(f.id))
  else visible.value.forEach((f) => next.delete(f.id))
  selected.value = next
}
function toggleOne(id: string, v: boolean | 'indeterminate') {
  const next = new Set(selected.value)
  if (v === true) next.add(id)
  else next.delete(id)
  selected.value = next
}

/** Stav publikace jedné jazykové mutace (živě / připraveno / prázdné). */
function lps(f: FaqItem, code: LangCode) {
  return langPublishState(code, filledLangsOf(f.question), f.publishedLangs)
}

/** Prostý text z richtextu (pro náhled odpovědi v seznamu). */
function plain(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function goNew() {
  router.push({ name: 'faq-new' })
}
function goEdit(id: string) {
  router.push({ name: 'faq-edit', params: { id } })
}

const rowActions = [
  { key: 'edit', label: 'Editovat dotaz', icon: 'edit' },
  { key: 'delete', label: 'Smazat dotaz', icon: 'trash', danger: true },
]
function onRowAction(key: string, f: FaqItem) {
  if (key === 'edit') goEdit(f.id)
  else if (key === 'delete') deleteTarget.value = f
}

/* ---------- Stránkování (prototyp — simulovaný dataset) ---------- */
const page = ref(1)
const perPage = 24
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
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">faq</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/faq</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">
          Časté dotazy
        </h1>
        <p class="mt-1.5 text-[13.5px] text-steel-500">
          {{ visible.length }} {{ visible.length === 1 ? 'dotaz' : 'dotazů' }} · otázky a odpovědi pro web
        </p>
      </div>
      <AppButton variant="primary" @click="goNew">
        <Icon name="plus" :size="17" />
        Nový dotaz
      </AppButton>
    </div>

    <!-- Filter bar -->
    <div class="mb-4 rounded-lg border border-steel-200 bg-white p-3">
      <div class="flex flex-wrap items-end gap-x-3 gap-y-3">
        <div class="min-w-[260px] flex-1 sm:max-w-md">
          <label class="mb-1 block field-tag">Hledat v dotazech</label>
          <div class="relative">
            <Icon name="search" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
            <input
              v-model="search"
              type="text"
              placeholder="Hledat podle otázky (např. vstupenky, parkování)…"
              class="h-9 w-full rounded-md border border-steel-200 pl-9 pr-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label class="mb-1 block field-tag">Kategorie</label>
          <AppSelect v-model="filterCategory" :options="categoryOptions" />
        </div>
        <div>
          <label class="mb-1 block field-tag">Stav</label>
          <AppSelect v-model="filterStatus" :options="statusOptions" />
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
        class="mb-3 flex items-center justify-between rounded-lg border border-brand-500/30 bg-brand-50 px-4 py-2.5"
      >
        <span class="text-[13px] font-600 text-brand-700">
          Vybráno {{ selected.size }} {{ selected.size === 1 ? 'dotaz' : 'dotazů' }}
        </span>
        <div class="flex items-center gap-2">
          <button class="text-[12.5px] font-500 text-steel-500 hover:text-graphite-800" @click="selected = new Set()">
            Zrušit výběr
          </button>
          <DialogRoot>
            <DialogTrigger as-child>
              <AppButton variant="danger" size="sm">
                <Icon name="trash" :size="15" /> Smazat vybrané
              </AppButton>
            </DialogTrigger>
            <DialogPortal>
              <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
              <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
                <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500">
                  <Icon name="trash" :size="22" />
                </div>
                <DialogTitle class="font-display text-lg font-700 text-graphite-900">
                  Smazat {{ selected.size }} {{ selected.size === 1 ? 'dotaz' : 'dotazů' }}?
                </DialogTitle>
                <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
                  Tato akce je nevratná. Vybrané dotazy se odstraní ze všech jazykových mutací.
                </DialogDescription>
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
              <CheckboxRoot
                :model-value="allSelected"
                class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
                @update:model-value="toggleAll"
              >
                <CheckboxIndicator class="text-white"><Icon name="check" :size="12" /></CheckboxIndicator>
              </CheckboxRoot>
            </th>
            <th class="px-2 py-3 font-600">Otázka</th>
            <th class="w-52 px-2 py-3 font-600">Kategorie</th>
            <th class="w-20 px-2 py-3 font-600">Pořadí</th>
            <th class="w-32 px-2 py-3 font-600">Jazykové mutace</th>
            <th class="w-24 px-2 py-3 font-600">Zveřejněno</th>
            <th class="w-16 px-3 py-3 text-right font-600">Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="f in visible"
            :key="f.id"
            class="group border-b border-steel-100 transition-colors last:border-0 hover:bg-steel-50/60"
            :class="selected.has(f.id) && 'bg-brand-50/40'"
          >
            <td class="px-4 py-3 align-middle">
              <CheckboxRoot
                :model-value="selected.has(f.id)"
                class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
                @update:model-value="(v) => toggleOne(f.id, v)"
              >
                <CheckboxIndicator class="text-white"><Icon name="check" :size="12" /></CheckboxIndicator>
              </CheckboxRoot>
            </td>
            <td class="px-2 py-3 align-middle">
              <button class="flex items-start gap-3 text-left" @click="goEdit(f.id)">
                <span class="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md bg-steel-100 text-steel-400">
                  <Icon name="faq" :size="16" />
                </span>
                <span class="min-w-0">
                  <span class="block truncate text-[14px] font-600 text-graphite-900 group-hover:text-brand-600">
                    {{ f.question.cs || 'Bez otázky' }}
                  </span>
                  <span class="mt-0.5 block max-w-[460px] truncate text-[12px]" :class="plain(f.answer.cs) ? 'text-steel-500' : 'text-amber-600'">
                    {{ plain(f.answer.cs) || 'Odpověď zatím není vyplněná' }}
                  </span>
                </span>
              </button>
            </td>
            <td class="px-2 py-3 align-middle">
              <TagChip :label="f.category" :color="faqCategoryColor(f.category)" />
            </td>
            <td class="px-2 py-3 align-middle">
              <span class="font-mono text-[12.5px] text-steel-500">{{ String(f.order).padStart(2, '0') }}</span>
            </td>
            <td class="px-2 py-3 align-middle">
              <div class="flex flex-wrap items-center gap-1">
                <span
                  v-for="l in LANGS"
                  :key="l.code"
                  :title="`${l.label} — ${LANG_PUBLISH_META[lps(f, l.code as LangCode)].label}`"
                  class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-700 uppercase tabular-nums"
                  :class="LANG_PUBLISH_META[lps(f, l.code as LangCode)].chip"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="LANG_PUBLISH_META[lps(f, l.code as LangCode)].dot" />
                  {{ l.code }}
                </span>
              </div>
            </td>
            <td class="px-2 py-3 align-middle">
              <AppSwitch :model-value="f.published" :aria-label="`Zveřejnit ${f.question.cs}`" @update:model-value="(v) => setPublished(f, v)" />
            </td>
            <td class="px-3 py-3 align-middle">
              <div class="flex justify-end">
                <RowActionsMenu :actions="rowActions" label="Akce s dotazem" @select="(key) => onRowAction(key, f)" />
              </div>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-if="visible.length === 0">
            <td colspan="7" class="px-4 py-16 text-center">
              <div class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-steel-100 text-steel-400"><Icon name="faq" :size="24" /></div>
              <p class="mt-3 text-[14px] font-600 text-graphite-800">Žádné dotazy</p>
              <p class="mt-1 text-[13px] text-steel-500">{{ hasFilters ? 'Zkuste upravit filtry.' : 'Vytvořte první dotaz.' }}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
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

    <!-- Single delete dialog -->
    <DialogRoot :open="!!deleteTarget" @update:open="(v) => !v && (deleteTarget = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500"><Icon name="trash" :size="22" /></div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">Smazat dotaz?</DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
            Chystáte se smazat <span class="font-600 text-graphite-800">„{{ deleteTarget?.question.cs }}"</span>. Tato akce je nevratná.
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
