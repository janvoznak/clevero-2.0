<script setup lang="ts">
/**
 * DOVík — propagace akce na Facebooku DOV (PROTOTYP, bez reálné AI a bez FB API).
 * Z dat akce sestaví text příspěvku + banner (vizuální mock) a nabídne „vytvořit
 * koncept" na propojeném profilu. Propojení, generování i vytvoření konceptu jsou
 * předstírané (ref + setTimeout) — DOVík nepublikuje, jen připraví koncept k revizi.
 */
import { ref } from 'vue'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import DovikAvatar from '@/components/admin/DovikAvatar.vue'
import { DOV_FB_PROFILE, composeFbPost, type FbPostInput } from '@/data/mockSocial'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    dateLabel?: string
    placeLabel?: string
    placeColor?: string
    image?: string
    summary?: string
    typeLabel?: string
    price?: string
    tags?: string[]
  }>(),
  { subtitle: '', dateLabel: '', placeLabel: '', placeColor: '#ee703d', image: '', summary: '', typeLabel: '', price: '', tags: () => [] },
)

const profile = DOV_FB_PROFILE

/* Úvodní emoji cyklíme při „přegenerování" — drobná variace (fake). */
const LEADS = ['🎉', '🔥', '🎶', '✨', '🎟️']
let leadIdx = 0
function build(): string {
  const input: FbPostInput = {
    title: props.title,
    dateLabel: props.dateLabel,
    placeLabel: props.placeLabel,
    summary: props.summary,
    typeLabel: props.typeLabel,
    price: props.price,
    tags: props.tags,
    lead: LEADS[leadIdx],
  }
  return composeFbPost(input)
}

const text = ref(build())

const regenerating = ref(false)
function regenerate() {
  if (regenerating.value) return
  regenerating.value = true
  leadIdx = (leadIdx + 1) % LEADS.length
  window.setTimeout(() => {
    text.value = build()
    regenerating.value = false
    created.value = false
  }, 800)
}

const creating = ref(false)
const created = ref(false)
function createDraft() {
  if (creating.value || created.value) return
  creating.value = true
  window.setTimeout(() => {
    creating.value = false
    created.value = true
  }, 1100)
}
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-brand-300 bg-brand-50/60 shadow-sm">
    <!-- Hlavička DOVík + propojený profil -->
    <div class="flex flex-wrap items-center gap-3 px-4 py-3">
      <span class="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-brand-100"><DovikAvatar :size="34" /></span>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <h3 class="text-[14px] font-700 text-graphite-900">Propagace na Facebooku</h3>
          <span class="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-brand-600">DOVík</span>
        </div>
        <p class="text-[11.5px] text-steel-500">DOVík z akce připraví příspěvek i banner — vy zkontrolujete a vytvoříte koncept.</p>
      </div>
      <!-- Propojený profil (kompaktní) -->
      <div class="flex items-center gap-2 rounded-lg border border-steel-200 bg-white px-2.5 py-1.5">
        <!-- #1877F2 = značková modrá Facebooku (brandová výjimka jako u štítků) -->
        <span class="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white" style="background-color: #1877f2"><Icon name="facebook" :size="15" /></span>
        <div class="leading-tight">
          <span class="block text-[12px] font-700 text-graphite-900">{{ profile.name }}</span>
          <span class="flex items-center gap-1 font-mono text-[10px] text-forge-600"><span class="h-1.5 w-1.5 rounded-full bg-forge-500" /> Propojeno</span>
        </div>
      </div>
    </div>

    <div class="border-t border-brand-100 bg-white/70 p-4">
      <!-- Composer: banner (menší) vlevo, text vpravo -->
      <div class="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <!-- Banner -->
        <div class="max-w-[380px]">
          <p class="mb-1.5 flex items-center justify-between text-[11px] font-600 text-steel-500">
            Náhled banneru <span class="field-tag">1200×630</span>
          </p>
          <div class="relative aspect-[40/21] w-full overflow-hidden rounded-lg bg-graphite-900">
            <img v-if="image" :src="image" alt="" class="absolute inset-0 h-full w-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-graphite-950/90 via-graphite-950/35 to-graphite-950/5" />
            <span class="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-700 text-white shadow">
              <Icon name="calendar" :size="11" /> {{ dateLabel || 'Termín upřesníme' }}
            </span>
            <div class="absolute inset-x-3 bottom-2.5">
              <h4 class="font-display text-[15px] font-800 leading-tight tracking-tight text-white drop-shadow-lg">{{ title || 'Název akce' }}</h4>
              <p class="mt-0.5 inline-flex items-center gap-1 text-[10.5px] font-600 text-white/90">
                <span class="h-1.5 w-1.5 rounded-full" :style="{ background: placeColor }" />
                <span v-if="placeLabel">{{ placeLabel }} · </span>Dolní Vítkovice
              </p>
            </div>
          </div>
        </div>

        <!-- Text příspěvku (editovatelný) -->
        <div class="flex flex-col">
          <p class="mb-1.5 text-[11px] font-600 text-steel-500">Text příspěvku</p>
          <textarea
            v-model="text"
            class="min-h-[172px] w-full flex-1 resize-y rounded-md border border-steel-200 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-graphite-800 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      <!-- Akční lišta (vždy viditelná) -->
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-steel-100 pt-3">
        <template v-if="!created">
          <p class="text-[11.5px] leading-snug text-steel-500">
            Vytvoří <span class="font-600 text-graphite-700">koncept</span> na FB stránce DOV — nepublikuje se, potvrdíte ho na Facebooku.
          </p>
          <div class="flex shrink-0 items-center gap-2">
            <AppButton variant="secondary" size="sm" :disabled="regenerating || creating" @click="regenerate">
              <Icon name="sparkles" :size="14" :class="regenerating && 'animate-pulse'" />
              {{ regenerating ? 'Generuji…' : 'Přegenerovat' }}
            </AppButton>
            <AppButton variant="primary" size="sm" :disabled="creating" @click="createDraft">
              <Icon name="facebook" :size="15" :class="creating && 'animate-pulse'" />
              {{ creating ? 'Vytvářím koncept…' : 'Vytvořit koncept na FB' }}
            </AppButton>
          </div>
        </template>

        <template v-else>
          <p class="flex items-center gap-2 text-[12.5px] font-500 text-forge-700">
            <Icon name="check" :size="16" class="shrink-0 text-forge-600" />
            Koncept vytvořen na FB stránce DOV — dokončete a zveřejněte na Facebooku.
          </p>
          <div class="flex shrink-0 items-center gap-2">
            <AppButton variant="secondary" size="sm" @click="created = false">Upravit a znovu</AppButton>
            <!-- Prototyp: mrtvý odkaz (žádné reálné napojení na FB) -->
            <a
              href="#"
              class="inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-[12.5px] font-600 text-white shadow-sm outline-none transition-opacity hover:opacity-90"
              style="background-color: #1877f2"
              @click.prevent
            >
              <Icon name="facebook" :size="15" /> Otevřít na Facebooku <Icon name="externalLink" :size="13" />
            </a>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
