<script setup lang="ts">
/**
 * Barevná silueta budovy DOV. Přednostně vykreslí vlastní nahrané SVG (`svg`,
 * už sanitizované v `sanitizeSvg`), jinak vestavěný tvar podle klíče (`venueId`).
 * V obou případech se obarví barvou objektu (`color`).
 */
import { SILHOUETTE_PATHS, DEFAULT_SILHOUETTE } from '@/data/venueSilhouettes'

withDefaults(defineProps<{ venueId?: string; color: string; size?: number; svg?: string }>(), {
  venueId: '',
  size: 22,
  svg: '',
})
</script>

<template>
  <span
    v-if="svg"
    class="inline-block shrink-0"
    :style="{ color, width: size + 'px', height: size + 'px', lineHeight: 0 }"
    aria-hidden="true"
    v-html="svg"
  />
  <svg v-else :width="size" :height="size" viewBox="0 0 24 24" :fill="color" aria-hidden="true">
    <path :d="SILHOUETTE_PATHS[venueId] ?? SILHOUETTE_PATHS[DEFAULT_SILHOUETTE]" />
  </svg>
</template>
