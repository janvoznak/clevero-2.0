<script setup lang="ts">
/** Tabulka pojmů taxonomie — vícejazyčné názvy + barva. Sdílená pro štítky i kategorie. */
import Icon from '@/components/ui/Icon.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { TaxonomyTerm } from '@/data/mockTaxonomy'

defineProps<{ list: TaxonomyTerm[]; entity: string }>()
defineEmits<{ add: []; remove: [number] }>()

function missing(term: TaxonomyTerm): number {
  return LANGS.filter((l) => l.code !== SOURCE_LANG && !term.label[l.code].trim()).length
}
</script>

<template>
  <div>
    <div class="scroll-thin overflow-x-auto">
      <table class="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr class="border-b border-steel-200 text-[11px] uppercase tracking-wider text-steel-500">
            <th class="w-14 px-2 py-2 font-600">Barva</th>
            <th
              v-for="l in LANGS"
              :key="l.code"
              class="px-2 py-2 font-600"
            >
              <span class="inline-flex items-center gap-1.5">
                <span>{{ l.flag }}</span> {{ l.code.toUpperCase() }}
                <span v-if="l.code === SOURCE_LANG" class="normal-case text-[10px] text-steel-400">(zdroj)</span>
              </span>
            </th>
            <th class="w-24 px-2 py-2 font-600">Překlady</th>
            <th class="w-12 px-2 py-2 text-right font-600" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="(term, i) in list" :key="i" class="border-b border-steel-100 last:border-0">
            <!-- Barva -->
            <td class="px-2 py-2 align-middle">
              <label class="relative inline-grid h-7 w-7 cursor-pointer place-items-center rounded-md ring-1 ring-black/5" :style="{ backgroundColor: term.color }">
                <input v-model="term.color" type="color" class="absolute inset-0 h-full w-full cursor-pointer opacity-0" :aria-label="`Barva (${term.label.cs || 'nový'})`" />
              </label>
            </td>

            <!-- Jazykové názvy -->
            <td v-for="l in LANGS" :key="l.code" class="px-2 py-2 align-middle">
              <input
                v-model="term.label[l.code]"
                type="text"
                :placeholder="l.code === SOURCE_LANG ? 'Název (CZ)' : term.label.cs ? `Přeložit „${term.label.cs}“` : '—'"
                class="h-9 w-full rounded-md border px-2.5 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                :class="l.code !== SOURCE_LANG && !term.label[l.code].trim() ? 'border-amber-300 bg-amber-50/40' : 'border-steel-200'"
              />
            </td>

            <!-- Indikátor úplnosti překladů -->
            <td class="px-2 py-2 align-middle">
              <span
                v-if="missing(term) === 0"
                class="inline-flex items-center gap-1 rounded-full bg-forge-500/10 px-2 py-0.5 text-[11px] font-600 text-forge-600"
              >
                <Icon name="check" :size="12" /> Kompletní
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-600 text-amber-600"
                :title="`Chybí ${missing(term)} překlad(y)`"
              >
                chybí {{ missing(term) }}
              </span>
            </td>

            <!-- Smazat -->
            <td class="px-2 py-2 text-right align-middle">
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-md text-steel-400 transition-colors hover:bg-danger-500/10 hover:text-danger-500"
                :title="`Smazat ${entity}`"
                @click="$emit('remove', i)"
              >
                <Icon name="trash" :size="15" />
              </button>
            </td>
          </tr>

          <tr v-if="list.length === 0">
            <td :colspan="LANGS.length + 3" class="px-2 py-10 text-center text-[13px] text-steel-500">
              Zatím žádné položky.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <button
      type="button"
      class="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-2 text-[12.5px] font-600 text-steel-600 transition-colors hover:border-brand-400 hover:text-brand-600"
      @click="$emit('add')"
    >
      <Icon name="plus" :size="15" /> Přidat {{ entity }}
    </button>
  </div>
</template>
