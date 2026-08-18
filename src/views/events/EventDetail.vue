<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import DetailActions from '@/components/admin/DetailActions.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import TagChip from '@/components/ui/TagChip.vue'
import TagPicker from '@/components/admin/TagPicker.vue'
import FormSection from '@/components/admin/FormSection.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import SlugField from '@/components/admin/SlugField.vue'
import { useAutoSlug } from '@/utils/useAutoSlug'
import LangBar from '@/components/admin/LangBar.vue'
import MlFieldHeader from '@/components/admin/MlFieldHeader.vue'
import { useMlTranslate } from '@/utils/useMlTranslate'
import AiPanel from '@/components/admin/AiPanel.vue'
import DovikUrlImport from '@/components/admin/DovikUrlImport.vue'
import DovikSocialPost from '@/components/admin/DovikSocialPost.vue'
import RelationPicker from '@/components/admin/RelationPicker.vue'
import GalleryField from '@/components/admin/GalleryField.vue'
import ContentBuilder from '@/components/admin/ContentBuilder.vue'
import { LANGS, SOURCE_LANG, defaultContentBlocks } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  filledLangsOf,
  publishedLangsOf,
  publishLangRows,
  toggleLangPublish,
} from '@/utils/langPublish'
import {
  MOCK_EVENTS,
  EVENT_TYPES,
  PREDEFINED_EVENT_TAGS,
  TICKET_MODE_OPTIONS,
  AGE_LIMIT_OPTIONS,
  COLOSSEUM_EVENTS,
  aiImportFromUrl,
  type DovEvent,
} from '@/data/mockEvents'
import ColosseumEventPicker from '@/components/admin/ColosseumEventPicker.vue'
import { PLACE_ITEMS, DEFAULT_PLACE_ID, areaPlace } from '@/data/mockVenues'

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
    c.contentBlocks = c.contentBlocks ?? defaultContentBlocks()
    // Zhmotnit fallback do explicitního seznamu, aby šlo přepínat.
    c.publishedLangs = publishedLangsOf(filledLangsOf(c.title), c.publishedLangs)
    return c
  }
  return {
    id: 'nová',
    title: empty(),
    subtitle: empty(),
    contentBlocks: defaultContentBlocks(),
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
    ticketMode: 'free',
    ageLimit: '',
    duration: '',
    performers: '',
    tags: [],
    areaIds: [DEFAULT_PLACE_ID],
    tourIds: [],
    colosseumEventId: '',
    galleryIds: [],
    gallery: [],
    published: false,
    // Nová akce: každá mutace půjde živě, jakmile dostane obsah.
    publishedLangs: LANGS.map((l) => l.code),
  }
}
const form = reactive<DovEvent>(clone())
const activeLang = ref<LangCode>('cs')

function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
}
const filledLangs = computed(() => LANGS.filter((l) => langFilled(l.code)).map((l) => l.code))

/* ---------- Publikování per jazyk ----------
   Stav záznamu (published) + termín řídí, KDY je akce živá; tyto přepínače
   řídí, KTERÉ mutace se na webu zobrazí. Prázdnou mutaci nelze zveřejnit. */
const liveLangs = computed(() => publishedLangsOf(filledLangsOf(form.title), form.publishedLangs))
const publishRows = computed(() => publishLangRows(form.title, form.publishedLangs))
function onToggleLang(code: LangCode) {
  form.publishedLangs = toggleLangPublish(form.publishedLangs, filledLangsOf(form.title), code)
}

const typeOptions = EVENT_TYPES.map((t) => ({ value: t, label: t }))
/** Místo konání = objekty v Areálu (může jich být víc; v kalendáři se akce
    zobrazí v řádku každého objektu). Barva pro propagaci = první objekt. */
const placeItems = PLACE_ITEMS
const place = computed(() => areaPlace(form.areaIds[0]))

/* Termín pro propagaci (FB banner/text). */
function fmtPromoD(iso: string): string {
  return iso ? new Date(iso + 'T00:00:00').toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' }) : ''
}
const promoDate = computed(() => {
  if (!form.from) return ''
  const f = fmtPromoD(form.from)
  return !form.to || form.to === form.from ? f : `${f} – ${fmtPromoD(form.to)}`
})

/* Věkové omezení = dropdown; sentinel pro „bez omezení" (Reka Select nechce ''). */
const AGE_NONE = '__none__'
const ageLimitOptions = [{ value: AGE_NONE, label: 'Bez omezení' }, ...AGE_LIMIT_OPTIONS]
const ageLimitModel = computed({
  get: () => form.ageLimit || AGE_NONE,
  set: (v: string) => (form.ageLimit = v === AGE_NONE ? '' : v),
})

/** Sekce detailu (podtržené záložky). */
const activeSection = ref('basic')
const sections = [
  { value: 'basic', label: 'Základní informace', icon: 'page' },
  { value: 'content', label: 'Obsah', icon: 'text' },
  { value: 'when', label: 'Termín a místo', icon: 'calendar' },
  { value: 'tickets', label: 'Vstupenky a detaily', icon: 'ticket' },
  { value: 'gallery', label: 'Galerie', icon: 'gallery' },
  { value: 'promo', label: 'Propagace', icon: 'share' },
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
    if (d.areaIds.length) form.areaIds = d.areaIds
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
    activeSection.value = 'basic'
    importing.value = false
    fireToast('AI připravila obsah akce z odkazu — zkontrolujte a doplňte detaily')
  }, 1900)
}

/** URL slug se generuje automaticky z názvu akce (dokud ho klient neupraví ručně). */
const slugText = computed({
  get: () => form.slug?.[activeLang.value] ?? '',
  set: (v: string) => {
    if (!form.slug) form.slug = empty()
    form.slug[activeLang.value] = v
  },
})
const { markManual } = useAutoSlug(() => form.title, () => (form.slug ??= empty()))

/* ---------- AI překlad mutací (prototyp) — sdílené řešení ---------- */
const mlFields: (keyof DovEvent)[] = ['title', 'subtitle', 'summary']
const { translating, translateLang, translateField } = useMlTranslate(form, mlFields)

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
function saveBack() {
  save()
  router.push({ name: 'events-list' })
}
function onDuplicate() {
  router.push({ name: 'event-new' })
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
          :published="liveLangs"
          :translating="translating"
          class="hidden lg:block"
          @translate="translateLang"
        />

        <div class="h-6 w-px bg-steel-200" />
        <DetailActions
          :name="form.title.cs"
          entity="akci"
          :is-edit="isEdit"
          :saved="saved"
          @save="save"
          @save-back="saveBack"
          @duplicate="onDuplicate"
          @delete="router.push({ name: 'events-list' })"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <!-- LEVÝ sloupec -->
      <div class="min-w-0 space-y-5">
        <!-- AI import z odkazu (sjednocený AI blok) -->
        <AiPanel title="Založit akci z odkazu" badge="DOVík" hint="Z odkazu na akci připraví DOVík celý obsah a vyplní pole.">
          <DovikUrlImport
            v-model="importUrl"
            :busy="importing"
            placeholder="Vložte odkaz na akci konanou v DOV, např. https://racethestreets.eu/cs/udalosti/ostrava-2026"
            @submit="aiImport"
          />
          <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
            <Icon name="sparkles" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
            DOVík z odkazu připraví název, popis, termín, místo, vstupné, věkové omezení, štítky i plakát. Vše pak zkontrolujete a upravíte.
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
              <!-- Sekce: Základní informace -->
              <TabsContent value="basic" class="space-y-4 outline-none">
                <div>
                  <MlFieldHeader label="Název akce" :lang="activeLang" tag="event-title" required @translate="translateField('title')" />
                  <input
                    v-model="form.title[activeLang]"
                    type="text"
                    placeholder="Např. Race the Streets Ostrava 2026"
                    class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <SlugField
                  v-model="slugText"
                  :tag="`event-url · ${activeLang.toUpperCase()}`"
                  @edit="markManual(activeLang)"
                />

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
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Typ akce</span>
                    <span class="field-tag">event-type</span>
                  </label>
                  <AppSelect v-model="form.type" :options="typeOptions" />
                </div>
              </TabsContent>

              <!-- Sekce: Obsah (jednotný ContentBuilder — nic dalšího pod ním) -->
              <TabsContent value="content" class="outline-none">
                <ContentBuilder v-model="form.contentBlocks" />
              </TabsContent>

              <!-- Sekce: Termín a místo — dvě vizuálně oddělené karty (jako Areál) -->
              <TabsContent value="when" class="space-y-5 outline-none">
                <!-- Místo -->
                <FormSection title="Místo konání" icon="map" tag="event-area_id">
                  <RelationPicker
                    v-model="form.areaIds"
                    :items="placeItems"
                    add-label="Přidat objekt"
                    empty-label="Zatím žádný objekt — akce se nezařadí do kalendáře."
                    search-placeholder="Hledat objekt v areálu…"
                    icon="home"
                    item-route-name="area-edit"
                    create-route-name="area-new"
                    create-label="Založit objekt"
                  />
                  <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
                    <Icon name="map" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
                    Místa = objekty v <span class="font-600 text-graphite-700">Areálu</span>. Akce se zobrazí v kalendáři v řádku každého objektu (v jeho barvě) a na webu v detailu každého z nich. Můžeš vybrat víc objektů.
                  </p>
                </FormSection>

                <!-- Termín -->
                <FormSection title="Termín" icon="calendar" tag="event-datetime">
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

                  <div class="mt-4 grid gap-4 sm:grid-cols-3">
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
                  <p class="mt-3 flex items-start gap-1.5 rounded-md bg-steel-50 px-3 py-2 text-[12px] text-steel-500">
                    <Icon name="calendar" :size="14" class="mt-0.5 shrink-0 text-steel-400" />
                    Stejné OD i DO = jednodenní akce. Rozdílné datumy = vícedenní / dlouhodobá akce v kalendáři.
                  </p>
                </FormSection>
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
                    <AppSelect v-model="ageLimitModel" :options="ageLimitOptions" placeholder="Bez omezení" />
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

                  <!-- Colosseum → napojení na akci z Colossea (našeptávač) -->
                  <div v-if="form.ticketMode === 'colosseum'" class="mt-3 border-t border-steel-100 pt-3">
                    <p class="mb-2 flex items-center gap-2 text-[12.5px] font-600 text-graphite-800"><Icon name="ticket" :size="14" class="text-steel-400" /> Akce z Colossea (prodej vstupenek) <span class="field-tag">event-colosseum</span></p>
                    <ColosseumEventPicker v-model="form.colosseumEventId" :events="COLOSSEUM_EVENTS" />
                    <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
                      <Icon name="ticket" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
                      <span>Vyber akci z <strong class="font-600 text-graphite-700">Colossea</strong> — dostupnost termínů i košík táhne vybraná akce (název i termín posílá Colosseum přes API). Pro vstupenkovou akci ji vždy propoj.</span>
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

              <!-- Sekce: Galerie (plakát + připojené galerie + přímo nahrané fotky) -->
              <TabsContent value="gallery" class="space-y-5 outline-none">
                <!-- Plakát = jeden hlavní vizuál akce (dřív samostatná záložka) -->
                <FormSection
                  title="Plakát (hlavní vizuál)"
                  icon="image"
                  hint="Jeden hlavní vizuál / plakát akce — zobrazí se v detailu, ve výpisu i při sdílení. Víc fotek (např. z minulého ročníku) přidej do galerie níže."
                  tag="event-image"
                >
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
                </FormSection>

                <GalleryField
                  v-model:galleries="form.galleryIds"
                  v-model:photos="form.gallery"
                  link-tag="event-gallery_ids"
                  photos-tag="event-gallery"
                />
              </TabsContent>

              <!-- Sekce: Propagace (DOVík → FB koncept) -->
              <TabsContent value="promo" class="outline-none">
                <DovikSocialPost
                  :title="form.title.cs"
                  :subtitle="form.subtitle.cs"
                  :date-label="promoDate"
                  :place-label="place?.title.cs ?? ''"
                  :place-color="place?.color"
                  :image="form.image"
                  :summary="form.summary.cs"
                  :type-label="form.type"
                  :price="form.price"
                  :tags="form.tags"
                />
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <PublishCard :published="form.published" :langs="publishRows" updated-by="Petr Dvořák" @toggle-lang="onToggleLang" />

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
