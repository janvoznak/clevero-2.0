<script setup lang="ts">
/**
 * Náhled velikosti pop-up okna ve SKUTEČNÉ velikosti (1:1 px).
 * Box se vykresluje v reálných rozměrech okna — když je větší než náhledová
 * plocha, plocha se odroluje (skutečná velikost má přednost před „vejít se").
 * Obousměrná synchronizace s poli Šířka/Výška:
 *  - tažení za pravý dolní roh → průběžně píše px do modelu,
 *  - změna hodnot v polích → box se překreslí (rozměry jsou odvozené z modelu).
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

/** Referenční šířka viewportu pro % režim (100 % = tolik reálných px). */
const REF_W = 1200
const MIN_W = 160
const MIN_H = 90
const MAX_W = 1920
const MAX_H = 1400

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/** Skutečná šířka okna v px (z px hodnoty nebo z % referenčního viewportu). */
const boxW = computed(() =>
  props.unit === 'px' ? width.value : Math.round((widthPercent.value / 100) * REF_W),
)
const boxH = computed(() => height.value)

const dragging = ref(false)

function startResize(e: PointerEvent) {
  e.preventDefault()
  const startX = e.clientX
  const startY = e.clientY
  const startW = boxW.value
  const startH = boxH.value
  dragging.value = true

  function move(ev: PointerEvent) {
    // 1:1 — posun kurzoru v px = změna velikosti okna v px
    const wpx = clamp(startW + (ev.clientX - startX), MIN_W, MAX_W)
    const hpx = clamp(startH + (ev.clientY - startY), MIN_H, MAX_H)
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
  const w = props.unit === 'px' ? `${width.value} px` : `${widthPercent.value} % (≈ ${boxW.value} px)`
  return `${w} × ${height.value} px`
})
</script>

<template>
  <div>
    <div class="mb-2 flex items-center gap-2">
      <span class="rounded bg-graphite-900 px-2 py-1 font-mono text-[11px] text-white tabular-nums">{{ sizeLabel }}</span>
      <span class="text-[11.5px] text-steel-500">skutečná velikost 1:1</span>
    </div>

    <!-- Náhledová plocha: box v reálné velikosti; výška neomezená (roste s oknem),
         jen vodorovně se odroluje, aby široké okno nerozbilo layout stránky -->
    <div class="scroll-thin overflow-x-auto rounded-lg border border-steel-200 bg-steel-100 p-4">
      <div
        class="relative flex select-none flex-col overflow-hidden rounded bg-white shadow-md"
        :class="[frame ? 'ring-1 ring-brand-500/60' : '', dragging ? 'outline outline-2 outline-brand-500' : '']"
        :style="{ width: boxW + 'px', height: boxH + 'px' }"
      >
        <img v-if="image" :src="image" alt="" class="h-2/5 w-full shrink-0 object-cover" />
        <div class="min-w-0 flex-1 p-3">
          <p class="truncate text-[14px] font-700 text-graphite-900">{{ title || 'Nadpis okna' }}</p>
          <p class="mt-1 text-[12px] leading-snug text-steel-500">Obsah pop-up okna…</p>
        </div>

        <!-- Resize handle (pravý dolní roh) -->
        <button
          type="button"
          class="absolute bottom-0 right-0 grid h-6 w-6 cursor-se-resize touch-none place-items-center rounded-tl-md bg-brand-500 text-white shadow-sm outline-none hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500/40"
          aria-label="Změnit velikost tažením"
          @pointerdown="startResize"
        >
          <Icon name="resize" :size="13" />
        </button>
      </div>
    </div>

    <p class="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-steel-500">
      <Icon name="cursor" :size="13" class="text-steel-400" />
      Táhněte za pravý dolní roh — hodnoty šířky a výšky se aktualizují automaticky.
    </p>
  </div>
</template>
