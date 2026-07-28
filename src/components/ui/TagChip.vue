<script setup lang="ts">
import Icon from '@/components/ui/Icon.vue'

withDefaults(
  defineProps<{
    label: string
    color: string
    removable?: boolean
    size?: 'sm' | 'md'
  }>(),
  { removable: false, size: 'sm' },
)
defineEmits<{ remove: [] }>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-md font-600 text-white"
    :class="size === 'md' ? 'px-2.5 py-1 text-[12px]' : 'px-2 py-[3px] text-[11px]'"
    :style="{ backgroundColor: color }"
  >
    {{ label }}
    <button
      v-if="removable"
      type="button"
      class="-mr-0.5 grid h-4 w-4 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/20 hover:text-white"
      :aria-label="`Odebrat štítek ${label}`"
      @click="$emit('remove')"
    >
      <Icon name="x" :size="11" />
    </button>
  </span>
</template>
