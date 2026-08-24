<script setup lang="ts">
/**
 * Rodinné vstupné jako BALÍČEK, ne dva vnořené krokovače.
 * Zákazník volí počet balíčků; počet dětí (je-li rozsah 2/3) se
 * vybírá přepínačem uvnitř karty. Zobrazí se i úspora proti
 * jednotlivým vstupenkám — hlavní důvod, proč balíček koupit.
 */
import { computed } from 'vue'
import QtyStepper from './QtyStepper.vue'
import { czk, type FamilyPackage, type TicketTier } from '../../data/mockTicketing'

const props = defineProps<{
  pkg: FamilyPackage
  tiers: TicketTier[]
  qty: number
  children: number
}>()

const emit = defineEmits<{
  'update:qty': [value: number]
  'update:children': [value: number]
}>()

const childOptions = computed(() => {
  const out: number[] = []
  for (let n = props.pkg.childrenMin; n <= props.pkg.childrenMax; n++) out.push(n)
  return out
})

function priceOf(id?: string) {
  return props.tiers.find((t) => t.id === id)?.price ?? 0
}

/** Kolik by stejná sestava stála po jednotlivých vstupenkách. */
const separatePrice = computed(
  () =>
    props.pkg.adults * priceOf(props.pkg.compareAdultTierId) +
    props.children * priceOf(props.pkg.compareChildTierId),
)
const saving = computed(() => separatePrice.value - props.pkg.price)
const lineTotal = computed(() => props.pkg.price * props.qty)
</script>

<template>
  <div
    class="relative border bg-white transition-colors"
    :class="qty > 0 ? 'border-dov-coal/70' : 'border-dov-line'"
  >
    <span v-if="qty > 0" class="absolute inset-y-0 left-0 w-[3px] bg-dov-rust" aria-hidden="true" />

    <div class="flex flex-wrap items-center gap-4 px-4 py-3.5 sm:px-5">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
          <span class="font-dov-display text-[19px] font-bold uppercase leading-none text-dov-coal">
            {{ pkg.name }}
          </span>
          <span class="font-dov-sans text-[13px] font-medium text-dov-mutedfg">
            {{ czk(pkg.price) }} <span class="text-dov-mutedfg/70">/ balíček</span>
          </span>
          <span
            v-if="saving > 0"
            class="bg-dov-signal px-1.5 py-0.5 font-dov-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-dov-coal"
          >
            Ušetříte {{ czk(saving) }}
          </span>
        </div>
        <p class="mt-1 font-dov-sans text-[12.5px] leading-snug text-dov-mutedfg">
          {{ pkg.adults }}× dospělý +
          <template v-if="pkg.childrenMin === pkg.childrenMax">{{ pkg.childrenMax }}×</template>
          <template v-else>{{ pkg.childrenMin }}–{{ pkg.childrenMax }}×</template>
          {{ pkg.childrenLabel }}
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-4">
        <span
          class="hidden w-[86px] text-right font-dov-display text-[17px] font-bold tabular-nums text-dov-coal sm:block"
          :class="qty > 0 ? 'opacity-100' : 'opacity-0'"
          aria-hidden="true"
        >
          {{ czk(lineTotal) }}
        </span>
        <QtyStepper
          :model-value="qty"
          :max="6"
          :label="`Počet balíčků ${pkg.name}`"
          @update:model-value="emit('update:qty', $event)"
        />
      </div>
    </div>

    <!-- Skladba balíčku — jen když si ho zákazník opravdu vybral. -->
    <div
      v-if="qty > 0 && childOptions.length > 1"
      class="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-dashed border-dov-line bg-dov-cream/60 px-4 py-3 sm:px-5"
    >
      <span class="font-dov-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-dov-mutedfg">
        Počet dětí v balíčku
      </span>
      <div class="flex gap-1.5">
        <button
          v-for="n in childOptions"
          :key="n"
          type="button"
          class="min-w-9 border px-3 py-1.5 font-dov-display text-[15px] font-bold tabular-nums transition-colors"
          :class="
            n === children
              ? 'border-dov-coal bg-dov-coal text-white'
              : 'border-dov-coal/25 bg-white text-dov-coal hover:border-dov-coal'
          "
          :aria-pressed="n === children"
          @click="emit('update:children', n)"
        >
          {{ n }}
        </button>
      </div>
      <span class="font-dov-sans text-[12.5px] text-dov-mutedfg">
        Cena balíčku je stejná pro {{ childOptions[0] }} i {{ childOptions[childOptions.length - 1] }} děti.
      </span>
    </div>
  </div>
</template>
