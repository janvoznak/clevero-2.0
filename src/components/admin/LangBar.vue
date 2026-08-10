<script setup lang="ts">
/**
 * Horní lišta jazykových mutací — JEDINÉ místo pro přepínání i překlad mutací.
 * Každá cizí mutace (EN/DE/PL) má ✨ ikonu: klik = přeložit celou tu mutaci
 * z češtiny (AI, prototyp). Čeština je zdroj (bez ✨). Tečka = vyplněno/prázdné.
 */
import { TabsRoot, TabsList, TabsTrigger } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode } from '@/data/types'

const props = defineProps<{
  /** Kódy vyplněných mutací (zelená tečka). */
  filled: LangCode[]
  /** Mutace, která se právě překládá (pulzující ✨), nebo null. */
  translating?: LangCode | null
}>()

const model = defineModel<LangCode>({ required: true })
defineEmits<{ translate: [LangCode] }>()

function isFilled(code: LangCode): boolean {
  return props.filled.includes(code)
}
</script>

<template>
  <TabsRoot :model-value="model" @update:model-value="(v) => (model = v as LangCode)">
    <TabsList
      class="inline-flex items-center gap-2 rounded-lg border border-steel-200 bg-steel-50 p-1"
      aria-label="Jazyková mutace"
    >
      <!-- Jedna pilulka na mutaci: vlaječka + kód + tečka (+ ✨ za oddělovačem). -->
      <div
        v-for="l in LANGS"
        :key="l.code"
        class="inline-flex items-center overflow-hidden rounded-md transition-colors"
        :class="model === l.code ? 'bg-white shadow-sm ring-1 ring-steel-200' : 'hover:bg-steel-100'"
      >
        <TabsTrigger
          :value="l.code"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[12.5px] font-600 outline-none transition-colors"
          :class="model === l.code ? 'text-graphite-900' : 'text-steel-500 hover:text-graphite-800'"
        >
          <span>{{ l.flag }}</span>
          {{ l.code.toUpperCase() }}
          <span
            class="h-1.5 w-1.5 rounded-full"
            :class="isFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'"
            :title="isFilled(l.code) ? 'Vyplněno' : 'Prázdné'"
          />
        </TabsTrigger>
        <!-- ✨ AI překlad celé mutace z češtiny — uvnitř téže pilulky, za oddělovačem -->
        <template v-if="l.code !== SOURCE_LANG">
          <span class="h-4 w-px shrink-0" :class="model === l.code ? 'bg-steel-200' : 'bg-steel-300/60'" />
          <button
            type="button"
            class="grid h-8 w-7 place-items-center text-steel-400 outline-none transition-colors hover:bg-brand-50 hover:text-brand-600"
            :title="`Přeložit ${l.label} z češtiny (AI)`"
            @click="$emit('translate', l.code)"
          >
            <Icon name="sparkles" :size="13" :class="translating === l.code && 'animate-pulse text-brand-600'" />
          </button>
        </template>
      </div>
    </TabsList>
  </TabsRoot>
</template>
