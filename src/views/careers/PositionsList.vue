<script setup lang="ts">
/**
 * Výpis volných pozic. Vedle stavu ukazuje i počet přihlášek — pozice bez
 * jediné přihlášky po měsíci je signál, ne detail.
 */
import { computed, ref } from 'vue'
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from 'reka-ui'
import { useRouter } from 'vue-router'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ClearFiltersButton from '@/components/ui/ClearFiltersButton.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import { langPublishState, LANG_PUBLISH_META, filledLangsOf } from '@/utils/langPublish'
import {
  MOCK_POSITIONS,
  positionState,
  POSITION_STATE_META,
  DEPARTMENT_OPTIONS,
  EMPLOYMENT_OPTIONS,
  optionLabel,
  salaryLabel,
  applicantsForPosition,
  newApplicantCount,
  type JobPosition,
} from '@/data/mockCareers'

const router = useRouter()
const rows = ref<JobPosition[]>([...MOCK_POSITIONS])

/* ---------- Filtr ---------- */
const filterState = ref('all')
const filterDept = ref('all')
const stateOptions = [
  { value: 'all', label: 'Všechny stavy' },
  { value: 'open', label: 'Nabírá' },
  { value: 'closed', label: 'Nábor uzavřen' },
  { value: 'draft', label: 'Koncept' },
]
const deptOptions = [{ value: 'all', label: 'Všechny úseky' }, ...DEPARTMENT_OPTIONS]
const hasFilters = computed(() => filterState.value !== 'all' || filterDept.value !== 'all')
function clearFilters() {
  filterState.value = 'all'
  filterDept.value = 'all'
}
const visible = computed(() =>
  rows.value.filter((p) => {
    if (filterState.value !== 'all' && positionState(p) !== filterState.value) return false
    if (filterDept.value !== 'all' && p.department !== filterDept.value) return false
    return true
  }),
)

/* ---------- Akce ---------- */
const rowActions = [
  { key: 'edit', label: 'Otevřít pozici', icon: 'edit' },
  { key: 'applicants', label: 'Zobrazit přihlášky', icon: 'user' },
  { key: 'delete', label: 'Smazat pozici', icon: 'trash', danger: true },
]
const deleteTarget = ref<JobPosition | null>(null)
function onRowAction(key: string, p: JobPosition) {
  if (key === 'edit') goEdit(p.id)
  else if (key === 'applicants') router.push({ name: 'applicants-list', query: { position: p.id } })
  else if (key === 'delete') deleteTarget.value = p
}
function confirmDelete() {
  if (deleteTarget.value) rows.value = rows.value.filter((p) => p.id !== deleteTarget.value!.id)
  deleteTarget.value = null
}
function goEdit(id: string) {
  router.push({ name: 'position-edit', params: { id } })
}
function lps(field: Record<LangCode, string>, published: LangCode[] | undefined, code: LangCode) {
  return langPublishState(code, filledLangsOf(field), published)
}
function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${Number(d)}. ${Number(m)}. ${y}`
}
</script>

<template>
  <div class="px-8 py-6">
    <!-- Hlavička -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">position</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/careers/positions</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">Pozice</h1>
        <p class="mt-1 text-[13px] text-steel-500">
          Volné pozice na webu. Z formuláře u pozice padají přihlášky do
          <RouterLink :to="{ name: 'applicants-list' }" class="font-600 text-brand-600 hover:underline">Uchazečů</RouterLink>.
        </p>
      </div>
      <AppButton variant="primary" @click="router.push({ name: 'position-new' })">
        <Icon name="plus" :size="17" />
        Nová pozice
      </AppButton>
    </div>

    <!-- Filtr -->
    <div class="mb-4 rounded-lg border border-steel-200 bg-white p-3">
      <div class="flex flex-wrap items-end gap-x-3 gap-y-3">
        <div>
          <label class="mb-1 block field-tag">Stav</label>
          <AppSelect v-model="filterState" :options="stateOptions" />
        </div>
        <div>
          <label class="mb-1 block field-tag">Úsek</label>
          <AppSelect v-model="filterDept" :options="deptOptions" />
        </div>
        <ClearFiltersButton :visible="hasFilters" @clear="clearFilters" />
      </div>
    </div>

    <!-- Tabulka -->
    <div class="overflow-hidden rounded-lg border border-steel-200 bg-white">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
            <th class="px-4 py-3 font-600">Pozice</th>
            <th class="w-40 px-2 py-3 font-600">Úvazek</th>
            <th class="w-32 px-2 py-3 font-600">Přihlášky</th>
            <th class="w-36 px-2 py-3 font-600">Uzávěrka</th>
            <th class="w-40 px-2 py-3 font-600">Stav</th>
            <th class="w-52 px-2 py-3 font-600">Jazykové mutace</th>
            <th class="w-16 px-3 py-3 text-right font-600">Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in visible"
            :key="p.id"
            class="group border-b border-steel-100 transition-colors last:border-0 hover:bg-steel-50/60"
          >
            <td class="px-4 py-2.5 align-middle">
              <button class="flex items-center gap-3 text-left" @click="goEdit(p.id)">
                <span class="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-steel-100 text-steel-400">
                  <Icon name="briefcase" :size="15" />
                </span>
                <span class="min-w-0">
                  <span class="block truncate text-[13.5px] font-600 text-graphite-800 group-hover:text-brand-600">
                    {{ p.title.cs || 'Bez názvu' }}
                  </span>
                  <span class="block truncate text-[11.5px] text-steel-400">
                    {{ optionLabel(DEPARTMENT_OPTIONS, p.department) }}<template v-if="salaryLabel(p)"> · {{ salaryLabel(p) }}</template>
                  </span>
                </span>
              </button>
            </td>
            <td class="px-2 py-2.5 align-middle text-[12.5px] text-graphite-700">
              {{ optionLabel(EMPLOYMENT_OPTIONS, p.employment) }}
            </td>
            <td class="px-2 py-2.5 align-middle">
              <button
                class="inline-flex items-center gap-1.5 text-[13px] tabular-nums"
                :class="applicantsForPosition(p.id).length ? 'font-600 text-graphite-800 hover:text-brand-600' : 'text-steel-400'"
                @click="router.push({ name: 'applicants-list', query: { position: p.id } })"
              >
                {{ applicantsForPosition(p.id).length }}
                <span
                  v-if="newApplicantCount(p.id)"
                  class="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10.5px] font-700 text-brand-700"
                >
                  {{ newApplicantCount(p.id) }} nových
                </span>
              </button>
            </td>
            <td class="px-2 py-2.5 align-middle text-[12.5px] text-graphite-700 tabular-nums">
              {{ fmtDate(p.deadline) }}
            </td>
            <td class="px-2 py-2.5 align-middle">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-600"
                :class="[POSITION_STATE_META[positionState(p)].bg, POSITION_STATE_META[positionState(p)].text]"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="POSITION_STATE_META[positionState(p)].dot" />
                {{ POSITION_STATE_META[positionState(p)].label }}
              </span>
            </td>
            <td class="px-2 py-2.5 align-middle">
              <div class="flex flex-nowrap items-center gap-1">
                <span
                  v-for="l in LANGS"
                  :key="l.code"
                  class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-700 uppercase tabular-nums"
                  :class="LANG_PUBLISH_META[lps(p.title, p.publishedLangs, l.code)].chip"
                  :title="`${l.label} — ${LANG_PUBLISH_META[lps(p.title, p.publishedLangs, l.code)].label}`"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="LANG_PUBLISH_META[lps(p.title, p.publishedLangs, l.code)].dot" />
                  {{ l.code }}
                </span>
              </div>
            </td>
            <td class="px-3 py-2.5 text-right align-middle">
              <div class="flex justify-end">
                <RowActionsMenu :actions="rowActions" label="Akce s pozicí" @select="(key) => onRowAction(key, p)" />
              </div>
            </td>
          </tr>
          <tr v-if="visible.length === 0">
            <td colspan="7" class="px-4 py-14 text-center">
              <Icon name="briefcase" :size="26" class="mx-auto mb-2 text-steel-300" />
              <p class="text-[14px] font-600 text-graphite-800">Žádná pozice neodpovídá filtru</p>
              <p class="mt-1 text-[12.5px] text-steel-500">Zrušte filtry, nebo vypište novou pozici.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Potvrzení smazání -->
    <DialogRoot :open="!!deleteTarget" @update:open="(v) => !v && (deleteTarget = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500">
            <Icon name="trash" :size="22" />
          </div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">
            Smazat pozici „{{ deleteTarget?.title.cs }}"?
          </DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
            Pozice zmizí z webu. Přihlášky, které na ni přišly, zůstanou v Uchazečích i s názvem pozice.
          </DialogDescription>
          <div class="mt-5 flex justify-end gap-2">
            <AppButton variant="secondary" @click="deleteTarget = null">Zrušit</AppButton>
            <AppButton variant="danger" @click="confirmDelete">Smazat pozici</AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
