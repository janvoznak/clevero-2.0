<script setup lang="ts">
/**
 * Výpis dotačních projektů.
 *
 * Řadí se podle poskytovatele a termínu, protože přesně tak vypadá výpis na
 * webu — a redakce podle něj kontroluje, že je zveřejněné všechno, co musí být.
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import ClearFiltersButton from '@/components/ui/ClearFiltersButton.vue'
import RowActionsMenu from '@/components/admin/RowActionsMenu.vue'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import { langPublishState, LANG_PUBLISH_META, filledLangsOf } from '@/utils/langPublish'
import {
  MOCK_GRANTS,
  MOCK_PROVIDERS,
  GRANT_PHASE_OPTIONS,
  GRANT_PHASE_META,
  provider,
  providerOptions,
  phaseMismatch,
  termLabel,
  type GrantProject,
} from '@/data/mockGrants'

const router = useRouter()
const rows = ref<GrantProject[]>([...MOCK_GRANTS])

/* ---------- Filtr ---------- */
const filterPhase = ref('all')
const filterProvider = ref('all')
const phaseOptions = [{ value: 'all', label: 'Všechny fáze' }, ...GRANT_PHASE_OPTIONS]
const provOptions = [{ value: 'all', label: 'Všichni poskytovatelé' }, ...providerOptions()]
const hasFilters = computed(() => filterPhase.value !== 'all' || filterProvider.value !== 'all')
function clearFilters() {
  filterPhase.value = 'all'
  filterProvider.value = 'all'
}

/** Pořadí jako na webu: podle poskytovatele, uvnitř od nejnovějšího termínu. */
const visible = computed(() =>
  rows.value
    .filter((g) => {
      if (filterPhase.value !== 'all' && g.phase !== filterPhase.value) return false
      if (filterProvider.value !== 'all' && g.providerId !== filterProvider.value) return false
      return true
    })
    .slice()
    .sort((a, b) => {
      const pa = MOCK_PROVIDERS.findIndex((p) => p.id === a.providerId)
      const pb = MOCK_PROVIDERS.findIndex((p) => p.id === b.providerId)
      if (pa !== pb) return pa - pb
      return b.from.localeCompare(a.from)
    }),
)

/** Kolik projektů je v které fázi — dlaždice odpovídají záložkám na webu. */
const counts = computed(() =>
  GRANT_PHASE_OPTIONS.map((p) => ({ ...p, count: rows.value.filter((g) => g.phase === p.value).length })),
)
/** Projekty s prošlým termínem, které zůstaly mezi aktuálními. */
const mismatched = computed(() => rows.value.filter((g) => phaseMismatch(g)))

/* ---------- Akce ---------- */
const rowActions = [
  { key: 'edit', label: 'Otevřít projekt', icon: 'edit' },
  { key: 'delete', label: 'Smazat projekt', icon: 'trash', danger: true },
]
const deleteTarget = ref<GrantProject | null>(null)
function onRowAction(key: string, g: GrantProject) {
  if (key === 'edit') goEdit(g.id)
  else if (key === 'delete') deleteTarget.value = g
}
function confirmDelete() {
  if (deleteTarget.value) rows.value = rows.value.filter((g) => g.id !== deleteTarget.value!.id)
  deleteTarget.value = null
}
function goEdit(id: string) {
  router.push({ name: 'grant-edit', params: { id } })
}
function lps(field: Record<LangCode, string>, published: LangCode[] | undefined, code: LangCode) {
  return langPublishState(code, filledLangsOf(field), published)
}
</script>

<template>
  <div class="px-8 py-6">
    <!-- Hlavička -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">grant</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/grants</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">Dotační projekty</h1>
        <p class="mt-1 max-w-[70ch] text-[13px] text-steel-500">
          Povinně zveřejňované údaje o čerpaných dotacích. Na webu z nich vzniká výpis rozdělený podle fáze
          a seskupený podle poskytovatele — úvodní text stránky se píše v modulu Stránky.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <AppButton variant="secondary" @click="router.push({ name: 'grant-providers' })">
          <Icon name="layers" :size="16" />
          Poskytovatelé a loga
        </AppButton>
        <AppButton variant="primary" @click="router.push({ name: 'grant-new' })">
          <Icon name="plus" :size="17" />
          Nový projekt
        </AppButton>
      </div>
    </div>

    <!-- Počty po fázích = záložky na webu -->
    <div class="mb-4 grid gap-3 sm:grid-cols-3">
      <button
        v-for="p in counts"
        :key="p.value"
        type="button"
        class="rounded-lg border bg-white px-4 py-3 text-left outline-none transition-colors"
        :class="filterPhase === p.value ? 'border-brand-400 ring-1 ring-brand-400' : 'border-steel-200 hover:border-steel-300'"
        @click="filterPhase = filterPhase === p.value ? 'all' : p.value"
      >
        <span class="flex items-center gap-1.5 text-[11.5px] font-600 uppercase tracking-wider text-steel-500">
          <span class="h-1.5 w-1.5 rounded-full" :class="GRANT_PHASE_META[p.value].dot" />
          {{ GRANT_PHASE_META[p.value].short }}
        </span>
        <span class="mt-1 block font-display text-[24px] font-700 leading-none text-graphite-900 tabular-nums">
          {{ p.count }}
        </span>
      </button>
    </div>

    <!-- Upozornění na prošlý termín u aktuálně čerpaného projektu -->
    <div
      v-if="mismatched.length"
      class="mb-4 flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3"
    >
      <Icon name="clock" :size="16" class="mt-0.5 shrink-0 text-amber-600" />
      <p class="text-[12.5px] leading-relaxed text-amber-700">
        <span class="font-600">
          {{ mismatched.length }}
          {{ mismatched.length === 1 ? 'projektu' : 'projektům' }}
          skončil termín řešení, ale zůstal mezi aktuálně čerpanými.
        </span>
        Zkontrolujte, jestli nemá přejít do udržitelnosti nebo mezi ukončené.
      </p>
    </div>

    <!-- Filtr -->
    <div class="mb-4 rounded-lg border border-steel-200 bg-white p-3">
      <div class="flex flex-wrap items-end gap-x-3 gap-y-3">
        <div>
          <label class="mb-1 block field-tag">Fáze</label>
          <AppSelect v-model="filterPhase" :options="phaseOptions" />
        </div>
        <div>
          <label class="mb-1 block field-tag">Poskytovatel</label>
          <AppSelect v-model="filterProvider" :options="provOptions" />
        </div>
        <ClearFiltersButton :visible="hasFilters" @clear="clearFilters" />
      </div>
    </div>

    <!-- Tabulka -->
    <div class="overflow-hidden rounded-lg border border-steel-200 bg-white">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
            <th class="px-4 py-3 font-600">Projekt</th>
            <th class="w-56 px-2 py-3 font-600">Poskytovatel</th>
            <th class="w-52 px-2 py-3 font-600">Termín řešení</th>
            <th class="w-44 px-2 py-3 font-600">Fáze</th>
            <th class="w-52 px-2 py-3 font-600">Jazykové mutace</th>
            <th class="w-16 px-3 py-3 text-right font-600">Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="g in visible"
            :key="g.id"
            class="group border-b border-steel-100 transition-colors last:border-0 hover:bg-steel-50/60"
          >
            <td class="px-4 py-2.5 align-middle">
              <button class="min-w-0 text-left" @click="goEdit(g.id)">
                <span class="block text-[13.5px] font-600 text-graphite-800 group-hover:text-brand-600">
                  {{ g.title.cs || 'Bez názvu' }}
                </span>
                <span class="block font-mono text-[11px] text-steel-400">
                  {{ g.regNumber || 'bez registračního čísla' }}<template v-if="!g.published"> · koncept</template>
                </span>
              </button>
            </td>
            <td class="px-2 py-2.5 align-middle text-[12.5px] text-graphite-700">
              {{ provider(g.providerId)?.name ?? '—' }}
            </td>
            <td class="px-2 py-2.5 align-middle text-[12.5px] text-graphite-700 tabular-nums">
              {{ termLabel(g) }}
            </td>
            <td class="px-2 py-2.5 align-middle">
              <div class="flex flex-col items-start gap-1">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-600"
                  :class="[GRANT_PHASE_META[g.phase].bg, GRANT_PHASE_META[g.phase].text]"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="GRANT_PHASE_META[g.phase].dot" />
                  {{ GRANT_PHASE_META[g.phase].short }}
                </span>
                <span v-if="phaseMismatch(g)" class="inline-flex items-center gap-1 text-[10.5px] font-600 text-amber-600">
                  <Icon name="clock" :size="11" /> Termín už skončil
                </span>
              </div>
            </td>
            <td class="px-2 py-2.5 align-middle">
              <div class="flex flex-nowrap items-center gap-1">
                <span
                  v-for="l in LANGS"
                  :key="l.code"
                  class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-700 uppercase tabular-nums"
                  :class="LANG_PUBLISH_META[lps(g.title, g.publishedLangs, l.code)].chip"
                  :title="`${l.label} — ${LANG_PUBLISH_META[lps(g.title, g.publishedLangs, l.code)].label}`"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="LANG_PUBLISH_META[lps(g.title, g.publishedLangs, l.code)].dot" />
                  {{ l.code }}
                </span>
              </div>
            </td>
            <td class="px-3 py-2.5 text-right align-middle">
              <div class="flex justify-end">
                <RowActionsMenu :actions="rowActions" label="Akce s projektem" @select="(key) => onRowAction(key, g)" />
              </div>
            </td>
          </tr>
          <tr v-if="visible.length === 0">
            <td colspan="6" class="px-4 py-14 text-center">
              <Icon name="grant" :size="26" class="mx-auto mb-2 text-steel-300" />
              <p class="text-[14px] font-600 text-graphite-800">Žádný projekt neodpovídá filtru</p>
              <p class="mt-1 text-[12.5px] text-steel-500">Zrušte filtry, nebo přidejte nový projekt.</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Potvrzení smazání -->
    <DialogRoot :open="!!deleteTarget" @update:open="(v) => !v && (deleteTarget = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[460px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500">
            <Icon name="trash" :size="22" />
          </div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">
            Smazat projekt „{{ deleteTarget?.title.cs }}"?
          </DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
            Projekt zmizí z webu. U dotací jde o povinně zveřejňované údaje — mazat je má smysl jen u překlepů,
            ne u projektů, které skončily. Ty patří mezi ukončené.
          </DialogDescription>
          <div class="mt-5 flex justify-end gap-2">
            <AppButton variant="secondary" @click="deleteTarget = null">Zrušit</AppButton>
            <AppButton variant="danger" @click="confirmDelete">Smazat projekt</AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
