<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import DetailActions from '@/components/admin/DetailActions.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import RelationPicker from '@/components/admin/RelationPicker.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import BackRefsCard from '@/components/admin/BackRefsCard.vue'
import { backRefsForTour } from '@/data/backrefs'
import AiPanel from '@/components/admin/AiPanel.vue'
import ContentBuilder from '@/components/admin/ContentBuilder.vue'
import SlugField from '@/components/admin/SlugField.vue'
import { useAutoSlug } from '@/utils/useAutoSlug'
import GalleryField from '@/components/admin/GalleryField.vue'
import LangBar from '@/components/admin/LangBar.vue'
import MlFieldHeader from '@/components/admin/MlFieldHeader.vue'
import { useMlTranslate } from '@/utils/useMlTranslate'
import { LANGS, SOURCE_LANG, defaultContentBlocks } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  filledLangsOf,
  publishedLangsOf,
  publishLangRows,
  toggleLangPublish,
} from '@/utils/langPublish'
import {
  MOCK_TOURS,
  CATEGORY_OPTIONS,
  blankTour,
  upcomingSlots,
  remaining,
  freeSeats,
  availability,
  AVAILABILITY_META,
  fmtSlot,
  COLOSSEUM_TOURS,
  colosseumTourById,
  type Tour,
  type TourHighlight,
} from '@/data/mockTours'
import { PLACE_ITEMS } from '@/data/mockVenues'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const route = useRoute()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_TOURS.find((t) => t.id === props.id))
function clone(): Tour {
  const s = source.value
  if (s) {
    const c = JSON.parse(JSON.stringify(s)) as Tour
    c.contentBlocks = c.contentBlocks ?? defaultContentBlocks()
    c.photos = c.photos ?? []
    c.galleryIds = c.galleryIds ?? []
    // Zhmotnit fallback do explicitního seznamu, aby šlo přepínat.
    c.publishedLangs = publishedLangsOf(filledLangsOf(c.title), c.publishedLangs)
    return c
  }
  const c = blankTour(typeof route.query.category === 'string' ? route.query.category : 'cat-dov')
  c.contentBlocks = c.contentBlocks ?? defaultContentBlocks()
  return c
}
const form = reactive<Tour>(clone())

/* Galerie (form.photos) je jediný zdroj fotek; hlavní fotka = cover. `form.image`
   drží denormalizovaný odkaz pro výpisy/karty mimo formulář (jako v Areálu). */
const coverImage = computed(() => form.photos.find((p) => p.isMain) ?? form.photos[0] ?? null)
watch(coverImage, (c) => { form.image = c?.src ?? '' }, { immediate: true })
const activeLang = ref<LangCode>('cs')
function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
}
const filledLangs = computed(() => LANGS.filter((l) => langFilled(l.code)).map((l) => l.code))

/** URL slug se generuje automaticky z názvu prohlídky (dokud ho klient neupraví ručně). */
const emptyML = (): ML => ({ cs: '', en: '', de: '', pl: '' })
const slugText = computed({
  get: () => form.slug?.[activeLang.value] ?? '',
  set: (v: string) => {
    if (!form.slug) form.slug = emptyML()
    form.slug[activeLang.value] = v
  },
})
const { markManual } = useAutoSlug(() => form.title, () => (form.slug ??= emptyML()))

/* ---------- Publikování per jazyk ----------
   Stav prohlídky (PublishCard) řídí, KDY je prohlídka živá; tyto přepínače
   řídí, KTERÉ mutace se na webu zobrazí. Prázdnou mutaci nelze zveřejnit. */
const liveLangs = computed(() => publishedLangsOf(filledLangsOf(form.title), form.publishedLangs))
const publishRows = computed(() => publishLangRows(form.title, form.publishedLangs))
function onToggleLang(code: LangCode) {
  form.publishedLangs = toggleLangPublish(form.publishedLangs, filledLangsOf(form.title), code)
}

/* ---------- Sekce ---------- */
const activeSection = ref('basic')
const sections = [
  { value: 'basic', label: 'Základní informace', icon: 'page' },
  { value: 'content', label: 'Obsah', icon: 'text' },
  { value: 'colosseum', label: 'Místo a Colosseum', icon: 'integration' },
  { value: 'gallery', label: 'Galerie', icon: 'gallery' },
]

/* ---------- „Co vás čeká" (highlights) ---------- */
let hlSeq = 0
function addHighlight() {
  hlSeq += 1
  form.highlights.push({ id: `hl-new-${hlSeq}`, text: { cs: '', en: '', de: '', pl: '' } })
}
function removeHighlight(i: number) {
  form.highlights.splice(i, 1)
}



/* ---------- Colosseum (read-only) ---------- */
const slots = computed(() => upcomingSlots(form))

/* ---------- Napojení na Colosseum — našeptávač z načtených okruhů ----------
   Vybírá se z akcí, které Colosseum aktuálně vrací (COLOSSEUM_TOURS). Lze zadat
   i ID zatím nenačtené (naplánované) akce — pak varujeme, že do zveřejnění
   v Colosseu nepůjde koupit vstupenky. */
const colOpen = ref(false)
function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}
const colSuggestions = computed(() => {
  const q = norm(form.colosseumId.trim())
  if (!q) return COLOSSEUM_TOURS
  return COLOSSEUM_TOURS.filter((t) => norm(t.id).includes(q) || norm(t.name).includes(q))
})
/** Napojený načtený okruh (undefined = ID prázdné nebo zatím nenačtené). */
const colTour = computed(() => (form.colosseumId.trim() ? colosseumTourById(form.colosseumId) : undefined))
/** Stav napojení: prázdné / načteno / nenačtené ID (naplánováno). */
const colState = computed<'empty' | 'loaded' | 'planned'>(() =>
  !form.colosseumId.trim() ? 'empty' : colTour.value ? 'loaded' : 'planned',
)
function pickColTour(t: { id: string }) {
  form.colosseumId = t.id
  colOpen.value = false
}

/* ---------- AI popis (prototyp) ---------- */
const aiPrompt = ref('')
const aiWorking = ref(false)
function aiDescribe() {
  const p = aiPrompt.value.trim()
  if (!p || aiWorking.value) return
  aiWorking.value = true
  window.setTimeout(() => {
    form.description[SOURCE_LANG] = `<p>${p.charAt(0).toUpperCase() + p.slice(1)}.</p><p>Komentovaná prohlídka s průvodcem, který vás provede areálem a přiblíží jeho historii.</p>`
    if (!form.highlights.length) {
      form.highlights = ['Komentovaný výklad průvodce.', 'Vstup do jinak nepřístupných prostor.', 'Fotopauza s výhledem.'].map((t, i) => ({ id: `hl-ai-${i}`, text: { cs: t, en: '', de: '', pl: '' } }))
    }
    if (!form.scheduleNote.cs) form.scheduleNote[SOURCE_LANG] = 'Denně v 10:00, 12:00 a 14:00. Kapacita skupiny je omezená, doporučujeme rezervaci předem.'
    activeLang.value = SOURCE_LANG
    activeSection.value = 'basic'
    aiWorking.value = false
    fireToast('AI připravila popis prohlídky — zkontrolujte a doplňte')
  }, 1600)
}

/* ---------- AI překlad mutací (prototyp) — sdílené řešení ---------- */
const mlFields: (keyof Tour)[] = ['title', 'perex', 'scheduleNote', 'paymentNote']
const { translating, translateLang, translateField } = useMlTranslate(form, mlFields)

const toast = ref('')
let toastTimer: number | undefined
function fireToast(msg: string) {
  toast.value = msg
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 3000)
}

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2000)
}
function backToCategory() {
  router.push({ name: 'category-edit', params: { id: form.categoryId } })
}
function saveBack() {
  save()
  router.push({ name: 'tours-list' })
}
function onDuplicate() {
  router.push({ name: 'tour-new' })
}
</script>

<template>
  <div class="pb-16">
    <!-- Sticky header -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800" @click="backToCategory">
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">tour</span>
            <span class="font-mono text-[11px] text-steel-400">{{ isEdit ? `/admin/tours/${form.id}` : '/admin/tours/new' }}</span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.title.cs || 'Bez názvu' : 'Nová prohlídka' }}
          </h1>
        </div>
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
          entity="prohlídku"
          :is-edit="isEdit"
          :saved="saved"
          @save="save"
          @save-back="saveBack"
          @duplicate="onDuplicate"
          @delete="router.push({ name: 'tours-list' })"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <!-- LEVÝ sloupec -->
      <div class="min-w-0 space-y-5">
        <!-- AI blok -->
        <AiPanel title="Popsat prohlídku s DOVíkem" hint="Ze stručného zadání připraví DOVík popis, odrážky a časy.">
          <div class="flex flex-col gap-2 sm:flex-row">
            <input v-model="aiPrompt" type="text" placeholder="Např. komentovaná prohlídka vysoké pece č.1 s výstupem na Bolt Tower" class="h-10 w-full flex-1 rounded-md border border-steel-200 bg-white px-3 text-[13px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" @keydown.enter.prevent="aiDescribe" />
            <AppButton variant="primary" :disabled="!aiPrompt.trim() || aiWorking" @click="aiDescribe">
              <Icon name="sparkles" :size="15" :class="aiWorking && 'animate-pulse'" />
              {{ aiWorking ? 'Tvořím…' : 'Vygenerovat' }}
            </AppButton>
          </div>
        </AiPanel>

        <div class="rounded-lg border border-steel-200 bg-white">
          <TabsRoot v-model="activeSection">
            <TabsList class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2" aria-label="Sekce prohlídky">
              <TabsTrigger v-for="s in sections" :key="s.value" :value="s.value" class="-mb-px inline-flex shrink-0 items-center gap-2 rounded-t-md border-b-2 border-transparent px-4 py-2.5 text-[13px] font-600 text-steel-500 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-800 data-[state=active]:border-brand-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700">
                <Icon :name="s.icon" :size="16" /> {{ s.label }}
              </TabsTrigger>
            </TabsList>

            <div class="p-5">
              <!-- Základní informace -->
              <TabsContent value="basic" class="space-y-4 outline-none">
                <div>
                  <MlFieldHeader label="Název prohlídky" :lang="activeLang" tag="tour-title" required @translate="translateField('title')" />
                  <input v-model="form.title[activeLang]" type="text" placeholder="Např. Vysokopecní okruh vč. návštěvy Bolt Tower" class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                </div>

                <SlugField v-model="slugText" :tag="`tour-url · ${activeLang.toUpperCase()}`" @edit="markManual(activeLang)" />

                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Kategorie</span>
                    <span class="field-tag">tour-category_id</span>
                  </label>
                  <AppSelect v-model="form.categoryId" :options="CATEGORY_OPTIONS" />
                </div>

                <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
                  <div>
                    <MlFieldHeader label="Perex" :lang="activeLang" tag="tour-perex" @translate="translateField('perex')" />
                    <textarea v-model="form.perex[activeLang]" rows="2" placeholder="Krátký úvod do výpisu (1–2 věty)" class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                  </div>
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Délka</span>
                      <span class="field-tag">tour-duration</span>
                    </label>
                    <input v-model="form.duration" type="text" placeholder="např. 100 minut" class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                  </div>
                </div>

                <!-- Co vás čeká -->
                <div>
                  <div class="mb-2 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Co vás při prohlídce čeká</span>
                    <span class="field-tag">tour-highlights · {{ activeLang.toUpperCase() }}</span>
                  </div>
                  <div v-if="form.highlights.length" class="space-y-2">
                    <div v-for="(h, i) in form.highlights" :key="h.id" class="flex items-center gap-2">
                      <Icon name="check" :size="15" class="shrink-0 text-brand-500" />
                      <input v-model="h.text[activeLang]" type="text" placeholder="Např. Jízda skipovým výtahem" class="h-10 flex-1 rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                      <button type="button" class="grid h-9 w-9 shrink-0 place-items-center rounded-md text-steel-400 transition-colors hover:bg-danger-500/10 hover:text-danger-600" aria-label="Odebrat" @click="removeHighlight(i)"><Icon name="trash" :size="15" /></button>
                    </div>
                  </div>
                  <p v-else class="text-[12px] text-steel-400">Zatím žádné odrážky.</p>
                  <button type="button" class="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-1.5 text-[12.5px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600" @click="addHighlight"><Icon name="plus" :size="15" /> Přidat odrážku</button>
                </div>

                <!-- Kdy začínají -->
                <div>
                  <MlFieldHeader label="Kdy prohlídky začínají" :lang="activeLang" tag="tour-schedule" @translate="translateField('scheduleNote')" />
                  <textarea v-model="form.scheduleNote[activeLang]" rows="3" placeholder="Např. Denně v 10:00, 12:00, 14:00 a 16:00. Max. kapacita skupiny 17 osob." class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[13.5px] leading-relaxed text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                </div>

                <!-- Kontakt a platba (dříve samostatná záložka) -->
                <div class="space-y-4 border-t border-steel-100 pt-4">
                  <!-- Ceny řeší Colosseum — v CMS se needitují (žádná ruční duplikace). -->
                  <div class="flex items-start gap-2.5 rounded-md border border-steel-200 bg-steel-50 px-3.5 py-3">
                    <Icon name="integration" :size="16" class="mt-0.5 shrink-0 text-brand-500" />
                    <p class="text-[12.5px] leading-relaxed text-steel-600">
                      <span class="font-600 text-graphite-800">Ceny vstupenek se v CMS nezadávají.</span>
                      Aktuální cena i nákup probíhají v <span class="font-600">Colosseu</span> (napojení nastavíte v záložce
                      <span class="font-600">Místo a Colosseum</span>). Tím nemůže vzniknout rozpor mezi cenou na webu a u pokladny.
                    </p>
                  </div>

                  <div class="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label class="mb-1.5 flex items-center justify-between">
                        <span class="text-[13px] font-600 text-graphite-800">Kontaktní e-mail</span>
                        <span class="field-tag">tour-contact_email</span>
                      </label>
                      <div class="relative">
                        <Icon name="mail" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
                        <input v-model="form.contactEmail" type="text" placeholder="nkp@dolnivitkovice.cz" class="h-10 w-full rounded-md border border-steel-200 pl-9 pr-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <MlFieldHeader label="Poznámka k platbě" :lang="activeLang" tag="tour-payment" @translate="translateField('paymentNote')" />
                      <input v-model="form.paymentNote[activeLang]" type="text" placeholder="Vstupenky lze platit platební kartou." class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <!-- Obsah (jednotný ContentBuilder — nic dalšího pod ním) -->
              <TabsContent value="content" class="outline-none">
                <ContentBuilder v-model="form.contentBlocks" />
              </TabsContent>

              <!-- Místo a Colosseum (místo konání + napojení na Colosseum) -->
              <TabsContent value="colosseum" class="space-y-5 outline-none">
                <FormSection
                  title="Místo konání"
                  icon="map"
                  tag="tour-area_id"
                  hint="Místa = objekty v Areálu. Prohlídka se na webu nabídne v detailu každého vybraného objektu. Můžeš vybrat víc objektů."
                >
                  <RelationPicker
                    v-model="form.areaIds"
                    :items="PLACE_ITEMS"
                    add-label="Přidat objekt"
                    empty-label="Zatím žádný objekt — prohlídka se nenabídne u žádného objektu."
                    search-placeholder="Hledat objekt v areálu…"
                    icon="home"
                    item-route-name="area-edit"
                    create-route-name="area-new"
                    create-label="Založit objekt"
                  />
                </FormSection>

                <FormSection title="Napojení na Colosseum" icon="integration" tag="tour-colosseum_id">
                  <!-- Našeptávač z načtených okruhů (+ volné zadání nenačteného ID) -->
                  <div class="relative">
                    <Icon name="ticket" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
                    <input
                      v-model="form.colosseumId"
                      type="text"
                      placeholder="Hledat načtenou akci nebo zadat ID…"
                      class="h-10 w-full rounded-md border border-steel-200 pl-9 pr-3 font-mono text-[13px] text-graphite-800 placeholder:font-sans placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                      @focus="colOpen = true"
                      @input="colOpen = true"
                      @blur="colOpen = false"
                    />
                    <!-- Návrhy (načtené okruhy z Colossea) -->
                    <div
                      v-if="colOpen && colSuggestions.length"
                      class="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded-md border border-steel-200 bg-white p-1 shadow-xl"
                    >
                      <button
                        v-for="t in colSuggestions"
                        :key="t.id"
                        type="button"
                        class="flex w-full items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left outline-none transition-colors hover:bg-steel-100"
                        :class="form.colosseumId.trim() === t.id && 'bg-brand-50'"
                        @mousedown.prevent="pickColTour(t)"
                      >
                        <span class="min-w-0">
                          <span class="block truncate text-[13px] font-500 text-graphite-800">{{ t.name }}</span>
                          <span class="block font-mono text-[11px] text-steel-400">{{ t.id }}</span>
                        </span>
                        <span class="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-600" :class="t.timed ? 'bg-forge-500/10 text-forge-600' : 'bg-steel-100 text-steel-500'">
                          {{ t.timed ? 'časovaný' : 'nečasovaný' }}
                        </span>
                      </button>
                    </div>
                  </div>

                  <!-- Stav napojení -->
                  <p v-if="colState === 'loaded'" class="mt-1.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-forge-600">
                    <Icon name="check" :size="13" class="mt-0.5 shrink-0" />
                    <span>Napojeno na načtenou akci <span class="font-600">„{{ colTour!.name }}"</span> — termíny a vstupenky se tahají z Colossea.</span>
                  </p>
                  <p v-else-if="colState === 'planned'" class="mt-1.5 flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-2 text-[11.5px] leading-relaxed text-amber-700">
                    <Icon name="help" :size="13" class="mt-0.5 shrink-0" />
                    <span>Toto ID zatím není mezi načtenými akcemi (naplánovaná akce). Až se akce v Colosseu zveřejní, doplní se termíny i vstupenky. <span class="font-600">Dokud tam nebude, na webu nepůjde koupit vstupenky.</span></span>
                  </p>
                  <p v-else class="mt-1.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
                    <Icon name="integration" :size="13" class="mt-0.5 shrink-0" />
                    <span>Vyberte načtenou akci z Colossea — bez napojení se termíny ani vstupenky nenačtou.</span>
                  </p>

                  <!-- Dostupnost & termíny z Colossea (read-only) -->
                  <div class="mt-4 border-t border-steel-100 pt-4">
                    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p class="flex items-center gap-2 text-[13px] font-600 text-graphite-800"><Icon name="calendar" :size="15" class="text-steel-400" /> Nejbližší termíny <span class="field-tag">Colosseum · read-only</span></p>
                      <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600" :class="[AVAILABILITY_META[availability(form)].bg, AVAILABILITY_META[availability(form)].text]">
                        <span class="h-1.5 w-1.5 rounded-full" :class="AVAILABILITY_META[availability(form)].dot" />
                        {{ AVAILABILITY_META[availability(form)].label }}
                      </span>
                    </div>
                    <ul v-if="slots.length" class="space-y-1.5">
                      <li v-for="s in slots" :key="s.id" class="flex items-center justify-between gap-2 rounded-md border border-steel-200 px-3 py-2">
                        <span class="text-[12.5px] font-500 text-graphite-800 tabular-nums">{{ fmtSlot(s.datetime) }}</span>
                        <span
                          class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-600 tabular-nums"
                          :class="remaining(s) === 0 ? 'bg-danger-500/10 text-danger-600' : remaining(s) <= 5 ? 'bg-amber-500/10 text-amber-600' : 'bg-forge-500/10 text-forge-600'"
                        >
                          <span class="h-1.5 w-1.5 rounded-full" :class="remaining(s) === 0 ? 'bg-danger-500' : remaining(s) <= 5 ? 'bg-amber-500' : 'bg-forge-500'" />
                          {{ remaining(s) === 0 ? 'Vyprodáno' : `${remaining(s)} / ${s.capacity} volných` }}
                        </span>
                      </li>
                    </ul>
                    <p v-else class="text-[12px] text-steel-400">Žádné nadcházející termíny z Colossea.</p>
                    <div v-if="slots.length" class="mt-3 flex items-center justify-between rounded-md bg-steel-50 px-3 py-2 text-[12px]">
                      <span class="text-steel-600">Volných míst celkem</span>
                      <span class="font-700 text-graphite-900 tabular-nums">{{ freeSeats(form) }}</span>
                    </div>
                    <p class="mt-2.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
                      <Icon name="integration" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
                      Termíny a volná místa se tahají z Colossea (needitovatelné). Na webu bude u prohlídky tlačítko „Koupit vstupenku" směřující do Colossea.
                    </p>
                  </div>
                </FormSection>
              </TabsContent>

              <!-- Fotogalerie (jednotné napříč moduly — hlavní fotka = cover) -->
              <TabsContent value="gallery" class="outline-none">
                <p class="mb-3 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Hlavní fotka (★) je zároveň náhledovka prohlídky ve výpisu i na kartě.
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">tour-gallery</span>
                </p>
                <GalleryField
                  v-model:galleries="form.galleryIds"
                  v-model:photos="form.photos"
                  link-tag="tour-gallery_ids"
                  photos-tag="tour-photos"
                />
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <PublishCard :published="form.published" :langs="publishRows" updated-by="Jana Svobodová" @toggle-lang="onToggleLang" />
        <BackRefsCard :groups="backRefsForTour(form.id)" entity-label="tuto prohlídku" />
      </aside>
    </div>

    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="toast" class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl"><Icon name="sparkles" :size="16" class="text-brand-400" />{{ toast }}</div>
    </Transition>
  </div>
</template>
