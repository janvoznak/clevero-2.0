<script setup lang="ts">
/**
 * Hlavička překládaného (jazykově závislého) pole: název + vlaječka aktivní
 * mutace + field-tag + ✨ ikona pro překlad tohoto pole do ostatních mutací.
 * Vlaječka signalizuje „toto pole je jazykové" — systémová/sdílená pole
 * (odkazy, datumy, výběry) tuto hlavičku nepoužívají, takže vlaječku nemají.
 */
import Icon from '@/components/ui/Icon.vue'
import LangFlag from '@/components/admin/LangFlag.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'

const props = withDefaults(
  defineProps<{
    label: string
    /** Aktivní mutace — určuje zobrazenou vlaječku. */
    lang: LangCode
    /** field-tag chip (bez jazyka — ten nese vlaječka). */
    tag?: string
    /** Nápověda k poli — skryje se pod „?" vedle labelu. */
    hint?: string
    required?: boolean
    /**
     * true (výchozí) = ikonka překladu spadne dovnitř políčka vpravo (jednoduché
     * inputy/textarey). false = ikonka zůstane v řádku hlavičky — pro pole s
     * vlastní lištou (RichText editor), kde by překryv koliduje.
     */
    overlay?: boolean
  }>(),
  { overlay: true },
)

defineEmits<{ translate: [] }>()

const langLabel = () => LANGS.find((l) => l.code === props.lang)?.label ?? props.lang
</script>

<template>
  <div class="mb-1.5 flex items-center justify-between gap-2" :class="overlay && 'relative'">
    <span class="flex items-center gap-1.5 text-[13px] font-600 text-graphite-800">
      {{ label }}
      <span v-if="required" class="text-brand-500">*</span>
      <LangFlag :lang="lang" :size="13" :title="`Jazyková mutace: ${langLabel()}`" />
      <HelpTip v-if="hint" :text="hint" />
    </span>

    <span class="flex items-center gap-1.5">
      <span v-if="tag" class="field-tag">{{ tag }}</span>
      <!-- Inline varianta: ikonka překladu přímo v hlavičce (u polí s vlastní lištou). -->
      <button
        v-if="!overlay"
        type="button"
        class="grid h-6 w-6 place-items-center rounded-md border border-brand-200 bg-brand-50/80 text-brand-600 outline-none transition-colors hover:border-brand-300 hover:bg-brand-100 hover:text-brand-700"
        title="Přeložit toto pole do ostatních mutací (DOVík)"
        @click="$emit('translate')"
      >
        <Icon name="sparkles" :size="14" />
      </button>
    </span>

    <!-- Overlay varianta: tlačítko spadne dovnitř políčka vpravo nahoře.
         Absolutně vůči této hlavičce (mb-1.5) → spadne přes horní okraj inputu. -->
    <button
      v-if="overlay"
      type="button"
      class="absolute right-2 top-[calc(100%+14px)] z-10 grid h-7 w-7 place-items-center rounded-md border border-brand-200 bg-brand-50/90 text-brand-600 shadow-sm backdrop-blur-sm outline-none transition-colors hover:border-brand-300 hover:bg-brand-100 hover:text-brand-700"
      title="Přeložit toto pole do ostatních mutací (DOVík)"
      @click="$emit('translate')"
    >
      <Icon name="sparkles" :size="15" />
    </button>
  </div>
</template>
