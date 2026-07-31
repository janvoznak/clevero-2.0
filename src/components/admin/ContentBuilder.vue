<script setup lang="ts">
/**
 * Content builder (prototyp — vizuální zástupka, viz princip 0).
 * Skládání obsahu stránky z bloků: výběr ze šablon (Popover s kategoriemi),
 * plátno s náhledem bloků, přetahování (reorder) a mazání.
 * Bloky jsou strukturální (ne per-jazyk) — reálný obsah sestaví editor.
 */
import { computed, ref } from 'vue'
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import { CONTENT_BLOCK_GROUPS, type ContentBlock } from '@/data/mockPages'

/** Bloky obsahu stránky. */
const model = defineModel<ContentBlock[]>({ default: () => [] })

/* ---------- Paleta bloků (Popover) ---------- */
const open = ref(false)
const activeCat = ref(CONTENT_BLOCK_GROUPS[0].category)
const activeBlocks = computed(
  () => CONTENT_BLOCK_GROUPS.find((g) => g.category === activeCat.value)?.blocks ?? [],
)

let seq = 0
function addBlock(type: string, name: string) {
  seq += 1
  model.value = [...model.value, { id: `cb-${seq}-${model.value.length}-${type}`, type, name }]
  open.value = false
}
function remove(id: string) {
  model.value = model.value.filter((b) => b.id !== id)
}

/* ---------- Ikona podle typu bloku ---------- */
const ICONS: Record<string, string> = {
  heading: 'heading',
  subheading: 'heading',
  text: 'text',
  perex: 'text',
  image: 'image',
  'image-wide': 'image',
  gallery: 'gallery',
  button: 'cursor',
  'button-group': 'cursor',
  cta: 'star',
  divider: 'divider',
  quote: 'quote',
  'text-image': 'layout',
  profile: 'user',
  reference: 'reference',
  contact: 'mail',
  map: 'map',
  hours: 'clock',
  video: 'video',
  faq: 'faq',
}
function iconOf(type: string) {
  return ICONS[type] ?? 'box'
}

/* ---------- Drag & drop reorder (nativní, jako GalleryManager) ---------- */
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
  if (!from || from === id) return reset()
  const list = [...model.value]
  const fi = list.findIndex((b) => b.id === from)
  const ti = list.findIndex((b) => b.id === id)
  if (fi < 0 || ti < 0) return reset()
  const [moved] = list.splice(fi, 1)
  list.splice(ti, 0, moved)
  model.value = list
  reset()
}
function reset() {
  dragId.value = null
  overId.value = null
}
</script>

<template>
  <div>
    <!-- Plátno s bloky -->
    <div
      v-if="model.length"
      class="mb-3 space-y-2 rounded-lg border border-steel-200 bg-steel-50/50 p-3"
    >
      <div
        v-for="block in model"
        :key="block.id"
        draggable="true"
        class="group relative rounded-md border bg-white transition-all"
        :class="[
          overId === block.id && dragId !== block.id
            ? 'border-brand-400 ring-1 ring-brand-400/30'
            : 'border-steel-200',
          dragId === block.id ? 'opacity-40' : '',
        ]"
        @dragstart="onDragStart(block.id)"
        @dragover.prevent="onDragOver(block.id)"
        @drop.prevent="onDrop(block.id)"
        @dragend="reset"
      >
        <!-- Hlavička bloku -->
        <div class="flex items-center gap-2 border-b border-steel-100 px-2.5 py-1.5">
          <Icon name="grip" :size="15" class="cursor-grab text-steel-300" />
          <span class="grid h-6 w-6 place-items-center rounded bg-brand-50 text-brand-500">
            <Icon :name="iconOf(block.type)" :size="14" />
          </span>
          <span class="text-[12.5px] font-600 text-graphite-800">{{ block.name }}</span>
          <span class="field-tag ml-1">{{ block.type }}</span>
          <button
            type="button"
            class="ml-auto grid h-6 w-6 place-items-center rounded text-steel-400 opacity-0 outline-none transition-all hover:bg-danger-500/10 hover:text-danger-500 group-hover:opacity-100"
            aria-label="Odebrat blok"
            @click="remove(block.id)"
          >
            <Icon name="trash" :size="14" />
          </button>
        </div>

        <!-- Stylizovaný náhled (nefunkční zástupka) -->
        <div class="px-3 py-2.5">
          <!-- Nadpisy -->
          <div v-if="block.type === 'heading'" class="h-4 w-2/3 rounded bg-graphite-800/80" />
          <div v-else-if="block.type === 'subheading'" class="h-3 w-1/2 rounded bg-graphite-700/70" />

          <!-- Text / perex -->
          <div v-else-if="block.type === 'text'" class="space-y-1.5">
            <div class="h-2 w-full rounded bg-steel-200" />
            <div class="h-2 w-full rounded bg-steel-200" />
            <div class="h-2 w-4/5 rounded bg-steel-200" />
          </div>
          <div v-else-if="block.type === 'perex'" class="space-y-1.5 border-l-2 border-brand-300 pl-3">
            <div class="h-2.5 w-full rounded bg-steel-300" />
            <div class="h-2.5 w-3/4 rounded bg-steel-300" />
          </div>

          <!-- Obrázky -->
          <div
            v-else-if="block.type === 'image'"
            class="grid h-24 place-items-center rounded bg-steel-100 text-steel-400"
          >
            <Icon name="image" :size="24" />
          </div>
          <div
            v-else-if="block.type === 'image-wide'"
            class="grid h-16 place-items-center rounded bg-steel-100 text-steel-400"
          >
            <Icon name="image" :size="22" />
          </div>
          <div v-else-if="block.type === 'gallery'" class="grid grid-cols-4 gap-1.5">
            <div
              v-for="n in 4"
              :key="n"
              class="grid aspect-square place-items-center rounded bg-steel-100 text-steel-400"
            >
              <Icon name="image" :size="16" />
            </div>
          </div>

          <!-- Tlačítka -->
          <div v-else-if="block.type === 'button'">
            <span class="inline-block h-7 w-28 rounded-md bg-brand-500/80" />
          </div>
          <div v-else-if="block.type === 'button-group'" class="flex gap-2">
            <span class="inline-block h-7 w-24 rounded-md bg-brand-500/80" />
            <span class="inline-block h-7 w-24 rounded-md border border-steel-300 bg-white" />
          </div>
          <div
            v-else-if="block.type === 'cta'"
            class="flex items-center justify-between rounded-md bg-brand-50 px-4 py-3"
          >
            <div class="space-y-1.5">
              <div class="h-3 w-32 rounded bg-brand-300" />
              <div class="h-2 w-24 rounded bg-brand-200" />
            </div>
            <span class="h-7 w-24 rounded-md bg-brand-500/80" />
          </div>

          <!-- Oddělovač -->
          <div v-else-if="block.type === 'divider'" class="flex items-center gap-2 py-1">
            <span class="h-px flex-1 bg-steel-300" />
            <Icon name="divider" :size="14" class="text-steel-300" />
            <span class="h-px flex-1 bg-steel-300" />
          </div>

          <!-- Citace -->
          <div v-else-if="block.type === 'quote'" class="flex gap-2">
            <Icon name="quote" :size="22" class="shrink-0 text-brand-300" />
            <div class="flex-1 space-y-1.5 italic">
              <div class="h-2.5 w-full rounded bg-steel-200" />
              <div class="h-2.5 w-2/3 rounded bg-steel-200" />
            </div>
          </div>

          <!-- Text s obrázkem -->
          <div v-else-if="block.type === 'text-image'" class="flex gap-3">
            <div class="flex-1 space-y-1.5">
              <div class="h-2 w-full rounded bg-steel-200" />
              <div class="h-2 w-full rounded bg-steel-200" />
              <div class="h-2 w-3/4 rounded bg-steel-200" />
            </div>
            <div class="grid h-16 w-24 shrink-0 place-items-center rounded bg-steel-100 text-steel-400">
              <Icon name="image" :size="18" />
            </div>
          </div>

          <!-- Profil / tým -->
          <div v-else-if="block.type === 'profile'" class="flex items-center gap-3">
            <div class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-steel-100 text-steel-400">
              <Icon name="user" :size="22" />
            </div>
            <div class="flex-1 space-y-1.5">
              <div class="h-2.5 w-1/3 rounded bg-graphite-700/60" />
              <div class="h-2 w-1/2 rounded bg-steel-200" />
            </div>
          </div>

          <!-- Reference -->
          <div v-else-if="block.type === 'reference'" class="rounded-md bg-steel-50 p-3">
            <Icon name="quote" :size="18" class="text-brand-300" />
            <div class="mt-1.5 space-y-1.5">
              <div class="h-2 w-full rounded bg-steel-200" />
              <div class="h-2 w-2/3 rounded bg-steel-200" />
            </div>
            <div class="mt-2 h-2 w-24 rounded bg-graphite-700/50" />
          </div>

          <!-- Kontaktní blok -->
          <div v-else-if="block.type === 'contact'" class="space-y-2">
            <div class="flex items-center gap-2">
              <Icon name="mail" :size="15" class="text-steel-400" />
              <div class="h-2 w-40 rounded bg-steel-200" />
            </div>
            <div class="flex items-center gap-2">
              <Icon name="bell" :size="15" class="text-steel-400" />
              <div class="h-2 w-28 rounded bg-steel-200" />
            </div>
          </div>

          <!-- Mapa -->
          <div
            v-else-if="block.type === 'map'"
            class="grid h-24 place-items-center rounded bg-steel-100 text-steel-400"
          >
            <div class="flex flex-col items-center gap-1">
              <Icon name="map" :size="24" />
              <span class="text-[11px]">Mapa (zástupka)</span>
            </div>
          </div>

          <!-- Otevírací doba -->
          <div v-else-if="block.type === 'hours'" class="space-y-1">
            <div v-for="n in 3" :key="n" class="flex items-center justify-between">
              <div class="h-2 w-10 rounded bg-steel-200" />
              <div class="h-2 w-16 rounded bg-steel-200" />
            </div>
          </div>

          <!-- Video -->
          <div
            v-else-if="block.type === 'video'"
            class="grid h-24 place-items-center rounded bg-graphite-800/90 text-white/80"
          >
            <Icon name="video" :size="28" />
          </div>

          <!-- FAQ / akordeon -->
          <div v-else-if="block.type === 'faq'" class="space-y-1.5">
            <div
              v-for="n in 2"
              :key="n"
              class="flex items-center justify-between rounded border border-steel-200 px-2.5 py-1.5"
            >
              <div class="h-2 w-1/2 rounded bg-steel-200" />
              <Icon name="chevronDown" :size="14" class="text-steel-300" />
            </div>
          </div>

          <!-- Fallback -->
          <div v-else class="h-2 w-1/2 rounded bg-steel-200" />
        </div>
      </div>
    </div>

    <!-- Prázdný stav -->
    <div
      v-else
      class="mb-3 grid place-items-center rounded-lg border border-dashed border-steel-300 bg-steel-50 px-6 py-10 text-center"
    >
      <Icon name="layout" :size="26" class="mb-2 text-steel-300" />
      <p class="text-[13px] font-600 text-graphite-700">Zatím žádný obsah</p>
      <p class="mt-0.5 text-[12px] text-steel-500">Poskládejte stránku z bloků — vyberte prvek níže.</p>
    </div>

    <!-- Přidat blok (Popover s paletou) -->
    <PopoverRoot v-model:open="open">
      <PopoverTrigger as-child>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-2 text-[13px] font-500 text-graphite-700 outline-none transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600 data-[state=open]:border-brand-500 data-[state=open]:text-brand-600"
        >
          <Icon name="plus" :size="16" /> Přidat blok obsahu
        </button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          align="start"
          :side-offset="6"
          class="z-50 w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-steel-200 bg-white shadow-2xl"
        >
          <div class="flex">
            <!-- Kategorie -->
            <div class="w-28 shrink-0 border-r border-steel-100 bg-steel-50/60 p-1.5">
              <button
                v-for="g in CONTENT_BLOCK_GROUPS"
                :key="g.category"
                type="button"
                class="mb-0.5 block w-full rounded-md px-2.5 py-1.5 text-left text-[12px] font-500 outline-none transition-colors"
                :class="
                  activeCat === g.category
                    ? 'bg-brand-500 text-white'
                    : 'text-graphite-700 hover:bg-steel-100'
                "
                @click="activeCat = g.category"
              >
                {{ g.category }}
              </button>
            </div>

            <!-- Bloky ve zvolené kategorii -->
            <div class="scroll-thin max-h-72 flex-1 overflow-y-auto p-2">
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="b in activeBlocks"
                  :key="b.type"
                  type="button"
                  class="flex flex-col items-center gap-1.5 rounded-lg border border-steel-200 bg-white p-3 text-center outline-none transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
                  @click="addBlock(b.type, b.name)"
                >
                  <span class="grid h-9 w-9 place-items-center rounded-md bg-steel-100 text-steel-500">
                    <Icon :name="iconOf(b.type)" :size="18" />
                  </span>
                  <span class="text-[11.5px] font-600 leading-tight text-graphite-800">{{ b.name }}</span>
                </button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </PopoverRoot>
  </div>
</template>
