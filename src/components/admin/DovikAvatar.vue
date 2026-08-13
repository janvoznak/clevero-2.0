<script setup lang="ts">
/**
 * Avatar maskota „DOVík" — přátelská robotí hlavička v ochranné přilbě + jiskra.
 * Robot = čitelný signál „tohle je AI" (ne člověk); ochranná přilba = identita
 * Dolních Vítkovic (dělník z huti); jiskra (sparkle) = AI motiv sdílený s ostatními
 * AI prvky. Značková oranžová + jantarová přilba.
 *
 * - `bare = false` (default): portrét — světlé kolečko + oranžová hlava (na světlé
 *   i barevné plochy: hlavička panelu, bubliny zpráv).
 * - `bare = true`: bez pozadí, bílá hlava s oranžovým obličejem — pro plochy ve
 *   značkové oranžové (plovoucí launcher). Přilba zůstává jantarová (kontrast).
 */
withDefaults(defineProps<{ size?: number; bare?: boolean }>(), { size: 32, bare: false })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    role="img"
  >
    <!-- Pozadí portrétu -->
    <circle v-if="!bare" cx="16" cy="16" r="16" class="fill-brand-50" />

    <!-- Ochranná přilba (huť = identita DOV) — jantarová v obou variantách kvůli kontrastu -->
    <path d="M10 8 A6 5.4 0 0 1 22 8 Z" class="fill-amber-500" />
    <rect x="8.2" y="7.1" width="15.6" height="2" rx="1" class="fill-amber-500" />
    <circle cx="16" cy="2.9" r="0.9" class="fill-amber-500" />
    <path d="M8.8 8.05 H23.2" class="stroke-brand-700/30" stroke-width="0.9" stroke-linecap="round" />

    <!-- Jiskra (AI motiv) — drobný akcent -->
    <path
      d="M23.6 3.7 L24.1 4.7 L25.1 5.2 L24.1 5.7 L23.6 6.7 L23.1 5.7 L22.1 5.2 L23.1 4.7 Z"
      :class="bare ? 'fill-white' : 'fill-brand-500'"
    />

    <!-- Ouška -->
    <rect x="5.4" y="13" width="1.8" height="4.6" rx="0.9" :class="bare ? 'fill-white' : 'fill-brand-500'" />
    <rect x="24.8" y="13" width="1.8" height="4.6" rx="0.9" :class="bare ? 'fill-white' : 'fill-brand-500'" />

    <!-- Hlava -->
    <rect x="7.5" y="8" width="17" height="15" rx="5.5" :class="bare ? 'fill-white' : 'fill-brand-500'" />

    <!-- Oči -->
    <circle cx="12.5" cy="14.8" r="1.85" :class="bare ? 'fill-brand-600' : 'fill-white'" />
    <circle cx="19.5" cy="14.8" r="1.85" :class="bare ? 'fill-brand-600' : 'fill-white'" />

    <!-- Úsměv -->
    <path
      d="M12.4 18.6 Q16 21.6 19.6 18.6"
      fill="none"
      :class="bare ? 'stroke-brand-600' : 'stroke-white'"
      stroke-width="1.7"
      stroke-linecap="round"
    />
  </svg>
</template>
