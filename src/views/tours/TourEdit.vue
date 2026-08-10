<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CardActionsMenu from '@/components/admin/CardActionsMenu.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import AiPanel from '@/components/admin/AiPanel.vue'
import ContentBuilder from '@/components/admin/ContentBuilder.vue'
import LangBar from '@/components/admin/LangBar.vue'
import MlFieldHeader from '@/components/admin/MlFieldHeader.vue'
import { useMlTranslate } from '@/utils/useMlTranslate'
import { LANGS, SOURCE_LANG, defaultContentBlocks } from '@/data/types'
import type { LangCode } from '@/data/types'
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
  type Tour,
  type PriceTier,
  type TourHighlight,
} from '@/data/mockTours'
import { PLACE_OPTIONS } from '@/data/mockVenues'

const props = defineProps<{ id?: string }>()
const router = useRouter()
const route = useRoute()

/** Místo konání = objekt v Areálu (nepovinné → sentinel + proxy na ''). */
const AREA_NONE = '__none__'
const placeOptions = [{ value: AREA_NONE, label: '— neurčeno' }, ...PLACE_OPTIONS]

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_TOURS.find((t) => t.id === props.id))
function clone(): Tour {
  const s = source.value
  const c = s
    ? (JSON.parse(JSON.stringify(s)) as Tour)
    : blankTour(typeof route.query.category === 'string' ? route.query.category : 'cat-dov')
  c.contentBlocks = c.contentBlocks ?? defaultContentBlocks()
  return c
}
const form = reactive<Tour>(clone())
const activeLang = ref<LangCode>('cs')
function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
}
const filledLangs = computed(() => LANGS.filter((l) => langFilled(l.code)).map((l) => l.code))

/* ---------- Sekce ---------- */
const activeSection = ref('basic')
const sections = [
  { value: 'basic', label: 'Základní informace', icon: 'page' },
  { value: 'content', label: 'Obsah', icon: 'text' },
  { value: 'pricing', label: 'Ceník a kontakt', icon: 'ticket' },
  { value: 'colosseum', label: 'Dostupnost a Colosseum', icon: 'integration' },
  { value: 'media', label: 'Obrázek', icon: 'image' },
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

/* ---------- Ceník (price tiers) ---------- */
let ptSeq = 0
function addTier() {
  ptSeq += 1
  form.priceTiers.push({ id: `pt-new-${ptSeq}`, label: '', price: '', note: '' })
}
function removeTier(i: number) {
  form.priceTiers.splice(i, 1)
}

/* ---------- Místo konání (objekt v Areálu) ---------- */
const areaModel = computed<string>({
  get: () => form.areaId || AREA_NONE,
  set: (v) => {
    form.areaId = v === AREA_NONE ? '' : v
  },
})

/* ---------- Colosseum (read-only) ---------- */
const slots = computed(() => upcomingSlots(form))

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
          :translating="translating"
          class="hidden lg:block"
          @translate="translateLang"
        />
        <div class="h-6 w-px bg-steel-200" />
        <CardActionsMenu
          v-if="isEdit"
          :name="form.title.cs"
          entity="prohlídku"
          @delete="backToCategory()"
        />
        <AppButton variant="secondary" @click="backToCategory">Zrušit</AppButton>
        <AppButton variant="primary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit prohlídku' }}
        </AppButton>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <!-- LEVÝ sloupec -->
      <div class="min-w-0 space-y-5">
        <!-- AI blok -->
        <AiPanel title="Popsat prohlídku s AI" hint="Ze stručného zadání připraví AI popis, odrážky a časy.">
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
              </TabsContent>

              <!-- Obsah (jednotný ContentBuilder — nic dalšího pod ním) -->
              <TabsContent value="content" class="outline-none">
                <ContentBuilder v-model="form.contentBlocks" />
              </TabsContent>

              <!-- Ceník a kontakt -->
              <TabsContent value="pricing" class="space-y-5 outline-none">
                <div>
                  <div class="mb-2 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Ceník</span>
                    <span class="field-tag">tour-price_tiers</span>
                  </div>
                  <div v-if="form.priceTiers.length" class="space-y-2">
                    <div v-for="(p, i) in form.priceTiers" :key="p.id" class="flex items-center gap-2">
                      <input v-model="p.label" type="text" placeholder="Dospělí" class="h-10 w-40 shrink-0 rounded-md border border-steel-200 px-3 text-[13.5px] font-600 text-graphite-900 placeholder:font-400 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                      <input v-model="p.price" type="text" placeholder="295 Kč" class="h-10 w-24 shrink-0 rounded-md border border-steel-200 px-3 text-[13.5px] font-700 text-graphite-900 placeholder:font-400 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                      <input v-model="p.note" type="text" placeholder="poznámka (nepovinné)" class="h-10 flex-1 rounded-md border border-steel-200 px-3 text-[12.5px] text-steel-600 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                      <button type="button" class="grid h-9 w-9 shrink-0 place-items-center rounded-md text-steel-400 transition-colors hover:bg-danger-500/10 hover:text-danger-600" aria-label="Odebrat" @click="removeTier(i)"><Icon name="trash" :size="15" /></button>
                    </div>
                  </div>
                  <p v-else class="text-[12px] text-steel-400">Zatím žádné ceny. Přidejte hladiny (Dospělí, Snížené, Rodinné…).</p>
                  <button type="button" class="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-1.5 text-[12.5px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600" @click="addTier"><Icon name="plus" :size="15" /> Přidat cenu</button>
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
              </TabsContent>

              <!-- Dostupnost a Colosseum (dříve v pravém railu) -->
              <TabsContent value="colosseum" class="space-y-5 outline-none">
                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="rounded-md bg-steel-50 px-3 py-2.5">
                    <p class="field-tag mb-1">Dostupnost</p>
                    <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600" :class="[AVAILABILITY_META[availability(form)].bg, AVAILABILITY_META[availability(form)].text]">
                      <span class="h-1.5 w-1.5 rounded-full" :class="AVAILABILITY_META[availability(form)].dot" />
                      {{ AVAILABILITY_META[availability(form)].label }}
                    </span>
                  </div>
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Kategorie</span>
                      <span class="field-tag">tour-category_id</span>
                    </label>
                    <AppSelect v-model="form.categoryId" :options="CATEGORY_OPTIONS" />
                  </div>
                </div>

                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Místo konání — objekt v areálu</span>
                    <span class="field-tag">tour-area_id</span>
                  </label>
                  <AppSelect v-model="areaModel" :options="placeOptions" />
                  <p class="mt-1 text-[11.5px] text-steel-500">Kde prohlídka reálně začíná. Propíše se do detailu objektu na webu (nabízené prohlídky).</p>
                </div>

                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Propojení Colosseum (ID)</span>
                    <span class="field-tag">tour-colosseum_id</span>
                  </label>
                  <div class="relative">
                    <Icon name="ticket" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
                    <input v-model="form.colosseumId" type="text" placeholder="Unikátní ID prohlídky" class="h-10 w-full rounded-md border border-steel-200 pl-9 pr-3 font-mono text-[13px] text-graphite-800 placeholder:font-sans placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                  </div>
                  <p class="mt-1.5 flex items-start gap-1.5 text-[11.5px] leading-relaxed" :class="form.colosseumId ? 'text-forge-600' : 'text-steel-500'">
                    <Icon :name="form.colosseumId ? 'check' : 'integration'" :size="13" class="mt-0.5 shrink-0" />
                    <span v-if="form.colosseumId">Napojeno — termíny a vstupenky se tahají z Colossea.</span>
                    <span v-else>Bez ID se termíny ani vstupenky z Colossea nenačtou.</span>
                  </p>
                </div>

                <!-- Termíny z Colossea (read-only) -->
                <div class="rounded-md border border-steel-200 p-4">
                  <p class="mb-2 flex items-center gap-2 text-[13px] font-600 text-graphite-800"><Icon name="calendar" :size="15" class="text-steel-400" /> Nejbližší termíny <span class="field-tag">Colosseum · read-only</span></p>
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
              </TabsContent>

              <!-- Obrázek -->
              <TabsContent value="media" class="outline-none">
                <p class="mb-3 text-[12.5px] text-steel-500">Hlavní vizuál prohlídky (výpis i detail).</p>
                <div class="flex items-center gap-4">
                  <span class="h-28 w-44 shrink-0 overflow-hidden rounded-lg bg-steel-100">
                    <img v-if="form.image" :src="form.image" alt="" class="h-full w-full object-cover" />
                    <span v-else class="grid h-full w-full place-items-center text-steel-400"><Icon name="image" :size="24" /></span>
                  </span>
                  <div class="space-y-2">
                    <button class="inline-flex items-center gap-2 rounded-md border border-dashed border-steel-300 px-3.5 py-2.5 text-[13px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"><Icon name="upload" :size="16" /> Nahrát obrázek</button>
                    <button v-if="form.image" class="block text-[12px] font-500 text-danger-500 hover:text-danger-600" @click="form.image = ''">Odebrat obrázek</button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <PublishCard :published="form.published" updated-by="Jana Svobodová" />
      </aside>
    </div>

    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="toast" class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl"><Icon name="sparkles" :size="16" class="text-brand-400" />{{ toast }}</div>
    </Transition>
  </div>
</template>
