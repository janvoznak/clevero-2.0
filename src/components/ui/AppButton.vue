<script setup lang="ts">
/**
 * Jednotné CTA tlačítko pro celý systém.
 * Barvu/vizuál řídí `variant`, nikdy se nedefinuje ad-hoc v místě použití —
 * tím je zaručena konzistence napříč administrací.
 */
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    size?: 'sm' | 'md'
  }>(),
  { variant: 'primary', size: 'md' },
)

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-600 outline-none transition-colors focus-visible:ring-4 focus-visible:ring-brand-500/15 disabled:pointer-events-none disabled:opacity-55'

const sizes: Record<string, string> = {
  md: 'h-10 px-4 text-[13px]',
  sm: 'h-9 px-3 text-[12.5px]',
}

const variants: Record<string, string> = {
  // Jediná primární CTA barva v systému = značková oranžová.
  primary: 'bg-brand-500 text-white shadow-sm hover:bg-brand-600',
  secondary: 'border border-steel-200 bg-white text-graphite-700 hover:bg-steel-50',
  danger: 'bg-danger-500 text-white shadow-sm hover:bg-danger-600',
  ghost: 'text-steel-600 hover:bg-steel-100 hover:text-graphite-900',
}
</script>

<template>
  <button :class="[base, sizes[size], variants[variant]]">
    <slot />
  </button>
</template>
