<script setup lang="ts">
import { computed, ref } from 'vue'
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import TagChip from '@/components/ui/TagChip.vue'
import type { Tag } from '@/data/types'
import { TAG_PALETTE } from '@/data/mockNews'

/** Popisky lze přizpůsobit, aby stejná komponenta obsloužila štítky i kategorie
    (stejné UI/UX, jen jiné texty). Defaulty odpovídají štítkům. */
const props = withDefaults(
  defineProps<{
    options: Tag[]
    addLabel?: string
    emptyLabel?: string
    colorLabel?: string
    searchPlaceholder?: string
  }>(),
  {
    addLabel: 'Přidat štítek',
    emptyLabel: 'Zatím žádné štítky.',
    colorLabel: 'Barva štítku',
    searchPlaceholder: 'Hledat nebo vytvořit…',
  },
)
/** Vybrané položky (labely). */
const model = defineModel<string[]>({ default: () => [] })

function colorFor(label: string, all: Tag[]): string {
  const f = all.find((t) => t.label.toLowerCase() === label.toLowerCase())
  if (f) return f.color
  let h = 0
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0
  return TAG_PALETTE[h % TAG_PALETTE.length]
}

/** Nabídka (předdefinované + nově vytvořené během session). */
const allTags = ref<Tag[]>([...props.options])
const search = ref('')
const open = ref(false)
/** Barva zvolená pro nově vytvářený štítek. */
const newColor = ref<string>(TAG_PALETTE[0])

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return allTags.value.filter((t) => t.label.toLowerCase().includes(q))
})
const canCreate = computed(() => {
  const q = search.value.trim()
  return q.length > 0 && !allTags.value.some((t) => t.label.toLowerCase() === q.toLowerCase())
})

function isSelected(label: string) {
  return model.value.includes(label)
}
function toggle(label: string) {
  model.value = isSelected(label)
    ? model.value.filter((l) => l !== label)
    : [...model.value, label]
}
function createTag() {
  const label = search.value.trim()
  if (!label || allTags.value.some((t) => t.label.toLowerCase() === label.toLowerCase())) return
  allTags.value = [...allTags.value, { label, color: newColor.value }]
  model.value = [...model.value, label]
  search.value = ''
  newColor.value = TAG_PALETTE[0]
}
function remove(label: string) {
  model.value = model.value.filter((l) => l !== label)
}
</script>

<template>
  <div>
    <!-- Vybrané štítky -->
    <div v-if="model.length" class="mb-2.5 flex flex-wrap gap-1.5">
      <TagChip
        v-for="label in model"
        :key="label"
        :label="label"
        :color="colorFor(label, allTags)"
        removable
        @remove="remove(label)"
      />
    </div>
    <p v-else class="mb-2.5 text-[12px] text-steel-400">{{ emptyLabel }}</p>

    <!-- Přidat štítek -->
    <PopoverRoot v-model:open="open">
      <PopoverTrigger as-child>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-1.5 text-[12.5px] font-500 text-graphite-700 outline-none transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600 data-[state=open]:border-brand-500 data-[state=open]:text-brand-600"
        >
          <Icon name="plus" :size="15" /> {{ addLabel }}
        </button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          align="start"
          :side-offset="6"
          class="z-50 w-64 rounded-xl border border-steel-200 bg-white p-2 shadow-2xl"
        >
          <div class="relative mb-1.5">
            <Icon name="search" :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-steel-400" />
            <input
              v-model="search"
              type="text"
              :placeholder="searchPlaceholder"
              class="h-8 w-full rounded-md border border-steel-200 pl-8 pr-2 text-[13px] focus:border-brand-500 focus:outline-none"
              @keydown.enter.prevent="canCreate && createTag()"
            />
          </div>

          <div class="scroll-thin max-h-56 overflow-y-auto">
            <button
              v-for="t in filtered"
              :key="t.label"
              type="button"
              class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] outline-none transition-colors hover:bg-steel-100"
              @click="toggle(t.label)"
            >
              <span class="h-2 w-2 shrink-0 rounded-full" :style="{ backgroundColor: t.color }" />
              <span class="flex-1 truncate text-graphite-800">{{ t.label }}</span>
              <Icon
                v-if="isSelected(t.label)"
                name="check"
                :size="15"
                class="shrink-0 text-brand-500"
              />
            </button>

            <p v-if="!filtered.length && !canCreate" class="px-2 py-2 text-[12.5px] text-steel-400">
              Nic nenalezeno.
            </p>

            <div v-if="canCreate" class="mt-1 border-t border-steel-100 pt-2">
              <p class="mb-1.5 px-1 text-[11px] font-500 text-steel-500">{{ colorLabel }}</p>
              <div class="mb-2 flex flex-wrap gap-1.5 px-1">
                <button
                  v-for="c in TAG_PALETTE"
                  :key="c"
                  type="button"
                  class="h-5 w-5 rounded-full outline-none transition-transform hover:scale-110"
                  :class="newColor === c ? 'ring-2 ring-graphite-900 ring-offset-1' : ''"
                  :style="{ backgroundColor: c }"
                  :aria-label="`Barva ${c}`"
                  @click="newColor = c"
                />
              </div>
              <button
                type="button"
                class="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] font-500 text-graphite-700 outline-none transition-colors hover:bg-steel-100"
                @click="createTag"
              >
                <Icon name="plus" :size="15" class="shrink-0 text-steel-500" />
                Vytvořit
                <span
                  class="ml-auto inline-flex max-w-[120px] items-center truncate rounded-md px-2 py-0.5 text-[11px] font-600 text-white"
                  :style="{ backgroundColor: newColor }"
                >
                  {{ search.trim() }}
                </span>
              </button>
            </div>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  </div>
</template>
