<script setup lang="ts">
/**
 * Sdílená karta „Jazykové mutace" pro pravý rail všech obsahových editorů
 * (princip 0b: jeden prvek = jedna komponenta). Sjednocuje přehled vyplněnosti
 * jazyků + AI překlad z CZ. Prototyp — překlad je předstíraný v rodiči.
 *
 * Použití:
 *   <LangMutationsCard v-model="activeLang" :filled="filledLangs"
 *      :source-ready="sourceReady" :translating="translating" @translate="translateAll" />
 * kde `filledLangs` je pole kódů vyplněných mutací (počítá rodič dle svých polí).
 */
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import FormSection from '@/components/admin/FormSection.vue'

const props = withDefaults(
  defineProps<{
    /** Kódy jazyků, které jsou vyplněné (forge tečka). */
    filled: LangCode[]
    /** Je zdroj (CZ) připravený k překladu? */
    sourceReady?: boolean
    translating?: boolean
  }>(),
  { sourceReady: false, translating: false },
)
const activeLang = defineModel<LangCode>({ required: true })
defineEmits<{ translate: [] }>()

function isFilled(code: LangCode): boolean {
  return props.filled.includes(code)
}
</script>

<template>
  <FormSection title="Jazykové mutace" icon="globe" tag="ML">
    <ul class="space-y-1.5">
      <li
        v-for="l in LANGS"
        :key="l.code"
        class="flex items-center justify-between rounded-md px-2.5 py-2 transition-colors"
        :class="activeLang === l.code ? 'bg-brand-50' : 'hover:bg-steel-50'"
      >
        <button type="button" class="flex items-center gap-2.5 text-left" @click="activeLang = l.code">
          <span>{{ l.flag }}</span>
          <span class="text-[13px] font-500 text-graphite-800">{{ l.label }}</span>
        </button>
        <span
          class="inline-flex items-center gap-1.5 font-mono text-[10.5px]"
          :class="isFilled(l.code) ? 'text-forge-600' : 'text-steel-400'"
        >
          <span class="h-1.5 w-1.5 rounded-full" :class="isFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'" />
          {{ isFilled(l.code) ? 'vyplněno' : 'prázdné' }}
        </span>
      </li>
    </ul>
    <div class="mt-4 border-t border-steel-100 pt-4">
      <AppButton
        variant="primary"
        size="sm"
        class="w-full"
        :disabled="translating || !sourceReady"
        @click="$emit('translate')"
      >
        <Icon name="sparkles" :size="15" :class="translating && 'animate-pulse'" />
        {{ translating ? 'Překládám…' : 'Přeložit z CZ přes AI' }}
      </AppButton>
      <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
        <Icon name="sparkles" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
        <span v-if="sourceReady">Vyplní ostatní mutace (EN, DE, PL) z české verze.</span>
        <span v-else>Nejdřív vyplňte českou verzi — z ní se překládá.</span>
      </p>
    </div>
  </FormSection>
</template>
