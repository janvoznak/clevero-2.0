<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { DialogRoot, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import TagChip from '@/components/ui/TagChip.vue'
import TagPicker from '@/components/admin/TagPicker.vue'
import RelationPicker from '@/components/admin/RelationPicker.vue'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import { SOURCE_LANG } from '@/data/types'
import type { ML } from '@/data/types'
import {
  EVENT_TYPES, PREDEFINED_EVENT_TAGS, eventStatus, EVENT_STATE_META,
  eventTagColor, aiImportFromUrl, type DovEvent,
} from '@/data/mockEvents'
import { PLACE_OPTIONS, DEFAULT_PLACE_ID, areaPlace } from '@/data/mockVenues'
import { tourOptionsList } from '@/data/mockTours'

const router = useRouter()
const tourItems = tourOptionsList()
const typeOptions = EVENT_TYPES.map((t) => ({ value: t, label: t }))

const empty = (): ML => ({ cs: '', en: '', de: '', pl: '' })
const form = reactive<DovEvent>({
  id: 'nová', title: empty(), subtitle: empty(), type: 'Festival',
  from: '', to: '', time: '', timeTo: '', summary: empty(), description: empty(),
  image: '', price: '', ticketUrl: '', ageLimit: '', duration: '', performers: '',
  tags: [], areaId: DEFAULT_PLACE_ID, tourIds: [], published: false,
})

/* ---------- Kroky ---------- */
const steps = [
  { key: 'start', label: 'Založení', icon: 'sparkles' },
  { key: 'basic', label: 'Obsah', icon: 'page' },
  { key: 'when', label: 'Termín a místo', icon: 'calendar' },
  { key: 'details', label: 'Detaily', icon: 'ticket' },
  { key: 'preview', label: 'Náhled', icon: 'eye' },
]
const step = ref(0)
const started = ref(false) // uživatel opustil úvodní krok (ručně/AI)
function go(i: number) {
  if (i >= 1) started.value = true
  step.value = Math.max(0, Math.min(steps.length - 1, i))
  window.scrollTo({ top: 0 })
}
function next() { go(step.value + 1) }
function prev() { go(step.value - 1) }

/* ---------- AI-first založení z odkazu (prototyp) ---------- */
const importUrl = ref('')
const importing = ref(false)
function aiImport() {
  const url = importUrl.value.trim()
  if (!url || importing.value) return
  importing.value = true
  window.setTimeout(() => {
    const d = aiImportFromUrl(url)
    form.title[SOURCE_LANG] = d.title
    form.subtitle[SOURCE_LANG] = d.subtitle
    form.summary[SOURCE_LANG] = d.summary
    form.description[SOURCE_LANG] = d.description
    form.type = d.type
    form.areaId = d.areaId
    form.from = d.from
    form.to = d.to
    form.time = d.time
    form.timeTo = d.timeTo
    form.price = d.price
    form.ticketUrl = d.ticketUrl
    form.ageLimit = d.ageLimit
    form.duration = d.duration
    form.performers = d.performers
    form.tags = [...d.tags]
    if (d.image) form.image = d.image
    importing.value = false
    started.value = true
    step.value = steps.length - 1 // rovnou na náhled ke kontrole
    window.scrollTo({ top: 0 })
  }, 1900)
}

/* ---------- Průběžné automatické ukládání (prototyp) ---------- */
const autoSave = ref<'idle' | 'saving' | 'saved'>('idle')
const savedAt = ref('')
let saveTimer: number | undefined
watch(
  form,
  () => {
    autoSave.value = 'saving'
    window.clearTimeout(saveTimer)
    saveTimer = window.setTimeout(() => {
      autoSave.value = 'saved'
      savedAt.value = new Date().toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
    }, 700)
  },
  { deep: true },
)

/* ---------- Zavření / koncept / dokončení ---------- */
const closeOpen = ref(false)
const toast = ref('')
function fireToast(m: string) {
  toast.value = m
  window.setTimeout(() => (toast.value = ''), 3000)
}
function saveDraftAndClose() {
  closeOpen.value = false
  router.push({ name: 'events-list' })
}
function discard() {
  closeOpen.value = false
  router.push({ name: 'events-list' })
}
function finish() {
  fireToast('Akce vytvořena a přidána do kalendáře')
  window.setTimeout(() => router.push({ name: 'events-list' }), 700)
}

/* ---------- Odvozené pro náhled ---------- */
const place = computed(() => areaPlace(form.areaId))
const status = computed(() => (form.from && form.to ? eventStatus(form) : null))
function fmtD(iso: string): string {
  return iso ? new Date(iso + 'T00:00:00').toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' }) : ''
}
const dateRange = computed(() => {
  if (!form.from) return ''
  const f = fmtD(form.from)
  return !form.to || form.to === form.from ? f : `${f} – ${fmtD(form.to)}`
})
const timeRange = computed(() => {
  if (!form.time) return ''
  return form.timeTo ? `${form.time}–${form.timeTo}` : form.time
})

/* Kontrolní seznam vyplněnosti pro náhled. */
const checklist = computed(() => [
  { label: 'Název akce', ok: !!form.title.cs.trim() },
  { label: 'Termín (OD)', ok: !!form.from },
  { label: 'Místo konání', ok: !!form.areaId },
  { label: 'Perex', ok: !!form.summary.cs.trim() },
  { label: 'Plakát', ok: !!form.image },
])
const canFinish = computed(() => !!form.title.cs.trim() && !!form.from && !!form.areaId)
</script>

<template>
  <div class="pb-24">
    <!-- Sticky header -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800" aria-label="Zavřít průvodce" @click="closeOpen = true">
          <Icon name="x" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">events</span>
            <span class="font-mono text-[11px] text-steel-400">/admin/events/new</span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            Nová akce — průvodce
          </h1>
        </div>

        <!-- Autosave indikátor -->
        <span class="hidden items-center gap-1.5 text-[12px] text-steel-500 sm:flex">
          <template v-if="autoSave === 'saving'"><Icon name="save" :size="14" class="animate-pulse text-steel-400" /> Ukládám…</template>
          <template v-else-if="autoSave === 'saved'"><Icon name="check" :size="14" class="text-forge-500" /> Automaticky uloženo · {{ savedAt }}</template>
          <template v-else><Icon name="save" :size="14" class="text-steel-300" /> Průběžně se ukládá</template>
        </span>
        <div class="h-6 w-px bg-steel-200" />
        <AppButton variant="secondary" @click="closeOpen = true">Uložit koncept</AppButton>
      </div>

      <!-- Stepper -->
      <div class="flex items-center gap-1 overflow-x-auto px-8 pb-3">
        <template v-for="(s, i) in steps" :key="s.key">
          <button
            class="group inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-600 outline-none transition-colors"
            :class="[
              i === step ? 'bg-brand-50 text-brand-700' : i < step ? 'text-graphite-700 hover:bg-steel-50' : 'text-steel-400 hover:bg-steel-50',
            ]"
            :disabled="i > 0 && !started"
            @click="go(i)"
          >
            <span
              class="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-700"
              :class="i === step ? 'bg-brand-500 text-white' : i < step ? 'bg-forge-500 text-white' : 'bg-steel-200 text-steel-500'"
            >
              <Icon v-if="i < step" name="check" :size="13" />
              <template v-else>{{ i + 1 }}</template>
            </span>
            {{ s.label }}
          </button>
          <span v-if="i < steps.length - 1" class="h-px w-5 shrink-0 bg-steel-200" />
        </template>
      </div>
    </div>

    <!-- Obsah kroku -->
    <div class="mx-auto max-w-[780px] px-6 py-8">
      <!-- KROK 1: Založení (AI-first) -->
      <div v-if="step === 0" class="space-y-6">
        <div class="text-center">
          <h2 class="font-display text-[22px] font-800 tracking-tight text-graphite-900">Jak akci založíme?</h2>
          <p class="mt-1.5 text-[14px] text-steel-500">Nechte to za sebe udělat AI z odkazu, nebo vyplňte krok po kroku.</p>
        </div>

        <!-- AI blok (výrazný) -->
        <div class="overflow-hidden rounded-2xl border border-brand-300 bg-gradient-to-br from-brand-50 to-white p-5 shadow-sm">
          <div class="mb-3 flex items-center gap-3">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-500 text-white shadow-sm"><Icon name="sparkles" :size="22" /></span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-display text-[15px] font-700 text-graphite-900">Založit z odkazu přes AI</h3>
                <span class="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] text-brand-600">AI-first</span>
              </div>
              <p class="text-[12.5px] text-steel-500">Vložte odkaz na akci a AI vyplní název, termín, místo, vstupné, štítky i plakát.</p>
            </div>
          </div>
          <div class="flex flex-col gap-2 sm:flex-row">
            <div class="relative flex-1">
              <Icon name="link" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
              <input
                v-model="importUrl"
                type="text"
                placeholder="Např. https://racethestreets.eu/cs/udalosti/ostrava-2026"
                class="h-11 w-full rounded-md border border-steel-200 bg-white pl-9 pr-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                @keydown.enter.prevent="aiImport"
              />
            </div>
            <AppButton variant="primary" :disabled="!importUrl.trim() || importing" @click="aiImport">
              <Icon name="sparkles" :size="16" :class="importing && 'animate-pulse'" />
              {{ importing ? 'Načítám…' : 'Vyplnit přes AI' }}
            </AppButton>
          </div>
          <p class="mt-2.5 text-[11.5px] text-steel-500">Po načtení vás rovnou vezmeme na náhled ke kontrole — vše půjde upravit.</p>
        </div>

        <div class="flex items-center gap-3 text-[12px] text-steel-400">
          <span class="h-px flex-1 bg-steel-200" /> nebo <span class="h-px flex-1 bg-steel-200" />
        </div>

        <button
          class="flex w-full items-center gap-3 rounded-xl border border-steel-200 bg-white px-5 py-4 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40"
          @click="go(1)"
        >
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-steel-100 text-steel-500"><Icon name="edit" :size="20" /></span>
          <span class="flex-1">
            <span class="block font-display text-[15px] font-700 text-graphite-900">Vyplnit ručně</span>
            <span class="block text-[12.5px] text-steel-500">Projděte průvodce krok po kroku — obsah, termín a místo, detaily.</span>
          </span>
          <Icon name="chevronRight" :size="18" class="text-steel-400" />
        </button>
      </div>

      <!-- KROK 2: Obsah -->
      <div v-else-if="step === 1" class="rounded-2xl border border-steel-200 bg-white p-6">
        <h2 class="font-display text-[17px] font-700 text-graphite-900">Obsah akce</h2>
        <p class="mt-1 text-[13px] text-steel-500">Základní texty. Překlady do dalších jazyků doplníte později v editaci akce.</p>
        <div class="mt-5 space-y-4">
          <div>
            <label class="mb-1.5 flex items-center justify-between">
              <span class="text-[13px] font-600 text-graphite-800">Název akce <span class="text-brand-500">*</span></span>
              <span class="field-tag">event-title · CS</span>
            </label>
            <input v-model="form.title.cs" type="text" placeholder="Např. Race the Streets Ostrava 2026" class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
          </div>
          <div>
            <label class="mb-1.5 flex items-center justify-between"><span class="text-[13px] font-600 text-graphite-800">Podnadpis</span><span class="field-tag">event-subtitle · CS</span></label>
            <input v-model="form.subtitle.cs" type="text" placeholder="Claim nebo doplňující řádek" class="h-10 w-full rounded-md border border-steel-200 px-3.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
          </div>
          <div>
            <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Typ akce</label>
            <AppSelect v-model="form.type" :options="typeOptions" />
          </div>
          <div>
            <label class="mb-1.5 flex items-center justify-between"><span class="text-[13px] font-600 text-graphite-800">Perex</span><span class="field-tag">event-summary · CS</span></label>
            <textarea v-model="form.summary.cs" rows="2" placeholder="Krátký úvod do výpisu a náhledů (1–2 věty)" class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
          </div>
          <div>
            <label class="mb-1.5 flex items-center justify-between"><span class="text-[13px] font-600 text-graphite-800">Popis akce</span><span class="field-tag">event-description · CS</span></label>
            <RichTextEditor v-model="form.description.cs" />
          </div>
        </div>
      </div>

      <!-- KROK 3: Termín a místo -->
      <div v-else-if="step === 2" class="rounded-2xl border border-steel-200 bg-white p-6">
        <h2 class="font-display text-[17px] font-700 text-graphite-900">Termín a místo</h2>
        <p class="mt-1 text-[13px] text-steel-500">Kdy a kde se akce koná. Podle objektu se barevně zařadí do kalendáře.</p>
        <div class="mt-5 space-y-4">
          <div>
            <label class="mb-1.5 flex items-center justify-between"><span class="text-[13px] font-600 text-graphite-800">Místo konání (objekt v areálu) <span class="text-brand-500">*</span></span><span class="field-tag">event-area_id</span></label>
            <AppSelect v-model="form.areaId" :options="PLACE_OPTIONS" />
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Termín OD <span class="text-brand-500">*</span></label>
              <input v-model="form.from" type="date" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Termín DO</label>
              <input v-model="form.to" type="date" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
            </div>
          </div>
          <div class="grid gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Čas OD</label>
              <input v-model="form.time" type="time" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Čas DO</label>
              <input v-model="form.timeTo" type="time" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Délka</label>
              <input v-model="form.duration" type="text" placeholder="např. 90 min" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
            </div>
          </div>
          <p class="flex items-start gap-1.5 rounded-md bg-steel-50 px-3 py-2 text-[12px] text-steel-500">
            <Icon name="calendar" :size="14" class="mt-0.5 shrink-0 text-steel-400" />
            Stejné OD i DO (nebo prázdné DO) = jednodenní akce. Rozdílné datumy = vícedenní.
          </p>
        </div>
      </div>

      <!-- KROK 4: Detaily -->
      <div v-else-if="step === 3" class="space-y-5">
        <div class="rounded-2xl border border-steel-200 bg-white p-6">
          <h2 class="font-display text-[17px] font-700 text-graphite-900">Vstupenky a detaily</h2>
          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Vstupné</label>
              <input v-model="form.price" type="text" placeholder="např. Vstup zdarma / od 390 Kč" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
            </div>
            <div>
              <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Věkové omezení</label>
              <input v-model="form.ageLimit" type="text" placeholder="např. 15+" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Odkaz na vstupenky / rezervaci</label>
              <div class="relative">
                <Icon name="ticket" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
                <input v-model="form.ticketUrl" type="text" placeholder="/vstupenky/… nebo https://…" class="h-10 w-full rounded-md border border-steel-200 pl-9 pr-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
              </div>
            </div>
            <div class="sm:col-span-2">
              <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Účinkující / lektoři</label>
              <input v-model="form.performers" type="text" placeholder="Jména oddělená čárkou" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
            </div>
          </div>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <div class="rounded-2xl border border-steel-200 bg-white p-5">
            <h3 class="mb-3 flex items-center gap-2 text-[13px] font-700 text-graphite-900"><Icon name="filter" :size="15" class="text-steel-400" /> Štítky</h3>
            <TagPicker v-model="form.tags" :options="PREDEFINED_EVENT_TAGS" />
          </div>
          <div class="rounded-2xl border border-steel-200 bg-white p-5">
            <h3 class="mb-3 flex items-center gap-2 text-[13px] font-700 text-graphite-900"><Icon name="ticket" :size="15" class="text-steel-400" /> Související prohlídky</h3>
            <RelationPicker v-model="form.tourIds" :items="tourItems" add-label="Přidat prohlídku" empty-label="Zatím žádné." search-placeholder="Hledat prohlídku…" icon="ticket" />
          </div>
        </div>

        <div class="rounded-2xl border border-steel-200 bg-white p-6">
          <h3 class="mb-3 flex items-center gap-2 text-[13px] font-700 text-graphite-900"><Icon name="image" :size="15" class="text-steel-400" /> Plakát</h3>
          <div class="flex items-center gap-4">
            <span class="h-28 w-44 shrink-0 overflow-hidden rounded-lg bg-steel-100">
              <img v-if="form.image" :src="form.image" alt="" class="h-full w-full object-cover" />
              <span v-else class="grid h-full w-full place-items-center text-steel-400"><Icon name="image" :size="24" /></span>
            </span>
            <button class="inline-flex items-center gap-2 rounded-md border border-dashed border-steel-300 px-3.5 py-2.5 text-[13px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"><Icon name="upload" :size="16" /> Nahrát plakát</button>
          </div>
        </div>
      </div>

      <!-- KROK 5: Náhled -->
      <div v-else class="space-y-5">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-display text-[18px] font-700 text-graphite-900">Náhled akce</h2>
            <p class="text-[13px] text-steel-500">Takto se akce zobrazí na webu. Zkontrolujte a dokončete.</p>
          </div>
          <span v-if="status" class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-600" :class="[EVENT_STATE_META[status].bg, EVENT_STATE_META[status].text]">
            <span class="h-1.5 w-1.5 rounded-full" :class="EVENT_STATE_META[status].dot" /> {{ EVENT_STATE_META[status].label }}
          </span>
        </div>

        <!-- Náhledová karta -->
        <article class="overflow-hidden rounded-2xl border border-steel-200 bg-white shadow-sm">
          <div class="relative aspect-[21/9] bg-steel-100">
            <img v-if="form.image" :src="form.image" alt="" class="absolute inset-0 h-full w-full object-cover" />
            <span v-else class="grid h-full w-full place-items-center text-steel-400"><Icon name="image" :size="32" /></span>
            <span class="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-graphite-950/70 px-2.5 py-1 text-[11px] font-600 text-white backdrop-blur-sm">{{ form.type }}</span>
          </div>
          <div class="p-6">
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-steel-500">
              <span v-if="place" class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full" :style="{ background: place.color }" /> {{ place.title.cs }}</span>
              <span v-if="dateRange" class="inline-flex items-center gap-1.5"><Icon name="calendar" :size="13" /> {{ dateRange }}</span>
              <span v-if="timeRange" class="inline-flex items-center gap-1.5"><Icon name="clock" :size="13" /> {{ timeRange }}</span>
            </div>
            <h3 class="mt-2 font-display text-[22px] font-800 leading-tight tracking-tight text-graphite-900">{{ form.title.cs || 'Bez názvu' }}</h3>
            <p v-if="form.subtitle.cs" class="mt-0.5 text-[14px] text-steel-600">{{ form.subtitle.cs }}</p>
            <p v-if="form.summary.cs" class="mt-3 text-[14px] leading-relaxed text-graphite-700">{{ form.summary.cs }}</p>
            <div v-if="form.description.cs" class="prose-preview mt-3 text-[13.5px] leading-relaxed text-steel-600" v-html="form.description.cs" />

            <div class="mt-4 flex flex-wrap items-center gap-4 border-t border-steel-100 pt-4 text-[13px]">
              <span v-if="form.price" class="inline-flex items-center gap-1.5 text-graphite-700"><Icon name="ticket" :size="15" class="text-steel-400" /> {{ form.price }}</span>
              <span v-if="form.ageLimit" class="inline-flex items-center gap-1.5 text-graphite-700"><Icon name="user" :size="15" class="text-steel-400" /> {{ form.ageLimit }}</span>
              <span v-if="form.duration" class="inline-flex items-center gap-1.5 text-graphite-700"><Icon name="clock" :size="15" class="text-steel-400" /> {{ form.duration }}</span>
              <span v-if="form.ticketUrl" class="ml-auto inline-flex items-center rounded-md bg-brand-500 px-3.5 py-1.5 text-[12.5px] font-600 text-white">Vstupenky</span>
            </div>

            <div v-if="form.tags.length" class="mt-4 flex flex-wrap gap-1.5">
              <TagChip v-for="t in form.tags" :key="t" :label="t" :color="eventTagColor(t)" />
            </div>
          </div>
        </article>

        <!-- Kontrola vyplněnosti + publikace -->
        <div class="grid gap-5 sm:grid-cols-2">
          <div class="rounded-2xl border border-steel-200 bg-white p-5">
            <h3 class="mb-3 text-[13px] font-700 text-graphite-900">Připravenost</h3>
            <ul class="space-y-2">
              <li v-for="c in checklist" :key="c.label" class="flex items-center gap-2 text-[13px]">
                <span class="grid h-5 w-5 place-items-center rounded-full" :class="c.ok ? 'bg-forge-500/15 text-forge-600' : 'bg-steel-100 text-steel-400'">
                  <Icon :name="c.ok ? 'check' : 'x'" :size="12" />
                </span>
                <span :class="c.ok ? 'text-graphite-700' : 'text-steel-500'">{{ c.label }}</span>
              </li>
            </ul>
          </div>
          <div class="rounded-2xl border border-steel-200 bg-white p-5">
            <h3 class="mb-3 text-[13px] font-700 text-graphite-900">Publikace</h3>
            <div class="flex items-center justify-between rounded-md border border-steel-200 px-3 py-2.5">
              <AppSwitch v-model="form.published" label="Zveřejnit na webu hned" aria-label="Zveřejnit na webu" />
            </div>
            <p class="mt-2 text-[11.5px] leading-relaxed text-steel-500">Bez zapnutí se akce uloží jako koncept a zveřejníte ji později.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Patička s navigací (mimo úvodní krok) -->
    <div v-if="step > 0" class="fixed inset-x-0 bottom-0 z-20 border-t border-steel-200 bg-white/95 backdrop-blur-sm xl:pl-[256px]">
      <div class="mx-auto flex max-w-[780px] items-center justify-between gap-3 px-6 py-3">
        <AppButton variant="secondary" @click="prev"><Icon name="chevronLeft" :size="16" /> Zpět</AppButton>
        <span class="font-mono text-[11.5px] text-steel-400">Krok {{ step + 1 }} z {{ steps.length }}</span>
        <AppButton v-if="step < steps.length - 1" variant="primary" @click="next">Pokračovat <Icon name="chevronRight" :size="16" /></AppButton>
        <AppButton v-else variant="primary" :disabled="!canFinish" @click="finish"><Icon name="check" :size="16" /> Dokončit a uložit</AppButton>
      </div>
    </div>

    <!-- Dialog: zavřít / uložit koncept -->
    <DialogRoot :open="closeOpen" @update:open="(v) => (closeOpen = v)">
      <DialogPortal>
        <DialogOverlay class="fixed inset-0 z-50 bg-graphite-950/40 backdrop-blur-[1px]" />
        <DialogContent class="fixed left-1/2 top-1/2 z-50 w-[460px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-steel-200 bg-white p-6 shadow-2xl">
          <div class="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon name="save" :size="22" /></div>
          <DialogTitle class="font-display text-lg font-700 text-graphite-900">Zavřít průvodce?</DialogTitle>
          <DialogDescription class="mt-1.5 text-[13.5px] leading-relaxed text-steel-500">
            Rozpracovaná akce se průběžně ukládá. Můžete ji uložit jako <span class="font-600 text-graphite-800">koncept</span> a dokončit později, nebo rozpracování zahodit.
          </DialogDescription>
          <div class="mt-5 flex flex-wrap justify-end gap-2">
            <AppButton variant="ghost" @click="closeOpen = false">Pokračovat v úpravách</AppButton>
            <AppButton variant="secondary" @click="discard">Zahodit</AppButton>
            <AppButton variant="primary" @click="saveDraftAndClose"><Icon name="save" :size="15" /> Uložit koncept</AppButton>
          </div>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>

    <!-- Toast -->
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="toast" class="fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl">
        <Icon name="check" :size="16" class="text-forge-500" /> {{ toast }}
      </div>
    </Transition>
  </div>
</template>
