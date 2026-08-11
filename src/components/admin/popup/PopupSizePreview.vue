<script setup lang="ts">
/**
 * Náhled šířky pop-up okna vůči obrazovce (responzivně).
 * Šířka se udává v % šířky viewportu — žádné pevné pixely (ty na responzivních
 * webech nedávají smysl). Výška okna je vždy dána obsahem (auto), proto se tu
 * nenastavuje. Tažením za pravý okraj se mění jen šířka (v %).
 */
import { computed, ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'

const widthPercent = defineModel<number>('widthPercent', { default: 30 })

withDefaults(defineProps<{ frame?: boolean }>(), { frame: true })

const MIN = 12
const MAX = 100

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

const dragging = ref(false)
const stageRef = ref<HTMLElement>()

function startResize(e: PointerEvent) {
  e.preventDefault()
  const rect = stageRef.value?.getBoundingClientRect()
  if (!rect) return
  dragging.value = true
  function move(ev: PointerEvent) {
    // Poloha kurzoru vůči šířce náhledové plochy → % šířky okna.
    const frac = (ev.clientX - rect!.left) / rect!.width
    widthPercent.value = clamp(Math.round(frac * 100), MIN, MAX)
  }
  function up() {
    dragging.value = false
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
}

const sizeLabel = computed(() => `${widthPercent.value} % šířky obrazovky`)
</script>

<template>
  <div>
    <div class="mb-2 flex items-center gap-2">
      <span class="rounded bg-graphite-900 px-2 py-1 font-mono text-[11px] text-white tabular-nums">{{ sizeLabel }}</span>
      <span class="text-[11.5px] text-steel-500">výška podle obsahu</span>
    </div>

    <!-- Faux viewport: okno zabírá `widthPercent` % šířky plochy; výšku určuje obsah -->
    <div ref="stageRef" class="relative rounded-lg border border-steel-200 bg-steel-100 p-4">
      <div
        class="relative grid select-none place-items-center rounded bg-white py-8 shadow-md transition-[width] duration-75"
        :class="[frame ? 'ring-1 ring-brand-500/60' : '', dragging ? 'outline outline-2 outline-brand-500' : '']"
        :style="{ width: widthPercent + '%' }"
      >
        <Icon name="popup" :size="26" class="text-steel-200" />

        <!-- Úchyt na pravém okraji — mění jen šířku -->
        <button
          type="button"
          class="absolute -right-1.5 top-1/2 grid h-8 w-3 -translate-y-1/2 cursor-ew-resize touch-none place-items-center rounded bg-brand-500 text-white shadow-sm outline-none hover:bg-brand-600 focus-visible:ring-2 focus-visible:ring-brand-500/40"
          aria-label="Změnit šířku tažením"
          @pointerdown="startResize"
        >
          <Icon name="resize" :size="11" />
        </button>
      </div>
    </div>

    <p class="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-steel-500">
      <Icon name="cursor" :size="13" class="text-steel-400" />
      Táhněte za pravý okraj — šířka se udává v % obrazovky, výška se přizpůsobí obsahu.
    </p>
  </div>
</template>
