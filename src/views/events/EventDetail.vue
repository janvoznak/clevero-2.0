<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CardActionsMenu from '@/components/admin/CardActionsMenu.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import TagChip from '@/components/ui/TagChip.vue'
import TagPicker from '@/components/admin/TagPicker.vue'
import FormSection from '@/components/admin/FormSection.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import LangBar from '@/components/admin/LangBar.vue'
import MlFieldHeader from '@/components/admin/MlFieldHeader.vue'
import { useMlTranslate } from '@/utils/useMlTranslate'
import AiPanel from '@/components/admin/AiPanel.vue'
import RelationPicker from '@/components/admin/RelationPicker.vue'
import GalleryField from '@/components/admin/GalleryField.vue'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  MOCK_EVENTS,
  EVENT_TYPES,
  PREDEFINED_EVENT_TAGS,
  TICKET_MODE_OPTIONS,
  aiImportFromUrl,
  type DovEvent,
} from '@/data/mockEvents'
import { PLACE_OPTIONS, DEFAULT_PLACE_ID, areaPlace } from '@/data/mockVenues'
import { tourOptionsList } from '@/data/mockTours'

const tourItems = tourOptionsList()

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_EVENTS.find((e) => e.id === props.id))

const empty = (): ML => ({ cs: '', en: '', de: '', pl: '' })

function clone(): DovEvent {
  const s = source.value
  if (s) {
    const c = JSON.parse(JSON.stringify(s)) as DovEvent
    c.gallery = c.gallery ?? []
    return c
  }
  return {
    id: 'nová',
    title: empty(),
    subtitle: empty(),
    type: 'Festival',
    from: '',
    to: '',
    time: '',
    timeTo: '',
    summary: empty(),
    description: empty(),
    image: '',
    price: '',
    ticketUrl: '',
    ticketMode: 'none',
    ageLimit: '',
    duration: '',
    performers: '',
    tags: [],
    areaId: DEFAULT_PLACE_ID,
    tourIds: [],
    galleryIds: [],
    gallery: [],
    published: false,
  }
}
const form = reactive<DovEvent>(clone())
const activeLang = ref<LangCode>('cs')

function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
}
const filledLangs = computed(() => LANGS.filter((l) => langFilled(l.code)).map((l) => l.code))

const typeOptions = EVENT_TYPES.map((t) => ({ value: t, label: t }))
/** Místo konání = objekt v Areálu (jedna kanonická vazba; barva v kalendáři
    se odvozuje z objektu). Všechna místa mají neprázdné ID. */
const placeOptions = PLACE_OPTIONS
const place = computed(() => areaPlace(form.areaId))

/* Proklik / založení objektu v Areálu z výběru místa konání (nový panel). */
function openPlace() {
  if (!form.areaId) return
  window.open(router.resolve({ name: 'area-edit', params: { id: form.areaId } }).href, '_blank')
}
function createPlace() {
  window.open(router.resolve({ name: 'area-new' }).href, '_blank')
}

/** Sekce detailu (podtržené záložky). */
const activeSection = ref('content')
const sections = [
  { value: 'content', label: 'Obsah', icon: 'page' },
  { value: 'when', label: 'Termín a místo', icon: 'calendar' },
  { value: 'tickets', label: 'Vstupenky a detaily', icon: 'ticket' },
  { value: 'media', label: 'Plakát', icon: 'image' },
  { value: 'gallery', label: 'Galerie', icon: 'gallery' },
]

/* ---------- Toast ---------- */
const toast = ref('')
let toastTimer: number | undefined
function fireToast(msg: string) {
  toast.value = msg
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 3200)
}

/* ============================================================
   AI-first import akce z odkazu (prototyp — fake).
   Vloží se URL akce v DOV → AI připraví kompletní obsah a pole.
   ============================================================ */
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
    form.ticketMode = d.ticketMode
    form.ageLimit = d.ageLimit
    form.duration = d.duration
    form.performers = d.performers
    form.tags = [...d.tags]
    if (d.image) form.image = d.image
    activeLang.value = SOURCE_LANG
    activeSection.value = 'content'
    importing.value = false
    fireToast('AI připravila obsah akce z odkazu — zkontrolujte a doplňte detaily')
  }, 1900)
}

/* ---------- AI překlad mutací (prototyp) — sdílené řešení ---------- */
const mlFields: (keyof DovEvent)[] = ['title', 'subtitle', 'summary', 'description']
const { translating, translateLang, translateField } = useMlTranslate(form, mlFields)

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
</script>

<template>
  <div class="pb-16">
    <!-- Sticky header -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button
          class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800"
          @click="router.push({ name: 'events-list' })"
        >
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">events</span>
            <span class="font-mono text-[11px] text-steel-400">{{ isEdit ? `/admin/events/${form.id}` : '/admin/events/new' }}</span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.title.cs || 'Bez názvu' : 'Nová akce' }}
          </h1>
        </div>

        <!-- Jazykové mutace (jediné místo, ✨ = AI překlad mutace) -->
        <LangBar
          v-model="activeLang"
          :filled="filledLangs"
          :translating="translating"
          class="hidden lg:block"
          @translate="translateLang"
        />

        <div class="h-6 w-px bg-steel-200" />
        <CardActionsMenu
          v-if="isEdit"
          :name="form.title.cs"
          entity="akci"
          @delete="router.push({ name: 'events-list' })"
        />
        <AppButton variant="secondary" @click="router.push({ name: 'events-list' })">Zrušit</AppButton>
        <AppButton variant="primary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit akci' }}
        </AppButton>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <!-- LEVÝ sloupec -->
      <div class="min-w-0 space-y-5">
        <!-- AI import z odkazu (sjednocený AI blok) -->
        <AiPanel title="Založit akci z odkazu" badge="AI-first" hint="Z odkazu na akci připraví AI celý obsah a vyplní pole.">
          <div class="flex flex-col gap-2 sm:flex-row">
            <div class="relative flex-1">
              <Icon name="link" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
              <input
                v-model="importUrl"
                type="text"
                placeholder="Vložte odkaz na akci konanou v DOV, např. https://racethestreets.eu/cs/udalosti/ostrava-2026"
                class="h-10 w-full rounded-md border border-steel-200 bg-white pl-9 pr-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                @keydown.enter.prevent="aiImport"
              />
            </div>
            <AppButton variant="primary" :disabled="!importUrl.trim() || importing" @click="aiImport">
              <Icon name="sparkles" :size="15" :class="importing && 'animate-pulse'" />
              {{ importing ? 'Načítám…' : 'Načíst přes AI' }}
            </AppButton>
          </div>
          <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
            <Icon name="sparkles" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
            AI z odkazu připraví název, popis, termín, místo, vstupné, věkové omezení, štítky i plakát. Vše pak zkontrolujete a upravíte.
          </p>
        </AiPanel>

        <!-- Obsahové sekce v podtržených záložkách -->
        <div class="rounded-lg border border-steel-200 bg-white">
          <TabsRoot v-model="activeSection">
            <TabsList class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2" aria-label="Sekce akce">
              <TabsTrigger
                v-for="s in sections"
                :key="s.value"
                :value="s.value"
                class="-mb-px inline-flex shrink-0 items-center gap-2 rounded-t-md border-b-2 border-transparent px-4 py-2.5 text-[13px] font-600 text-steel-500 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-800 data-[state=active]:border-brand-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700"
              >
                <Icon :name="s.icon" :size="16" />
                {{ s.label }}
              </TabsTrigger>
            </TabsList>

            <div class="p-5">
              <!-- Sekce: Obsah -->
              <TabsContent value="content" class="space-y-4 outline-none">
                <div>
                  <MlFieldHeader label="Název akce" :lang="activeLang" tag="event-title" required @translate="translateField('title')" />
                  <input
                    v-model="form.title[activeLang]"
                    type="text"
                    placeholder="Např. Race the Streets Ostrava 2026"
                    class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <MlFieldHeader label="Podnadpis" :lang="activeLang" tag="event-subtitle" @translate="translateField('subtitle')" />
                  <input
                    v-model="form.subtitle[activeLang]"
                    type="text"
                    placeholder="Claim nebo doplňující řádek pod názvem"
                    class="h-10 w-full rounded-md border border-steel-200 px-3.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <MlFieldHeader label="Perex (krátké shrnutí)" :lang="activeLang" tag="event-summary" @translate="translateField('summary')" />
                  <textarea
                    v-model="form.summary[activeLang]"
                    rows="2"
                    placeholder="Krátký úvod do výpisu a náhledů (1–2 věty)"
                    class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <MlFieldHeader label="Popis akce" :lang="activeLang" tag="event-description" @translate="translateField('description')" />
                  <RichTextEditor v-model="form.description[activeLang]" />
                </div>
              </TabsContent>

              <!-- Sekce: Termín a místo -->
              <TabsContent value="when" class="space-y-4 outline-none">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Místo konání (objekt v areálu) <span class="text-brand-500">*</span></span>
                      <span class="field-tag">event-area_id</span>
                    </label>
                    <AppSelect v-model="form.areaId" :options="placeOptions" />
                    <div class="mt-1.5 flex items-center gap-3 text-[11.5px]">
                      <button v-if="form.areaId" type="button" class="inline-flex items-center gap-1 font-600 text-brand-600 transition-colors hover:text-brand-700" @click="openPlace">
                        <Icon name="externalLink" :size="12" /> Otevřít objekt
                      </button>
                      <button type="button" class="inline-flex items-center gap-1 font-600 text-steel-500 transition-colors hover:text-brand-600" @click="createPlace">
                        <Icon name="plus" :size="12" /> Nový objekt
                      </button>
                    </div>
                  </div>
                  <div>
                    <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Typ akce</label>
                    <AppSelect v-model="form.type" :options="typeOptions" />
                  </div>
                </div>
                <p class="flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
                  <Icon name="map" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
                  Místo = objekt v <span class="font-600 text-graphite-700">Areálu</span>. Podle něj se akce barevně zařadí do kalendáře a na webu se zobrazí v detailu objektu.
                </p>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Termín OD</label>
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
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Délka</span>
                      <span class="field-tag">event-duration</span>
                    </label>
                    <input v-model="form.duration" type="text" placeholder="např. 90 min" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                  </div>
                </div>
                <p class="flex items-start gap-1.5 rounded-md bg-steel-50 px-3 py-2 text-[12px] text-steel-500">
                  <Icon name="calendar" :size="14" class="mt-0.5 shrink-0 text-steel-400" />
                  Stejné OD i DO = jednodenní akce. Rozdílné datumy = vícedenní / dlouhodobá akce v kalendáři.
                </p>

              </TabsContent>

              <!-- Sekce: Vstupenky a detaily -->
              <TabsContent value="tickets" class="space-y-4 outline-none">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Vstupné</span>
                      <span class="field-tag">event-price</span>
                    </label>
                    <input v-model="form.price" type="text" placeholder="např. Vstup zdarma / od 390 Kč" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                  </div>
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Věkové omezení</span>
                      <span class="field-tag">event-age_limit</span>
                    </label>
                    <input v-model="form.ageLimit" type="text" placeholder="např. 15+" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                  </div>
                </div>

                <!-- Prodej vstupenek — přepínač určuje, co se u akce vyplňuje -->
                <div class="rounded-md border border-steel-200 p-4">
                  <div class="mb-2.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Prodej vstupenek</span>
                    <span class="field-tag">event-ticket_mode</span>
                  </div>
                  <div class="inline-flex flex-wrap rounded-md border border-steel-200 bg-steel-50 p-1">
                    <button
                      v-for="opt in TICKET_MODE_OPTIONS"
                      :key="opt.value"
                      type="button"
                      class="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[12.5px] font-600 outline-none transition-colors"
                      :class="form.ticketMode === opt.value ? 'bg-white text-brand-700 shadow-sm' : 'text-steel-500 hover:text-graphite-800'"
                      @click="form.ticketMode = opt.value"
                    >
                      <Icon :name="opt.icon" :size="14" />
                      {{ opt.label }}
                    </button>
                  </div>
                  <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
                    <Icon name="help" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
                    {{ TICKET_MODE_OPTIONS.find((o) => o.value === form.ticketMode)?.hint }}
                  </p>

                  <!-- Colosseum → navázaná prohlídka -->
                  <div v-if="form.ticketMode === 'colosseum'" class="mt-3 border-t border-steel-100 pt-3">
                    <p class="mb-2 flex items-center gap-2 text-[12.5px] font-600 text-graphite-800"><Icon name="ticket" :size="14" class="text-steel-400" /> Navázaná prohlídka (prodej přes Colosseum) <span class="field-tag">event-tours</span></p>
                    <RelationPicker
                      v-model="form.tourIds"
                      :items="tourItems"
                      add-label="Přidat prohlídku"
                      empty-label="Zatím žádná prohlídka."
                      search-placeholder="Hledat prohlídku…"
                      icon="ticket"
                      item-route-name="tour-edit"
                      create-route-name="tour-new"
                      create-label="Založit novou prohlídku"
                    />
                    <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
                      <Icon name="ticket" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
                      <span>Dostupnost termínů i košík táhne <strong class="font-600 text-graphite-700">navázaná prohlídka</strong> z Colossea. Pro vstupenkovou akci vždy propoj alespoň jednu prohlídku.</span>
                    </p>
                  </div>

                  <!-- Externí odkaz -->
                  <div v-else-if="form.ticketMode === 'external'" class="mt-3 border-t border-steel-100 pt-3">
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[12.5px] font-600 text-graphite-800">Odkaz na externí prodej</span>
                      <span class="field-tag">event-ticket_url</span>
                    </label>
                    <div class="relative">
                      <Icon name="link" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
                      <input v-model="form.ticketUrl" type="text" placeholder="https://… (web pořadatele / nájemce)" class="h-10 w-full rounded-md border border-steel-200 pl-9 pr-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                    </div>
                    <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
                      <Icon name="link" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
                      <span>Web jen odkáže ven — prodej i vstupenky řeší pořadatel / nájemce (žádné napojení na Colosseum).</span>
                    </p>
                  </div>
                </div>

                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Účinkující / lektoři</span>
                    <span class="field-tag">event-performers</span>
                  </label>
                  <input v-model="form.performers" type="text" placeholder="Jména oddělená čárkou" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                </div>
              </TabsContent>

              <!-- Sekce: Plakát (jeden hlavní vizuál akce) -->
              <TabsContent value="media" class="outline-none">
                <p class="mb-3 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-steel-500">
                  <Icon name="image" :size="13" class="mt-0.5 shrink-0 text-steel-400" />
                  <span>Jeden <strong class="font-600 text-graphite-700">hlavní vizuál / plakát</strong> akce — zobrazí se v detailu, ve výpisu i při sdílení. Víc fotek (např. z minulého ročníku) se připojuje v záložce <strong class="font-600 text-graphite-700">Galerie</strong>.</span>
                </p>
                <div class="flex items-center gap-4">
                  <span class="h-28 w-44 shrink-0 overflow-hidden rounded-lg bg-steel-100">
                    <img v-if="form.image" :src="form.image" alt="" class="h-full w-full object-cover" />
                    <span v-else class="grid h-full w-full place-items-center text-steel-400"><Icon name="image" :size="24" /></span>
                  </span>
                  <div class="space-y-2">
                    <button class="inline-flex items-center gap-2 rounded-md border border-dashed border-steel-300 px-3.5 py-2.5 text-[13px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600">
                      <Icon name="upload" :size="16" /> Nahrát plakát
                    </button>
                    <button v-if="form.image" class="block text-[12px] font-500 text-danger-500 hover:text-danger-600" @click="form.image = ''">
                      Odebrat plakát
                    </button>
                  </div>
                </div>
              </TabsContent>

              <!-- Sekce: Galerie (připojené galerie + přímo nahrané fotky) -->
              <TabsContent value="gallery" class="outline-none">
                <GalleryField
                  v-model:galleries="form.galleryIds"
                  v-model:photos="form.gallery"
                  link-tag="event-gallery_ids"
                  photos-tag="event-gallery"
                />
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <PublishCard :published="form.published" updated-by="Petr Dvořák" />

        <!-- Štítky (sdílený TagPicker — stejné UI/UX jako Aktuality) -->
        <FormSection title="Štítky" icon="filter" tag="event-tags">
          <TagPicker v-model="form.tags" :options="PREDEFINED_EVENT_TAGS" />
        </FormSection>
      </aside>
    </div>

    <!-- Toast -->
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="toast" class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl">
        <Icon name="sparkles" :size="16" class="text-brand-400" />
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
