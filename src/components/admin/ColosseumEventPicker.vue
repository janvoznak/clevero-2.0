<script setup lang="ts">
/**
 * Našeptávač akcí z Colossea (přes API) — hlavní napojení prodeje vstupenek.
 * Colosseum posílá název akce + termín (datum/čas). v-model = ID vybrané akce
 * ('' = nenapojeno). Jednovýběr — jedna akce = jedno napojení na košík Colossea.
 */
import { computed, nextTick, ref } from 'vue'
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import type { ColosseumEvent } from '@/data/mockEvents'

const props = defineProps<{ events: ColosseumEvent[] }>()
const model = defineModel<string>({ default: '' })

const open = ref(false)
const query = ref('')
const inputEl = ref<HTMLInputElement | null>(null)

const selected = computed(() => props.events.find((e) => e.id === model.value) ?? null)
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.events
  return props.events.filter((e) => e.name.toLowerCase().includes(q) || e.when.toLowerCase().includes(q))
})

function pick(id: string) {
  model.value = id
  close()
}
function clear() {
  model.value = ''
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
  <div>
    <!-- Vybraná akce z Colossea -->
    <div
      v-if="selected"
      class="mb-2 flex items-center gap-2.5 rounded-md border border-brand-300 bg-brand-50/50 px-3 py-2"
    >
      <Icon name="ticket" :size="16" class="shrink-0 text-brand-600" />
      <span class="min-w-0 flex-1">
        <span class="block truncate text-[13px] font-600 text-graphite-900">{{ selected.name }}</span>
        <span class="block text-[11.5px] text-steel-500">
          {{ selected.when }} · <span class="font-mono text-[10.5px]">{{ selected.id }}</span>
        </span>
      </span>
      <button
        type="button"
        class="grid h-6 w-6 shrink-0 place-items-center rounded text-steel-400 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-700"
        title="Odpojit akci z Colossea"
        @click="clear"
      >
        <Icon name="x" :size="14" />
      </button>
    </div>

    <!-- Našeptávač -->
    <PopoverRoot :open="open" @update:open="onOpen">
      <PopoverTrigger as-child>
        <button
          type="button"
          class="inline-flex h-10 w-full items-center justify-between gap-2 rounded-md border border-steel-200 bg-white px-3 text-[13px] text-steel-500 outline-none transition-colors hover:border-steel-300 focus:border-brand-500 data-[state=open]:border-brand-500"
        >
          <span class="inline-flex items-center gap-2">
            <Icon name="search" :size="15" class="text-steel-400" />
            {{ selected ? 'Změnit akci z Colossea…' : 'Vyhledat akci z Colossea…' }}
          </span>
          <Icon name="chevronDown" :size="14" class="text-steel-400" />
        </button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          align="start"
          :side-offset="6"
          class="z-50 w-[--reka-popover-trigger-width] overflow-hidden rounded-lg border border-steel-200 bg-white shadow-2xl"
          @open-auto-focus.prevent
        >
          <div class="border-b border-steel-100 p-1.5">
            <div class="relative">
              <Icon name="search" :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-steel-400" />
              <input
                ref="inputEl"
                v-model="query"
                type="text"
                placeholder="Hledat podle názvu nebo termínu…"
                class="h-8 w-full rounded-md border border-steel-200 bg-white pl-8 pr-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
          <div class="max-h-64 overflow-y-auto p-1.5">
            <button
              v-for="e in filtered"
              :key="e.id"
              type="button"
              class="relative flex w-full cursor-pointer items-start gap-2 rounded-md px-2.5 py-2 pr-8 text-left outline-none transition-colors hover:bg-steel-100"
              @click="pick(e.id)"
            >
              <Icon name="ticket" :size="14" class="mt-0.5 shrink-0 text-steel-400" />
              <span class="min-w-0">
                <span class="block truncate text-[13px] font-600 text-graphite-900">{{ e.name }}</span>
                <span class="block text-[11.5px] text-steel-500">{{ e.when }}</span>
              </span>
              <Icon v-if="e.id === model" name="check" :size="15" class="absolute right-2.5 top-2.5 text-brand-500" />
            </button>
            <p v-if="!filtered.length" class="px-2.5 py-3 text-[12.5px] text-steel-400">Žádná akce nenalezena.</p>
          </div>
          <div class="border-t border-steel-100 px-2.5 py-1.5 text-[11px] text-steel-400">
            Seznam se načítá z Colossea přes API (prototyp).
          </div>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  </div>
</template>
