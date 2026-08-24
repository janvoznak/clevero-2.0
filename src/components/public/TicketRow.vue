<script setup lang="ts">
/**
 * Řádek jedné vstupenky ve výběru.
 * Vlevo název + upřesnění + cena za osobu, vpravo krokovač a mezisoučet.
 * Vybraný řádek se zvýrazní rezavým pruhem — je vidět, co je v objednávce.
 */
import { computed } from 'vue'
import QtyStepper from './QtyStepper.vue'
import { czk, type TicketTier } from '../../data/mockTicketing'

const props = defineProps<{ tier: TicketTier; modelValue: number }>()
defineEmits<{ 'update:modelValue': [value: number] }>()

const lineTotal = computed(() => props.tier.price * props.modelValue)
const isFree = computed(() => props.tier.price === 0)
</script>

<template>
  <div
    class="relative flex items-center gap-4 border bg-white px-4 py-3.5 transition-colors sm:px-5"
    :class="modelValue > 0 ? 'border-dov-coal/70' : 'border-dov-line'"
  >
    <span
      v-if="modelValue > 0"
      class="absolute inset-y-0 left-0 w-[3px] bg-dov-rust"
      aria-hidden="true"
    />

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <span class="font-dov-display text-[19px] font-bold uppercase leading-none tracking-[0.01em] text-dov-coal">
          {{ tier.name }}
        </span>
        <span
          v-if="isFree"
          class="bg-dov-moss px-1.5 py-0.5 font-dov-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white"
        >
          Zdarma
        </span>
        <span v-else class="font-dov-sans text-[13px] font-medium text-dov-mutedfg">
          {{ czk(tier.price) }} <span class="text-dov-mutedfg/70">/ osoba</span>
        </span>
      </div>
      <p v-if="tier.note" class="mt-1 font-dov-sans text-[12.5px] leading-snug text-dov-mutedfg">
        {{ tier.note }}
      </p>
    </div>

    <div class="flex shrink-0 items-center gap-4">
      <span
        class="hidden w-[86px] text-right font-dov-display text-[17px] font-bold tabular-nums text-dov-coal sm:block"
        :class="modelValue > 0 ? 'opacity-100' : 'opacity-0'"
        aria-hidden="true"
      >
        {{ isFree ? '—' : czk(lineTotal) }}
      </span>
      <QtyStepper
        :model-value="modelValue"
        :label="`Počet vstupenek ${tier.name}`"
        @update:model-value="$emit('update:modelValue', $event)"
      />
    </div>
  </div>
</template>
