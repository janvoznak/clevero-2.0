<script setup lang="ts">
/**
 * Malá nápověda „?" — popisek pole/sekce/funkce se skryje pod ikonku a ukáže
 * se v tooltipu (hover/fokus). Text předej přes prop `text` nebo default slot.
 *
 * Cíl: formuláře jsou vizuálně čistší (bez šedých vět pod každým polem),
 * vysvětlení je po ruce, ale až na vyžádání.
 */
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  TooltipArrow,
} from 'reka-ui'

defineProps<{ text?: string }>()
</script>

<template>
  <TooltipProvider :delay-duration="120">
    <TooltipRoot>
      <TooltipTrigger as-child>
        <button
          type="button"
          class="inline-grid h-[15px] w-[15px] shrink-0 translate-y-[0.5px] cursor-help place-items-center rounded-full border border-steel-300 align-middle text-[10px] font-700 leading-none text-steel-400 outline-none transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500/30 data-[state=delayed-open]:border-brand-400 data-[state=delayed-open]:bg-brand-50 data-[state=delayed-open]:text-brand-600"
          aria-label="Nápověda"
          @click.prevent
        >
          ?
        </button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          side="top"
          align="start"
          :side-offset="6"
          :collision-padding="12"
          class="z-50 max-w-xs rounded-lg bg-graphite-900 px-3 py-2 text-[12px] font-400 leading-relaxed text-white shadow-xl"
        >
          <slot>{{ text }}</slot>
          <TooltipArrow class="fill-graphite-900" />
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
