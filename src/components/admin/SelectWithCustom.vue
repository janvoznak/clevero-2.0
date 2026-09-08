<script setup lang="ts">
/**
 * Výběr z číselníku s možností napsat vlastní hodnotu (rozhodnutí 00/22 a 00/26).
 * Web nabízí víc hodnot, než kolik jich má číselník — redakce proto musí umět
 * zadat i vlastní (typ akce, věkové omezení). Jeden prvek = jedna komponenta
 * (standard §0b): select nad Reka přes `AppSelect` + textové pole.
 */
import { computed, nextTick, ref, watch } from 'vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppButton from '@/components/ui/AppButton.vue'
import Icon from '@/components/ui/Icon.vue'

const model = defineModel<string>({ default: '' })
const props = withDefaults(
  defineProps<{
    options: { value: string; label: string }[]
    /** Popisek volby, která přepne na vlastní hodnotu. */
    customLabel?: string
    placeholder?: string
    inputPlaceholder?: string
  }>(),
  { customLabel: '— vlastní hodnota…', placeholder: 'Vyberte…', inputPlaceholder: 'Napište vlastní hodnotu' },
)

const CUSTOM = '__custom__'
const input = ref<HTMLInputElement | null>(null)
/** Hodnota mimo číselník = vlastní (např. „6–12 let", „60+", „Soukromá akce"). */
function isCustom(v: string): boolean {
  return v.trim().length > 0 && !props.options.some((o) => o.value === v)
}
const custom = ref(isCustom(model.value))
watch(model, (v) => {
  if (isCustom(v)) custom.value = true
})

const selectOptions = computed(() => [...props.options, { value: CUSTOM, label: props.customLabel }])
const selectModel = computed({
  get: () => (custom.value ? CUSTOM : model.value),
  set: (v: string) => {
    if (v === CUSTOM) {
      custom.value = true
      model.value = ''
      // Po přepnutí ať se dá hned psát (jinak by uživatel musel kliknout do pole).
      void nextTick(() => input.value?.focus())
    } else {
      custom.value = false
      model.value = v
    }
  },
})
function backToList() {
  custom.value = false
  model.value = ''
}
</script>

<template>
  <div v-if="custom" class="flex items-center gap-2">
    <input
      ref="input"
      v-model="model"
      type="text"
      :placeholder="inputPlaceholder"
      class="h-10 min-w-0 flex-1 rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
    />
    <AppButton variant="secondary" size="sm" title="Zpět na výběr z číselníku" @click="backToList">
      <Icon name="chevronDown" :size="14" />
      Z číselníku
    </AppButton>
  </div>
  <AppSelect v-else v-model="selectModel" :options="selectOptions" :placeholder="placeholder" />
</template>
