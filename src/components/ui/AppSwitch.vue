<script setup lang="ts">
/**
 * Jednotný přepínač (toggle) nad Reka `Switch`.
 * Znovupoužitelný pro každé on/off nastavení (zobrazovat, nové okno, rámeček…).
 * Bez `label` = jen přepínač (např. v buňce tabulky); s `label` = řádek popisek + přepínač.
 */
import { SwitchRoot, SwitchThumb } from 'reka-ui'
import HelpTip from '@/components/ui/HelpTip.vue'

const model = defineModel<boolean>({ default: false })
withDefaults(
  defineProps<{
    label?: string
    hint?: string
    ariaLabel?: string
    /** Zamknutý přepínač (nelze přepnout) — např. když je řízený jinou podmínkou. */
    disabled?: boolean
  }>(),
  {},
)
</script>

<template>
  <component
    :is="label ? 'label' : 'span'"
    class="inline-flex items-center gap-3"
    :class="label && !disabled && 'cursor-pointer'"
  >
    <SwitchRoot
      v-model="model"
      :disabled="disabled"
      :aria-label="ariaLabel ?? label"
      class="relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-steel-300 outline-none transition-colors data-[state=checked]:bg-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/15 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
    >
      <SwitchThumb
        class="pointer-events-none block h-4 w-4 translate-x-0.5 rounded-full bg-white shadow-sm transition-transform will-change-transform data-[state=checked]:translate-x-[18px]"
      />
    </SwitchRoot>
    <span v-if="label" class="flex min-w-0 items-center gap-1.5">
      <span class="text-[13px] font-500 text-graphite-800">{{ label }}</span>
      <HelpTip v-if="hint" :text="hint" />
    </span>
  </component>
</template>
