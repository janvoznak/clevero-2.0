<script setup lang="ts">
/**
 * Avatar uživatele CMS — profilová fotka, jinak barevný monogram (fallback).
 *
 * Nahrazuje dřívější šedou „zkratku jména". Fotku i barvu bere z centrálního
 * adresáře `mockUsers` (resolveUser). Až přibude upload fotek do profilu,
 * doplní se URL v adresáři a avatar se přepne na fotku bez zásahu do call-sites.
 */
import { computed, ref, watch } from 'vue'
import { resolveUser } from '@/data/mockUsers'

const props = withDefaults(defineProps<{ name: string; size?: number }>(), { size: 28 })

const user = computed(() => resolveUser(props.name))
const fontSize = computed(() => Math.max(9, Math.round(props.size * 0.4)))

// Když se fotka nenačte (chybějící soubor apod.), spadneme na monogram.
const imgFailed = ref(false)
watch(() => props.name, () => (imgFailed.value = false))
const showPhoto = computed(() => !!user.value.photo && !imgFailed.value)
</script>

<template>
  <span
    class="inline-grid shrink-0 select-none place-items-center overflow-hidden rounded-full align-middle ring-1 ring-black/5"
    :style="{
      width: size + 'px',
      height: size + 'px',
      background: showPhoto ? '#eef1f5' : user.gradient,
    }"
    :title="name"
  >
    <img
      v-if="showPhoto"
      :src="user.photo"
      :alt="name"
      class="h-full w-full object-cover"
      loading="lazy"
      @error="imgFailed = true"
    />
    <span v-else class="font-700 leading-none text-white" :style="{ fontSize: fontSize + 'px' }">
      {{ user.initials }}
    </span>
  </span>
</template>
