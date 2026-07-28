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
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
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
import { MOCK_NEWS, publishState, STATE_META } from '@/data/mockNews'
import type { NewsItem, LangCode } from '@/data/types'

const router = useRouter()

/* ---------- Filtry ---------- */
const filterStatus = ref('all')
const filterLang = ref('all')
const filterFrom = ref('')
const filterTo = ref('')
const sortBy = ref('newest')

const statusOptions = [
  { value: 'all', label: 'Všechny stavy' },
  { value: 'active', label: 'Publikováno' },
  { value: 'scheduled', label: 'Naplánováno' },
  { value: 'expired', label: 'Ukončeno' },
  { value: 'draft', label: 'Koncept' },
]
const langOptions = [
  { value: 'all', label: 'Všechny jazyky' },
  { value: 'cs', label: 'Čeština' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
]
const sortOptions = [
  { value: 'newest', label: 'Nejnovější' },
  { value: 'oldest', label: 'Nejstarší' },
  { value: 'title', label: 'Podle názvu (A–Z)' },
]

const hasFilters = computed(
  () =>
    filterStatus.value !== 'all' ||
    filterLang.value !== 'all' ||
    !!filterFrom.value ||
    !!filterTo.value ||
    sortBy.value !== 'newest',
)
function clearFilters() {
  filterStatus.value = 'all'
  filterLang.value = 'all'
  filterFrom.value = ''
  filterTo.value = ''
  sortBy.value = 'newest'
}

/* ---------- Data + mazání (prototyp — jen lokální stav) ---------- */
const rows = ref<NewsItem[]>([...MOCK_NEWS])
const deleteTarget = ref<NewsItem | null>(null)

const visible = computed(() => {
  const list = rows.value.filter((n) => {
    const matchesStatus = filterStatus.value === 'all' || publishState(n) === filterStatus.value
    const matchesLang =
      filterLang.value === 'all' || n.title[filterLang.value as LangCode].trim() !== ''
    const from = n.dateFrom ? n.dateFrom.slice(0, 10) : ''
    const matchesFrom = !filterFrom.value || (from && from >= filterFrom.value)
    const matchesTo = !filterTo.value || (from && from <= filterTo.value)
    return matchesStatus && matchesLang && matchesFrom && matchesTo
  })
  return [...list].sort((a, b) => {
    if (sortBy.value === 'title') return a.title.cs.localeCompare(b.title.cs, 'cs')
    const ta = a.dateFrom ? new Date(a.dateFrom).getTime() : 0
    const tb = b.dateFrom ? new Date(b.dateFrom).getTime() : 0
    return sortBy.value === 'oldest' ? ta - tb : tb - ta
  })
})

function confirmDeleteOne() {
  if (!deleteTarget.value) return
  const id = deleteTarget.value.id
  rows.value = rows.value.filter((n) => n.id !== id)
  const next = new Set(selected.value)
  next.delete(id)
  selected.value = next
  deleteTarget.value = null
}
function confirmDeleteBulk() {
  rows.value = rows.value.filter((n) => !selected.value.has(n.id))
  selected.value = new Set()
}

/* ---------- Výběr / hromadné akce (nad viditelnými řádky) ---------- */
const selected = ref<Set<string>>(new Set())
const allSelected = computed(
  () => visible.value.length > 0 && visible.value.every((n) => selected.value.has(n.id)),
)
function toggleAll(v: boolean | 'indeterminate') {
  const next = new Set(selected.value)
  if (v === true) visible.value.forEach((n) => next.add(n.id))
  else visible.value.forEach((n) => next.delete(n.id))
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
  const d = new Date(dt)
  return d.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
}
function fmtTime(dt: string | null): string {
  if (!dt) return ''
  return new Date(dt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
}

function goNew() {
  router.push({ name: 'news-new' })
}
function goEdit(id: string) {
  router.push({ name: 'news-edit', params: { id } })
}

/* ---------- Stránkování (Reka Pagination) ----------
   Prototyp: dataset je simulovaný na větší počet, aby byl vidět
   vícestránkový ovládací prvek. Řádky se reálně neposílají. */
const page = ref(1)
const perPage = 24
const totalItems = 138
const rangeStart = computed(() => (page.value - 1) * perPage + 1)
const rangeEnd = computed(() => Math.min(page.value * perPage, totalItems))
</script>

<template>
  <div class="px-8 py-6">
    <!-- Page header -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">news</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/news/list</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">
          Aktuality
        </h1>
        <p class="mt-1.5 text-[13.5px] text-steel-500">
          {{ visible.length }} {{ visible.length === 1 ? 'položka' : 'položek' }} · časově řízené
          příspěvky na webu
        </p>
      </div>
      <AppButton variant="primary" @click="goNew">
        <Icon name="plus" :size="17" />
        Nová aktualita
      </AppButton>
    </div>

    <!-- Filter bar -->
    <div class="mb-4 rounded-lg border border-steel-200 bg-white p-3">
      <div class="flex flex-wrap items-end gap-x-3 gap-y-3">
        <div>
          <label class="mb-1 block field-tag">Stav publikace</label>
          <AppSelect v-model="filterStatus" :options="statusOptions" />
        </div>
        <div>
          <label class="mb-1 block field-tag">Jazyková mutace</label>
          <AppSelect v-model="filterLang" :options="langOptions" />
        </div>
        <div>
          <label class="mb-1 block field-tag">Publikace OD</label>
          <input
            v-model="filterFrom"
            type="date"
            class="h-9 rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label class="mb-1 block field-tag">Publikace DO</label>
          <input
            v-model="filterTo"
            type="date"
            class="h-9 rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
          />
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
        class="mb-3 flex items-center justify-between rounded-lg border border-brand-500/30 bg-brand-50 px-4 py-2.5"
      >
        <span class="text-[13px] font-600 text-brand-700">
          Vybráno {{ selected.size }} {{ selected.size === 1 ? 'položka' : 'položek' }}
        </span>
        <div class="flex items-center gap-2">
          <button
            class="text-[12.5px] font-500 text-steel-500 hover:text-graphite-800"
            @click="selected = new Set()"
          >
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
              <DialogContent
                class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl"
              >
                <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500">
                  <Icon name="trash" :size="22" />
                </div>
                <DialogTitle class="font-display text-lg font-700 text-graphite-900">
                  Smazat {{ selected.size }} {{ selected.size === 1 ? 'aktualitu' : 'aktualit' }}?
                </DialogTitle>
                <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
                  Tato akce je nevratná. Vybrané aktuality se odstraní ze všech jazykových mutací.
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
                <CheckboxIndicator class="text-white">
                  <Icon name="check" :size="12" />
                </CheckboxIndicator>
              </CheckboxRoot>
            </th>
            <th class="px-2 py-3 font-600">Název aktuality</th>
            <th class="px-2 py-3 font-600">Publikace OD – DO</th>
            <th class="px-2 py-3 font-600">Stav</th>
            <th class="w-32 px-4 py-3 text-right font-600">Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="n in visible"
            :key="n.id"
            class="group border-b border-steel-100 transition-colors last:border-0 hover:bg-steel-50/60"
            :class="selected.has(n.id) && 'bg-brand-50/40'"
          >
            <td class="px-4 py-3 align-middle">
              <CheckboxRoot
                :model-value="selected.has(n.id)"
                class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
                @update:model-value="(v) => toggleOne(n.id, v)"
              >
                <CheckboxIndicator class="text-white">
                  <Icon name="check" :size="12" />
                </CheckboxIndicator>
              </CheckboxRoot>
            </td>
            <td class="px-2 py-3 align-middle">
              <button class="flex items-center gap-3 text-left" @click="goEdit(n.id)">
                <span class="grid h-10 w-14 shrink-0 place-items-center overflow-hidden rounded-md bg-steel-100 text-steel-400">
                  <img
                    v-if="n.gallery[0]"
                    :src="n.gallery[0].src"
                    :alt="n.gallery[0].alt"
                    class="h-full w-full object-cover"
                  />
                  <Icon v-else name="image" :size="16" />
                </span>
                <span class="min-w-0">
                  <span class="block truncate text-[14px] font-600 text-graphite-900 group-hover:text-brand-600">
                    {{ n.title.cs || 'Bez názvu' }}
                  </span>
                  <span class="mt-0.5 flex items-center gap-2 font-mono text-[10.5px] text-steel-400">
                    <span>{{ n.id }}</span>
                    <span v-if="n.gallery.length" class="flex items-center gap-1">
                      <Icon name="image" :size="11" /> {{ n.gallery.length }}
                    </span>
                    <span v-if="n.attachments.length" class="flex items-center gap-1">
                      <Icon name="paperclip" :size="11" /> {{ n.attachments.length }}
                    </span>
                  </span>
                </span>
              </button>
            </td>
            <td class="px-2 py-3 align-middle">
              <div class="flex items-center gap-2 text-[13px] text-graphite-700">
                <span class="tabular-nums">{{ fmt(n.dateFrom) }}</span>
                <span class="text-steel-300">→</span>
                <span class="tabular-nums" :class="!n.dateTo && 'text-steel-400'">{{ fmt(n.dateTo) }}</span>
              </div>
              <div v-if="n.dateFrom" class="mt-0.5 font-mono text-[10.5px] text-steel-400">
                {{ fmtTime(n.dateFrom) }}<span v-if="n.dateTo"> – {{ fmtTime(n.dateTo) }}</span>
              </div>
            </td>
            <td class="px-2 py-3 align-middle">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600"
                :class="[STATE_META[publishState(n)].bg, STATE_META[publishState(n)].text]"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="STATE_META[publishState(n)].dot" />
                {{ STATE_META[publishState(n)].label }}
              </span>
            </td>
            <td class="px-4 py-3 align-middle">
              <TooltipProvider :delay-duration="250">
                <div class="flex items-center justify-end gap-1">
                  <TooltipRoot>
                    <TooltipTrigger as-child>
                      <a
                        href="#"
                        target="_blank"
                        class="grid h-8 w-8 place-items-center rounded-md text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-800"
                        @click.prevent
                      >
                        <Icon name="eye" :size="17" />
                      </a>
                    </TooltipTrigger>
                    <TooltipPortal>
                      <TooltipContent side="top" class="rounded bg-graphite-900 px-2 py-1 text-[11.5px] text-white">
                        Náhled na webu
                      </TooltipContent>
                    </TooltipPortal>
                  </TooltipRoot>

                  <TooltipRoot>
                    <TooltipTrigger as-child>
                      <button
                        class="grid h-8 w-8 place-items-center rounded-md text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-800"
                        @click="goEdit(n.id)"
                      >
                        <Icon name="edit" :size="16" />
                      </button>
                    </TooltipTrigger>
                    <TooltipPortal>
                      <TooltipContent side="top" class="rounded bg-graphite-900 px-2 py-1 text-[11.5px] text-white">
                        Editovat
                      </TooltipContent>
                    </TooltipPortal>
                  </TooltipRoot>

                  <TooltipRoot>
                    <TooltipTrigger as-child>
                      <button
                        class="grid h-8 w-8 place-items-center rounded-md text-steel-400 transition-colors hover:bg-danger-500/10 hover:text-danger-500"
                        @click="deleteTarget = n"
                      >
                        <Icon name="trash" :size="16" />
                      </button>
                    </TooltipTrigger>
                    <TooltipPortal>
                      <TooltipContent side="top" class="rounded bg-graphite-900 px-2 py-1 text-[11.5px] text-white">
                        Smazat
                      </TooltipContent>
                    </TooltipPortal>
                  </TooltipRoot>
                </div>
              </TooltipProvider>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-if="visible.length === 0">
            <td colspan="5" class="px-4 py-16 text-center">
              <div class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-steel-100 text-steel-400">
                <Icon name="news" :size="24" />
              </div>
              <p class="mt-3 text-[14px] font-600 text-graphite-800">Žádné aktuality</p>
              <p class="mt-1 text-[13px] text-steel-500">
                {{ hasFilters ? 'Zkuste upravit filtry.' : 'Vytvořte první aktualitu.' }}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination (Reka Pagination) -->
    <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p class="text-[12.5px] text-steel-500">
        Zobrazeno
        <span class="font-600 text-graphite-800">{{ rangeStart }}–{{ rangeEnd }}</span>
        z {{ totalItems }}
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
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">Smazat aktualitu?</DialogTitle>
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
