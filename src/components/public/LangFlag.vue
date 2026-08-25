<script setup lang="ts">
/**
 * Vlaječka jazyka výkladu — u prohlídek s průvodcem, kde je jazyk
 * součástí termínu („Fárání do DOLU · 9:00 · česky").
 *
 * Prototyp — vlajky jsou kreslené inline v SVG, žádné externí assety.
 * Jazyk chodí z Colossea jako český název („Česky", „Anglicky"), proto
 * se na kód mapuje přes název zbavený diakritiky a velikosti písmen.
 * Neznámý jazyk vlaječku nevykreslí (radši nic než cizí vlajka).
 *
 * Velikost si říká rodič přes `class` (poměr stran 3:2), např. `h-3 w-[18px]`.
 */
import { computed } from 'vue'

const props = defineProps<{ language: string }>()

const CODES: Record<string, 'cs' | 'en' | 'de' | 'pl'> = {
  cesky: 'cs',
  cestina: 'cs',
  czech: 'cs',
  anglicky: 'en',
  anglictina: 'en',
  english: 'en',
  nemecky: 'de',
  nemcina: 'de',
  german: 'de',
  polsky: 'pl',
  polstina: 'pl',
  polish: 'pl',
}

const code = computed(() => {
  const key = props.language
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
  return CODES[key]
})
</script>

<template>
  <svg
    v-if="code"
    viewBox="0 0 18 12"
    class="h-3 w-[18px] shrink-0"
    role="img"
    :aria-label="`Jazyk výkladu: ${language}`"
  >
    <!-- Česko -->
    <template v-if="code === 'cs'">
      <rect width="18" height="6" fill="#FFFFFF" />
      <rect y="6" width="18" height="6" fill="#D7141A" />
      <path d="M0 0l9 6-9 6z" fill="#11457E" />
    </template>

    <!-- Spojené království -->
    <template v-else-if="code === 'en'">
      <rect width="18" height="12" fill="#012169" />
      <path d="M0 0l18 12M18 0L0 12" stroke="#FFFFFF" stroke-width="2.4" />
      <path d="M0 0l18 12M18 0L0 12" stroke="#C8102E" stroke-width="1.2" />
      <path d="M9 0v12M0 6h18" stroke="#FFFFFF" stroke-width="4" />
      <path d="M9 0v12M0 6h18" stroke="#C8102E" stroke-width="2.4" />
    </template>

    <!-- Německo -->
    <template v-else-if="code === 'de'">
      <rect width="18" height="4" fill="#000000" />
      <rect y="4" width="18" height="4" fill="#DD0000" />
      <rect y="8" width="18" height="4" fill="#FFCE00" />
    </template>

    <!-- Polsko -->
    <template v-else>
      <rect width="18" height="6" fill="#FFFFFF" />
      <rect y="6" width="18" height="6" fill="#DC143C" />
    </template>

    <!-- Obrys, aby bílá pole nesplynula s podkladem. -->
    <rect x="0.5" y="0.5" width="17" height="11" fill="none" stroke="rgba(0,0,0,0.22)" />
  </svg>
</template>
