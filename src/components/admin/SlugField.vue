<script setup lang="ts">
/**
 * Jednotné pole „URL adresa (slug)" pro základní záložku detailů.
 * URL se generuje automaticky z nadpisu (viz useAutoSlug); klient ji ale
 * může upravit — ruční zásah hlásíme událostí `edit`, aby se auto-generování
 * pro danou mutaci zastavilo. Title/meta description se odvozují automaticky.
 */
import HelpTip from '@/components/ui/HelpTip.vue'

const model = defineModel<string>({ default: '' })
defineProps<{
  /** field-tag chip vpravo, např. „news-url · CS". */
  tag?: string
}>()
defineEmits<{ edit: [] }>()
</script>

<template>
  <div>
    <label class="mb-1.5 flex items-center justify-between">
      <span class="flex items-center gap-1.5 text-[13px] font-600 text-graphite-800">
        URL adresa (slug)
        <HelpTip text="URL se generuje automaticky z nadpisu, můžete ji ale upravit. Titulek a popis pro vyhledávače se doplní automaticky z nadpisu a perexu." />
      </span>
      <span v-if="tag" class="field-tag">{{ tag }}</span>
    </label>
    <input
      v-model="model"
      type="text"
      placeholder="cast-url"
      class="h-10 w-full rounded-md border border-steel-200 px-3 font-mono text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
      @input="$emit('edit')"
    />
  </div>
</template>
