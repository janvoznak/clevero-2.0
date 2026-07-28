<script setup lang="ts">
import { ref } from 'vue'
import {
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipPortal,
  TooltipContent,
} from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import { imageFor } from '@/data/mockNews'
import type { GalleryImage } from '@/data/types'

const model = defineModel<GalleryImage[]>({ default: () => [] })

const dragIndex = ref<number | null>(null)
const overIndex = ref<number | null>(null)

function syncMain() {
  model.value = model.value.map((img, i) => ({ ...img, isMain: i === 0 }))
}

function onDrop(target: number) {
  if (dragIndex.value === null || dragIndex.value === target) {
    dragIndex.value = null
    overIndex.value = null
    return
  }
  const arr = [...model.value]
  const [moved] = arr.splice(dragIndex.value, 1)
  arr.splice(target, 0, moved)
  model.value = arr
  syncMain()
  dragIndex.value = null
  overIndex.value = null
}

/** Hvězda → přesun na 1. pozici (= hlavní obrázek). */
function setMain(index: number) {
  if (index === 0) return
  const arr = [...model.value]
  const [moved] = arr.splice(index, 1)
  arr.unshift(moved)
  model.value = arr
  syncMain()
}

function remove(index: number) {
  const arr = [...model.value]
  arr.splice(index, 1)
  model.value = arr
  syncMain()
}

/** Přidání „nahraných" fotek (prototyp — vybírá z lokálních obrázků). */
function addMock() {
  const base = model.value.length
  const add: GalleryImage[] = Array.from({ length: 3 }, (_, i) => ({
    id: `up-${base + i}-${base * 7 + i}`,
    src: imageFor(base + i + 5),
    alt: `Nahraná fotografie ${base + i + 1}`,
    isMain: false,
  }))
  model.value = [...model.value, ...add]
  syncMain()
}

const fileInput = ref<HTMLInputElement | null>(null)
</script>

<template>
  <div>
    <!-- Upload dropzone -->
    <div
      class="mb-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-steel-300 bg-steel-50 px-6 py-7 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40"
      @dragover.prevent
      @drop.prevent="addMock"
    >
      <div class="mb-2 grid h-11 w-11 place-items-center rounded-full bg-white text-brand-500 shadow-sm">
        <Icon name="upload" :size="20" />
      </div>
      <p class="text-[13.5px] font-600 text-graphite-800">Přetáhněte obrázky sem</p>
      <p class="mt-0.5 text-[12px] text-steel-500">nebo</p>
      <button
        class="mt-2 inline-flex items-center gap-1.5 rounded-md bg-graphite-900 px-3.5 py-2 text-[12.5px] font-600 text-white transition-colors hover:bg-graphite-800"
        @click="fileInput?.click(); addMock()"
      >
        <Icon name="image" :size="15" /> Nahrát obrázky
      </button>
      <input ref="fileInput" type="file" multiple accept="image/*" class="hidden" />
      <p class="mt-2 font-mono text-[10.5px] text-steel-400">JPG, PNG, WEBP · max 8 MB</p>
    </div>

    <!-- Grid -->
    <TooltipProvider :delay-duration="250">
      <div v-if="model.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <div
          v-for="(img, i) in model"
          :key="img.id"
          draggable="true"
          class="group relative aspect-[4/3] cursor-grab overflow-hidden rounded-lg border-2 bg-steel-100 transition-all active:cursor-grabbing"
          :class="[
            i === 0 ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-transparent',
            overIndex === i && dragIndex !== i ? 'scale-[0.97] ring-2 ring-brand-400' : '',
            dragIndex === i ? 'opacity-40' : '',
          ]"
          @dragstart="dragIndex = i"
          @dragenter.prevent="overIndex = i"
          @dragover.prevent
          @dragend="dragIndex = null; overIndex = null"
          @drop="onDrop(i)"
        >
          <!-- obrázek -->
          <img :src="img.src" :alt="img.alt" class="absolute inset-0 h-full w-full object-cover" draggable="false" />

          <!-- position index -->
          <span class="absolute left-2 top-2 rounded bg-graphite-950/60 px-1.5 py-0.5 font-mono text-[10px] text-white/90">
            {{ String(i + 1).padStart(2, '0') }}
          </span>

          <!-- main badge -->
          <span
            v-if="i === 0"
            class="absolute right-2 top-2 inline-flex items-center gap-1 rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-700 text-white shadow"
          >
            <Icon name="star" :size="11" /> Hlavní
          </span>

          <!-- grip hint -->
          <span class="absolute bottom-2 left-2 text-white/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Icon name="grip" :size="16" />
          </span>

          <!-- hover actions -->
          <div
            class="absolute inset-0 flex items-end justify-end gap-1.5 bg-gradient-to-t from-graphite-950/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <TooltipRoot>
              <TooltipTrigger as-child>
                <button
                  class="grid h-8 w-8 place-items-center rounded-md bg-white/90 text-graphite-800 transition-colors hover:bg-white"
                  :class="i === 0 && 'text-brand-500'"
                  @click.stop="setMain(i)"
                >
                  <Icon name="star" :size="16" />
                </button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent side="top" class="rounded bg-graphite-900 px-2 py-1 text-[11px] text-white">
                  Nastavit jako hlavní
                </TooltipContent>
              </TooltipPortal>
            </TooltipRoot>
            <TooltipRoot>
              <TooltipTrigger as-child>
                <button class="grid h-8 w-8 place-items-center rounded-md bg-white/90 text-graphite-800 hover:bg-white">
                  <Icon name="edit" :size="15" />
                </button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent side="top" class="rounded bg-graphite-900 px-2 py-1 text-[11px] text-white">
                  Upravit v editoru
                </TooltipContent>
              </TooltipPortal>
            </TooltipRoot>
            <TooltipRoot>
              <TooltipTrigger as-child>
                <button
                  class="grid h-8 w-8 place-items-center rounded-md bg-white/90 text-danger-500 hover:bg-white"
                  @click.stop="remove(i)"
                >
                  <Icon name="trash" :size="15" />
                </button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent side="top" class="rounded bg-graphite-900 px-2 py-1 text-[11px] text-white">
                  Smazat
                </TooltipContent>
              </TooltipPortal>
            </TooltipRoot>
          </div>
        </div>
      </div>
    </TooltipProvider>

    <p v-if="model.length" class="mt-3 flex items-center gap-1.5 text-[12px] text-steel-500">
      <Icon name="star" :size="13" class="text-brand-500" />
      Obrázek na 1. pozici je hlavní. Přetažením změníte pořadí, hvězdou přesunete fotku na 1. místo.
    </p>
  </div>
</template>
