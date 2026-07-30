<script setup lang="ts">
/**
 * Výběr polohy pop-up okna — vizuální 3×3 mřížka (9 pozic) nad Reka `RadioGroup`.
 * Mřížka = mini-obrazovka; indikátor v buňce je ukotvený do odpovídajícího
 * rohu/středu, takže je na první pohled vidět, kam okno padne.
 */
import { RadioGroupRoot, RadioGroupItem } from 'reka-ui'
import { POPUP_POSITION_LABELS } from '@/data/mockPopups'
import type { PopupPosition } from '@/data/mockPopups'

const model = defineModel<PopupPosition>({ default: 'center' })

/** 9 poloh 3×3 mřížky v pořadí čtení + zarovnání indikátoru v buňce. */
const CELLS: { value: PopupPosition; align: string }[] = [
  { value: 'top-left', align: 'items-start justify-start' },
  { value: 'top-center', align: 'items-start justify-center' },
  { value: 'top-right', align: 'items-start justify-end' },
  { value: 'middle-left', align: 'items-center justify-start' },
  { value: 'center', align: 'items-center justify-center' },
  { value: 'middle-right', align: 'items-center justify-end' },
  { value: 'bottom-left', align: 'items-end justify-start' },
  { value: 'bottom-center', align: 'items-end justify-center' },
  { value: 'bottom-right', align: 'items-end justify-end' },
]

const cellBase =
  'group flex rounded-md border border-steel-200 bg-white p-1.5 outline-none transition-all hover:border-brand-300 hover:bg-brand-50 data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-50 focus-visible:ring-2 focus-visible:ring-brand-500/40'
</script>

<template>
  <div>
    <RadioGroupRoot
      v-model="model"
      class="grid aspect-[16/10] w-full grid-cols-3 grid-rows-3 gap-1.5 rounded-lg border border-steel-200 bg-steel-50 p-2"
      aria-label="Umístění pop-up okna na obrazovce"
    >
      <RadioGroupItem
        v-for="c in CELLS"
        :key="c.value"
        :value="c.value"
        :aria-label="POPUP_POSITION_LABELS[c.value]"
        :title="POPUP_POSITION_LABELS[c.value]"
        :class="[cellBase, c.align]"
      >
        <span
          class="h-2.5 w-3.5 rounded-[2px] bg-steel-300 transition-colors group-hover:bg-brand-400 group-data-[state=checked]:bg-brand-500"
        />
      </RadioGroupItem>
    </RadioGroupRoot>

    <!-- Zvolená poloha -->
    <p class="mt-2 flex items-center gap-1.5 text-[12.5px] text-steel-600">
      <span class="h-1.5 w-1.5 rounded-full bg-brand-500" />
      Zvolená poloha: <span class="font-600 text-graphite-800">{{ POPUP_POSITION_LABELS[model] }}</span>
    </p>
  </div>
</template>
