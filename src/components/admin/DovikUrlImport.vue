<script setup lang="ts">
/**
 * Sdílený vstup „import z odkazu přes DOVíka" (prototyp — bez reálné AI).
 * Jednotné UI pro zakládání obsahu z URL: používá EventWizard (dlaždice) i
 * EventDetail (panel), aby vypadaly i zněly stejně (princip „jeden prvek =
 * jedna komponenta"). Logika importu (co se z odkazu vyplní) zůstává ve volajícím
 * — komponenta jen vysbírá URL a emituje `submit`.
 */
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = withDefaults(
  defineProps<{
    /** Probíhá import (spinner + disabled). */
    busy?: boolean
    placeholder?: string
    /** Text tlačítka v klidu / při běhu. */
    cta?: string
    busyLabel?: string
    /** Svislé uspořádání (vstup nad tlačítkem) — pro úzké dlaždice. */
    stack?: boolean
  }>(),
  {
    busy: false,
    placeholder: 'Vložte odkaz, např. https://…',
    cta: 'Připravit s DOVíkem',
    busyLabel: 'DOVík načítá…',
    stack: false,
  },
)

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ submit: [] }>()

function submit() {
  if (!model.value.trim() || props.busy) return
  emit('submit')
}
</script>

<template>
  <div :class="stack ? 'space-y-2' : 'flex flex-col gap-2 sm:flex-row'">
    <div class="relative flex-1">
      <Icon name="link" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
      <input
        v-model="model"
        type="text"
        :placeholder="placeholder"
        class="h-11 w-full rounded-md border border-steel-200 bg-white pl-9 pr-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
        @keydown.enter.prevent="submit"
      />
    </div>
    <AppButton variant="primary" :class="stack ? 'w-full' : ''" :disabled="!model.trim() || busy" @click="submit">
      <Icon name="sparkles" :size="16" :class="busy && 'animate-pulse'" />
      {{ busy ? busyLabel : cta }}
    </AppButton>
  </div>
</template>
