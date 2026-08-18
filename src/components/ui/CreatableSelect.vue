<script setup lang="ts">
/**
 * Výběr s možností vytvořit novou položku („vyber nebo napiš novou").
 * Chová se jako AppSelect, ale v panelu má filtrační pole a když napíšeš
 * název, který ještě neexistuje, nabídne „+ Vytvořit …". Emituje `create`
 * s novým názvem (nadřazená komponenta si ho zaregistruje do svého seznamu).
 */
import { computed, nextTick, ref } from 'vue'
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'

export interface SelectOption {
  value: string
  label: string
}

const props = defineProps<{
  options: SelectOption[]
  placeholder?: string
  /** Popisek u nabídky „vytvořit" — např. „kategorii". */
  createNoun?: string
}>()

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ create: [string] }>()

const open = ref(false)
const query = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

const selectedLabel = computed(
  () => props.options.find((o) => o.value === model.value)?.label ?? model.value,
)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((o) => o.label.toLowerCase().includes(q))
})

const exactExists = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q !== '' && props.options.some((o) => o.label.toLowerCase() === q)
})
const canCreate = computed(() => query.value.trim() !== '' && !exactExists.value)

function pick(value: string) {
  model.value = value
  close()
}
function createNew() {
  const label = query.value.trim()
  if (!label) return
  emit('create', label)
  model.value = label
  close()
}
function close() {
  open.value = false
  query.value = ''
}
function onOpen(v: boolean) {
  open.value = v
  if (v) nextTick(() => inputEl.value?.focus())
}
</script>

<template>
  <PopoverRoot :open="open" @update:open="onOpen">
    <PopoverTrigger
      class="inline-flex h-9 w-full min-w-[150px] items-center justify-between gap-2 rounded-md border border-steel-200 bg-white px-3 text-[13px] outline-none transition-colors hover:border-steel-300 focus:border-brand-500 data-[state=open]:border-brand-500"
      :class="selectedLabel ? 'text-graphite-800' : 'text-steel-400'"
    >
      <span class="truncate">{{ selectedLabel || placeholder || 'Vyberte…' }}</span>
      <Icon name="chevronDown" :size="14" class="shrink-0 text-steel-400" />
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        align="start"
        :side-offset="6"
        class="z-50 w-[--reka-popover-trigger-width] overflow-hidden rounded-lg border border-steel-200 bg-white shadow-2xl"
        @open-auto-focus.prevent
      >
        <!-- Filtr / název nové položky -->
        <div class="border-b border-steel-100 p-1.5">
          <div class="relative">
            <Icon name="search" :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-steel-400" />
            <input
              ref="inputEl"
              v-model="query"
              type="text"
              placeholder="Napiš nebo vyber…"
              class="h-8 w-full rounded-md border border-steel-200 bg-white pl-8 pr-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              @keydown.enter.prevent="canCreate ? createNew() : (filtered[0] && pick(filtered[0].value))"
            />
          </div>
        </div>

        <!-- Seznam možností -->
        <div class="max-h-56 overflow-y-auto p-1.5">
          <button
            v-for="opt in filtered"
            :key="opt.value"
            type="button"
            class="relative flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 pr-8 text-left text-[13px] text-graphite-800 outline-none transition-colors hover:bg-steel-100"
            :class="opt.value === model && 'font-600 text-brand-600'"
            @click="pick(opt.value)"
          >
            <span class="truncate">{{ opt.label }}</span>
            <Icon v-if="opt.value === model" name="check" :size="15" class="absolute right-2.5 text-brand-500" />
          </button>

          <!-- Vytvořit novou -->
          <button
            v-if="canCreate"
            type="button"
            class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-[13px] font-500 text-brand-600 outline-none transition-colors hover:bg-brand-50"
            @click="createNew"
          >
            <Icon name="plus" :size="15" class="shrink-0" />
            <span class="truncate">Vytvořit „{{ query.trim() }}"{{ createNoun ? ` (${createNoun})` : '' }}</span>
          </button>

          <!-- Prázdno bez možnosti vytvořit -->
          <p v-else-if="!filtered.length" class="px-2.5 py-2 text-[12.5px] text-steel-400">Nic nenalezeno.</p>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
