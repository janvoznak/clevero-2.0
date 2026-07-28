<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import Icon from '@/components/ui/Icon.vue'

const route = useRoute()
const name = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  return parts[parts.length - 1] ?? ''
})
</script>

<template>
  <div class="grid h-full place-items-center p-10">
    <div class="max-w-md text-center">
      <div class="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-xl bg-steel-100 text-steel-400">
        <Icon name="page" :size="26" />
      </div>
      <h1 class="font-display text-xl font-700 capitalize text-graphite-900">{{ name }}</h1>
      <p class="mt-2 text-[13.5px] leading-relaxed text-steel-500">
        Tento modul zatím není součástí prototypu. Prototypujeme postupně po modulech — aktuálně je
        hotový modul <RouterLink to="/admin/news/list" class="font-600 text-brand-600 underline underline-offset-2">Aktuality</RouterLink>.
      </p>
    </div>
  </div>
</template>
