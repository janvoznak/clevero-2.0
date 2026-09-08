<script setup lang="ts">
/**
 * Kam odkaz vede — jeden výběr pro menu i patičku (princip 0b).
 *
 * Typ cíle a cíl samotný je jedno rozhodnutí: redakce nechce zvolit „typ",
 * chce zvolit stránku. Typ se z volby odvodí. U externího odkazu se doplní
 * pole na URL a přepínač nového okna.
 */
import { computed } from 'vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import Icon from '@/components/ui/Icon.vue'
import { MOCK_PAGES } from '@/data/mockPages'
import {
  NAV_MODULE_OPTIONS,
  NAV_NO_TARGET,
  NAV_URL_CHOICE,
  targetChoice,
  applyTargetChoice,
  type NavItem,
} from '@/data/mockNavigation'

const item = defineModel<NavItem>({ required: true })

/** Volby: stránky z modulu Stránky, modulové výpisy, externí odkaz. */
const options = computed(() => [
  { value: NAV_NO_TARGET, label: '— nevybráno —' },
  ...MOCK_PAGES.map((p) => ({ value: `page:${p.id}`, label: `Stránka: ${p.title.cs || 'Bez názvu'}` })),
  ...NAV_MODULE_OPTIONS.map((m) => ({ value: `module:${m.value}`, label: m.label })),
  { value: NAV_URL_CHOICE, label: 'Externí odkaz…' },
])

const choice = computed({
  get: () => targetChoice(item.value),
  set: (v: string) => applyTargetChoice(item.value, v),
})
const isUrl = computed(() => item.value.kind === 'url')
</script>

<template>
  <div class="space-y-2">
    <AppSelect v-model="choice" :options="options" placeholder="Kam odkaz vede…" />

    <div v-if="isUrl" class="relative block">
      <Icon name="link" :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-steel-400" />
      <input
        v-model="item.target"
        type="text"
        placeholder="https://…"
        class="h-9 w-full rounded-md border border-steel-200 pl-8 pr-3 font-mono text-[12px] text-graphite-800 placeholder:font-sans placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
      />
    </div>

    <!-- Nové okno má smysl u odkazu ven; u vnitřní stránky je to jen šum. -->
    <div v-if="isUrl" class="block">
      <AppSwitch v-model="item.newWindow" label="Otevřít v novém okně" />
    </div>
  </div>
</template>
