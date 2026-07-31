<script setup lang="ts">
/**
 * Editor otevírací doby — pro každý den přepínač Otevřeno/Zavřeno a hodiny.
 * Znovupoužitelné (stránky, kontakty, budovy…). Jen lokální stav (prototyp).
 */
import AppSwitch from '@/components/ui/AppSwitch.vue'
import type { OpeningDay } from '@/data/mockPages'

const model = defineModel<OpeningDay[]>({ default: () => [] })
</script>

<template>
  <div class="space-y-1.5">
    <div
      v-for="d in model"
      :key="d.day"
      class="flex items-center gap-3 rounded-md px-2 py-1.5"
      :class="d.open ? 'bg-white' : 'bg-steel-50'"
    >
      <span class="w-7 shrink-0 font-mono text-[12px] font-700 text-graphite-800">{{ d.day }}</span>
      <input
        v-if="d.open"
        v-model="d.hours"
        type="text"
        placeholder="9:00–17:00"
        class="h-8 flex-1 rounded-md border border-steel-200 px-2.5 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
      />
      <span v-else class="flex-1 text-[12.5px] italic text-steel-400">Zavřeno</span>
      <AppSwitch v-model="d.open" :aria-label="`${d.day} — otevřeno`" />
    </div>
  </div>
</template>
