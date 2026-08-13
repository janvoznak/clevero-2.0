<script setup lang="ts">
/**
 * Editor formuláře (prototyp — vizuální zástupka, princip 0).
 * - start ze šablony nebo z „AI" návrhu,
 * - pole lze přejmenovat, změnit typ, přetáhnout (reorder), smazat i přidat.
 * Struktura formuláře je jen demonstrace UX; reálné odesílání řeší backend.
 */
import { computed, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AiPanel from '@/components/admin/AiPanel.vue'
import type { FormTemplate, FormFieldType } from '@/data/mockPages'

const props = defineProps<{ templates: FormTemplate[] }>()
/** Vybraná šablona (id) — jen pro zvýraznění karty. */
const model = defineModel<string>({ default: '' })

/** Editovatelné pole formuláře (s vlastním id kvůli reorderu). */
interface EditField {
  id: string
  label: string
  type: FormFieldType
}
const FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'E-mail' },
  { value: 'tel', label: 'Telefon' },
  { value: 'number', label: 'Číslo' },
  { value: 'date', label: 'Datum' },
  { value: 'textarea', label: 'Víceřádkový text' },
  { value: 'select', label: 'Výběr z možností' },
  { value: 'checkbox', label: 'Zaškrtávátko' },
  { value: 'file', label: 'Soubor' },
]

const fields = ref<EditField[]>([])
/** Byl formulář po výběru šablony ručně upraven? */
const edited = ref(false)
let seq = 0
function nextId() {
  seq += 1
  return `fld-${seq}`
}

/* ---------- Start ze šablony / AI ---------- */
function loadTemplate(t: FormTemplate) {
  model.value = t.id
  fields.value = t.fields.map((f) => ({ id: nextId(), label: f.label, type: f.type }))
  edited.value = false
}

const prompt = ref('')
const generating = ref(false)
function generate() {
  if (!prompt.value.trim() || generating.value) return
  generating.value = true
  window.setTimeout(() => {
    model.value = 'ft-ai'
    fields.value = [
      { id: nextId(), label: 'Jméno a příjmení', type: 'text' },
      { id: nextId(), label: 'E-mail', type: 'email' },
      { id: nextId(), label: 'Telefon', type: 'tel' },
      { id: nextId(), label: 'Zpráva', type: 'textarea' },
    ]
    edited.value = false
    generating.value = false
    prompt.value = ''
  }, 1300)
}

/* ---------- Editace polí ---------- */
function addField() {
  fields.value = [...fields.value, { id: nextId(), label: 'Nové pole', type: 'text' }]
  edited.value = true
}
function removeField(id: string) {
  fields.value = fields.value.filter((f) => f.id !== id)
  edited.value = true
}

/* ---------- Drag & drop reorder ---------- */
const dragId = ref<string | null>(null)
const overId = ref<string | null>(null)
function onDragStart(id: string) {
  dragId.value = id
}
function onDragOver(id: string) {
  if (dragId.value && dragId.value !== id) overId.value = id
}
function onDrop(id: string) {
  const from = dragId.value
  if (!from || from === id) return resetDnd()
  const list = [...fields.value]
  const fi = list.findIndex((f) => f.id === from)
  const ti = list.findIndex((f) => f.id === id)
  if (fi < 0 || ti < 0) return resetDnd()
  const [moved] = list.splice(fi, 1)
  list.splice(ti, 0, moved)
  fields.value = list
  edited.value = true
  resetDnd()
}
function resetDnd() {
  dragId.value = null
  overId.value = null
}

const selectedTemplate = computed(() => props.templates.find((t) => t.id === model.value) ?? null)
const inputPreview = 'pointer-events-none h-9 w-full rounded-md border border-steel-200 bg-steel-50 px-3 text-[13px] text-steel-400'
</script>

<template>
  <div class="space-y-5">
    <!-- DOVík: návrh formuláře z popisu (sjednocený AI panel) -->
    <AiPanel title="Vytvořit formulář s DOVíkem" hint="Popište, jaký formulář potřebujete — DOVík navrhne pole, která pak upravíte.">
      <div class="flex flex-wrap gap-2">
        <input
          v-model="prompt"
          type="text"
          placeholder="Např. rezervace firemního večírku v aule Gong…"
          class="h-10 min-w-[220px] flex-1 rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
          @keydown.enter.prevent="generate"
        />
        <AppButton variant="primary" :disabled="!prompt.trim() || generating" @click="generate">
          <Icon name="sparkles" :size="15" :class="generating && 'animate-pulse'" />
          {{ generating ? 'Generuji…' : 'Vygenerovat' }}
        </AppButton>
      </div>
    </AiPanel>

    <!-- Výběr ze šablon -->
    <div>
      <p class="mb-2 flex items-center gap-2 text-[12.5px] text-steel-500">
        Vyberte formulář ze šablon — pole pak upravíte níže.
        <span class="field-tag">page-form</span>
      </p>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button
          v-for="t in templates"
          :key="t.id"
          type="button"
          class="group flex flex-col rounded-lg border p-3 text-left outline-none transition-all hover:-translate-y-0.5 hover:shadow-md"
          :class="model === t.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/20' : 'border-steel-200 bg-white hover:border-brand-300'"
          @click="loadTemplate(t)"
        >
          <span class="mb-2 flex items-center justify-between">
            <span
              class="grid h-7 w-7 place-items-center rounded-md"
              :class="model === t.id ? 'bg-brand-500 text-white' : 'bg-steel-100 text-steel-500'"
            >
              <Icon name="reference" :size="15" />
            </span>
            <Icon v-if="model === t.id" name="check" :size="16" class="text-brand-500" />
          </span>
          <span class="text-[13px] font-600 leading-tight text-graphite-900">{{ t.name }}</span>
          <span class="mt-0.5 line-clamp-2 text-[11px] leading-snug text-steel-500">{{ t.desc }}</span>
          <span class="mt-2 flex flex-wrap gap-1">
            <span
              v-for="f in t.fields.slice(0, 4)"
              :key="f.label"
              class="rounded bg-steel-100 px-1.5 py-0.5 text-[10px] font-500 text-steel-600"
            >
              {{ f.label }}
            </span>
            <span v-if="t.fields.length > 4" class="self-center text-[10px] text-steel-400">+{{ t.fields.length - 4 }}</span>
          </span>
        </button>
      </div>
    </div>

    <!-- Editor formuláře -->
    <div v-if="fields.length" class="rounded-lg border border-steel-200 bg-steel-50/60 p-4">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon name="reference" :size="16" class="text-brand-500" />
          <p class="text-[13px] font-700 text-graphite-900">
            {{ model === 'ft-ai' ? 'Návrh DOVíka' : selectedTemplate?.name ?? 'Formulář' }}
          </p>
          <span v-if="edited" class="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10.5px] font-600 text-amber-600">upraveno</span>
        </div>
        <span class="field-tag">editace · prototyp</span>
      </div>

      <!-- Editovatelná pole -->
      <div class="space-y-2">
        <div
          v-for="f in fields"
          :key="f.id"
          draggable="true"
          class="group rounded-md border bg-white p-2.5 transition-all"
          :class="[
            overId === f.id && dragId !== f.id ? 'border-brand-400 ring-1 ring-brand-400/30' : 'border-steel-200',
            dragId === f.id ? 'opacity-40' : '',
          ]"
          @dragstart="onDragStart(f.id)"
          @dragover.prevent="onDragOver(f.id)"
          @drop.prevent="onDrop(f.id)"
          @dragend="resetDnd"
        >
          <!-- Ovládací řádek -->
          <div class="flex items-center gap-2">
            <Icon name="grip" :size="15" class="shrink-0 cursor-grab text-steel-300" />
            <input
              v-model="f.label"
              type="text"
              placeholder="Název pole"
              class="h-8 min-w-0 flex-1 rounded-md border border-steel-200 px-2.5 text-[13px] font-500 text-graphite-800 focus:border-brand-500 focus:outline-none"
              @input="edited = true"
            />
            <div class="w-[168px] shrink-0">
              <AppSelect
                :model-value="f.type"
                :options="FIELD_TYPE_OPTIONS"
                @update:model-value="(v: string) => { f.type = v as FormFieldType; edited = true }"
              />
            </div>
            <button
              type="button"
              class="grid h-8 w-8 shrink-0 place-items-center rounded-md text-steel-400 outline-none transition-colors hover:bg-danger-500/10 hover:text-danger-500"
              title="Odebrat pole"
              @click="removeField(f.id)"
            >
              <Icon name="trash" :size="15" />
            </button>
          </div>

          <!-- Stylizovaný náhled pole (nefunkční) -->
          <div class="mt-2 pl-6">
            <label v-if="f.type === 'checkbox'" class="flex items-center gap-2 text-[13px] text-graphite-700">
              <span class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-steel-50" />
              {{ f.label || 'Souhlasím…' }}
            </label>
            <textarea v-else-if="f.type === 'textarea'" rows="2" disabled :class="[inputPreview, 'h-auto py-2']" />
            <div
              v-else-if="f.type === 'file'"
              class="flex items-center gap-2 rounded-md border border-dashed border-steel-300 bg-steel-50 px-3 py-2 text-[12.5px] text-steel-400"
            >
              <Icon name="upload" :size="15" /> Nahrát soubor
            </div>
            <div
              v-else-if="f.type === 'select'"
              class="flex items-center justify-between rounded-md border border-steel-200 bg-steel-50 px-3 text-[13px] text-steel-400"
              style="height: 36px"
            >
              Vyberte… <Icon name="chevronDown" :size="14" />
            </div>
            <div
              v-else-if="f.type === 'date'"
              class="flex items-center justify-between rounded-md border border-steel-200 bg-steel-50 px-3 text-[13px] text-steel-400"
              style="height: 36px"
            >
              dd. mm. rrrr <Icon name="calendar" :size="14" />
            </div>
            <input v-else type="text" disabled :class="inputPreview" />
          </div>
        </div>
      </div>

      <!-- Přidat pole -->
      <button
        type="button"
        class="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-2 text-[12.5px] font-500 text-graphite-700 outline-none transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"
        @click="addField"
      >
        <Icon name="plus" :size="15" /> Přidat pole
      </button>

      <!-- Náhled odeslání -->
      <div class="mt-4 flex items-center justify-between border-t border-steel-200 pt-3">
        <span class="text-[11px] text-steel-400">Náhled je nefunkční zástupka — reálné odeslání řeší backend.</span>
        <button type="button" disabled class="rounded-md bg-brand-500/70 px-4 py-2 text-[13px] font-600 text-white">
          Odeslat
        </button>
      </div>
    </div>

    <!-- Prázdný stav -->
    <p v-else class="rounded-md border border-dashed border-steel-300 bg-steel-50 p-6 text-center text-[12.5px] text-steel-500">
      Zatím není vybrán žádný formulář. Vyberte šablonu výše, nebo si nechte návrh připravit od DOVíka — pole pak můžete libovolně upravit.
    </p>
  </div>
</template>
