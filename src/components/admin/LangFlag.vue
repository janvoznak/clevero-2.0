<script setup lang="ts">
/**
 * Vlaječka jazykové mutace jako inline SVG.
 *
 * Proč SVG a ne emoji (🇨🇿…): vlajková emoji (regional indicator symbols)
 * na Windows nemají glyfy — Chrome/Edge na Windows místo vlajky zobrazí jen
 * dvoupísmenný kód (nebo nic). SVG se vykreslí stejně na všech platformách.
 */
import { computed, useId } from 'vue'
import type { LangCode } from '@/data/types'

const props = withDefaults(defineProps<{ lang: LangCode; size?: number }>(), {
  size: 14,
})

// Union Jack potřebuje clip-path; unikátní id kvůli více instancím na stránce.
const uid = useId()
const height = computed(() => props.size)
</script>

<template>
  <span
    class="inline-block shrink-0 overflow-hidden rounded-[2px] align-middle ring-1 ring-black/10"
    :style="{ height: height + 'px', lineHeight: 0 }"
    aria-hidden="true"
  >
    <!-- Česko -->
    <svg v-if="lang === 'cs'" :height="height" viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="1" fill="#fff" />
      <rect width="3" height="1" y="1" fill="#d7141a" />
      <path d="M0 0 1.5 1 0 2Z" fill="#11457e" />
    </svg>

    <!-- Velká Británie (Union Jack) -->
    <svg v-else-if="lang === 'en'" :height="height" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
      <clipPath :id="uid">
        <path d="M30 15h30v15zv15H0zH0V0zV0h30z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 0l60 30m0-30L0 30" stroke="#fff" stroke-width="6" />
      <path d="M0 0l60 30m0-30L0 30" :clip-path="`url(#${uid})`" stroke="#c8102e" stroke-width="4" />
      <path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10" />
      <path d="M30 0v30M0 15h60" stroke="#c8102e" stroke-width="6" />
    </svg>

    <!-- Německo -->
    <svg v-else-if="lang === 'de'" :height="height" viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="2" fill="#ffce00" />
      <rect width="3" height="1.334" fill="#d00" />
      <rect width="3" height="0.667" fill="#000" />
    </svg>

    <!-- Polsko -->
    <svg v-else-if="lang === 'pl'" :height="height" viewBox="0 0 3 2" xmlns="http://www.w3.org/2000/svg">
      <rect width="3" height="2" fill="#dc143c" />
      <rect width="3" height="1" fill="#fff" />
    </svg>
  </span>
</template>
