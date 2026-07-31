<script setup lang="ts">
/**
 * Vizuální výběr formuláře (prototyp — „content builder" jen jako zástupka).
 * - výběr z připravených šablon (karty s náhledem polí),
 * - náhled sestaveného formuláře (nefunkční),
 * - AI vytvoření formuláře (předstíraný stav, žádný reálný model).
 */
import { computed, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import type { FormTemplate } from '@/data/mockPages'

const props = defineProps<{ templates: FormTemplate[] }>()
/** Vybraná šablona (id). */
const model = defineModel<string>({ default: '' })

/* AI vytvoření (prototyp — jen ref + setTimeout). */
const prompt = ref('')
const generating = ref(false)
const generated = ref<FormTemplate | null>(null)
function generate() {
  if (!prompt.value.trim() || generating.value) return
  generating.value = true
  window.setTimeout(() => {
    // prototyp — „AI" vytvoří zástupný formulář z popisu
    generated.value = {
      id: 'ft-ai',
      name: prompt.value.trim().slice(0, 48),
      desc: 'Návrh vytvořený AI (prototyp)',
      fields: [
        { label: 'Jméno a příjmení', type: 'text' },
        { label: 'E-mail', type: 'email' },
        { label: 'Telefon', type: 'tel' },
        { label: 'Zpráva', type: 'textarea' },
      ],
    }
    model.value = 'ft-ai'
    generating.value = false
    prompt.value = ''
  }, 1300)
}

const allTemplates = computed(() => (generated.value ? [...props.templates, generated.value] : props.templates))
const selected = computed(() => allTemplates.value.find((t) => t.id === model.value) ?? null)

const inputPreview = 'pointer-events-none h-9 w-full rounded-md border border-steel-200 bg-steel-50 px-3 text-[13px] text-steel-400'
</script>

<template>
  <div class="space-y-5">
    <!-- AI vytvoření formuláře (prototyp) -->
    <div class="rounded-md border border-brand-500/20 bg-brand-50 p-4">
      <div class="mb-1 flex items-center gap-2">
        <Icon name="sparkles" :size="18" class="text-brand-500" />
        <p class="text-[13px] font-600 text-graphite-800">Vytvořit formulář s AI</p>
      </div>
      <p class="mb-2.5 text-[12px] text-steel-500">Popište, jaký formulář potřebujete — AI navrhne pole.</p>
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
    </div>

    <!-- Výběr ze šablon -->
    <div>
      <p class="mb-2 flex items-center gap-2 text-[12.5px] text-steel-500">
        Vyberte formulář ze šablon — klik zobrazí náhled polí.
        <span class="field-tag">page-form</span>
      </p>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button
          v-for="t in allTemplates"
          :key="t.id"
          type="button"
          class="group flex flex-col rounded-lg border p-3 text-left outline-none transition-all hover:-translate-y-0.5 hover:shadow-md"
          :class="model === t.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500/20' : 'border-steel-200 bg-white hover:border-brand-300'"
          @click="model = t.id"
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

    <!-- Náhled sestaveného formuláře (nefunkční) -->
    <div v-if="selected" class="rounded-lg border border-steel-200 bg-steel-50/60 p-4">
      <div class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon name="reference" :size="16" class="text-brand-500" />
          <p class="text-[13px] font-700 text-graphite-900">{{ selected.name }}</p>
        </div>
        <span class="field-tag">náhled · prototyp</span>
      </div>
      <div class="space-y-3 rounded-md border border-steel-200 bg-white p-4">
        <template v-for="f in selected.fields" :key="f.label">
          <!-- checkbox: štítek je popisek zaškrtávátka -->
          <label v-if="f.type === 'checkbox'" class="flex items-center gap-2 text-[13px] text-graphite-700">
            <span class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-steel-50" />
            {{ f.label }}
          </label>
          <div v-else>
            <label class="mb-1 block text-[12.5px] font-600 text-graphite-800">{{ f.label }}</label>
            <textarea v-if="f.type === 'textarea'" rows="2" disabled :class="[inputPreview, 'h-auto py-2']" />
            <div v-else-if="f.type === 'file'" class="flex items-center gap-2 rounded-md border border-dashed border-steel-300 bg-steel-50 px-3 py-2 text-[12.5px] text-steel-400">
              <Icon name="upload" :size="15" /> Nahrát soubor
            </div>
            <div v-else-if="f.type === 'select'" class="flex items-center justify-between rounded-md border border-steel-200 bg-steel-50 px-3 text-[13px] text-steel-400" style="height: 36px">
              Vyberte… <Icon name="chevronDown" :size="14" />
            </div>
            <input v-else :type="'text'" disabled :class="inputPreview" />
          </div>
        </template>
        <button type="button" disabled class="mt-1 rounded-md bg-brand-500/70 px-4 py-2 text-[13px] font-600 text-white">
          Odeslat
        </button>
      </div>
      <p class="mt-2 text-[11px] text-steel-400">Náhled je nefunkční zástupka — reálný formulář sestaví editor formulářů.</p>
    </div>
    <p v-else class="rounded-md border border-dashed border-steel-300 bg-steel-50 p-6 text-center text-[12.5px] text-steel-500">
      Zatím není vybrán žádný formulář. Vyberte šablonu výše, nebo nechte návrh vytvořit AI.
    </p>
  </div>
</template>
