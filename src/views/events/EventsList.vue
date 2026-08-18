<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ClearFiltersButton from '@/components/ui/ClearFiltersButton.vue'
import TagChip from '@/components/ui/TagChip.vue'
import EventTimeline from '@/components/admin/calendar/EventTimeline.vue'
import {
  MOCK_EVENTS,
  EVENT_TYPES,
  eventStatus,
  eventTagColor,
  EVENT_STATE_META,
  type DovEvent,
} from '@/data/mockEvents'
import { MOCK_VENUES, areaPlace } from '@/data/mockVenues'
import { langPublishState, LANG_PUBLISH_META, filledLangsOf } from '@/utils/langPublish'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'

const router = useRouter()

const view = ref<'table' | 'calendar'>('table')

/* ---------- filtry ---------- */
const filterVenue = ref('all')
const filterType = ref('all')
const filterStatus = ref('all')

/* Prototyp: smazané akce jen skryjeme (mock data nemutujeme). */
const hiddenIds = ref<Set<string>>(new Set())

const venueOptions = [{ value: 'all', label: 'Všechna místa' }, ...MOCK_VENUES.map((v) => ({ value: v.id, label: v.title.cs }))]
/** Popisek a barva místa (objektu v Areálu) pro výpis. */
function placeLabel(id: string): string {
  return areaPlace(id)?.title.cs ?? '—'
}
function placeColor(id: string): string {
  return areaPlace(id)?.color ?? '#64748b'
}
const typeOptions = [{ value: 'all', label: 'Všechny typy' }, ...EVENT_TYPES.map((t) => ({ value: t, label: t }))]
const statusOptions = [
  { value: 'all', label: 'Všechny stavy' },
  { value: 'ongoing', label: 'Probíhá' },
  { value: 'upcoming', label: 'Nadcházející' },
  { value: 'past', label: 'Ukončeno' },
]

const hasFilters = computed(
  () => filterVenue.value !== 'all' || filterType.value !== 'all' || filterStatus.value !== 'all',
)
function clearFilters() {
  filterVenue.value = 'all'
  filterType.value = 'all'
  filterStatus.value = 'all'
}

const visible = computed(() =>
  MOCK_EVENTS.filter((e) => {
    const mV = filterVenue.value === 'all' || e.areaIds.includes(filterVenue.value)
    const mT = filterType.value === 'all' || e.type === filterType.value
    const mS = filterStatus.value === 'all' || eventStatus(e) === filterStatus.value
    return mV && mT && mS && !hiddenIds.value.has(e.id)
  }),
)

/* tabulka řazená dle začátku */
const rows = computed(() =>
  [...visible.value].sort((a, b) => a.from.localeCompare(b.from)),
)

function fmt(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
}
function fmtRange(e: DovEvent): string {
  return e.from === e.to ? fmt(e.from) : `${fmt(e.from)} – ${fmt(e.to)}`
}

function goDetail(e: DovEvent) {
  router.push({ name: 'event-detail', params: { id: e.id } })
}

/** Stav publikace jedné mutace v řádku výpisu (sdílený helper). */
function lps(e: DovEvent, code: LangCode) {
  return langPublishState(code, filledLangsOf(e.title), e.publishedLangs)
}
function goNew() {
  router.push({ name: 'event-new' })
}

/* ---------- Akce nad řádkem (kontextové menu ⋮) ---------- */
const rowActions = [
  { key: 'edit', label: 'Editovat akci', icon: 'edit' },
  { key: 'delete', label: 'Smazat akci', icon: 'trash', danger: true },
]
const deleteTarget = ref<DovEvent | null>(null)
function onRowAction(key: string, e: DovEvent) {
  if (key === 'edit') goDetail(e)
  else if (key === 'delete') deleteTarget.value = e
}
function confirmDelete() {
  if (!deleteTarget.value) return
  hiddenIds.value = new Set(hiddenIds.value).add(deleteTarget.value.id)
  deleteTarget.value = null
}
</script>

<template>
  <div class="px-8 py-6">
    <!-- Page header -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">events</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/events</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">
          Kalendář akcí
        </h1>      </div>
      <AppButton variant="primary" @click="goNew">
        <Icon name="plus" :size="17" />
        Nová akce
      </AppButton>
    </div>

    <TabsRoot v-model="view">
      <!-- Toolbar: filtry + přepínač zobrazení -->
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3 rounded-lg border border-steel-200 bg-white p-3">
        <div class="flex flex-wrap items-end gap-3">
          <div>
            <label class="mb-1 block text-[11.5px] font-600 text-steel-500">Místo</label>
            <AppSelect v-model="filterVenue" :options="venueOptions" />
          </div>
          <div>
            <label class="mb-1 block text-[11.5px] font-600 text-steel-500">Typ</label>
            <AppSelect v-model="filterType" :options="typeOptions" />
          </div>
          <div>
            <label class="mb-1 block text-[11.5px] font-600 text-steel-500">Stav</label>
            <AppSelect v-model="filterStatus" :options="statusOptions" />
          </div>
          <ClearFiltersButton :visible="hasFilters" @clear="clearFilters" />
        </div>

        <!-- Přepínač Výpis / Kalendář -->
        <TabsList class="inline-flex items-center gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1">
          <TabsTrigger
            value="table"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors hover:text-graphite-800 data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm"
          >
            <Icon name="reference" :size="15" /> Výpis
          </TabsTrigger>
          <TabsTrigger
            value="calendar"
            class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors hover:text-graphite-800 data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm"
          >
            <Icon name="calendar" :size="15" /> Kalendář
          </TabsTrigger>
        </TabsList>
      </div>

      <!-- VÝPIS (tabulka) -->
      <TabsContent value="table" class="outline-none">
        <div class="overflow-hidden rounded-lg border border-steel-200 bg-white">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
                <th class="px-4 py-3 font-600">Název akce</th>
                <th class="px-2 py-3 font-600">Místo</th>
                <th class="px-2 py-3 font-600">Termín</th>
                <th class="px-2 py-3 font-600">Typ</th>
                <th class="w-40 px-2 py-3 font-600">Jazykové mutace</th>
                <th class="w-28 px-4 py-3 text-right font-600">Akce</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="e in rows"
                :key="e.id"
                class="group border-b border-steel-100 transition-colors last:border-0 hover:bg-steel-50/60"
              >
                <td class="px-4 py-3 align-middle">
                  <button class="flex items-center gap-3 text-left" @click="goDetail(e)">
                    <span class="h-10 w-14 shrink-0 overflow-hidden rounded-md bg-steel-100">
                      <img :src="e.image" :alt="e.title.cs" class="h-full w-full object-cover" />
                    </span>
                    <span class="min-w-0">
                      <span class="block truncate text-[14px] font-600 text-graphite-900 group-hover:text-brand-600">
                        {{ e.title.cs || 'Bez názvu' }}
                      </span>
                      <span v-if="e.tags.length" class="mt-1 flex flex-wrap items-center gap-1.5">
                        <TagChip v-for="t in e.tags" :key="t" :label="t" :color="eventTagColor(t)" />
                      </span>
                      <span v-if="!e.published" class="mt-0.5 inline-block text-[11px] text-steel-400">Koncept</span>
                    </span>
                  </button>
                </td>
                <td class="px-2 py-3 align-middle">
                  <div class="flex flex-wrap items-center gap-1">
                    <TagChip v-for="aid in e.areaIds" :key="aid" :label="placeLabel(aid)" :color="placeColor(aid)" />
                    <span v-if="!e.areaIds.length" class="text-[12px] text-steel-400">—</span>
                  </div>
                </td>
                <td class="px-2 py-3 align-middle">
                  <div class="text-[13px] text-graphite-700 tabular-nums">{{ fmtRange(e) }}</div>
                  <div v-if="e.time" class="font-mono text-[10.5px] text-steel-400">{{ e.time }}</div>
                </td>
                <td class="px-2 py-3 align-middle">
                  <span class="text-[13px] text-graphite-700">{{ e.type }}</span>
                </td>
                <td class="px-2 py-3 align-middle">
                  <div class="flex flex-wrap items-center gap-1">
                    <span
                      v-for="l in LANGS"
                      :key="l.code"
                      class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-700 uppercase tabular-nums"
                      :class="LANG_PUBLISH_META[lps(e, l.code)].chip"
                      :title="`${l.label} — ${LANG_PUBLISH_META[lps(e, l.code)].label}`"
                    >
                      <span class="h-1.5 w-1.5 rounded-full" :class="LANG_PUBLISH_META[lps(e, l.code)].dot" />
                      {{ l.code }}
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3 align-middle">
                  <div class="flex justify-end">
                    <RowActionsMenu
                      :actions="rowActions"
                      label="Akce s akcí"
                      @select="(key) => onRowAction(key, e)"
                    />
                  </div>
                </td>
              </tr>
              <tr v-if="rows.length === 0">
                <td colspan="6" class="px-4 py-16 text-center">
                  <div class="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-steel-100 text-steel-400">
                    <Icon name="calendar" :size="24" />
                  </div>
                  <p class="mt-3 text-[14px] font-600 text-graphite-800">Žádné akce</p>
                  <p class="mt-1 text-[13px] text-steel-500">Zkuste upravit filtry.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </TabsContent>

      <!-- KALENDÁŘ (časová osa dle budov) -->
      <TabsContent value="calendar" class="outline-none">
        <EventTimeline :events="visible" navigable show-hint @select="goDetail" />
      </TabsContent>
    </TabsRoot>

    <!-- Potvrzení smazání akce (prototyp) -->
    <DialogRoot :open="!!deleteTarget" @update:open="(v) => !v && (deleteTarget = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500"><Icon name="trash" :size="22" /></div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">Smazat akci?</DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">Chystáte se smazat <span class="font-600 text-graphite-800">„{{ deleteTarget?.title.cs }}"</span>. Tato akce je nevratná.</DialogDescription>
          <div class="mt-5 flex justify-end gap-2">
            <AppButton variant="secondary" @click="deleteTarget = null">Zrušit</AppButton>
            <AppButton variant="danger" @click="confirmDelete">Smazat</AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
