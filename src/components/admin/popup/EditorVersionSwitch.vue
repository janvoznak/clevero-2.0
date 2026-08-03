<script setup lang="ts">
/**
 * Přepínač mezi dvěma verzemi pop-up editoru — „Formulář" (klasický, po sekcích)
 * a „Plátno" (WYSIWYG, AI-first). Slouží k porovnání obou přístupů na stejném
 * záznamu; po rozhodnutí se jedna verze odstraní.
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '@/components/ui/Icon.vue'

const props = defineProps<{ id?: string }>()
const route = useRoute()

const isCanvas = computed(() => String(route.name).includes('canvas'))

const formTo = computed(() =>
  props.id ? { name: 'popup-edit', params: { id: props.id } } : { name: 'popup-new' },
)
const canvasTo = computed(() =>
  props.id ? { name: 'popup-edit-canvas', params: { id: props.id } } : { name: 'popup-new-canvas' },
)

const itemBase =
  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 outline-none transition-colors'
</script>

<template>
  <div
    class="inline-flex items-center rounded-lg border border-steel-200 bg-steel-50 p-1"
    aria-label="Verze editoru"
  >
    <RouterLink
      :to="formTo"
      :class="[itemBase, !isCanvas ? 'bg-white text-graphite-900 shadow-sm' : 'text-steel-500 hover:text-graphite-800']"
    >
      <Icon name="page" :size="15" /> Formulář
    </RouterLink>
    <RouterLink
      :to="canvasTo"
      :class="[itemBase, isCanvas ? 'bg-white text-graphite-900 shadow-sm' : 'text-steel-500 hover:text-graphite-800']"
    >
      <Icon name="sparkles" :size="15" :class="isCanvas ? 'text-brand-500' : ''" /> Plátno
      <span class="rounded bg-brand-500/10 px-1 py-px font-mono text-[9px] leading-none text-brand-600">beta</span>
    </RouterLink>
  </div>
</template>
