<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  TabsRoot,
  TabsList,
  TabsTrigger,
  TabsContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import TagChip from '@/components/ui/TagChip.vue'
import CalVenues from '@/components/admin/calendar/CalVenues.vue'
import {
  MOCK_EVENTS,
  VENUES,
  EVENT_TYPES,
  venue,
  eventStatus,
  eventTagColor,
  EVENT_STATE_META,
  type DovEvent,
} from '@/data/mockEvents'

const router = useRouter()

const view = ref<'table' | 'calendar'>('table')

/* ---------- filtry ---------- */
const filterVenue = ref('all')
const filterType = ref('all')
const filterStatus = ref('all')

const venueOptions = [{ value: 'all', label: 'Všechny budovy' }, ...VENUES.map((v) => ({ value: v.id, label: v.label }))]
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
    const mV = filterVenue.value === 'all' || e.venueId === filterVenue.value
    const mT = filterType.value === 'all' || e.type === filterType.value
    const mS = filterStatus.value === 'all' || eventStatus(e) === filterStatus.value
    return mV && mT && mS
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
function goNew() {
  router.push({ name: 'event-new' })
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
        </h1>
        <p class="mt-1.5 text-[13.5px] text-steel-500">
          {{ visible.length }} akcí · více budov, jedno­denní i dlouhodobé události
        </p>
      </div>
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
            <label class="mb-1 block text-[11.5px] font-600 text-steel-500">Budova</label>
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
          <button
            v-if="hasFilters"
            class="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-500 text-steel-500 transition-colors hover:bg-steel-100 hover:text-graphite-800"
            @click="clearFilters"
          >
            <Icon name="x" :size="14" /> Zrušit filtry
          </button>
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
                <th class="px-2 py-3 font-600">Stav</th>
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
                  <TagChip :label="venue(e.venueId).label" :color="venue(e.venueId).color" />
                </td>
                <td class="px-2 py-3 align-middle">
                  <div class="text-[13px] text-graphite-700 tabular-nums">{{ fmtRange(e) }}</div>
                  <div v-if="e.time" class="font-mono text-[10.5px] text-steel-400">{{ e.time }}</div>
                </td>
                <td class="px-2 py-3 align-middle">
                  <span class="text-[13px] text-graphite-700">{{ e.type }}</span>
                </td>
                <td class="px-2 py-3 align-middle">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600"
                    :class="[EVENT_STATE_META[eventStatus(e)].bg, EVENT_STATE_META[eventStatus(e)].text]"
                  >
                    <span class="h-1.5 w-1.5 rounded-full" :class="EVENT_STATE_META[eventStatus(e)].dot" />
                    {{ EVENT_STATE_META[eventStatus(e)].label }}
                  </span>
                </td>
                <td class="px-4 py-3 align-middle">
                  <TooltipProvider :delay-duration="250">
                    <div class="flex items-center justify-end gap-1">
                      <TooltipRoot>
                        <TooltipTrigger as-child>
                          <button
                            class="grid h-8 w-8 place-items-center rounded-md text-steel-400 transition-colors hover:bg-steel-100 hover:text-graphite-800"
                            @click="goDetail(e)"
                          >
                            <Icon name="edit" :size="16" />
                          </button>
                        </TooltipTrigger>
                        <TooltipPortal>
                          <TooltipContent side="top" class="rounded bg-graphite-900 px-2 py-1 text-[11.5px] text-white">
                            Detail / editace
                          </TooltipContent>
                        </TooltipPortal>
                      </TooltipRoot>
                    </div>
                  </TooltipProvider>
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
        <CalVenues :events="visible" @select="goDetail" />
      </TabsContent>
    </TabsRoot>
  </div>
</template>
