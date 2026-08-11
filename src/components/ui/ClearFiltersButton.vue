<script setup lang="ts">
/**
 * Sjednocené tlačítko „Zrušit filtry" pro filtrované výpisy napříč moduly.
 * Zobrazí se jen když je aktivní aspoň jeden filtr (`visible`); klik emituje `clear`.
 * Logika resetu (které refy na co) zůstává v každém výpisu — liší se filtr od filtru.
 */
import Icon from '@/components/ui/Icon.vue'

defineProps<{ visible?: boolean }>()
defineEmits<{ (e: 'clear'): void }>()
</script>

<template>
  <button
    v-if="visible"
    type="button"
    class="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-500 text-steel-500 transition-colors hover:bg-steel-100 hover:text-graphite-800"
    @click="$emit('clear')"
  >
    <Icon name="x" :size="14" /> Zrušit filtry
  </button>
</template>
