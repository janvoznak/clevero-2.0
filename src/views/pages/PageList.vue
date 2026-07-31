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
  RadioGroupRoot,
  RadioGroupItem,
  RadioGroupIndicator,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'
import { LANGS } from '@/data/types'
import {
  MOCK_PAGES,
  treeRows,
  hasChildren,
  ancestorDisabled,
  type PageItem,
  type TreeRow,
} from '@/data/mockPages'

const router = useRouter()

/* ---------- Data (prototyp — lokální stav) ---------- */
const rows = ref<PageItem[]>([...MOCK_PAGES])
const collapsed = ref<Set<string>>(new Set())

/* ---------- Filtry: Stav + fulltextové hledání ---------- */
const filterStatus = ref('all')
const search = ref('')
const statusOptions = [
  { value: 'all', label: 'Všechny stavy' },
  { value: 'active', label: 'Aktivní' },
  { value: 'inactive', label: 'Neaktivní' },
]
const hasFilters = computed(() => filterStatus.value !== 'all' || search.value.trim() !== '')
function clearFilters() {
  filterStatus.value = 'all'
  search.value = ''
}

/* Při aktivním filtru/hledání zobrazíme plochý filtrovaný seznam; jinak strom. */
const visibleRows = computed<TreeRow[]>(() => {
  if (!hasFilters.value) return treeRows(rows.value, collapsed.value)
  const q = search.value.trim().toLowerCase()
  return rows.value
    .filter((p) => {
      const mS =
        filterStatus.value === 'all' ||
        (filterStatus.value === 'active' && p.enabled) ||
        (filterStatus.value === 'inactive' && !p.enabled)
      const mQ =
        !q ||
        LANGS.some((l) => p.title[l.code].toLowerCase().includes(q)) ||
        p.slug.cs.toLowerCase().includes(q)
      return mS && mQ
    })
    .sort((a, b) => a.title.cs.localeCompare(b.title.cs, 'cs'))
    .map((page) => ({ page, depth: 0, hasKids: false }))
})

function toggleCollapse(id: string) {
  const next = new Set(collapsed.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  collapsed.value = next
}

function setEnabled(p: PageItem, v: boolean) {
  p.enabled = v // prototyp — lokální stav
}

/* ---------- Výběr / hromadné akce ---------- */
const selected = ref<Set<string>>(new Set())
const allSelected = computed(
  () => visibleRows.value.length > 0 && visibleRows.value.every((r) => selected.value.has(r.page.id)),
)
function toggleAll(v: boolean | 'indeterminate') {
  const next = new Set(selected.value)
  if (v === true) visibleRows.value.forEach((r) => next.add(r.page.id))
  else visibleRows.value.forEach((r) => next.delete(r.page.id))
  selected.value = next
}
function toggleOne(id: string, v: boolean | 'indeterminate') {
  const next = new Set(selected.value)
  if (v === true) next.add(id)
  else next.delete(id)
  selected.value = next
}
function bulkSetEnabled(v: boolean) {
  rows.value.forEach((p) => {
    if (selected.value.has(p.id)) p.enabled = v
  })
}
function confirmDeleteBulk() {
  rows.value = rows.value.filter((p) => !selected.value.has(p.id))
  selected.value = new Set()
}

/* ---------- Mazání (s ohledem na potomky) ---------- */
const deleteTarget = ref<PageItem | null>(null)
const deleteMode = ref<'move' | 'cascade'>('move')
const targetHasKids = computed(() => (deleteTarget.value ? hasChildren(rows.value, deleteTarget.value.id) : false))
function askDelete(p: PageItem) {
  deleteMode.value = 'move'
  deleteTarget.value = p
}
function confirmDeleteOne() {
  const t = deleteTarget.value
  if (!t) return
  if (targetHasKids.value && deleteMode.value === 'move') {
    // Potomky přesuneme o úroveň výš (na rodiče mazané stránky)
    rows.value.forEach((p) => {
      if (p.parentId === t.id) p.parentId = t.parentId
    })
    rows.value = rows.value.filter((p) => p.id !== t.id)
  } else if (targetHasKids.value && deleteMode.value === 'cascade') {
    // Kaskádové smazání celé podvětve
    const toRemove = new Set<string>([t.id])
    let changed = true
    while (changed) {
      changed = false
      for (const p of rows.value) {
        if (p.parentId && toRemove.has(p.parentId) && !toRemove.has(p.id)) {
          toRemove.add(p.id)
          changed = true
        }
      }
    }
    rows.value = rows.value.filter((p) => !toRemove.has(p.id))
  } else {
    rows.value = rows.value.filter((p) => p.id !== t.id)
  }
  deleteTarget.value = null
}

/* ---------- Navigace / řádkové akce ---------- */
function goNew() {
  router.push({ name: 'page-new' })
}
function goEdit(id: string) {
  router.push({ name: 'page-edit', params: { id } })
}
function goSubpage(parentId: string) {
  router.push({ name: 'page-new', query: { parent: parentId } })
}
const rowActions = [
  { key: 'edit', label: 'Editovat stránku', icon: 'edit' },
  { key: 'preview', label: 'Náhled na webu', icon: 'eye' },
  { key: 'subpage', label: 'Přidat podstránku', icon: 'subpage' },
  { key: 'delete', label: 'Smazat stránku', icon: 'trash', danger: true },
]
function onRowAction(key: string, p: PageItem) {
  if (key === 'edit') goEdit(p.id)
  else if (key === 'subpage') goSubpage(p.id)
  else if (key === 'delete') askDelete(p)
  // 'preview' — prototyp: náhled na webu je mrtvý odkaz
}

function footerLabel(p: PageItem): string {
  return `Patička ${p.allowFooter}`
}
</script>

<template>
  <div class="px-8 py-6">
    <!-- Page header -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">page</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/page/list</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">Stránky</h1>
        <p class="mt-1.5 text-[13.5px] text-steel-500">
          {{ rows.length }} stránek · hierarchická struktura webu
        </p>
      </div>
      <AppButton variant="primary" @click="goNew">
        <Icon name="plus" :size="17" />
        Nová stránka
      </AppButton>
    </div>

    <!-- Filter bar -->
    <div class="mb-4 rounded-lg border border-steel-200 bg-white p-3">
      <div class="flex flex-wrap items-end gap-x-3 gap-y-3">
        <div>
          <label class="mb-1 block field-tag">Stav</label>
          <AppSelect v-model="filterStatus" :options="statusOptions" />
        </div>
        <div class="min-w-[260px] flex-1 sm:max-w-sm">
          <label class="mb-1 block field-tag">Vyhledat stránku</label>
          <div class="relative">
            <Icon name="search" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
            <input
              v-model="search"
              type="text"
              placeholder="Hledat podle názvu nebo slugu…"
              class="h-9 w-full rounded-md border border-steel-200 pl-9 pr-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
        <button
          v-if="hasFilters"
          class="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-500 text-steel-500 transition-colors hover:bg-steel-100 hover:text-graphite-800"
          @click="clearFilters"
        >
          <Icon name="x" :size="14" /> Zrušit filtry
        </button>
        <p v-if="hasFilters" class="ml-auto self-center text-[12px] text-steel-400">
          Filtrovaný výpis (plochý). Zrušením filtrů se vrátíte do stromu.
        </p>
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
        <span class="text-[13px] font-600 text-brand-700">Vybráno {{ selected.size }} stránek</span>
        <div class="flex items-center gap-2">
          <button class="text-[12.5px] font-500 text-steel-500 hover:text-graphite-800" @click="selected = new Set()">
            Zrušit výběr
          </button>
          <AppButton variant="secondary" size="sm" @click="bulkSetEnabled(true)">
            <Icon name="check" :size="15" /> Zapnout
          </AppButton>
          <AppButton variant="secondary" size="sm" @click="bulkSetEnabled(false)">
            <Icon name="x" :size="15" /> Vypnout
          </AppButton>
          <DialogRoot>
            <DialogTrigger as-child>
              <AppButton variant="danger" size="sm"><Icon name="trash" :size="15" /> Smazat vybrané</AppButton>
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
                  Smazat {{ selected.size }} stránek?
                </DialogTitle>
                <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
                  Tato akce je nevratná. Podstránky vybraných stránek budou odstraněny také.
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

    <!-- Tree table -->
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
            <th class="px-2 py-3 font-600">Název stránky</th>
            <th class="px-2 py-3 font-600">Umístění</th>
            <th class="px-2 py-3 font-600">Jazykové mutace</th>
            <th class="w-24 px-2 py-3 font-600">Stav</th>
            <th class="w-16 px-3 py-3 text-right font-600">Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="{ page: p, depth, hasKids } in visibleRows"
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
                <CheckboxIndicator class="text-white"><Icon name="check" :size="12" /></CheckboxIndicator>
              </CheckboxRoot>
            </td>
            <td class="px-2 py-3 align-middle">
              <div class="flex items-center gap-1.5" :style="{ paddingLeft: depth * 22 + 'px' }">
                <!-- Drag handle (prototyp — vizuální) -->
                <Icon name="grip" :size="14" class="shrink-0 cursor-grab text-steel-300" />
                <!-- Expand / collapse -->
                <button
                  v-if="hasKids"
                  class="grid h-5 w-5 shrink-0 place-items-center rounded text-steel-500 transition-colors hover:bg-steel-100 hover:text-graphite-800"
                  @click="toggleCollapse(p.id)"
                >
                  <Icon :name="collapsed.has(p.id) ? 'chevronRight' : 'chevronDown'" :size="15" />
                </button>
                <span v-else class="w-5 shrink-0" />
                <button class="flex min-w-0 items-center gap-2 text-left" @click="goEdit(p.id)">
                  <Icon :name="hasKids ? 'layers' : 'page'" :size="15" class="shrink-0 text-steel-400" />
                  <span class="min-w-0">
                    <span class="block truncate text-[14px] font-600 text-graphite-900 group-hover:text-brand-600">
                      {{ p.title.cs || 'Bez názvu' }}
                    </span>
                    <span v-if="ancestorDisabled(rows, p.id)" class="text-[10.5px] font-500 text-amber-600">
                      Skryto — neaktivní rodič
                    </span>
                  </span>
                </button>
              </div>
            </td>
            <td class="px-2 py-3 align-middle">
              <div class="flex flex-wrap items-center gap-1">
                <span v-if="p.allowMenu" class="inline-flex items-center gap-1 rounded-full bg-steel-100 px-2 py-0.5 text-[10.5px] font-600 text-steel-600">
                  <Icon name="reference" :size="11" /> Menu
                </span>
                <span v-if="p.allowFooter !== '0'" class="inline-flex items-center gap-1 rounded-full bg-steel-100 px-2 py-0.5 text-[10.5px] font-600 text-steel-600">
                  <Icon name="layout" :size="11" /> {{ footerLabel(p) }}
                </span>
                <span v-if="p.allowHp" class="inline-flex items-center gap-1 rounded-full bg-steel-100 px-2 py-0.5 text-[10.5px] font-600 text-steel-600">
                  <Icon name="home" :size="11" /> HP
                </span>
                <span v-if="!p.allowMenu && p.allowFooter === '0' && !p.allowHp" class="text-[11px] text-steel-400">—</span>
              </div>
            </td>
            <td class="px-2 py-3 align-middle">
              <div class="flex flex-wrap items-center gap-1">
                <span
                  v-for="l in LANGS"
                  :key="l.code"
                  :title="p.title[l.code].trim() ? `${l.label} — vyplněno` : `${l.label} — chybí překlad`"
                  class="rounded px-1.5 py-0.5 text-[10.5px] font-700 uppercase tabular-nums"
                  :class="p.title[l.code].trim() ? 'bg-forge-500/10 text-forge-600' : 'bg-steel-100 text-steel-400'"
                >
                  {{ l.code }}
                </span>
              </div>
            </td>
            <td class="px-2 py-3 align-middle">
              <AppSwitch
                :model-value="p.enabled"
                :aria-label="`Zobrazovat ${p.title.cs}`"
                @update:model-value="(v) => setEnabled(p, v)"
              />
            </td>
            <td class="px-3 py-3 align-middle">
              <div class="flex justify-end">
                <RowActionsMenu :actions="rowActions" label="Akce se stránkou" @select="(key) => onRowAction(key, p)" />
              </div>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-if="visibleRows.length === 0">
            <td colspan="6" class="px-4 py-16 text-center">
              <div class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-steel-100 text-steel-400">
                <Icon name="page" :size="24" />
              </div>
              <p class="mt-3 text-[14px] font-600 text-graphite-800">Žádné stránky</p>
              <p class="mt-1 text-[13px] text-steel-500">
                {{ hasFilters ? 'Zkuste upravit filtry.' : 'Vytvořte první stránku.' }}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete dialog (s ohledem na potomky) -->
    <DialogRoot :open="!!deleteTarget" @update:open="(v) => !v && (deleteTarget = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent
          class="fixed left-1/2 top-1/2 z-50 w-[460px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl"
        >
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500">
            <Icon name="trash" :size="22" />
          </div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">Smazat stránku?</DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
            Chystáte se smazat <span class="font-600 text-graphite-800">„{{ deleteTarget?.title.cs }}"</span>.
            Tato akce je nevratná.
          </DialogDescription>

          <!-- Volba pro stránku s potomky -->
          <div v-if="targetHasKids" class="mt-4">
            <p class="mb-2 text-[12.5px] font-600 text-graphite-800">Tato stránka má podstránky. Jak s nimi naložit?</p>
            <RadioGroupRoot v-model="deleteMode" class="space-y-2">
              <label
                v-for="opt in [
                  { value: 'move', title: 'Přesunout podstránky o úroveň výš', desc: 'Podstránky se zachovají a přeřadí k rodiči mazané stránky.' },
                  { value: 'cascade', title: 'Smazat kaskádově vše', desc: 'Odstraní stránku i všechny její podstránky.' },
                ]"
                :key="opt.value"
                class="flex cursor-pointer items-start gap-2.5 rounded-md border border-steel-200 p-3 transition-colors has-[[data-state=checked]]:border-brand-500 has-[[data-state=checked]]:bg-brand-50"
              >
                <RadioGroupItem
                  :value="opt.value"
                  class="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-steel-300 bg-white outline-none data-[state=checked]:border-brand-500"
                >
                  <RadioGroupIndicator class="h-2 w-2 rounded-full bg-brand-500" />
                </RadioGroupItem>
                <span>
                  <span class="block text-[13px] font-600 text-graphite-800">{{ opt.title }}</span>
                  <span class="block text-[11.5px] leading-snug text-steel-500">{{ opt.desc }}</span>
                </span>
              </label>
            </RadioGroupRoot>
          </div>

          <div class="mt-5 flex justify-end gap-2">
            <AppButton variant="secondary" @click="deleteTarget = null">Zrušit</AppButton>
            <AppButton variant="danger" @click="confirmDeleteOne">Smazat</AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
