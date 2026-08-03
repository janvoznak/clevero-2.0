<script setup lang="ts">
/**
 * Sjednocený AI blok pro celou administraci.
 * - Výrazně podbarvený (značková oranžová) s ikonou → nepřehlédnutelný.
 * - Defaultně sbalený; klik na hlavičku ho rozbalí (obsah = slot).
 * - Stejné vizuální řešení napříč moduly (princip „jeden prvek = jedna komponenta").
 */
import { ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'

const props = withDefaults(
  defineProps<{
    title: string
    /** Krátký popis v hlavičce (viditelný i ve sbaleném stavu). */
    hint?: string
    /** Text odznaku vpravo v hlavičce. */
    badge?: string
    /** Ikona bloku. */
    icon?: string
    /** Rozbalit hned po načtení. */
    defaultOpen?: boolean
  }>(),
  { hint: '', badge: 'AI', icon: 'sparkles', defaultOpen: false },
)

const open = ref(props.defaultOpen)
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-brand-300 bg-brand-50/70 shadow-sm">
    <!-- Hlavička (přepínač) -->
    <button
      type="button"
      class="flex w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-brand-100/50 focus-visible:bg-brand-100/50"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500 text-white shadow-sm">
        <Icon :name="icon" :size="16" />
      </span>
      <span class="min-w-0 flex-1">
        <span class="flex items-center gap-2">
          <span class="text-[13.5px] font-700 text-graphite-900">{{ title }}</span>
          <span class="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-brand-600">{{ badge }}</span>
        </span>
        <span v-if="hint" class="mt-0.5 block truncate text-[11.5px] text-steel-500">{{ hint }}</span>
      </span>
      <span class="grid h-7 w-7 shrink-0 place-items-center rounded-md text-brand-600 transition-transform" :class="open ? 'rotate-180' : ''">
        <Icon name="chevronDown" :size="18" />
      </span>
    </button>

    <!-- Obsah -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div v-show="open" class="border-t border-brand-100 bg-white/60 p-4">
        <slot />
      </div>
    </Transition>
  </div>
</template>
