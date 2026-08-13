<script setup lang="ts">
import Icon from '@/components/ui/Icon.vue'
defineProps<{ title: string; icon?: string; hint?: string; tag?: string }>()
</script>

<template>
  <section class="rounded-lg border border-steel-200 bg-white">
    <header class="flex items-center gap-3 border-b border-steel-100 px-5 py-3.5">
      <span v-if="icon" class="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-steel-100 text-graphite-700">
        <Icon :name="icon" :size="17" />
      </span>
      <div class="min-w-0 flex-1">
        <h2 class="font-display text-[15px] font-700 tracking-tight text-graphite-900">{{ title }}</h2>
        <p v-if="hint" class="text-[12px] text-steel-500">{{ hint }}</p>
      </div>
      <span v-if="tag" class="field-tag hidden rounded bg-steel-100 px-1.5 py-0.5 sm:inline">{{ tag }}</span>
    </header>
    <div class="p-5">
      <slot />
    </div>
  </section>
</template>
