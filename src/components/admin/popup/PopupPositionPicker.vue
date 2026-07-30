<script setup lang="ts">
/**
 * Výběr polohy pop-up okna (11 poloh) nad Reka `RadioGroup`.
 * Vizuálně = mini-obrazovka: horní lišta + 3×3 mřížka + dolní lišta.
 */
import { RadioGroupRoot, RadioGroupItem } from 'reka-ui'
import { POPUP_POSITION_LABELS } from '@/data/mockPopups'
import type { PopupPosition } from '@/data/mockPopups'

const model = defineModel<PopupPosition>({ default: 'center' })

/** 9 poloh 3×3 mřížky v pořadí čtení. */
const GRID: PopupPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'middle-left',
  'center',
  'middle-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
]

const cellBase =
  'group relative grid place-items-center rounded-md border border-steel-200 bg-white text-steel-300 outline-none transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-400 data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500 data-[state=checked]:text-white focus-visible:ring-2 focus-visible:ring-brand-500/40'
</script>

<template>
  <div>
    <RadioGroupRoot v-model="model" class="flex aspect-[16/10] w-full flex-col gap-1.5 rounded-lg border border-steel-200 bg-steel-50 p-2">
      <!-- Horní lišta -->
      <RadioGroupItem value="top-bar" :aria-label="POPUP_POSITION_LABELS['top-bar']" :class="[cellBase, 'h-[15%]']">
        <span class="h-1.5 w-10 rounded-[2px] bg-current opacity-80" />
      </RadioGroupItem>

      <!-- 3×3 mřížka -->
      <div class="grid flex-1 grid-cols-3 gap-1.5">
        <RadioGroupItem
          v-for="pos in GRID"
          :key="pos"
          :value="pos"
          :aria-label="POPUP_POSITION_LABELS[pos]"
          :class="cellBase"
        >
          <span class="h-2.5 w-3.5 rounded-[2px] bg-current opacity-80" />
        </RadioGroupItem>
      </div>

      <!-- Dolní lišta -->
      <RadioGroupItem value="bottom-bar" :aria-label="POPUP_POSITION_LABELS['bottom-bar']" :class="[cellBase, 'h-[15%]']">
        <span class="h-1.5 w-10 rounded-[2px] bg-current opacity-80" />
      </RadioGroupItem>
    </RadioGroupRoot>

    <!-- Zvolená poloha -->
    <p class="mt-2 flex items-center gap-1.5 text-[12.5px] text-steel-600">
      <span class="h-1.5 w-1.5 rounded-full bg-brand-500" />
      Zvolená poloha: <span class="font-600 text-graphite-800">{{ POPUP_POSITION_LABELS[model] }}</span>
    </p>
  </div>
</template>
