<script setup lang="ts">
/**
 * Výběr způsobu založení obsahu — dlaždice „Zrychleně s DOVíkem" vs „Ručně".
 * Sdílené (princip „jeden prvek = jedna komponenta"): používá průvodce akcí
 * (URL import) i editor Aktualit (téma). Levá (DOVík) dlaždice má obsah přes
 * slot `#dovik`; pravá (ručně) emituje `manual`.
 *
 * Volitelná třetí dlaždice: vyplňte slot `#third` (+ `third*` props) — např.
 * v průvodci akcí „Z Colossea" (našeptávač). Bez slotu zůstává layout dvoudlaždicový
 * (zpětná kompatibilita s Aktualitami).
 */
import Icon from '@/components/ui/Icon.vue'
import DovikAvatar from '@/components/admin/DovikAvatar.vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    dovikTitle?: string
    /** Krátký popisek pod nadpisem DOVík dlaždice. */
    dovikHint?: string
    /** Odstavec v DOVík dlaždici. */
    dovikLead?: string
    manualTitle?: string
    manualHint?: string
    manualLead?: string
    manualCta?: string
    /** Volitelná třetí dlaždice (obsah přes slot `#third`). */
    thirdTitle?: string
    /** Odznak vpravo od nadpisu třetí dlaždice (např. „Colosseum"). */
    thirdBadge?: string
    /** Krátký popisek pod nadpisem třetí dlaždice. */
    thirdHint?: string
    /** Odstavec ve třetí dlaždici. */
    thirdLead?: string
    /** Ikona v hlavičce třetí dlaždice. */
    thirdIcon?: string
    /** Poznámka pod dlaždicemi (na střed). */
    note?: string
  }>(),
  {
    subtitle: '',
    dovikTitle: 'Založit zrychleně',
    dovikHint: '',
    dovikLead: '',
    manualTitle: 'Založit ručně',
    manualHint: 'Bez DOVíka, krok po kroku.',
    manualLead: '',
    manualCta: 'Začít ručně',
    thirdTitle: '',
    thirdBadge: '',
    thirdHint: '',
    thirdLead: '',
    thirdIcon: 'ticket',
    note: '',
  },
)
defineEmits<{ manual: [] }>()
</script>

<template>
  <div class="space-y-6">
    <div class="text-center">
      <h2 class="font-display text-[22px] font-800 tracking-tight text-graphite-900">{{ title }}</h2>
      <p v-if="subtitle" class="mt-1.5 text-[14px] text-steel-500">{{ subtitle }}</p>
    </div>

    <div class="grid items-stretch gap-4" :class="$slots.third ? 'lg:grid-cols-3 sm:grid-cols-2' : 'sm:grid-cols-2'">
      <!-- Dlaždice A: Zrychleně s DOVíkem -->
      <div class="flex flex-col overflow-hidden rounded-2xl border-2 border-brand-300 bg-gradient-to-br from-brand-50 to-white p-5 shadow-sm">
        <div class="mb-3 flex items-center gap-3">
          <span class="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-brand-100"><DovikAvatar :size="42" /></span>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-display text-[16px] font-700 text-graphite-900">{{ dovikTitle }}</h3>
              <span class="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-brand-600">DOVík</span>
            </div>
            <p v-if="dovikHint" class="text-[12.5px] text-steel-500">{{ dovikHint }}</p>
          </div>
        </div>
        <p v-if="dovikLead" class="mb-3 text-[13px] leading-relaxed text-graphite-700">{{ dovikLead }}</p>
        <div class="mt-auto">
          <slot name="dovik" />
        </div>
      </div>

      <!-- Dlaždice C: Volitelná třetí možnost (např. z Colossea) -->
      <div v-if="$slots.third" class="flex flex-col overflow-hidden rounded-2xl border-2 border-forge-300 bg-gradient-to-br from-forge-50 to-white p-5 shadow-sm">
        <div class="mb-3 flex items-center gap-3">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-forge-600 shadow-sm ring-1 ring-forge-100"><Icon :name="thirdIcon" :size="22" /></span>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-display text-[16px] font-700 text-graphite-900">{{ thirdTitle }}</h3>
              <span v-if="thirdBadge" class="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-forge-600">{{ thirdBadge }}</span>
            </div>
            <p v-if="thirdHint" class="text-[12.5px] text-steel-500">{{ thirdHint }}</p>
          </div>
        </div>
        <p v-if="thirdLead" class="mb-3 text-[13px] leading-relaxed text-graphite-700">{{ thirdLead }}</p>
        <div class="mt-auto">
          <slot name="third" />
        </div>
      </div>

      <!-- Dlaždice B: Ručně (bez AI) -->
      <button
        type="button"
        class="group flex flex-col rounded-2xl border-2 border-steel-200 bg-white p-5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/30"
        @click="$emit('manual')"
      >
        <div class="mb-3 flex items-center gap-3">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-steel-100 text-steel-500 transition-colors group-hover:bg-brand-100 group-hover:text-brand-600"><Icon name="edit" :size="22" /></span>
          <div>
            <h3 class="font-display text-[16px] font-700 text-graphite-900">{{ manualTitle }}</h3>
            <p v-if="manualHint" class="text-[12.5px] text-steel-500">{{ manualHint }}</p>
          </div>
        </div>
        <p v-if="manualLead" class="mb-3 text-[13px] leading-relaxed text-graphite-700">{{ manualLead }}</p>
        <span class="mt-auto inline-flex items-center gap-1.5 text-[13px] font-600 text-brand-600">
          {{ manualCta }} <Icon name="chevronRight" :size="16" class="transition-transform group-hover:translate-x-0.5" />
        </span>
      </button>
    </div>

    <p v-if="note" class="text-center text-[11.5px] text-steel-400">{{ note }}</p>
  </div>
</template>
