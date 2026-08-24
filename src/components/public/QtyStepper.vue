<script setup lang="ts">
/**
 * Krokovač počtu (−  n  +) pro veřejný web.
 * Vodorovný, s velkými dotykovými cíli — na rozdíl od svislých
 * mikro-tlačítek v Colosseu. Číslo lze i přepsat z klávesnice.
 */
const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    /** Popis pro čtečky — „Počet vstupenek Dospělý". */
    label: string
    size?: 'md' | 'sm'
  }>(),
  { min: 0, max: 20, size: 'md' },
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

function set(next: number) {
  emit('update:modelValue', Math.min(props.max, Math.max(props.min, next)))
}

function onInput(e: Event) {
  const raw = Number.parseInt((e.target as HTMLInputElement).value.replace(/\D/g, ''), 10)
  set(Number.isNaN(raw) ? props.min : raw)
}

const box = 'grid place-items-center border border-dov-coal/25 bg-white text-dov-coal transition-colors hover:border-dov-coal hover:bg-dov-coal hover:text-white disabled:pointer-events-none disabled:border-dov-coal/10 disabled:text-dov-coal/25'
</script>

<template>
  <div class="inline-flex items-center gap-1.5" :class="size === 'sm' ? 'gap-1' : 'gap-1.5'">
    <button
      type="button"
      :class="[box, size === 'sm' ? 'size-8' : 'size-9 sm:size-10']"
      :disabled="modelValue <= min"
      :aria-label="`${label} — odebrat`"
      @click="set(modelValue - 1)"
    >
      <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M5 12h14" />
      </svg>
    </button>

    <input
      type="text"
      inputmode="numeric"
      :value="modelValue"
      :aria-label="label"
      :class="[
        'border bg-transparent text-center font-dov-display font-bold tabular-nums outline-none transition-colors',
        modelValue > 0 ? 'border-dov-coal/25 text-dov-coal' : 'border-transparent text-dov-coal/35',
        size === 'sm' ? 'h-8 w-9 text-[16px]' : 'h-9 w-9 text-[17px] sm:h-10 sm:w-11 sm:text-[19px]',
      ]"
      @input="onInput"
    />

    <button
      type="button"
      :class="[box, size === 'sm' ? 'size-8' : 'size-9 sm:size-10']"
      :disabled="modelValue >= max"
      :aria-label="`${label} — přidat`"
      @click="set(modelValue + 1)"
    >
      <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  </div>
</template>
