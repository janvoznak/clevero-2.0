<script setup lang="ts">
/**
 * Hlavička překládaného (jazykově závislého) pole: název + vlaječka aktivní
 * mutace + field-tag + ✨ ikona pro překlad tohoto pole do ostatních mutací.
 * Vlaječka signalizuje „toto pole je jazykové" — systémová/sdílená pole
 * (odkazy, datumy, výběry) tuto hlavičku nepoužívají, takže vlaječku nemají.
 */
import Icon from '@/components/ui/Icon.vue'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'

const props = defineProps<{
  label: string
  /** Aktivní mutace — určuje zobrazenou vlaječku. */
  lang: LangCode
  /** field-tag chip (bez jazyka — ten nese vlaječka). */
  tag?: string
  required?: boolean
}>()

defineEmits<{ translate: [] }>()

const flag = () => LANGS.find((l) => l.code === props.lang)?.flag ?? ''
const langLabel = () => LANGS.find((l) => l.code === props.lang)?.label ?? props.lang
</script>

<template>
  <div class="mb-1.5 flex items-center justify-between gap-2">
    <span class="flex items-center gap-1.5 text-[13px] font-600 text-graphite-800">
      {{ label }}
      <span v-if="required" class="text-brand-500">*</span>
      <span class="text-[13px] leading-none" :title="`Jazyková mutace: ${langLabel()}`">{{ flag() }}</span>
    </span>
    <span class="flex items-center gap-1.5">
      <span v-if="tag" class="field-tag">{{ tag }}</span>
      <button
        type="button"
        class="grid h-6 w-6 place-items-center rounded-md text-steel-400 outline-none transition-colors hover:bg-brand-50 hover:text-brand-600"
        title="Přeložit toto pole do ostatních mutací (DOVík)"
        @click="$emit('translate')"
      >
        <Icon name="sparkles" :size="13" />
      </button>
    </span>
  </div>
</template>
