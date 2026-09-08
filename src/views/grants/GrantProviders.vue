<script setup lang="ts">
/**
 * Poskytovatelé dotace — malý číselník s logy (vzor: správa taxonomie).
 *
 * Logo je povinná publicita a opakuje se u všech projektů téhož poskytovatele,
 * takže patří sem, ne k jednotlivému projektu — nahraje se jednou.
 * Prototyp — nahrávání i ukládání jsou předstírané.
 */
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { MOCK_PROVIDERS, blankProvider, grantsForProvider, type GrantProvider } from '@/data/mockGrants'

const router = useRouter()
/* Lokální kopie (prototyp — sdílená data needitujeme přímo). */
const rows = reactive<GrantProvider[]>(JSON.parse(JSON.stringify(MOCK_PROVIDERS)))

let seq = 0
function addProvider() {
  seq += 1
  const p = blankProvider()
  p.id = `new-${seq}`
  rows.push(p)
}
const removeTarget = ref<{ index: number; provider: GrantProvider } | null>(null)
/** Kolik projektů poskytovatel drží — mazat toho s projekty by je osiřelo. */
function usedBy(p: GrantProvider): number {
  return grantsForProvider(p.id).length
}
function confirmRemove() {
  if (removeTarget.value) rows.splice(removeTarget.value.index, 1)
  removeTarget.value = null
}
/** Iniciály do zástupného loga, dokud není nahrané. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '—'
  return parts
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
</script>

<template>
  <div class="px-8 py-6 pb-16">
    <!-- Hlavička -->
    <div class="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="mb-1 flex items-center gap-2">
          <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">grant-provider</span>
          <span class="font-mono text-[11px] text-steel-400">/admin/grants/providers</span>
        </div>
        <h1 class="font-display text-[26px] font-700 leading-none tracking-tight text-graphite-900">
          Poskytovatelé a loga
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <AppButton variant="secondary" @click="router.push({ name: 'grants-list' })">
          <Icon name="chevronLeft" :size="16" /> Zpět na projekty
        </AppButton>
        <AppButton variant="primary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit' }}
        </AppButton>
      </div>
    </div>


    <div class="overflow-hidden rounded-lg border border-steel-200 bg-white">
      <table class="w-full border-collapse text-left">
        <thead>
          <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
            <th class="w-28 px-4 py-3 font-600">Logo</th>
            <th class="px-2 py-3 font-600">Název poskytovatele</th>
            <th class="w-72 px-2 py-3 font-600">Web</th>
            <th class="w-28 px-2 py-3 font-600">Projekty</th>
            <th class="w-14 px-3 py-3 text-right font-600"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in rows" :key="p.id" class="border-b border-steel-100 last:border-0">
            <td class="px-4 py-3 align-middle">
              <button
                class="grid h-10 w-16 place-items-center overflow-hidden rounded border border-dashed border-steel-300 text-[10px] font-700 uppercase tracking-wider text-steel-400 transition-colors hover:border-brand-400 hover:text-brand-600"
                title="Nahrát logo (prototyp)"
              >
                <img v-if="p.logo" :src="p.logo" alt="" class="h-full w-full object-contain" />
                <span v-else>{{ initials(p.name) }}</span>
              </button>
            </td>
            <td class="px-2 py-3 align-middle">
              <input
                v-model="p.name"
                type="text"
                placeholder="Např. Moravskoslezský kraj"
                class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
            </td>
            <td class="px-2 py-3 align-middle">
              <input
                v-model="p.url"
                type="text"
                placeholder="https://…"
                class="h-9 w-full rounded-md border border-steel-200 px-3 font-mono text-[12px] text-graphite-800 placeholder:font-sans placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
            </td>
            <td class="px-2 py-3 align-middle text-[12.5px] tabular-nums" :class="usedBy(p) ? 'text-graphite-700' : 'text-steel-400'">
              {{ usedBy(p) }}
            </td>
            <td class="px-3 py-3 text-right align-middle">
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-md text-steel-400 transition-colors hover:bg-danger-500/10 hover:text-danger-600"
                aria-label="Odebrat poskytovatele"
                @click="removeTarget = { index: i, provider: p }"
              >
                <Icon name="trash" :size="15" />
              </button>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td colspan="5" class="px-4 py-12 text-center">
              <Icon name="layers" :size="24" class="mx-auto mb-2 text-steel-300" />
              <p class="text-[13.5px] font-600 text-graphite-800">Zatím žádný poskytovatel</p>
              <p class="mt-1 text-[12.5px] text-steel-500">Přidejte prvního — bez něj se projekt nemá kam zařadit.</p>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="border-t border-steel-100 p-3">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-1.5 text-[12.5px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"
          @click="addProvider"
        >
          <Icon name="plus" :size="15" /> Přidat poskytovatele
        </button>
      </div>
    </div>

    <!-- Potvrzení odebrání -->
    <DialogRoot :open="!!removeTarget" @update:open="(v) => !v && (removeTarget = null)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[460px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-danger-500/10 text-danger-500">
            <Icon name="trash" :size="22" />
          </div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">
            Odebrat poskytovatele {{ removeTarget?.provider.name }}?
          </DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
            <template v-if="removeTarget && usedBy(removeTarget.provider)">
              Drží {{ usedBy(removeTarget.provider) }}
              {{ usedBy(removeTarget.provider) === 1 ? 'projekt' : 'projektů' }} — ty by zůstaly bez skupiny i bez loga.
              Nejdřív je přeřaďte jinam.
            </template>
            <template v-else>Poskytovatel se odebere ze seznamu. Žádný projekt na něj neodkazuje.</template>
          </DialogDescription>
          <div class="mt-5 flex justify-end gap-2">
            <AppButton variant="secondary" @click="removeTarget = null">Zrušit</AppButton>
            <AppButton
              variant="danger"
              :disabled="!!removeTarget && usedBy(removeTarget.provider) > 0"
              @click="confirmRemove"
            >
              Odebrat
            </AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  </div>
</template>
