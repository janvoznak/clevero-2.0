<script setup lang="ts">
/**
 * Sdílený správce fotogalerie napříč moduly (Aktuality, Areál, Galerie, Produkty).
 * Jeden prvek = jedna komponenta → záložka Galerie vypadá a chová se všude stejně.
 * Řádkový výpis (tabulka) dle vzoru: Pořadí (úchyt + číslo + hlavní), Náhled, Název,
 * SEO popisek, Velikost, Akce. Řazení: drag&drop + tlačítka ↑/↓,
 * topování úplně nahoru (⤒ = hlavní na 1. pozici). Prototyp — nahrávání
 * i velikosti jsou zástupné (nefunkční vizuál).
 * Vodoznaky záměrně neřešíme — DOV chce, aby jeho obsah bylo možné re-publikovat.
 * Editor fotek (ořez/úpravy) je prozatím vynechán — dořeší se až na konci podle
 * ziskovosti projektu; u řádku proto není akce „Upravit v editoru".
 */
import { computed, ref } from 'vue'
import { CheckboxRoot, CheckboxIndicator } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import { imageFor } from '@/data/mockNews'
import type { GalleryImage } from '@/data/types'

const model = defineModel<GalleryImage[]>({ default: () => [] })

const dragIndex = ref<number | null>(null)
const overIndex = ref<number | null>(null)
const selected = ref<Set<string>>(new Set())

/** Hlavní = vždy obrázek na 1. pozici. Vrací pole s doplněným `isMain`
    (jedno přiřazení do model.value — getter defineModelu vrací starou hodnotu
    do dalšího tiku, proto nikdy nečteme model.value hned po zápisu). */
function withMain(arr: GalleryImage[]): GalleryImage[] {
  return arr.map((img, i) => ({ ...img, isMain: i === 0 }))
}

function moveTo(from: number, to: number) {
  if (to < 0 || to >= model.value.length || from === to) return
  const arr = [...model.value]
  const [moved] = arr.splice(from, 1)
  arr.splice(to, 0, moved)
  model.value = withMain(arr)
}
function moveUp(i: number) {
  moveTo(i, i - 1)
}
function moveDown(i: number) {
  moveTo(i, i + 1)
}
/** Topovat úplně nahoru → 1. pozice = hlavní obrázek. */
function moveToTop(i: number) {
  moveTo(i, 0)
}

function onDrop(target: number) {
  if (dragIndex.value === null || dragIndex.value === target) {
    dragIndex.value = null
    overIndex.value = null
    return
  }
  moveTo(dragIndex.value, target)
  dragIndex.value = null
  overIndex.value = null
}

function remove(index: number) {
  const arr = [...model.value]
  const [gone] = arr.splice(index, 1)
  if (gone) {
    const next = new Set(selected.value)
    next.delete(gone.id)
    selected.value = next
  }
  model.value = withMain(arr)
}

/* ---------- Výběr / hromadné mazání ---------- */
const allSelected = computed(() => model.value.length > 0 && model.value.every((i) => selected.value.has(i.id)))
function toggleAll(v: boolean | 'indeterminate') {
  selected.value = v === true ? new Set(model.value.map((i) => i.id)) : new Set()
}
function toggleOne(id: string, v: boolean | 'indeterminate') {
  const next = new Set(selected.value)
  if (v === true) next.add(id)
  else next.delete(id)
  selected.value = next
}
function removeSelected() {
  model.value = withMain(model.value.filter((i) => !selected.value.has(i.id)))
  selected.value = new Set()
}

/** Přidání „nahraných" fotek (prototyp — vybírá z lokálních obrázků). */
function addMock() {
  const base = model.value.length
  const add: GalleryImage[] = Array.from({ length: 3 }, (_, i) => ({
    id: `up-${base + i}-${base * 7 + i}`,
    src: imageFor(base + i + 5),
    alt: '',
    isMain: false,
  }))
  model.value = withMain([...model.value, ...add])
}

const fileInput = ref<HTMLInputElement | null>(null)

/* ---------- Zástupná metadata (prototyp) ---------- */
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}
function sizeOf(img: GalleryImage): string {
  return `${(8 + (hash(img.id) % 1200) / 10).toFixed(1)} kB`
}
function dimsOf(img: GalleryImage): string {
  const h = hash(img.id)
  return `${600 + (h % 1400)} × ${320 + ((h >> 4) % 900)} px`
}
/** Cesta/název souboru z URL (pro sloupec Název). */
function nameOf(img: GalleryImage): string {
  return img.src.replace(/^\//, '')
}
</script>

<template>
  <div>
    <!-- Hromadná akce (při výběru) -->
    <div
      v-if="selected.size"
      class="mb-3 flex items-center justify-between rounded-lg border border-brand-500/30 bg-brand-50 px-4 py-2.5"
    >
      <span class="text-[13px] font-600 text-brand-700">Vybráno {{ selected.size }} {{ selected.size === 1 ? 'fotka' : 'fotek' }}</span>
      <div class="flex items-center gap-2">
        <button class="text-[12.5px] font-500 text-steel-500 hover:text-graphite-800" @click="selected = new Set()">Zrušit výběr</button>
        <button
          class="inline-flex items-center gap-1.5 rounded-md bg-danger-500 px-3 py-1.5 text-[12.5px] font-600 text-white transition-colors hover:bg-danger-600"
          @click="removeSelected"
        >
          <Icon name="trash" :size="14" /> Smazat vybrané
        </button>
      </div>
    </div>

    <!-- Řádkový výpis fotek -->
    <div v-if="model.length" class="overflow-x-auto rounded-lg border border-steel-200">
      <table class="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr class="border-b border-steel-200 bg-steel-50 text-[11px] uppercase tracking-wider text-steel-500">
            <th class="w-10 px-3 py-2.5">
              <CheckboxRoot
                :model-value="allSelected"
                class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
                @update:model-value="toggleAll"
              >
                <CheckboxIndicator class="text-white"><Icon name="check" :size="12" /></CheckboxIndicator>
              </CheckboxRoot>
            </th>
            <th class="w-20 px-2 py-2.5 font-600">Pořadí</th>
            <th class="w-24 px-2 py-2.5 font-600">Náhled</th>
            <th class="px-2 py-2.5 font-600">Název</th>
            <th class="px-2 py-2.5 font-600">SEO popisek</th>
            <th class="w-28 px-2 py-2.5 font-600">Velikost</th>
            <th class="w-28 px-3 py-2.5 text-right font-600">Akce</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(img, i) in model"
            :key="img.id"
            class="border-b border-steel-100 align-middle transition-colors last:border-0 hover:bg-steel-50/60"
            :class="[
              i === 0 ? 'bg-brand-50/30' : '',
              overIndex === i && dragIndex !== i ? 'ring-2 ring-inset ring-brand-400' : '',
              dragIndex === i ? 'opacity-40' : '',
            ]"
            @dragenter.prevent="dragIndex !== null && (overIndex = i)"
            @dragover.prevent
            @drop="onDrop(i)"
          >
            <!-- Výběr -->
            <td class="px-3 py-2.5">
              <CheckboxRoot
                :model-value="selected.has(img.id)"
                class="grid h-4 w-4 place-items-center rounded border border-steel-300 bg-white data-[state=checked]:border-brand-500 data-[state=checked]:bg-brand-500"
                @update:model-value="(v) => toggleOne(img.id, v)"
              >
                <CheckboxIndicator class="text-white"><Icon name="check" :size="12" /></CheckboxIndicator>
              </CheckboxRoot>
            </td>

            <!-- Pořadí: úchyt + číslo + hlavní -->
            <td class="px-2 py-2.5">
              <div class="flex items-center gap-1.5">
                <span
                  draggable="true"
                  class="cursor-grab text-steel-400 transition-colors hover:text-graphite-700 active:cursor-grabbing"
                  title="Přetáhnout pro změnu pořadí"
                  @dragstart="dragIndex = i"
                  @dragend="dragIndex = null; overIndex = null"
                >
                  <Icon name="grip" :size="16" />
                </span>
                <span class="font-mono text-[12.5px] font-600 text-graphite-700 tabular-nums">{{ i + 1 }}.</span>
                <Icon v-if="i === 0" name="star" :size="14" class="text-brand-500" title="Hlavní obrázek" />
              </div>
            </td>

            <!-- Náhled -->
            <td class="px-2 py-2.5">
              <span class="block h-11 w-16 overflow-hidden rounded-md border border-steel-200 bg-steel-100">
                <img :src="img.src" :alt="img.alt" class="h-full w-full object-cover" draggable="false" />
              </span>
            </td>

            <!-- Název -->
            <td class="px-2 py-2.5">
              <span class="block max-w-[220px] truncate font-mono text-[12px] text-graphite-700" :title="nameOf(img)">{{ nameOf(img) }}</span>
              <span v-if="i === 0" class="mt-0.5 inline-flex items-center gap-1 rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-700 text-brand-600">Hlavní</span>
            </td>

            <!-- SEO popisek -->
            <td class="px-2 py-2.5">
              <input
                v-model="img.alt"
                type="text"
                placeholder="SEO popisek"
                class="h-9 w-full min-w-[160px] rounded-md border border-steel-200 px-2.5 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
            </td>

            <!-- Velikost (prototyp — zástupná data) -->
            <td class="px-2 py-2.5">
              <span class="block text-[12.5px] text-graphite-700 tabular-nums">{{ sizeOf(img) }}</span>
              <span class="block font-mono text-[10.5px] text-steel-400 tabular-nums">{{ dimsOf(img) }}</span>
            </td>

            <!-- Akce -->
            <td class="px-3 py-2.5">
              <div class="flex items-center justify-end gap-0.5">
                <button
                  v-if="i !== 0"
                  draggable="false"
                  class="grid h-7 w-7 place-items-center rounded-md text-brand-600 transition-colors hover:bg-brand-50"
                  title="Úplně nahoru (nastavit jako hlavní)"
                  @mousedown.stop
                  @click.stop="moveToTop(i)"
                >
                  <Icon name="chevronsUp" :size="15" />
                </button>
                <button
                  draggable="false"
                  class="grid h-7 w-7 place-items-center rounded-md text-steel-500 transition-colors hover:bg-steel-100 hover:text-graphite-800 disabled:cursor-not-allowed disabled:opacity-30"
                  title="O pozici výš"
                  :disabled="i === 0"
                  @mousedown.stop
                  @click.stop="moveUp(i)"
                >
                  <Icon name="chevronUp" :size="16" />
                </button>
                <button
                  draggable="false"
                  class="grid h-7 w-7 place-items-center rounded-md text-steel-500 transition-colors hover:bg-steel-100 hover:text-graphite-800 disabled:cursor-not-allowed disabled:opacity-30"
                  title="O pozici níž"
                  :disabled="i === model.length - 1"
                  @mousedown.stop
                  @click.stop="moveDown(i)"
                >
                  <Icon name="chevronDown" :size="16" />
                </button>
                <button
                  draggable="false"
                  class="grid h-7 w-7 place-items-center rounded-md text-danger-500 transition-colors hover:bg-danger-500/10"
                  title="Smazat"
                  @mousedown.stop
                  @click.stop="remove(i)"
                >
                  <Icon name="trash" :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Dropzone / přidání (prototyp) -->
    <div
      class="mt-3 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-steel-300 bg-steel-50 px-6 py-7 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40"
      @dragover.prevent
      @drop.prevent="addMock"
    >
      <div class="mb-2 grid h-11 w-11 place-items-center rounded-full bg-white text-brand-500 shadow-sm">
        <Icon name="upload" :size="20" />
      </div>
      <p class="text-[13.5px] font-600 text-graphite-800">Přetáhněte fotografie sem</p>
      <p class="mt-0.5 text-[12px] text-steel-500">nebo použijte tlačítko Přidat</p>
      <button
        class="mt-2 inline-flex items-center gap-1.5 rounded-md bg-graphite-900 px-3.5 py-2 text-[12.5px] font-600 text-white transition-colors hover:bg-graphite-800"
        @click="fileInput?.click(); addMock()"
      >
        <Icon name="plus" :size="15" /> Přidat fotografie
      </button>
      <input ref="fileInput" type="file" multiple accept="image/*" class="hidden" />
      <p class="mt-2 font-mono text-[10.5px] text-steel-400">JPG, PNG, WEBP · max 8 MB</p>
    </div>

    <p v-if="model.length" class="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-steel-500">
      <Icon name="star" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
      <span>Fotka na 1. pozici je hlavní. Pořadí změníte přetažením za úchyt <Icon name="grip" :size="12" class="inline align-[-1px]" /> nebo šipkami; <Icon name="chevronsUp" :size="12" class="inline align-[-1px]" /> přesune fotku úplně nahoru (a nastaví ji jako hlavní).</span>
    </p>
  </div>
</template>
