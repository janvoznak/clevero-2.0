<script setup lang="ts">
/**
 * Výběr vazeb na záznamy z jiných modulů (galerie, akce…).
 * Jedna sdílená komponenta pro všechny relační výběry — v-model = pole ID.
 * UI/UX vychází z `TagPicker` (Popover + hledání + výběr), jen s bohatšími
 * položkami (miniatura + popisek). Prototyp — data přicházejí přes `items`.
 */
import { computed, ref } from 'vue'
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'

export interface RelItem {
  id: string
  label: string
  /** Doplňující řádek (např. termín, počet fotek). */
  sub?: string
  /** Miniatura (URL). */
  thumb?: string
  /** Barevná tečka místo miniatury (např. barva budovy). */
  color?: string
}

const props = withDefaults(
  defineProps<{
    items: RelItem[]
    addLabel?: string
    emptyLabel?: string
    searchPlaceholder?: string
    /** Ikona pro položky bez miniatury. */
    icon?: string
  }>(),
  {
    addLabel: 'Přidat',
    emptyLabel: 'Zatím nic nepřiřazeno.',
    searchPlaceholder: 'Hledat…',
    icon: 'reference',
  },
)
const model = defineModel<string[]>({ default: () => [] })

const search = ref('')
const byId = computed(() => new Map(props.items.map((i) => [i.id, i])))
const selectedItems = computed(() => model.value.map((id) => byId.value.get(id)).filter((i): i is RelItem => !!i))
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return props.items.filter((i) => !q || i.label.toLowerCase().includes(q) || (i.sub ?? '').toLowerCase().includes(q))
})

function isSelected(id: string) {
  return model.value.includes(id)
}
function toggle(id: string) {
  model.value = isSelected(id) ? model.value.filter((x) => x !== id) : [...model.value, id]
}
function remove(id: string) {
  model.value = model.value.filter((x) => x !== id)
}
</script>

<template>
  <div>
    <!-- Vybrané položky -->
    <ul v-if="selectedItems.length" class="mb-2.5 space-y-1.5">
      <li
        v-for="it in selectedItems"
        :key="it.id"
        class="flex items-center gap-2.5 rounded-md border border-steel-200 bg-white py-1.5 pl-1.5 pr-2"
      >
        <span class="grid h-9 w-12 shrink-0 place-items-center overflow-hidden rounded bg-steel-100 text-steel-400">
          <img v-if="it.thumb" :src="it.thumb" alt="" class="h-full w-full object-cover" />
          <span v-else-if="it.color" class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: it.color }" />
          <Icon v-else :name="icon" :size="16" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-[13px] font-600 text-graphite-800">{{ it.label }}</span>
          <span v-if="it.sub" class="block truncate text-[11.5px] text-steel-500">{{ it.sub }}</span>
        </span>
        <button
          type="button"
          class="grid h-6 w-6 shrink-0 place-items-center rounded-md text-steel-400 transition-colors hover:bg-danger-500/10 hover:text-danger-600"
          aria-label="Odebrat"
          @click="remove(it.id)"
        >
          <Icon name="x" :size="14" />
        </button>
      </li>
    </ul>
    <p v-else class="mb-2.5 text-[12px] text-steel-400">{{ emptyLabel }}</p>

    <!-- Přidat vazbu -->
    <PopoverRoot>
      <PopoverTrigger as-child>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-1.5 text-[12.5px] font-500 text-graphite-700 outline-none transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600 data-[state=open]:border-brand-500 data-[state=open]:text-brand-600"
        >
          <Icon name="plus" :size="15" /> {{ addLabel }}
        </button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent align="start" :side-offset="6" class="z-50 w-80 rounded-xl border border-steel-200 bg-white p-2 shadow-2xl">
          <div class="relative mb-1.5">
            <Icon name="search" :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-steel-400" />
            <input
              v-model="search"
              type="text"
              :placeholder="searchPlaceholder"
              class="h-8 w-full rounded-md border border-steel-200 pl-8 pr-2 text-[13px] focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div class="scroll-thin max-h-64 overflow-y-auto">
            <button
              v-for="it in filtered"
              :key="it.id"
              type="button"
              class="flex w-full items-center gap-2.5 rounded-md px-1.5 py-1.5 text-left outline-none transition-colors hover:bg-steel-100"
              @click="toggle(it.id)"
            >
              <span class="grid h-8 w-11 shrink-0 place-items-center overflow-hidden rounded bg-steel-100 text-steel-400">
                <img v-if="it.thumb" :src="it.thumb" alt="" class="h-full w-full object-cover" />
                <span v-else-if="it.color" class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: it.color }" />
                <Icon v-else :name="icon" :size="15" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[13px] text-graphite-800">{{ it.label }}</span>
                <span v-if="it.sub" class="block truncate text-[11px] text-steel-500">{{ it.sub }}</span>
              </span>
              <Icon v-if="isSelected(it.id)" name="check" :size="16" class="shrink-0 text-brand-500" />
            </button>
            <p v-if="!filtered.length" class="px-2 py-3 text-center text-[12.5px] text-steel-400">Nic nenalezeno.</p>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  </div>
</template>
