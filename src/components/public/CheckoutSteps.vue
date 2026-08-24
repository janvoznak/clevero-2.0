<script setup lang="ts">
/** Krokovník nákupu — sdílený mezi výběrem vstupenek a košíkem. */
defineProps<{ current: 1 | 2 | 3 }>()

const STEPS = ['Vstupenky', 'Košík', 'Platba']
</script>

<template>
  <ol class="flex flex-wrap items-center gap-x-2 gap-y-1 font-dov-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] sm:text-[11px] sm:tracking-[0.16em]">
    <li v-for="(step, i) in STEPS" :key="step" class="flex items-center gap-2">
      <span
        class="grid size-5 place-items-center rounded-full text-[10px]"
        :class="
          i + 1 === current
            ? 'bg-dov-rust text-white'
            : i + 1 < current
              ? 'bg-dov-coal text-white'
              : 'bg-dov-coal/10 text-dov-coal/50'
        "
      >
        <svg v-if="i + 1 < current" viewBox="0 0 24 24" class="size-3" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
        <template v-else>{{ i + 1 }}</template>
      </span>
      <span :class="i + 1 <= current ? 'text-dov-coal' : 'text-dov-coal/45'">{{ step }}</span>
      <span v-if="i < STEPS.length - 1" class="mx-1 hidden h-px w-5 bg-dov-coal/15 sm:block" aria-hidden="true" />
    </li>
  </ol>
</template>
