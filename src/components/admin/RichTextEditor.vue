<script setup lang="ts">
import {
  ToggleGroupRoot,
  ToggleGroupItem,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
  PopoverRoot,
  PopoverTrigger,
  PopoverPortal,
  PopoverContent,
  PopoverClose,
} from 'reka-ui'
import { computed, ref, watch } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import DovikAvatar from '@/components/admin/DovikAvatar.vue'

/** Vizuální náhrada CKEditoru pro prototyp (contenteditable + toolbar). */
const model = defineModel<string>({ default: '' })
/**
 * Vestavěné AI:
 * - 'generate' (výchozí) = tlačítko „Napsat s DOVíkem" v liště (vygeneruje nový text),
 * - 'dovik' = patička DOVíka pod editorem: přepíše text, který uživatel napsal, do
 *   souvislých vět (obsah NEvymýšlí) + volitelný pokyn + „Vrátit původní". Jednotné
 *   řešení pro všechna pole s CK editorem.
 * - 'none' = bez vestavěného AI; do lišty lze vložit vlastní přes slot `toolbar-ai`.
 */
const props = withDefaults(
  defineProps<{ ai?: 'generate' | 'dovik' | 'none'; flush?: boolean }>(),
  {
    ai: 'generate',
    // flush = bez vlastního rámečku/zaoblení (když editor obaluje nadřazený box).
    flush: false,
  },
)
const editor = ref<HTMLElement | null>(null)

const tools = [
  { group: 'style', items: [
    { v: 'bold', label: 'Tučně', glyph: 'B', cls: 'font-800' },
    { v: 'italic', label: 'Kurzíva', glyph: 'I', cls: 'italic font-serif' },
    { v: 'underline', label: 'Podtržení', glyph: 'U', cls: 'underline' },
  ]},
]
const active = ref<string[]>([])

function exec(cmd: string) {
  document.execCommand(cmd, false)
  editor.value?.focus()
}
function onInput() {
  model.value = editor.value?.innerHTML ?? ''
}

/* ---------- AI: napsat text (prototyp — žádná reálná AI) ---------- */
const aiOpen = ref(false)
const aiPrompt = ref('')
const aiGenerating = ref(false)
function aiGenerate() {
  if (aiGenerating.value) return
  aiGenerating.value = true
  window.setTimeout(() => {
    const topic = aiPrompt.value.trim() || 'Nový příspěvek'
    const html =
      `<p><strong>${topic}</strong> — areál Dolních Vítkovic zve návštěvníky na jedinečný zážitek ` +
      `mezi vysokými pecemi a industriální architekturou.</p>` +
      `<p>Prohlídka nabízí komentovaný výklad, panoramatické výhledy z ochozů a program pro celou rodinu. ` +
      `Aktuální termíny a vstupné najdete níže.</p>`
    model.value = (model.value || '') + html
    if (editor.value) editor.value.innerHTML = model.value
    aiGenerating.value = false
    aiOpen.value = false
    aiPrompt.value = ''
  }, 1400)
}

/* ---------- DOVík: přepis textu do souvislých vět (ai="dovik") ----------
   Uživatel napíše text sám (klidně jen body) → DOVík ho přepíše. AI obsah
   NEvymýšlí, jen stylizuje. Volitelný pokyn (prompt) + „Vrátit původní". */
const dovikBusy = ref(false)
const dovikInstruction = ref('')
const rewriteChips = ['Stručněji', 'Formálněji', 'Do odrážek']
const hasText = computed(() => (model.value || '').replace(/<[^>]*>/g, '').trim().length > 0)

// Snapshot pro undo. Jakákoli změna textu zvenčí (ruční editace, přepnutí mutace)
// snapshot zahodí — „Vrátit původní" dává smysl jen hned po přepisu.
const backup = ref<string | null>(null)
const canUndo = computed(() => backup.value !== null)
let selfChange = false
watch(model, () => {
  if (selfChange) {
    selfChange = false
    return
  }
  backup.value = null
})

function polishDraft(raw: string, instruction = ''): string {
  const text = raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const parts = text
    .split(/(?:[.;\n]|\s[•·–-]\s)+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (!parts.length) return `<p>${text}</p>`
  const cap = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`
  const instr = instruction.toLowerCase()
  if (/odráž|body|seznam|bullet/.test(instr)) {
    return `<ul>${parts.map((s) => `<li>${cap(s)}</li>`).join('')}</ul>`
  }
  if (/struč|krát|zkrat|kratš/.test(instr)) {
    const brief = parts.slice(0, Math.min(2, parts.length))
    return `<p>${brief.map((s) => `${cap(s)}.`).join(' ')}</p>`
  }
  if (/formál|zdvoř|oficiál/.test(instr)) {
    return `<p>Děkujeme za dotaz. ${parts.map((s) => `${cap(s)}.`).join(' ')}</p>`
  }
  return parts.map((s) => `<p>${cap(s)}.</p>`).join('')
}

function dovikRewrite(instruction = '') {
  if (dovikBusy.value || !hasText.value) return
  backup.value = model.value
  dovikBusy.value = true
  window.setTimeout(() => {
    selfChange = true
    model.value = polishDraft(backup.value ?? '', instruction)
    if (editor.value) editor.value.innerHTML = model.value
    dovikBusy.value = false
    dovikInstruction.value = ''
  }, 1000)
}
function dovikUndo() {
  if (backup.value === null) return
  selfChange = true
  model.value = backup.value
  if (editor.value) editor.value.innerHTML = model.value
  backup.value = null
}
</script>

<template>
  <div class="overflow-hidden" :class="flush ? '' : 'rounded-md border border-steel-200 focus-within:border-brand-500'">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-1 border-b border-steel-200 bg-steel-50 px-2 py-1.5">
      <TooltipProvider :delay-duration="300">
        <ToggleGroupRoot
          v-model="active"
          type="multiple"
          class="flex items-center gap-0.5"
        >
          <template v-for="grp in tools" :key="grp.group">
            <TooltipRoot v-for="t in grp.items" :key="t.v">
              <TooltipTrigger as-child>
                <ToggleGroupItem
                  :value="t.v"
                  class="grid h-7 w-7 place-items-center rounded text-[13px] text-graphite-700 transition-colors hover:bg-steel-200 data-[state=on]:bg-graphite-900 data-[state=on]:text-white"
                  :class="t.cls"
                  @click="exec(t.v)"
                >
                  {{ t.glyph }}
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent side="top" class="rounded bg-graphite-900 px-2 py-1 text-[11px] text-white">
                  {{ t.label }}
                </TooltipContent>
              </TooltipPortal>
            </TooltipRoot>
          </template>
        </ToggleGroupRoot>
      </TooltipProvider>

      <span class="mx-1 h-5 w-px bg-steel-200" />
      <button
        class="grid h-7 w-7 place-items-center rounded text-graphite-700 hover:bg-steel-200"
        title="Odrážkový seznam"
        @click="exec('insertUnorderedList')"
      >
        ☰
      </button>
      <button
        class="grid h-7 w-7 place-items-center rounded text-graphite-700 hover:bg-steel-200"
        title="Odkaz"
        @click="exec('createLink')"
      >
        🔗
      </button>
      <span class="ml-auto"></span>

      <!-- Vlastní AI z rodiče (např. FAQ: přepis odpovědi do vět) -->
      <slot name="toolbar-ai" />

      <!-- AI: napsat text (prototyp) -->
      <PopoverRoot v-if="ai === 'generate'" v-model:open="aiOpen">
        <PopoverTrigger as-child>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2.5 py-1 text-[12px] font-600 text-brand-700 outline-none transition-colors hover:bg-brand-100 data-[state=open]:bg-brand-100"
          >
            <Icon name="sparkles" :size="14" /> Napsat s DOVíkem
          </button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            side="bottom"
            align="end"
            :side-offset="8"
            class="z-50 w-80 rounded-xl border border-steel-200 bg-white p-4 shadow-2xl"
          >
            <div class="mb-1.5 flex items-center gap-2">
              <span class="grid h-7 w-7 place-items-center rounded-md bg-brand-50 text-brand-600">
                <Icon name="sparkles" :size="15" />
              </span>
              <p class="text-[13px] font-700 text-graphite-900">Napsat text s DOVíkem</p>
            </div>
            <p class="mb-2.5 text-[11.5px] leading-relaxed text-steel-500">
              Zadejte téma nebo pokyn a DOVík navrhne text. <span class="text-steel-400">(prototyp)</span>
            </p>
            <textarea
              v-model="aiPrompt"
              rows="3"
              placeholder="Např. Napiš pozvánku na noční prohlídku dolu Hlubina…"
              class="mb-2.5 w-full resize-y rounded-md border border-steel-200 px-3 py-2 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
            />
            <div class="flex justify-end gap-2">
              <PopoverClose as-child>
                <AppButton variant="secondary" size="sm">Zavřít</AppButton>
              </PopoverClose>
              <AppButton variant="primary" size="sm" :disabled="aiGenerating" @click="aiGenerate">
                <Icon name="sparkles" :size="14" :class="aiGenerating && 'animate-pulse'" />
                {{ aiGenerating ? 'Generuji…' : 'Vygenerovat' }}
              </AppButton>
            </div>
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>

      <span class="field-tag pl-2 pr-1">CKEditor (prototyp)</span>
    </div>

    <!-- Editable area -->
    <div
      ref="editor"
      contenteditable="true"
      class="prose-editor min-h-[180px] px-4 py-3 text-[14px] leading-relaxed text-graphite-800 focus:outline-none"
      v-html="model"
      @input="onInput"
    />

    <!-- Patička DOVíka: přepis textu do souvislých vět (ai="dovik") -->
    <div v-if="props.ai === 'dovik'" class="border-t border-steel-200 bg-brand-50/50 px-3 py-2.5">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <DovikAvatar :size="24" class="shrink-0" />
        <span class="text-[12.5px] font-700 text-graphite-900">DOVík</span>
        <span class="text-[11.5px] text-steel-500">přepíše text do souvislých vět (obsah nevymýšlí)</span>
        <div class="ml-auto flex flex-wrap items-center gap-1.5">
          <button
            v-for="c in rewriteChips"
            :key="c"
            type="button"
            class="rounded-full border px-2.5 py-0.5 text-[11.5px] transition-colors"
            :class="dovikInstruction.trim() === c
              ? 'border-brand-400 bg-brand-50 font-600 text-brand-700'
              : 'border-steel-200 bg-white text-graphite-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700'"
            @click="dovikInstruction = dovikInstruction.trim() === c ? '' : c"
          >
            {{ c }}
          </button>
        </div>
      </div>

      <div class="mt-2 flex flex-wrap items-center gap-2">
        <input
          v-model="dovikInstruction"
          type="text"
          placeholder="Pokyn pro DOVíka (nepovinné) — např. zdvořile ve 2 větách, do odrážek…"
          class="h-9 min-w-[180px] flex-1 rounded-md border border-steel-200 bg-white px-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
          @keydown.enter.prevent="hasText && dovikRewrite(dovikInstruction)"
        />
        <AppButton variant="primary" size="sm" :disabled="dovikBusy || !hasText" @click="dovikRewrite(dovikInstruction)">
          <Icon name="sparkles" :size="15" :class="dovikBusy && 'animate-pulse'" />
          {{ dovikBusy ? 'Přepisuji…' : 'Přepsat do vět' }}
        </AppButton>
        <button
          v-if="canUndo"
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border border-steel-200 bg-white px-3 py-1.5 text-[12.5px] font-500 text-steel-600 outline-none transition-colors hover:border-steel-300 hover:bg-steel-50 hover:text-graphite-800"
          title="Vrátit text na verzi před úpravou DOVíkem"
          @click="dovikUndo"
        >
          <Icon name="sync" :size="14" /> Vrátit původní
        </button>
      </div>
      <p v-if="!hasText" class="mt-1.5 text-[11.5px] text-steel-500">Nejdřív napiš text výše (klidně jen body).</p>
    </div>
  </div>
</template>

<style scoped>
.prose-editor:empty::before {
  content: 'Začněte psát hlavní obsah aktuality…';
  color: var(--color-steel-400);
}
.prose-editor :deep(p) {
  margin: 0 0 0.6em;
}
.prose-editor :deep(ul) {
  margin: 0 0 0.6em 1.2em;
  list-style: disc;
}
.prose-editor :deep(a) {
  color: var(--color-brand-600);
  text-decoration: underline;
}
</style>
