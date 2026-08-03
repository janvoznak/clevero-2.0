<script setup lang="ts">
/**
 * Inline editovatelná oblast pro „živé plátno" pop-up editoru.
 * Uživatel píše přímo do náhledu okna (nadpis / text), místo do formulářových
 * polí. Obousměrně svázané s modelem:
 *  - psaní → emit update (DOM už obsah má, caret neposkočí),
 *  - externí změna modelu (AI, šablona) → přepíše DOM jen když se liší,
 *  - změna `resetKey` (přepnutí jazyka) → vynutí re-sync z modelu.
 * Prototyp: žádné sanitizace, richtext je jen contenteditable.
 */
import { ref, watch, onMounted, computed } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    /** 'text' = prostý text (nadpis), 'html' = jednoduchý richtext (odstavce). */
    mode?: 'text' | 'html'
    /** Změna vynutí přenačtení obsahu z modelu (typicky aktivní jazyk). */
    resetKey?: string | number
  }>(),
  { placeholder: '', mode: 'text' },
)

const emit = defineEmits<{ 'update:modelValue': [string] }>()

const el = ref<HTMLElement>()

function readContent(): string {
  if (!el.value) return ''
  return props.mode === 'html' ? el.value.innerHTML : el.value.innerText
}
function writeContent(v: string) {
  if (!el.value) return
  if (props.mode === 'html') el.value.innerHTML = v
  else el.value.innerText = v
}

const isEmpty = computed(() => {
  const v = props.modelValue
  if (props.mode === 'html') return !v || v.replace(/<[^>]*>/g, '').trim() === ''
  return !v || v.trim() === ''
})

function onInput() {
  emit('update:modelValue', readContent())
}

onMounted(() => writeContent(props.modelValue))

// Externí změna (AI, šablona) — přepiš DOM jen když se reálně liší (při psaní
// se DOM == model, takže se nic nepřepíše a caret zůstane na místě).
watch(
  () => props.modelValue,
  (v) => {
    if (readContent() !== v) writeContent(v)
  },
)
// Přepnutí jazyka / explicitní reset — vždy přenačti z modelu.
watch(
  () => props.resetKey,
  () => writeContent(props.modelValue),
)
</script>

<template>
  <div
    ref="el"
    :contenteditable="true"
    role="textbox"
    :data-placeholder="placeholder"
    :class="['canvas-editable outline-none', isEmpty && 'is-empty']"
    @input="onInput"
  />
</template>

<style scoped>
.canvas-editable.is-empty::before {
  content: attr(data-placeholder);
  opacity: 0.5;
  pointer-events: none;
}
.canvas-editable :deep(p) {
  margin: 0 0 0.5em;
}
.canvas-editable :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
