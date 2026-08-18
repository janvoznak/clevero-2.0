<script setup lang="ts">
/** Stylizovaná barevná silueta budovy DOV (filled SVG). */
import { SILHOUETTE_PATHS, DEFAULT_SILHOUETTE } from '@/data/venueSilhouettes'

withDefaults(defineProps<{ venueId: string; color: string; size?: number }>(), { size: 22 })
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" :fill="color" aria-hidden="true">
    <path :d="SILHOUETTE_PATHS[venueId] ?? SILHOUETTE_PATHS[DEFAULT_SILHOUETTE]" />
  </svg>
</template>
