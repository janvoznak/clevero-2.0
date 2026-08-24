<script setup lang="ts">
/**
 * Zjednodušená hlavička a patička nového webu dolnivitkovice.cz.
 * Slouží jen k tomu, aby prototyp stránky s vstupenkami vypadal
 * v kontextu webu. Odkazy jsou neaktivní — prototyp, ne web.
 */
defineProps<{ cartCount?: number }>()

const NAV = ['Co dělat v DOV', 'Kalendář akcí', 'Mapa areálu', '3D prohlídky', 'Galerie', 'Pronájem prostor', 'Kontakty']
</script>

<template>
  <div class="dov-web flex min-h-screen flex-col bg-dov-cream font-dov-sans text-dov-coal">
    <header class="bg-dov-coal">
      <div class="mx-auto flex h-20 max-w-[1400px] items-center gap-4 px-5 xl:gap-6">
        <a href="#" class="flex items-center gap-3" aria-label="Dolní Vítkovice — úvod">
          <span class="grid size-14 place-items-center rounded-full bg-dov-signal font-dov-display text-[19px] font-black text-dov-coal">
            DOV
          </span>
        </a>

        <nav class="ml-auto hidden items-center gap-7 xl:flex">
          <a
            v-for="link in NAV"
            :key="link"
            href="#"
            class="whitespace-nowrap text-[14px] font-medium tracking-tight text-white/75 transition-colors hover:text-white"
          >
            {{ link }}
          </a>
        </nav>

        <div class="ml-auto flex items-center gap-2 xl:ml-6">
          <a href="#" class="hidden px-2 font-dov-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white sm:inline">
            EN
          </a>
          <a href="#" class="hidden border border-white/25 px-3.5 py-2.5 font-dov-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:border-white sm:inline-block">
            Můj účet
          </a>
          <a href="#" class="inline-flex items-center gap-2 bg-dov-signal px-3.5 py-2.5 font-dov-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-dov-coal transition-colors hover:bg-dov-rust hover:text-white">
            <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 6h15l-1.5 9h-12zM6 6L5 3H2M9 20h.01M18 20h.01" />
            </svg>
            Košík
            <span class="grid size-[18px] place-items-center rounded-full bg-dov-coal text-[10px] font-semibold text-dov-signal">
              {{ cartCount ?? 0 }}
            </span>
          </a>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="mt-16 bg-dov-coal py-10 text-white/60">
      <div class="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-5">
        <p class="font-dov-mono text-[11px] uppercase tracking-[0.2em]">
          Dolní oblast Vítkovice, z. s.
        </p>
        <p class="font-dov-sans text-[12px]">
          Prodej vstupenek zajišťuje vstupenkový systém Colosseum.
        </p>
      </div>
    </footer>
  </div>
</template>
