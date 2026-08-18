<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  AccordionRoot,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
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
import ClearFiltersButton from '@/components/ui/ClearFiltersButton.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'
import { MOCK_FAQ, FAQ_CATEGORIES, faqCategoryColor, type FaqItem } from '@/data/mockFaq'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import { langPublishState, LANG_PUBLISH_META, filledLangsOf } from '@/utils/langPublish'

const router = useRouter()

/* ---------- Filtry ----------
   Těžiště je fulltext v otázce (a odpovědi) — u FAQ hledá redaktor konkrétní
   dotaz podle znění, ne podle abecedy. Výpis je seskupený po kategoriích a
   pořadí v rámci kategorie se mění přetažením řádku za úchyt (viz `groups`
   + drag handlery níže); pole `order` je jen odvozené číslo pozice. */
const search = ref('')
const filterCategory = ref('all')
const filterStatus = ref('all')

const categoryOptions = computed(() => [
  { value: 'all', label: 'Všechny kategorie' },
  ...FAQ_CATEGORIES.map((c) => ({ value: c.label, label: c.label })),
])
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

/* Rozbalené položky accordionu (víc naráz). */
const openItems = ref<string[]>([])

const visible = computed(() => {
  const q = norm(search.value.trim())
  const list = rows.value.filter((f) => {
    const matchesCategory = filterCategory.value === 'all' || f.category === filterCategory.value
    const matchesStatus =
      filterStatus.value === 'all' ||
      (filterStatus.value === 'published' && faqPublished(f)) ||
      (filterStatus.value === 'draft' && !faqPublished(f))
    // Fulltext: otázka napříč všemi mutacemi + prostý text odpovědi (CS).
    const matchesSearch =
      q === '' ||
      LANGS.some((l) => norm(f.question[l.code as LangCode]).includes(q)) ||
      norm(plain(f.answer.cs)).includes(q)
    return matchesCategory && matchesStatus && matchesSearch
  })
  return [...list].sort((a, b) => a.order - b.order)
})

/* ---------- Seskupení po kategoriích + řazení přetažením ----------
   Pořadí je per-kategorie, takže výpis dělíme na sekce podle kategorie a v
   každé sekci se řadí samostatně. */

/** Řazení přetažením dává smysl jen nad úplným seznamem kategorie — při
    hledání nebo filtru stavu je vidět jen podmnožina, takže úchyty schováme. */
const canReorder = computed(
  () => search.value.trim() === '' && filterStatus.value === 'all',
)

/** Sekce výpisu: kategorie (v pořadí dle FAQ_CATEGORIES) + její otázky dle order. */
const groups = computed(() => {
  const byCat = new Map<string, FaqItem[]>()
  for (const f of visible.value) {
    if (!byCat.has(f.category)) byCat.set(f.category, [])
    byCat.get(f.category)!.push(f)
  }
  const rank = FAQ_CATEGORIES.map((c) => c.label)
  const cats = [...byCat.keys()].sort((a, b) => {
    const ia = rank.indexOf(a), ib = rank.indexOf(b)
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib)
  })
  return cats.map((category) => ({
    category,
    color: faqCategoryColor(category),
    items: byCat.get(category)!.slice().sort((a, b) => a.order - b.order),
  }))
})

/* Drag & drop (nativní HTML5, stejný vzor jako widgety na Dashboardu). */
const dragId = ref<string | null>(null)
const dragCat = ref<string | null>(null)
const overId = ref<string | null>(null)

function onDragStart(f: FaqItem, e: DragEvent) {
  dragId.value = f.id
  dragCat.value = f.category
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', f.id) // Firefox potřebuje data
  }
}
function onDragOver(f: FaqItem) {
  // Drop povolíme jen v rámci téže kategorie.
  if (dragId.value && dragCat.value === f.category) overId.value = f.id
}
function onDrop(f: FaqItem) {
  const id = dragId.value
  if (id && dragCat.value === f.category && id !== f.id) {
    const catItems = rows.value
      .filter((x) => x.category === f.category)
      .sort((a, b) => a.order - b.order)
    const from = catItems.findIndex((x) => x.id === id)
    const to = catItems.findIndex((x) => x.id === f.id)
    if (from >= 0 && to >= 0) {
      const [moved] = catItems.splice(from, 1)
      catItems.splice(to, 0, moved)
      catItems.forEach((x, i) => (x.order = i + 1)) // přečíslování pozic
    }
  }
  onDragEnd()
}
function onDragEnd() {
  dragId.value = null
  dragCat.value = null
  overId.value = null
}

/** Dotaz je zveřejněný, když má aspoň jednu živou (zveřejněnou a vyplněnou) mutaci.
    Stav publikace nesou jazykové mutace — samostatný master přepínač proto nemá smysl. */
function faqPublished(f: FaqItem): boolean {
  return LANGS.some((l) => lps(f, l.code as LangCode) === 'live')
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
        </h1>      </div>
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
        <ClearFiltersButton :visible="hasFilters" @clear="clearFilters" />
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

    <!-- Výpis: seskupeno po kategoriích; v každé sekci řazení přetažením za úchyt -->
    <div class="overflow-hidden rounded-lg border border-steel-200 bg-white">
      <!-- Záhlaví: vybrat vše + nápověda k řazení -->
      <div class="flex items-center gap-3 border-b border-steel-200 bg-steel-50 px-4 py-2.5 text-[11px] font-600 uppercase tracking-wider text-steel-500">
        <CheckboxRoot
          :model-value="allSelected"
          aria-label="Vybrat vše"
          class="grid h-4 w-4 shrink-0 place-items-center rounded border border-steel-300 bg-white data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
          @update:model-value="toggleAll"
        >
          <CheckboxIndicator class="text-white"><Icon name="check" :size="12" /></CheckboxIndicator>
        </CheckboxRoot>
        <span>Otázka</span>
        <span
          v-if="visible.length && !canReorder"
          class="ml-auto inline-flex items-center gap-1 font-500 normal-case tracking-normal text-steel-400"
        >
          <Icon name="grip" :size="13" /> Řazení přetažením je dostupné bez hledání a filtru stavu
        </span>
      </div>

      <template v-if="visible.length">
        <div v-for="g in groups" :key="g.category">
          <!-- Sekce kategorie -->
          <div class="flex items-center gap-2 border-b border-steel-100 bg-steel-50/60 px-4 py-2">
            <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: g.color }" />
            <span class="text-[12.5px] font-700 text-graphite-800">{{ g.category }}</span>
            <span class="text-[11px] font-600 text-steel-400">{{ g.items.length }}</span>
          </div>

          <AccordionRoot v-model="openItems" type="multiple" class="divide-y divide-steel-100">
            <AccordionItem
              v-for="f in g.items"
              :key="f.id"
              :value="f.id"
              class="relative transition-colors"
              :class="[
                selected.has(f.id) && 'bg-brand-50/40',
                dragId === f.id && 'opacity-40',
                overId === f.id && dragId && dragId !== f.id && 'shadow-[inset_0_2px_0_0_var(--color-brand-500)]',
              ]"
              @dragover.prevent="onDragOver(f)"
              @drop="onDrop(f)"
            >
              <!-- Řádek otázky -->
              <div class="flex items-center gap-2 px-4 py-2.5">
                <!-- Úchyt pro přetažení (jen když lze řadit) -->
                <button
                  v-if="canReorder"
                  type="button"
                  draggable="true"
                  class="grid h-7 w-6 shrink-0 cursor-grab place-items-center rounded text-steel-300 transition-colors hover:bg-steel-100 hover:text-steel-500 active:cursor-grabbing"
                  title="Přetáhni pro změnu pořadí v kategorii"
                  aria-label="Přetáhnout pro změnu pořadí"
                  @click.stop
                  @dragstart="onDragStart(f, $event)"
                  @dragend="onDragEnd"
                >
                  <Icon name="grip" :size="15" />
                </button>
                <span v-else class="w-6 shrink-0" />

                <CheckboxRoot
                  :model-value="selected.has(f.id)"
                  :aria-label="`Vybrat ${f.question.cs}`"
                  class="grid h-4 w-4 shrink-0 place-items-center rounded border border-steel-300 bg-white data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
                  @update:model-value="(v) => toggleOne(f.id, v)"
                >
                  <CheckboxIndicator class="text-white"><Icon name="check" :size="12" /></CheckboxIndicator>
                </CheckboxRoot>

                <!-- Spouštěč = otázka (rozbalí odpověď) -->
                <AccordionHeader class="min-w-0 flex-1">
                  <AccordionTrigger class="group flex w-full items-center gap-3 text-left outline-none">
                    <span class="block min-w-0 flex-1 truncate text-[14px] font-600 text-graphite-900 group-hover:text-brand-600">
                      {{ f.question.cs || 'Bez otázky' }}
                    </span>
                    <!-- Jazykové mutace -->
                    <span class="hidden shrink-0 items-center gap-1 md:flex">
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
                    </span>
                    <Icon name="chevronDown" :size="18" class="shrink-0 text-steel-400 transition-transform group-data-[state=open]:rotate-180" />
                  </AccordionTrigger>
                </AccordionHeader>

                <!-- Akce (mimo spouštěč) -->
                <RowActionsMenu :actions="rowActions" label="Akce s dotazem" @select="(key) => onRowAction(key, f)" />
              </div>

              <!-- Odpověď (rozbaleno) -->
              <AccordionContent class="acc-content">
                <div class="px-4 pb-4 pl-[72px]">
                  <div v-if="plain(f.answer.cs)" class="faq-answer max-w-3xl text-[13.5px] leading-relaxed text-steel-600" v-html="f.answer.cs" />
                  <p v-else class="flex items-center gap-1.5 text-[13px] text-amber-600">
                    <Icon name="x" :size="14" /> Odpověď zatím není vyplněná.
                  </p>
                  <div class="mt-3">
                    <AppButton variant="secondary" size="sm" @click="goEdit(f.id)"><Icon name="edit" :size="14" /> Editovat dotaz</AppButton>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </AccordionRoot>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else class="px-4 py-16 text-center">
        <div class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-steel-100 text-steel-400"><Icon name="faq" :size="24" /></div>
        <p class="mt-3 text-[14px] font-600 text-graphite-800">Žádné dotazy</p>
        <p class="mt-1 text-[13px] text-steel-500">{{ hasFilters ? 'Zkuste upravit filtry.' : 'Vytvořte první dotaz.' }}</p>
      </div>
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

<style scoped>
/* Animace rozbalení (reka-ui poskytuje výšku obsahu přes CSS proměnnou). */
.acc-content {
  overflow: hidden;
}
.acc-content[data-state='open'] {
  animation: acc-down 200ms ease-out;
}
.acc-content[data-state='closed'] {
  animation: acc-up 160ms ease-in;
}
@keyframes acc-down {
  from { height: 0; }
  to { height: var(--reka-accordion-content-height); }
}
@keyframes acc-up {
  from { height: var(--reka-accordion-content-height); }
  to { height: 0; }
}

/* Čitelné formátování richtextu odpovědi v náhledu. */
.faq-answer :deep(p) { margin: 0 0 0.5rem; }
.faq-answer :deep(p:last-child) { margin-bottom: 0; }
.faq-answer :deep(ul) { margin: 0.25rem 0 0.5rem; padding-left: 1.1rem; list-style: disc; }
.faq-answer :deep(ol) { margin: 0.25rem 0 0.5rem; padding-left: 1.2rem; list-style: decimal; }
.faq-answer :deep(li) { margin: 0.15rem 0; }
.faq-answer :deep(a) { color: var(--color-brand-600); text-decoration: underline; }
.faq-answer :deep(strong) { font-weight: 700; color: var(--color-graphite-800); }
</style>
