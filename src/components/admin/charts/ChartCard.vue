<script setup lang="ts">
/**
 * Rám jedné grafové karty (nadpis + volitelná legenda/akce + plocha grafu).
 * Sjednocuje vzhled všech grafů — samotné grafy uvnitř řeší jen kreslení.
 */
import Icon from '@/components/ui/Icon.vue'

defineProps<{
  title: string
  /** Doplňující věta pod nadpisem (co graf ukazuje). */
  hint?: string
  /** Konstrukční field-tag do rohu karty (jako u formulářových sekcí). */
  tag?: string
  icon?: string
}>()
</script>

<template>
  <section class="flex flex-col overflow-hidden rounded-2xl border border-steel-200 bg-white shadow-sm">
    <header class="flex flex-wrap items-start gap-x-3 gap-y-2 border-b border-steel-100 px-5 py-3.5">
      <div class="min-w-0 flex-1">
        <h2 class="flex items-center gap-2 font-display text-[15px] font-700 leading-tight text-graphite-900">
          <Icon v-if="icon" :name="icon" :size="16" class="shrink-0 text-steel-400" />
          {{ title }}
        </h2>
        <p v-if="hint" class="mt-0.5 text-[12px] leading-relaxed text-steel-500">{{ hint }}</p>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <slot name="actions" />
        <span v-if="tag" class="field-tag">{{ tag }}</span>
      </div>
    </header>

    <div class="flex-1 px-5 py-4">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="border-t border-steel-100 px-5 py-3">
      <slot name="footer" />
    </footer>
  </section>
</template>
