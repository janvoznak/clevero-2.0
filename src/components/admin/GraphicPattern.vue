<script setup lang="ts">
/**
 * Náhled jednoho grafického vzoru (prototyp — vizuální zástupka, princip 0).
 * Stejná komponenta se používá v paletě (zmenšený náhled přes `zoom`) i na
 * plátně (plná šířka) — princip 0b: jeden vizuál, žádné kopie.
 */
import Icon from '@/components/ui/Icon.vue'

defineProps<{ kind: string; text?: string }>()

const LOREM =
  'Areál Dolních Vítkovic patří k unikátním průmyslovým památkám Evropy. Bývalý těžní a hutní komplex se proměnil v živé centrum kultury, vzdělávání a společenského dění.'
const LEAD =
  'Národní kulturní památka a jedinečné centrum, kde se snoubí industriální historie s moderní kulturou, vzděláváním a zábavou pro celou rodinu.'
const QUOTE =
  'Dolní Vítkovice jsou důkazem, že z industriální minulosti může vyrůst živé místo pro budoucnost.'

/* Jednotný obrázkový placeholder (teplý gradient v duchu značky). */
const imgClass =
  'grid w-full place-items-center overflow-hidden rounded bg-gradient-to-br from-amber-500/25 via-brand-100 to-steel-200 text-steel-400/80'
const textClass = 'text-[13px] leading-relaxed text-steel-600 text-justify'
</script>

<template>
  <div class="w-full text-graphite-900">
    <!-- Úvodní nadpis (hero) -->
    <div v-if="kind === 'hero'" class="py-6 text-center">
      <h2 class="text-[26px] font-800 leading-tight">Objevte Dolní Vítkovice</h2>
      <p class="mx-auto mt-2 max-w-md text-[13px] text-steel-500">
        Národní kulturní památka a živé centrum kultury v srdci Ostravy.
      </p>
    </div>

    <!-- Odstavec textu -->
    <p v-else-if="kind === 'paragraph'" :class="textClass">{{ text?.trim() ? text : `${LOREM} ${LOREM}` }}</p>

    <!-- Nadpis 1 + text -->
    <div v-else-if="kind === 'h1-text'">
      <h1 class="text-[22px] font-700">Nadpis první úrovně</h1>
      <p class="mt-2" :class="textClass">{{ text?.trim() ? text : LOREM }}</p>
    </div>

    <!-- Nadpis 2 + text -->
    <div v-else-if="kind === 'h2-text'">
      <h2 class="text-[18px] font-700">Nadpis druhé úrovně</h2>
      <p class="mt-2" :class="textClass">{{ text?.trim() ? text : LOREM }}</p>
    </div>

    <!-- Obrázek -->
    <div v-else-if="kind === 'image'" :class="imgClass" style="aspect-ratio: 16 / 9">
      <Icon name="image" :size="34" />
    </div>

    <!-- O nás -->
    <div v-else-if="kind === 'about'" class="py-3">
      <h2 class="text-[24px] font-800">O nás</h2>
      <p class="mt-0.5 text-[12px] uppercase tracking-wide text-steel-400">Založeno 1828</p>
    </div>

    <!-- Dva sloupce textu -->
    <div v-else-if="kind === 'two-col'" class="grid grid-cols-2 gap-6">
      <p :class="textClass">{{ LOREM }}</p>
      <p :class="textClass">{{ LOREM }}</p>
    </div>

    <!-- Perex (lead) -->
    <p v-else-if="kind === 'lead'" class="text-[16px] font-500 leading-relaxed text-graphite-700">
      {{ text?.trim() ? text : LEAD }}
    </p>

    <!-- Text s obrázkem -->
    <div v-else-if="kind === 'text-image'" class="grid grid-cols-2 items-center gap-6">
      <div :class="imgClass" style="aspect-ratio: 4 / 3">
        <Icon name="image" :size="28" />
      </div>
      <div>
        <h3 class="text-[17px] font-700">Historie i současnost</h3>
        <p class="mt-2" :class="textClass">{{ text?.trim() ? text : LOREM }}</p>
      </div>
    </div>

    <!-- Citace -->
    <blockquote
      v-else-if="kind === 'quote'"
      class="border-l-4 border-brand-400 pl-4 text-[15px] italic leading-relaxed text-graphite-700"
    >
      „{{ text?.trim() ? text : QUOTE }}"
    </blockquote>

    <!-- Tlačítko -->
    <div v-else-if="kind === 'button'" class="py-2 text-center">
      <span class="inline-block rounded-md bg-brand-500 px-6 py-2.5 text-[13px] font-600 text-white">
        Zjistit více
      </span>
    </div>

    <!-- Dvě tlačítka -->
    <div v-else-if="kind === 'button-pair'" class="flex justify-center gap-3 py-2">
      <span class="inline-block rounded-md bg-brand-500 px-5 py-2.5 text-[13px] font-600 text-white">
        Koupit vstupenku
      </span>
      <span
        class="inline-block rounded-md border border-steel-300 px-5 py-2.5 text-[13px] font-600 text-graphite-700"
      >
        Kontaktujte nás
      </span>
    </div>

    <!-- CTA banner -->
    <div v-else-if="kind === 'cta'" class="rounded-lg bg-brand-500 px-8 py-6 text-center text-white">
      <h3 class="text-[20px] font-700">Máte zájem o prohlídku?</h3>
      <p class="mt-1 text-[13px] text-white/85">Rezervujte si termín ještě dnes.</p>
      <span class="mt-3 inline-block rounded-md bg-white px-5 py-2 text-[13px] font-600 text-brand-600">
        Rezervovat termín
      </span>
    </div>

    <!-- Galerie -->
    <div v-else-if="kind === 'gallery'" class="grid grid-cols-3 gap-2">
      <div v-for="n in 6" :key="n" :class="imgClass" style="aspect-ratio: 1 / 1">
        <Icon name="image" :size="20" />
      </div>
    </div>

    <!-- Obrázek na šířku -->
    <div v-else-if="kind === 'image-wide'" :class="imgClass" style="aspect-ratio: 21 / 7">
      <Icon name="image" :size="30" />
    </div>

    <!-- Tým -->
    <div v-else-if="kind === 'team'" class="grid grid-cols-3 gap-4">
      <div v-for="p in ['Ředitel', 'Kurátorka', 'Průvodce']" :key="p" class="text-center">
        <div class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-steel-100 text-steel-400">
          <Icon name="user" :size="26" />
        </div>
        <p class="mt-2 text-[13px] font-600">Jméno Příjmení</p>
        <p class="text-[11px] text-steel-500">{{ p }}</p>
      </div>
    </div>

    <!-- Reference -->
    <div v-else-if="kind === 'testimonial'" class="rounded-lg bg-steel-50 p-5 text-center">
      <Icon name="quote" :size="22" class="mx-auto text-brand-300" />
      <p class="mt-2 text-[14px] italic leading-relaxed text-graphite-700">„{{ QUOTE }}"</p>
      <p class="mt-3 text-[12px] font-600 text-graphite-800">— Marie Svobodová, návštěvnice</p>
    </div>

    <!-- Kontaktní údaje -->
    <div v-else-if="kind === 'contact'" class="space-y-2.5 text-[13px] text-graphite-700">
      <div class="flex items-center gap-2.5">
        <Icon name="map" :size="16" class="text-brand-500" /> Ruská 2993, 703 00 Ostrava-Vítkovice
      </div>
      <div class="flex items-center gap-2.5">
        <Icon name="mail" :size="16" class="text-brand-500" /> info@dolnivitkovice.cz
      </div>
      <div class="flex items-center gap-2.5">
        <Icon name="bell" :size="16" class="text-brand-500" /> +420 720 927 856
      </div>
    </div>

    <!-- Mapa -->
    <div v-else-if="kind === 'map'" :class="imgClass" style="aspect-ratio: 16 / 6">
      <div class="flex flex-col items-center gap-1">
        <Icon name="map" :size="28" />
        <span class="text-[12px]">Mapa (zástupka)</span>
      </div>
    </div>

    <!-- Otevírací doba -->
    <div v-else-if="kind === 'hours'" class="mx-auto max-w-xs space-y-1.5 text-[13px]">
      <div
        v-for="d in [
          ['Pondělí – Pátek', '9:00 – 18:00'],
          ['Sobota', '10:00 – 20:00'],
          ['Neděle', '10:00 – 18:00'],
        ]"
        :key="d[0]"
        class="flex items-center justify-between border-b border-steel-100 pb-1"
      >
        <span class="text-graphite-700">{{ d[0] }}</span>
        <span class="font-600 text-graphite-900">{{ d[1] }}</span>
      </div>
    </div>

    <!-- Video -->
    <div
      v-else-if="kind === 'video'"
      class="grid w-full place-items-center rounded bg-graphite-800 text-white/85"
      style="aspect-ratio: 16 / 9"
    >
      <Icon name="video" :size="40" />
    </div>

    <!-- FAQ / akordeon -->
    <div v-else-if="kind === 'faq'" class="space-y-2">
      <div
        v-for="q in ['Kde zaparkuji?', 'Jsou prohlídky s průvodcem?', 'Mohu přijít se psem?']"
        :key="q"
        class="flex items-center justify-between rounded-md border border-steel-200 px-4 py-3 text-[13px] font-500 text-graphite-800"
      >
        {{ q }}
        <Icon name="chevronDown" :size="15" class="text-steel-400" />
      </div>
    </div>

    <!-- Oddělovač -->
    <div v-else-if="kind === 'divider'" class="flex items-center gap-3 py-3">
      <span class="h-px flex-1 bg-steel-300" />
      <Icon name="divider" :size="15" class="text-steel-300" />
      <span class="h-px flex-1 bg-steel-300" />
    </div>

    <!-- Fallback -->
    <div v-else class="h-3 w-1/2 rounded bg-steel-200" />
  </div>
</template>
