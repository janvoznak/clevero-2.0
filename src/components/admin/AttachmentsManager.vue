<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import type { Attachment, LangCode } from '@/data/types'

const props = defineProps<{ lang: LangCode }>()
const model = defineModel<Attachment[]>({ default: () => [] })

const forLang = computed(() => model.value.filter((a) => a.lang === props.lang))

function addMock() {
  const n = model.value.length + 1
  model.value = [
    ...model.value,
    {
      id: `att-${n}-${props.lang}`,
      name: `dokument-${n}.pdf`,
      size: `${120 + n * 37} kB`,
      ext: 'pdf',
      lang: props.lang,
    },
  ]
}
function remove(id: string) {
  model.value = model.value.filter((a) => a.id !== id)
}

const extColor: Record<string, string> = {
  pdf: 'bg-danger-500/10 text-danger-600',
  doc: 'bg-brand-500/10 text-brand-600',
  docx: 'bg-brand-500/10 text-brand-600',
  xls: 'bg-forge-500/10 text-forge-600',
  zip: 'bg-graphite-800/10 text-graphite-700',
}
</script>

<template>
  <div>
    <ul v-if="forLang.length" class="mb-3 space-y-2">
      <li
        v-for="a in forLang"
        :key="a.id"
        class="flex items-center gap-3 rounded-md border border-steel-200 bg-steel-50 px-3 py-2.5"
      >
        <span
          class="grid h-9 w-9 shrink-0 place-items-center rounded-md font-mono text-[10px] font-700 uppercase"
          :class="extColor[a.ext] ?? 'bg-steel-200 text-steel-600'"
        >
          {{ a.ext }}
        </span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-[13.5px] font-500 text-graphite-800">{{ a.name }}</p>
          <p class="font-mono text-[10.5px] text-steel-400">{{ a.size }}</p>
        </div>
        <button
          class="grid h-8 w-8 place-items-center rounded-md text-steel-400 transition-colors hover:bg-danger-500/10 hover:text-danger-500"
          @click="remove(a.id)"
        >
          <Icon name="trash" :size="15" />
        </button>
      </li>
    </ul>

    <button
      class="inline-flex items-center gap-2 rounded-md border border-dashed border-steel-300 px-3.5 py-2.5 text-[13px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"
      @click="addMock"
    >
      <Icon name="paperclip" :size="16" />
      Nahrát přílohu
      <span class="field-tag">· {{ lang.toUpperCase() }}</span>
    </button>
  </div>
</template>
