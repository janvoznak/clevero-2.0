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
} from 'reka-ui'

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
      <span class="ml-auto field-tag pr-1">CKEditor (prototyp)</span>
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
