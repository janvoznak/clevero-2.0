<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import TagChip from '@/components/ui/TagChip.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'
import {
  MOCK_VENUES,
  PREDEFINED_AREA_TAGS,
  areaTagColor,
  OPEN_STATE_META,
  type AreaObject,
} from '@/data/mockVenues'
import { LANGS } from '@/data/types'

const router = useRouter()
const rows = ref<AreaObject[]>([...MOCK_VENUES])

/* ---------- Filtry ---------- */
const search = ref('')
const filterTag = ref('all')
const filterState = ref('all')
const tagOptions = [{ value: 'all', label: 'Všechny štítky' }, ...PREDEFINED_AREA_TAGS.map((t) => ({ value: t.label, label: t.label }))]
const stateOptions = [
  { value: 'all', label: 'Všechny stavy' },
  { value: 'open', label: 'Otevřeno' },
  { value: 'closed', label: 'Zavřeno' },
  { value: 'seasonal', label: 'Sezónně' },
]
const hasFilters = computed(() => search.value.trim() !== '' || filterTag.value !== 'all' || filterState.value !== 'all')
function clearFilters() {
  search.value = ''
  filterTag.value = 'all'
  filterState.value = 'all'
}

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rows.value.filter((v) => {
    const mQ = !q || v.title.cs.toLowerCase().includes(q) || v.summary.cs.toLowerCase().includes(q)
    const mT = filterTag.value === 'all' || v.tags.includes(filterTag.value)
    const mS = filterState.value === 'all' || v.openState === filterState.value
    return mQ && mT && mS
  })
})

/* ---------- Navigace / řádkové akce ---------- */
function goNew() {
  router.push({ name: 'area-new' })
}
function goEdit(id: string) {
  router.push({ name: 'area-edit', params: { id } })
}
const rowActions = [
  { key: 'edit', label: 'Editovat objekt', icon: 'edit' },
  { key: 'preview', label: 'Náhled na webu', icon: 'eye' },
  { key: 'delete', label: 'Smazat objekt', icon: 'trash', danger: true },
]
const deleteTarget = ref<AreaObject | null>(null)
function onRowAction(key: string, v: AreaObject) {
  if (key === 'edit') goEdit(v.id)
  else if (key === 'delete') deleteTarget.value = v
}
function confirmDelete() {
  if (deleteTarget.value) rows.value = rows.value.filter((v) => v.id !== deleteTarget.value!.id)
  deleteTarget.value = null
}
</script>

<template>
  <div class="px-8 py-6">
    <!-- Header -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">area</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/area/list</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">Areál</h1>
        <p class="mt-1.5 text-[13.5px] text-steel-500">
          {{ rows.length }} objektů · budovy a místa v areálu DOV · propojení s akcemi, galeriemi a Colosseem
        </p>
      </div>
      <AppButton variant="primary" @click="goNew">
        <Icon name="plus" :size="17" />
        Nový objekt
      </AppButton>
    </div>

    <!-- Filter bar -->
    <div class="mb-4 rounded-lg border border-steel-200 bg-white p-3">
      <div class="flex flex-wrap items-end gap-x-3 gap-y-3">
        <div>
          <label class="mb-1 block field-tag">Štítek</label>
          <AppSelect v-model="filterTag" :options="tagOptions" />
        </div>
        <div>
          <label class="mb-1 block field-tag">Stav</label>
          <AppSelect v-model="filterState" :options="stateOptions" />
        </div>
        <div class="min-w-[240px] flex-1 sm:max-w-sm">
          <label class="mb-1 block field-tag">Vyhledat objekt</label>
          <div class="relative">
            <Icon name="search" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
            <input
              v-model="search"
              type="text"
              placeholder="Hledat podle názvu…"
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
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-lg border border-steel-200 bg-white">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
            <th class="px-4 py-3 font-600">Objekt</th>
            <th class="px-2 py-3 font-600">Štítky</th>
            <th class="w-28 px-2 py-3 font-600">Stav</th>
            <th class="w-40 px-2 py-3 font-600">Jazykové mutace</th>
            <th class="w-16 px-3 py-3 text-right font-600">Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="v in visible"
            :key="v.id"
            class="group border-b border-steel-100 transition-colors last:border-0 hover:bg-steel-50/60"
          >
            <!-- Objekt -->
            <td class="px-4 py-3 align-middle">
              <button class="flex items-center gap-3 text-left" @click="goEdit(v.id)">
                <span class="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-steel-100">
                  <img v-if="v.image" :src="v.image" :alt="v.title.cs" class="h-full w-full object-cover" />
                </span>
                <span class="min-w-0">
                  <span class="block truncate text-[14px] font-600 text-graphite-900 group-hover:text-brand-600">
                    {{ v.title.cs || 'Bez názvu' }}
                  </span>
                  <span class="block max-w-[320px] truncate text-[12px] text-steel-500">{{ v.summary.cs }}</span>
                </span>
              </button>
            </td>
            <!-- Štítky -->
            <td class="px-2 py-3 align-middle">
              <span v-if="v.tags.length" class="flex flex-wrap items-center gap-1.5">
                <TagChip v-for="t in v.tags" :key="t" :label="t" :color="areaTagColor(t)" />
              </span>
              <span v-else class="text-[12px] text-steel-300">—</span>
            </td>
            <!-- Stav -->
            <td class="px-2 py-3 align-middle">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600"
                :class="[OPEN_STATE_META[v.openState].bg, OPEN_STATE_META[v.openState].text]"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="OPEN_STATE_META[v.openState].dot" />
                {{ OPEN_STATE_META[v.openState].label }}
              </span>
            </td>
            <!-- Jazykové mutace -->
            <td class="px-2 py-3 align-middle">
              <div class="flex flex-wrap items-center gap-1">
                <span
                  v-for="l in LANGS"
                  :key="l.code"
                  :title="v.title[l.code].trim() ? `${l.label} — vyplněno` : `${l.label} — chybí překlad`"
                  class="rounded px-1.5 py-0.5 text-[10.5px] font-700 uppercase tabular-nums"
                  :class="v.title[l.code].trim() ? 'bg-forge-500/10 text-forge-600' : 'bg-steel-100 text-steel-400'"
                >
                  {{ l.code }}
                </span>
              </div>
            </td>
            <!-- Akce -->
            <td class="px-3 py-3 align-middle">
              <div class="flex justify-end">
                <RowActionsMenu :actions="rowActions" label="Akce s objektem" @select="(key) => onRowAction(key, v)" />
              </div>
            </td>
          </tr>

          <!-- Empty state -->
          <tr v-if="visible.length === 0">
            <td colspan="6" class="px-4 py-16 text-center">
              <div class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-steel-100 text-steel-400">
                <Icon name="map" :size="24" />
              </div>
              <p class="mt-3 text-[14px] font-600 text-graphite-800">Nic nenalezeno</p>
              <p class="mt-1 text-[13px] text-steel-500">Zkuste upravit filtr nebo hledaný výraz.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete dialog -->
    <DialogRoot :open="!!deleteTarget" @update:open="(v) => !v && (deleteTarget = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500">
            <Icon name="trash" :size="22" />
          </div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">Smazat objekt?</DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
            Chystáte se smazat <span class="font-600 text-graphite-800">„{{ deleteTarget?.title.cs }}"</span>. Tato akce je nevratná. Vazby na akce a galerie se pouze odpojí (samotné akce a galerie zůstanou).
          </DialogDescription>
          <div class="mt-5 flex justify-end gap-2">
            <AppButton variant="secondary" @click="deleteTarget = null">Zrušit</AppButton>
            <AppButton variant="danger" @click="confirmDelete">Smazat</AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
