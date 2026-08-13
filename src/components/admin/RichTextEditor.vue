<script setup lang="ts">
import { ref } from 'vue'
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
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'

/** Vizuální náhrada CKEditoru pro prototyp (contenteditable + toolbar). */
const model = defineModel<string>({ default: '' })
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
</script>

<template>
  <div class="overflow-hidden rounded-md border border-steel-200 focus-within:border-brand-500">
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

      <!-- AI: napsat text (prototyp) -->
      <PopoverRoot v-model:open="aiOpen">
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
