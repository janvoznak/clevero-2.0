<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import TagChip from '@/components/ui/TagChip.vue'
import TagPicker from '@/components/admin/TagPicker.vue'
import FormSection from '@/components/admin/FormSection.vue'
import AiPanel from '@/components/admin/AiPanel.vue'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  MOCK_EVENTS,
  EVENT_TYPES,
  PREDEFINED_EVENT_TAGS,
  eventStatus,
  EVENT_STATE_META,
  aiImportFromUrl,
  type DovEvent,
} from '@/data/mockEvents'
import { PLACE_OPTIONS, DEFAULT_PLACE_ID, areaPlace } from '@/data/mockVenues'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_EVENTS.find((e) => e.id === props.id))

const empty = (): ML => ({ cs: '', en: '', de: '', pl: '' })

function clone(): DovEvent {
  const s = source.value
  if (s) return JSON.parse(JSON.stringify(s))
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
    ageLimit: '',
    duration: '',
    performers: '',
    tags: [],
    areaId: DEFAULT_PLACE_ID,
    published: false,
  }
}
const form = reactive<DovEvent>(clone())
const activeLang = ref<LangCode>('cs')

function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
}

const typeOptions = EVENT_TYPES.map((t) => ({ value: t, label: t }))
/** Místo konání = objekt v Areálu (jedna kanonická vazba; barva v kalendáři
    se odvozuje z objektu). Všechna místa mají neprázdné ID. */
const placeOptions = PLACE_OPTIONS
const place = computed(() => areaPlace(form.areaId))
const status = computed(() => (form.from && form.to ? eventStatus(form) : null))

/** Sekce detailu (podtržené záložky). */
const activeSection = ref('content')
const sections = [
  { value: 'content', label: 'Obsah', icon: 'page' },
  { value: 'when', label: 'Termín a místo', icon: 'calendar' },
  { value: 'tickets', label: 'Vstupenky a detaily', icon: 'ticket' },
  { value: 'media', label: 'Plakát', icon: 'image' },
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

/* ---------- AI překlad (prototyp) — CZ → EN/DE/PL napříč ML poli. ---------- */
const targetLangs = LANGS.filter((l) => l.code !== SOURCE_LANG)
const translating = ref(false)
const sourceReady = computed(() => form.title[SOURCE_LANG].trim().length > 0)
const mlFields: (keyof DovEvent)[] = ['title', 'subtitle', 'summary', 'description']
function translateAll() {
  if (translating.value || !sourceReady.value) return
  translating.value = true
  window.setTimeout(() => {
    for (const f of mlFields) {
      const val = form[f] as ML
      const src = val[SOURCE_LANG]
      for (const t of targetLangs) if (src) val[t.code] = src
    }
    translating.value = false
    fireToast(`Přeloženo z CZ do ${targetLangs.map((l) => l.code.toUpperCase()).join(', ')}`)
  }, 1500)
}

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

        <!-- Jazykové mutace -->
        <TabsRoot :model-value="activeLang" class="hidden lg:block" @update:model-value="(v) => (activeLang = v as LangCode)">
          <TabsList class="inline-flex items-center gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1" aria-label="Jazyková mutace">
            <TabsTrigger
              v-for="l in LANGS"
              :key="l.code"
              :value="l.code"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors hover:text-graphite-800 data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm"
            >
              <span>{{ l.flag }}</span>{{ l.code.toUpperCase() }}
              <span class="h-1.5 w-1.5 rounded-full" :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'" />
            </TabsTrigger>
          </TabsList>
        </TabsRoot>

        <div class="h-6 w-px bg-steel-200" />
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
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Název akce <span class="text-brand-500">*</span></span>
                    <span class="field-tag">event-title · {{ activeLang.toUpperCase() }}</span>
                  </label>
                  <input
                    v-model="form.title[activeLang]"
                    type="text"
                    placeholder="Např. Race the Streets Ostrava 2026"
                    class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Podnadpis</span>
                    <span class="field-tag">event-subtitle · {{ activeLang.toUpperCase() }}</span>
                  </label>
                  <input
                    v-model="form.subtitle[activeLang]"
                    type="text"
                    placeholder="Claim nebo doplňující řádek pod názvem"
                    class="h-10 w-full rounded-md border border-steel-200 px-3.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Perex (krátké shrnutí)</span>
                    <span class="field-tag">event-summary · {{ activeLang.toUpperCase() }}</span>
                  </label>
                  <textarea
                    v-model="form.summary[activeLang]"
                    rows="2"
                    placeholder="Krátký úvod do výpisu a náhledů (1–2 věty)"
                    class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Popis akce</span>
                    <span class="field-tag">event-description · {{ activeLang.toUpperCase() }}</span>
                  </label>
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

                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Odkaz na vstupenky / rezervaci</span>
                    <span class="field-tag">event-ticket_url</span>
                  </label>
                  <div class="relative">
                    <Icon name="ticket" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
                    <input v-model="form.ticketUrl" type="text" placeholder="/vstupenky/… nebo https://…" class="h-10 w-full rounded-md border border-steel-200 pl-9 pr-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
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

              <!-- Sekce: Plakát -->
              <TabsContent value="media" class="outline-none">
                <p class="mb-3 text-[12.5px] text-steel-500">Hlavní vizuál / plakát akce. Zobrazí se v detailu i ve výpisu.</p>
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
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <FormSection title="Publikace" icon="eye">
          <div class="space-y-3">
            <div class="flex items-center justify-between rounded-md bg-steel-50 px-3 py-2.5">
              <span class="text-[12.5px] font-500 text-steel-600">Stav akce</span>
              <span v-if="status" class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600" :class="[EVENT_STATE_META[status].bg, EVENT_STATE_META[status].text]">
                <span class="h-1.5 w-1.5 rounded-full" :class="EVENT_STATE_META[status].dot" />
                {{ EVENT_STATE_META[status].label }}
              </span>
              <span v-else class="text-[12px] text-steel-400">doplňte termín</span>
            </div>
            <div class="flex items-center justify-between rounded-md border border-steel-200 px-3 py-2.5">
              <AppSwitch v-model="form.published" label="Zveřejnit na webu" aria-label="Zveřejnit na webu" />
              <span class="field-tag">event-published</span>
            </div>
          </div>
        </FormSection>

        <!-- Štítky (sdílený TagPicker — stejné UI/UX jako Aktuality) -->
        <FormSection title="Štítky" icon="filter" tag="event-tags">
          <TagPicker v-model="form.tags" :options="PREDEFINED_EVENT_TAGS" />
        </FormSection>

        <!-- Jazykové mutace + AI překlad -->
        <FormSection title="Jazykové mutace" icon="globe" tag="ML">
          <ul class="space-y-1.5">
            <li v-for="l in LANGS" :key="l.code" class="flex items-center justify-between rounded-md px-2.5 py-2 transition-colors" :class="activeLang === l.code ? 'bg-brand-50' : 'hover:bg-steel-50'">
              <button class="flex items-center gap-2.5 text-left" @click="activeLang = l.code">
                <span>{{ l.flag }}</span>
                <span class="text-[13px] font-500 text-graphite-800">{{ l.label }}</span>
              </button>
              <span class="inline-flex items-center gap-1.5 font-mono text-[10.5px]" :class="langFilled(l.code) ? 'text-forge-600' : 'text-steel-400'">
                <span class="h-1.5 w-1.5 rounded-full" :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'" />
                {{ langFilled(l.code) ? 'vyplněno' : 'prázdné' }}
              </span>
            </li>
          </ul>
          <div class="mt-4 border-t border-steel-100 pt-4">
            <AppButton variant="primary" size="sm" class="w-full" :disabled="translating || !sourceReady" @click="translateAll">
              <Icon name="sparkles" :size="15" :class="translating && 'animate-pulse'" />
              {{ translating ? 'Překládám…' : 'Přeložit z CZ přes AI' }}
            </AppButton>
            <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
              <Icon name="sparkles" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
              <span v-if="sourceReady">Vyplní mutace EN, DE, PL (název, podnadpis, perex, popis) ze zdrojové české verze.</span>
              <span v-else>Nejdřív vyplňte český název — z něj se překládá.</span>
            </p>
          </div>
        </FormSection>

        <FormSection title="Zařazení" icon="calendar">
          <dl class="space-y-2.5 text-[13px]">
            <div class="flex items-center justify-between">
              <dt class="text-steel-500">Místo</dt>
              <dd v-if="place"><TagChip :label="place.title.cs" :color="place.color" /></dd>
              <dd v-else class="text-steel-400">—</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="text-steel-500">Typ</dt>
              <dd class="font-600 text-graphite-800">{{ form.type }}</dd>
            </div>
            <div v-if="form.price" class="flex items-center justify-between">
              <dt class="text-steel-500">Vstupné</dt>
              <dd class="font-600 text-graphite-800">{{ form.price }}</dd>
            </div>
          </dl>
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
