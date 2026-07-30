<script setup lang="ts">
/**
 * Resizovatelný náhled velikosti pop-up okna.
 * Obousměrná synchronizace s poli Šířka/Výška:
 *  - tažení za pravý dolní roh → průběžně aktualizuje hodnoty (width / widthPercent, height),
 *  - změna hodnot v polích → náhled se překreslí (rozměry náhledu jsou odvozené z modelu).
 * Jediný zdroj pravdy jsou hodnoty modelu; tažení jen zapisuje px do modelu.
 */
import { computed, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import type { WidthUnit } from '@/data/mockPopups'

const width = defineModel<number>('width', { default: 400 })
const widthPercent = defineModel<number>('widthPercent', { default: 30 })
const height = defineModel<number>('height', { default: 300 })

const props = withDefaults(
  defineProps<{
    unit: WidthUnit
    frame?: boolean
    title?: string
    image?: string | null
  }>(),
  { frame: true, title: '', image: null },
)

/* Náhledové plátno = referenční „obrazovka". Rozměry okna se do něj promítají v měřítku. */
const SCALE = 0.36
const CANVAS_W = 432
const CANVAS_H = 274
const REF_W = Math.round(CANVAS_W / SCALE) // referenční šířka viewportu (px) pro % režim
const MIN_W = 160
const MIN_H = 90

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/** Efektivní šířka okna v px (z px hodnoty nebo z % referenčního viewportu). */
const activeWidthPx = computed(() =>
  props.unit === 'px' ? width.value : Math.round((widthPercent.value / 100) * REF_W),
)

/** Rozměry náhledového boxu (px na plátně) — odvozené z modelu. */
const renderedW = computed(() => clamp(activeWidthPx.value * SCALE, MIN_W * SCALE, CANVAS_W))
const renderedH = computed(() => clamp(height.value * SCALE, MIN_H * SCALE, CANVAS_H))

const dragging = ref(false)

function startResize(e: PointerEvent) {
  e.preventDefault()
  const startX = e.clientX
  const startY = e.clientY
  const startRW = renderedW.value
  const startRH = renderedH.value
  dragging.value = true

  function move(ev: PointerEvent) {
    const nrw = clamp(startRW + (ev.clientX - startX), MIN_W * SCALE, CANVAS_W)
    const nrh = clamp(startRH + (ev.clientY - startY), MIN_H * SCALE, CANVAS_H)
    const wpx = Math.round(nrw / SCALE)
    const hpx = Math.round(nrh / SCALE)
    if (props.unit === 'px') width.value = wpx
    else widthPercent.value = clamp(Math.round((wpx / REF_W) * 100), 1, 100)
    height.value = hpx
  }
  function up() {
    dragging.value = false
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}

const sizeLabel = computed(() => {
  const w = props.unit === 'px' ? `${width.value} px` : `${widthPercent.value} %`
  return `${w} × ${height.value} px`
})
</script>

<template>
  <div>
    <div
      class="relative overflow-hidden rounded-lg border border-steel-200 bg-steel-100"
      :style="{ width: CANVAS_W + 'px', height: CANVAS_H + 'px', maxWidth: '100%' }"
    >
      <!-- jemný rastr „obrazovky" -->
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:16px_16px]" />

      <!-- Náhled okna (kotva vlevo nahoře, resize za pravý dolní roh) -->
      <div
        class="absolute left-3 top-3 flex select-none flex-col overflow-hidden rounded bg-white shadow-md"
        :class="[frame ? 'ring-1 ring-brand-500/50' : '', dragging ? 'outline outline-2 outline-brand-500' : '']"
        :style="{ width: renderedW + 'px', height: renderedH + 'px' }"
      >
        <img v-if="image" :src="image" alt="" class="h-1/2 w-full shrink-0 object-cover" />
        <div class="min-w-0 flex-1 p-2">
          <p class="truncate text-[11px] font-700 text-graphite-900">{{ title || 'Nadpis okna' }}</p>
          <p class="mt-0.5 text-[9.5px] leading-snug text-steel-500">Obsah pop-up okna…</p>
        </div>

        <!-- Resize handle -->
        <button
          type="button"
          class="absolute bottom-0 right-0 grid h-5 w-5 cursor-se-resize touch-none place-items-center rounded-tl-md bg-brand-500 text-white shadow-sm outline-none hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500/40"
          aria-label="Změnit velikost tažením"
          @pointerdown="startResize"
        >
          <Icon name="resize" :size="11" />
        </button>
      </div>

      <!-- Rozměrový štítek -->
      <span class="absolute bottom-2 left-3 rounded bg-graphite-900/80 px-1.5 py-0.5 font-mono text-[10px] text-white tabular-nums">
        {{ sizeLabel }}
      </span>
    </div>
    <p class="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-steel-500">
      <Icon name="cursor" :size="13" class="text-steel-400" />
      Táhněte za pravý dolní roh — hodnoty šířky a výšky se aktualizují automaticky.
    </p>
  </div>
</template>
