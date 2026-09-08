<script setup lang="ts">
/**
 * Výpis uchazečů — co přišlo z formulářů u pozic.
 *
 * Nahoře jsou počty po stavech: náborová schránka se čte odshora („kolik je
 * nových"), ne procházením celé tabulky. Klik na dlaždici filtruje.
 */
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ClearFiltersButton from '@/components/ui/ClearFiltersButton.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'
import UserAvatar from '@/components/admin/UserAvatar.vue'
import {
  MOCK_APPLICANTS,
  APPLICANT_STATUS_META,
  APPLICANT_STATUS_OPTIONS,
  FILE_KIND_META,
  positionOptions,
  fmtSubmitted,
  type Applicant,
  type ApplicantStatus,
} from '@/data/mockCareers'

const router = useRouter()
const route = useRoute()
const rows = ref<Applicant[]>([...MOCK_APPLICANTS])

/* ---------- Filtr ---------- */
const filterStatus = ref<string>('all')
const filterPosition = ref<string>(typeof route.query.position === 'string' ? route.query.position : 'all')
const statusOptions = [{ value: 'all', label: 'Všechny stavy' }, ...APPLICANT_STATUS_OPTIONS]
const posOptions = [
  { value: 'all', label: 'Všechny pozice' },
  { value: 'general', label: 'Obecné přihlášky' },
  ...positionOptions(),
]
const hasFilters = computed(() => filterStatus.value !== 'all' || filterPosition.value !== 'all')
function clearFilters() {
  filterStatus.value = 'all'
  filterPosition.value = 'all'
}
const visible = computed(() =>
  rows.value.filter((a) => {
    if (filterStatus.value !== 'all' && a.status !== filterStatus.value) return false
    if (filterPosition.value === 'general' && a.positionId) return false
    else if (filterPosition.value !== 'all' && filterPosition.value !== 'general' && a.positionId !== filterPosition.value)
      return false
    return true
  }),
)

/** Počty po stavech — dlaždice nad tabulkou. */
const counts = computed(() =>
  APPLICANT_STATUS_OPTIONS.map((s) => ({
    ...s,
    count: rows.value.filter((a) => a.status === s.value).length,
  })),
)
function filterByStatus(v: ApplicantStatus) {
  filterStatus.value = filterStatus.value === v ? 'all' : v
}

/* ---------- Akce ---------- */
function setStatus(a: Applicant, status: ApplicantStatus) {
  a.status = status
  rows.value = [...rows.value]
}
const rowActions = (a: Applicant) => [
  { key: 'open', label: 'Otevřít přihlášku', icon: 'eye' },
  { key: 'mail', label: 'Odpovědět e-mailem', icon: 'mail' },
  ...(a.status !== 'shortlisted' ? [{ key: 'shortlist', label: 'Označit jako předvybrán', icon: 'check' }] : []),
  ...(a.status !== 'rejected' ? [{ key: 'reject', label: 'Zamítnout', icon: 'x' }] : []),
  { key: 'delete', label: 'Smazat přihlášku', icon: 'trash', danger: true },
]
const deleteTarget = ref<Applicant | null>(null)
function onRowAction(key: string, a: Applicant) {
  if (key === 'open') router.push({ name: 'applicant-detail', params: { id: a.id } })
  else if (key === 'mail') window.location.href = `mailto:${a.email}`
  else if (key === 'shortlist') setStatus(a, 'shortlisted')
  else if (key === 'reject') setStatus(a, 'rejected')
  else if (key === 'delete') deleteTarget.value = a
}
function confirmDelete() {
  if (deleteTarget.value) rows.value = rows.value.filter((a) => a.id !== deleteTarget.value!.id)
  deleteTarget.value = null
}

/* ---------- Hromadné akce ---------- */
const selected = ref<Set<string>>(new Set())
const allSelected = computed(
  () => visible.value.length > 0 && visible.value.every((a) => selected.value.has(a.id)),
)
function toggleAll(v: boolean | 'indeterminate') {
  const next = new Set(selected.value)
  if (v === true) visible.value.forEach((a) => next.add(a.id))
  else visible.value.forEach((a) => next.delete(a.id))
  selected.value = next
}
function toggleOne(id: string, v: boolean | 'indeterminate') {
  const next = new Set(selected.value)
  if (v === true) next.add(id)
  else next.delete(id)
  selected.value = next
}
function bulkStatus(status: ApplicantStatus) {
  rows.value = rows.value.map((a) => (selected.value.has(a.id) ? { ...a, status } : a))
  selected.value = new Set()
}
function bulkDelete() {
  rows.value = rows.value.filter((a) => !selected.value.has(a.id))
  selected.value = new Set()
}
</script>

<template>
  <div class="px-8 py-6">
    <!-- Hlavička -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">applicant</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/careers/applicants</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">Uchazeči</h1>
        <p class="mt-1 text-[13px] text-steel-500">
          Přihlášky z formulářů u
          <RouterLink :to="{ name: 'positions-list' }" class="font-600 text-brand-600 hover:underline">pozic</RouterLink>.
          Údaje přišly od uchazeče a neupravují se — mění se jen stav, kdo přihlášku řeší, a poznámka.
        </p>
      </div>
    </div>

    <!-- Počty po stavech (klik = filtr) -->
    <div class="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <button
        v-for="s in counts"
        :key="s.value"
        type="button"
        class="rounded-lg border bg-white px-4 py-3 text-left outline-none transition-colors"
        :class="filterStatus === s.value ? 'border-brand-400 ring-1 ring-brand-400' : 'border-steel-200 hover:border-steel-300'"
        @click="filterByStatus(s.value)"
      >
        <span class="flex items-center gap-1.5 text-[11.5px] font-600 uppercase tracking-wider text-steel-500">
          <span class="h-1.5 w-1.5 rounded-full" :class="APPLICANT_STATUS_META[s.value].dot" />
          {{ s.label }}
        </span>
        <span class="mt-1 block font-display text-[24px] font-700 leading-none text-graphite-900 tabular-nums">
          {{ s.count }}
        </span>
      </button>
    </div>

    <!-- Filtr -->
    <div class="mb-4 rounded-lg border border-steel-200 bg-white p-3">
      <div class="flex flex-wrap items-end gap-x-3 gap-y-3">
        <div>
          <label class="mb-1 block field-tag">Stav</label>
          <AppSelect v-model="filterStatus" :options="statusOptions" />
        </div>
        <div>
          <label class="mb-1 block field-tag">Pozice</label>
          <AppSelect v-model="filterPosition" :options="posOptions" />
        </div>
        <ClearFiltersButton :visible="hasFilters" @clear="clearFilters" />
      </div>
    </div>

    <!-- Hromadné akce -->
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
          Vybráno {{ selected.size }} {{ selected.size === 1 ? 'přihláška' : selected.size < 5 ? 'přihlášky' : 'přihlášek' }}
        </span>
        <div class="flex flex-wrap items-center gap-2">
          <button class="text-[12.5px] font-500 text-steel-500 hover:text-graphite-800" @click="selected = new Set()">
            Zrušit výběr
          </button>
          <AppButton variant="secondary" size="sm" @click="bulkStatus('shortlisted')">
            <Icon name="check" :size="15" /> Předvybrat
          </AppButton>
          <AppButton variant="secondary" size="sm" @click="bulkStatus('rejected')">
            <Icon name="x" :size="15" /> Zamítnout
          </AppButton>
          <DialogRoot>
            <DialogTrigger as-child>
              <AppButton variant="danger" size="sm"><Icon name="trash" :size="15" /> Smazat vybrané</AppButton>
            </DialogTrigger>
            <DialogPortal>
              <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
              <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
                <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500">
                  <Icon name="trash" :size="22" />
                </div>
                <DialogTitle class="font-display text-lg font-700 text-graphite-900">
                  Smazat {{ selected.size }} {{ selected.size === 1 ? 'přihlášku' : 'přihlášek' }}?
                </DialogTitle>
                <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
                  Smažou se i přiložené životopisy a motivační dopisy. Nevratné — a u osobních údajů je to správně.
                </DialogDescription>
                <div class="mt-5 flex justify-end gap-2">
                  <DialogClose as-child><AppButton variant="secondary">Zrušit</AppButton></DialogClose>
                  <DialogClose as-child><AppButton variant="danger" @click="bulkDelete">Smazat</AppButton></DialogClose>
                </div>
              </DialogContent>
            </DialogPortal>
          </DialogRoot>
        </div>
      </div>
    </Transition>

    <!-- Tabulka -->
    <div class="overflow-hidden rounded-lg border border-steel-200 bg-white">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
            <th class="w-10 px-4 py-3">
              <CheckboxRoot
                :model-value="allSelected"
                class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white outline-none data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
                aria-label="Vybrat vše"
                @update:model-value="toggleAll"
              >
                <CheckboxIndicator><Icon name="check" :size="11" class="text-white" /></CheckboxIndicator>
              </CheckboxRoot>
            </th>
            <th class="px-2 py-3 font-600">Uchazeč</th>
            <th class="w-56 px-2 py-3 font-600">Pozice</th>
            <th class="w-28 px-2 py-3 font-600">Přílohy</th>
            <th class="w-44 px-2 py-3 font-600">Přišlo</th>
            <th class="w-36 px-2 py-3 font-600">Stav</th>
            <th class="w-36 px-2 py-3 font-600">Řeší</th>
            <th class="w-16 px-3 py-3 text-right font-600">Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="a in visible"
            :key="a.id"
            class="group border-b border-steel-100 transition-colors last:border-0 hover:bg-steel-50/60"
            :class="selected.has(a.id) && 'bg-brand-50/60'"
          >
            <td class="px-4 py-2.5 align-middle">
              <CheckboxRoot
                :model-value="selected.has(a.id)"
                class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white outline-none data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
                :aria-label="`Vybrat ${a.name}`"
                @update:model-value="(v) => toggleOne(a.id, v)"
              >
                <CheckboxIndicator><Icon name="check" :size="11" class="text-white" /></CheckboxIndicator>
              </CheckboxRoot>
            </td>
            <td class="px-2 py-2.5 align-middle">
              <button class="min-w-0 text-left" @click="router.push({ name: 'applicant-detail', params: { id: a.id } })">
                <span class="flex items-center gap-2">
                  <span class="truncate text-[13.5px] font-600 text-graphite-800 group-hover:text-brand-600">{{ a.name }}</span>
                  <span v-if="a.status === 'new'" class="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" title="Nová přihláška" />
                </span>
                <span class="block truncate font-mono text-[11px] text-steel-400">{{ a.email }}</span>
              </button>
            </td>
            <td class="px-2 py-2.5 align-middle">
              <span class="text-[12.5px]" :class="a.positionId ? 'text-graphite-700' : 'italic text-steel-500'">
                {{ a.positionTitle }}
              </span>
            </td>
            <td class="px-2 py-2.5 align-middle">
              <span class="flex items-center gap-1.5">
                <span
                  v-for="f in a.files"
                  :key="f.id"
                  class="grid h-6 w-6 place-items-center rounded bg-steel-100 text-steel-500"
                  :title="`${FILE_KIND_META[f.kind].label} — ${f.name}`"
                >
                  <Icon :name="FILE_KIND_META[f.kind].icon" :size="12" />
                </span>
                <span v-if="!a.files.length" class="text-[12px] text-steel-400">—</span>
              </span>
            </td>
            <td class="px-2 py-2.5 align-middle text-[12.5px] text-graphite-700 tabular-nums">
              {{ fmtSubmitted(a.createdAt) }}
            </td>
            <td class="px-2 py-2.5 align-middle">
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-600"
                :class="[APPLICANT_STATUS_META[a.status].bg, APPLICANT_STATUS_META[a.status].text]"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="APPLICANT_STATUS_META[a.status].dot" />
                {{ APPLICANT_STATUS_META[a.status].label }}
              </span>
            </td>
            <td class="px-2 py-2.5 align-middle">
              <span v-if="a.assignee" class="flex items-center gap-1.5">
                <UserAvatar :name="a.assignee" :size="22" />
                <span class="truncate text-[12px] text-graphite-700">{{ a.assignee }}</span>
              </span>
              <span v-else class="text-[12px] text-steel-400">Nepřiřazeno</span>
            </td>
            <td class="px-3 py-2.5 text-right align-middle">
              <div class="flex justify-end">
                <RowActionsMenu :actions="rowActions(a)" label="Akce s přihláškou" @select="(key) => onRowAction(key, a)" />
              </div>
            </td>
          </tr>
          <tr v-if="visible.length === 0">
            <td colspan="8" class="px-4 py-14 text-center">
              <Icon name="user" :size="26" class="mx-auto mb-2 text-steel-300" />
              <p class="text-[14px] font-600 text-graphite-800">Žádná přihláška neodpovídá filtru</p>
              <p class="mt-1 text-[12.5px] text-steel-500">Zrušte filtry, nebo počkejte na další přihlášku z webu.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="mt-3 text-[12px] text-steel-500">Zobrazeno {{ visible.length }} z {{ rows.length }} přihlášek.</p>

    <!-- Potvrzení smazání jedné přihlášky -->
    <DialogRoot :open="!!deleteTarget" @update:open="(v) => !v && (deleteTarget = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[440px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500">
            <Icon name="trash" :size="22" />
          </div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">
            Smazat přihlášku {{ deleteTarget?.name }}?
          </DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
            Smaže se i životopis a motivační dopis. Nevratné — a u osobních údajů je to správně.
          </DialogDescription>
          <div class="mt-5 flex justify-end gap-2">
            <AppButton variant="secondary" @click="deleteTarget = null">Zrušit</AppButton>
            <AppButton variant="danger" @click="confirmDelete">Smazat přihlášku</AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
