<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import DetailActions from '@/components/admin/DetailActions.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import ContentBuilder from '@/components/admin/ContentBuilder.vue'
import OpeningHoursEditor from '@/components/admin/OpeningHoursEditor.vue'
import TagPicker from '@/components/admin/TagPicker.vue'
import GalleryField from '@/components/admin/GalleryField.vue'
import LangBar from '@/components/admin/LangBar.vue'
import MlFieldHeader from '@/components/admin/MlFieldHeader.vue'
import HelpTip from '@/components/ui/HelpTip.vue'
import VenueSilhouette from '@/components/ui/VenueSilhouette.vue'
import { sanitizeSvg } from '@/data/venueSilhouettes'
import SlugField from '@/components/admin/SlugField.vue'
import { useAutoSlug } from '@/utils/useAutoSlug'
import { useMlTranslate } from '@/utils/useMlTranslate'
import { LANGS } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  MOCK_VENUES,
  PREDEFINED_AREA_TAGS,
  OPEN_STATE_OPTIONS,
  OPEN_STATE_META,
  blankVenue,
  type AreaObject,
} from '@/data/mockVenues'
import {
  filledLangsOf,
  publishedLangsOf,
  publishLangRows,
  toggleLangPublish,
} from '@/utils/langPublish'
import { galleriesForVenue } from '@/data/mockGalleries'
import BackRefsCard from '@/components/admin/BackRefsCard.vue'
import { backRefsForArea } from '@/data/backrefs'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_VENUES.find((v) => v.id === props.id))
function clone(): AreaObject {
  const s = source.value
  if (s) {
    const c = JSON.parse(JSON.stringify(s)) as AreaObject
    // Předvyplnění z existující vazby (Gallery.areaId) — nově editovatelné přímo tady.
    c.galleryIds = c.galleryIds ?? galleriesForVenue(c.id).map((g) => g.id)
    // Zhmotnit fallback do explicitního seznamu, aby šlo přepínat.
    c.publishedLangs = publishedLangsOf(filledLangsOf(c.title), c.publishedLangs)
    return c
  }
  return blankVenue()
}
const form = reactive<AreaObject>(clone())
const activeLang = ref<LangCode>('cs')
function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
}
const filledLangs = computed(() => LANGS.filter((l) => langFilled(l.code)).map((l) => l.code))

/* ---------- Publikování per jazyk ----------
   Stav publikace (PublishCard) řídí, KDY je objekt živý; tyto přepínače
   řídí, KTERÉ mutace se na webu zobrazí. Prázdnou mutaci nelze zveřejnit. */
const liveLangs = computed(() => publishedLangsOf(filledLangsOf(form.title), form.publishedLangs))
const publishRows = computed(() => publishLangRows(form.title, form.publishedLangs))
function onToggleLang(code: LangCode) {
  form.publishedLangs = toggleLangPublish(form.publishedLangs, filledLangsOf(form.title), code)
}

/* ---------- Sekce (podtržené záložky) ----------
   Fixní záložky budovy + individuální záložky přidružených stránek (per budova).
   Přidružené stránky (form.pageTabs) se přidají za fixní záložky pod svými názvy. */
const activeSection = ref('basic')
/** První záložka se jmenuje podle názvu budovy (kopíruje hlavní záložku na FE webu). */
const basicTabLabel = computed(() => form.title.cs.trim() || 'Základní informace')
const baseSections = computed(() => [
  { value: 'basic', label: basicTabLabel.value, icon: 'page' },
  { value: 'gallery', label: 'Galerie', icon: 'gallery' },
])
/** Individuální záložky přidružených stránek (kopírují záložky na FE webu; obsah = ContentBuilder). */
const pageTabs = computed(() => form.pageTabs ?? [])

/* ---------- Silueta objektu (nahrání vlastního SVG) ---------- */
const svgInput = ref<HTMLInputElement | null>(null)
const svgError = ref('')
function onSilhouetteFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // reset, aby šlo nahrát stejný soubor znovu
  if (!file) return
  svgError.value = ''
  const isSvg = /svg/i.test(file.type) || file.name.toLowerCase().endsWith('.svg')
  if (!isSvg) {
    svgError.value = 'Nahraj prosím soubor ve formátu SVG.'
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const clean = sanitizeSvg(String(reader.result ?? ''))
    if (!clean) {
      svgError.value = 'Soubor se nepodařilo načíst jako platné SVG.'
      return
    }
    form.silhouetteSvg = clean
  }
  reader.onerror = () => (svgError.value = 'Soubor se nepodařilo přečíst.')
  reader.readAsText(file)
}
function clearSilhouette() {
  form.silhouetteSvg = ''
  svgError.value = ''
}

/* ---------- Zajímavá čísla ---------- */
let statSeq = 0
function addStat() {
  statSeq += 1
  form.stats.push({ id: `stat-new-${statSeq}`, value: '', label: '' })
}
function removeStat(i: number) {
  form.stats.splice(i, 1)
}

/* ---------- Hlavní obrázek (náhledovka) = cover z galerie ----------
   Galerie (form.photos) je jediný zdroj fotek. Hlavní obrázek je fotka
   označená hvězdou (isMain, resp. 1. pozice) — nenahrává se zvlášť.
   form.image drží denormalizovaný odkaz pro výpisy/karty mimo tento formulář. */
const coverImage = computed(() => form.photos.find((p) => p.isMain) ?? form.photos[0] ?? null)
watch(coverImage, (c) => { form.image = c?.src ?? '' }, { immediate: true })


/* ---------- URL slug (sdílené řešení jako Aktuality) ----------
   Auto z názvu objektu, dokud ho klient neupraví ručně. */
const emptyML = (): ML => ({ cs: '', en: '', de: '', pl: '' })
const slugText = computed({
  get: () => form.slug?.[activeLang.value] ?? '',
  set: (v: string) => {
    if (!form.slug) form.slug = emptyML()
    form.slug[activeLang.value] = v
  },
})
const { markManual } = useAutoSlug(() => form.title, () => (form.slug ??= emptyML()))

/* ---------- AI překlad mutací (prototyp) — sdílené řešení ---------- */
const mlFields: (keyof AreaObject)[] = ['title', 'summary', 'statusNote']
const { translating, toast, translateLang, translateField } = useMlTranslate(form, mlFields)

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}
function saveBack() {
  save()
  router.push({ name: 'area-list' })
}
function onDuplicate() {
  router.push({ name: 'area-new' })
}
</script>

<template>
  <div class="pb-16">
    <!-- Sticky header -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button
          class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800"
          @click="router.push({ name: 'area-list' })"
        >
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">area</span>
            <span class="font-mono text-[11px] text-steel-400">{{ isEdit ? `/admin/area/${form.id}` : '/admin/area/new' }}</span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.title.cs || 'Bez názvu' : 'Nový objekt v areálu' }}
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
          entity="objekt"
          :is-edit="isEdit"
          :saved="saved"
          @save="save"
          @save-back="saveBack"
          @duplicate="onDuplicate"
          @delete="router.push({ name: 'area-list' })"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <!-- LEVÝ sloupec: sekce -->
      <div class="min-w-0">
        <div class="rounded-lg border border-steel-200 bg-white">
          <TabsRoot v-model="activeSection">
            <TabsList class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2" aria-label="Sekce objektu">
              <!-- Fixní záložky budovy -->
              <TabsTrigger
                v-for="s in baseSections"
                :key="s.value"
                :value="s.value"
                class="-mb-px inline-flex shrink-0 items-center gap-2 rounded-t-md border-b-2 border-transparent px-4 py-2.5 text-[13px] font-600 text-steel-500 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-800 data-[state=active]:border-brand-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700"
              >
                <Icon :name="s.icon" :size="16" />
                {{ s.label }}
              </TabsTrigger>
              <!-- Individuální záložky přidružených stránek (per budova) -->
              <TabsTrigger
                v-for="(p, i) in pageTabs"
                :key="`pgtab-${i}`"
                :value="`pgtab-${i}`"
                class="-mb-px inline-flex shrink-0 items-center gap-2 rounded-t-md border-b-2 border-transparent px-4 py-2.5 text-[13px] font-600 text-steel-500 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-800 data-[state=active]:border-brand-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700"
              >
                <Icon name="text" :size="16" />
                {{ p.label }}
              </TabsTrigger>
            </TabsList>

            <div class="p-5">
              <!-- Sekce: Základní informace -->
              <TabsContent value="basic" class="space-y-5 outline-none">
                <!-- Základní údaje -->
                <FormSection title="Základní údaje">
                  <div class="space-y-4">
                    <div>
                      <MlFieldHeader label="Název objektu" :lang="activeLang" tag="area-title" required @translate="translateField('title')" />
                      <input
                        v-model="form.title[activeLang]"
                        type="text"
                        placeholder="Např. Malý svět techniky U6"
                        class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <SlugField
                      v-model="slugText"
                      :tag="`area-url · ${activeLang.toUpperCase()}`"
                      @edit="markManual(activeLang)"
                    />

                    <div>
                      <MlFieldHeader label="Krátký popis (perex)" :lang="activeLang" tag="area-summary" @translate="translateField('summary')" />
                      <textarea
                        v-model="form.summary[activeLang]"
                        rows="3"
                        placeholder="Stručná charakteristika objektu do výpisu a náhledů"
                        class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div class="flex items-center justify-between rounded-md border border-steel-200 px-3 py-2.5">
                      <AppSwitch v-model="form.accessible" label="Bezbariérový přístup" aria-label="Bezbariérový přístup" />
                      <span class="field-tag">area-accessible</span>
                    </div>
                  </div>
                </FormSection>

                <!-- Silueta objektu (vlastní nahrané SVG) -->
                <FormSection
                  title="Silueta objektu"
                  hint="Vlastní SVG silueta budovy — propisuje se do kalendáře a všude, kde se objekt vybírá (např. místo konání akce). Obarví se barvou objektu."
                  tag="area-silhouette"
                >
                  <div class="flex items-center gap-4">
                    <span class="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-steel-200 bg-steel-50">
                      <VenueSilhouette :svg="form.silhouetteSvg" :venue-id="form.silhouette" :color="form.color || '#64748b'" :size="52" />
                    </span>
                    <div class="min-w-0 flex-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          class="inline-flex items-center gap-2 rounded-md border border-dashed border-steel-300 px-3.5 py-2 text-[13px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"
                          @click="svgInput?.click()"
                        >
                          <Icon name="upload" :size="16" /> {{ form.silhouetteSvg ? 'Nahradit SVG' : 'Nahrát SVG siluetu' }}
                        </button>
                        <button
                          v-if="form.silhouetteSvg"
                          type="button"
                          class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-[12.5px] font-500 text-steel-500 transition-colors hover:bg-danger-500/10 hover:text-danger-600"
                          @click="clearSilhouette"
                        >
                          <Icon name="trash" :size="14" /> Odebrat
                        </button>
                        <input ref="svgInput" type="file" accept=".svg,image/svg+xml" class="hidden" @change="onSilhouetteFile" />
                      </div>
                      <p class="mt-1.5 text-[11.5px] leading-relaxed text-steel-500">
                        Nejlépe funguje jednobarevná silueta / obrys (SVG) — obarví se barvou objektu. Bez vlastního SVG se použije výchozí tvar.
                      </p>
                      <p v-if="svgError" class="mt-1 text-[11.5px] font-500 text-danger-600">{{ svgError }}</p>
                    </div>
                  </div>
                </FormSection>

                <!-- Zajímavá čísla (statistiky budovy) -->
                <FormSection title="Zajímavá čísla" tag="area-stats">
                  <div v-if="form.stats.length" class="space-y-2">
                    <div v-for="(s, i) in form.stats" :key="s.id" class="flex items-center gap-2">
                      <input
                        v-model="s.value"
                        type="text"
                        placeholder="900 m²"
                        class="h-10 w-32 shrink-0 rounded-md border border-steel-200 px-3 text-[14px] font-700 text-graphite-900 placeholder:font-400 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                      />
                      <input
                        v-model="s.label"
                        type="text"
                        placeholder="rozloha expozice"
                        class="h-10 flex-1 rounded-md border border-steel-200 px-3 text-[13.5px] text-graphite-700 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        class="grid h-9 w-9 shrink-0 place-items-center rounded-md text-steel-400 transition-colors hover:bg-danger-500/10 hover:text-danger-600"
                        aria-label="Odebrat číslo"
                        @click="removeStat(i)"
                      >
                        <Icon name="trash" :size="15" />
                      </button>
                    </div>
                  </div>
                  <p v-else class="text-[12px] text-steel-400">Zatím žádná čísla. Přidejte např. výšku, rok stavby, rozlohu.</p>
                  <button
                    type="button"
                    class="mt-2.5 inline-flex items-center gap-1.5 rounded-md border border-dashed border-steel-300 px-3 py-1.5 text-[12.5px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"
                    @click="addStat"
                  >
                    <Icon name="plus" :size="15" /> Přidat číslo
                  </button>
                </FormSection>

                <!-- Provozní stav -->
                <FormSection title="Provozní stav" hint="Nadřazený otevírací době — řídí, co se zobrazí na webu." tag="area-open_state">
                  <div class="flex flex-wrap items-center gap-3">
                    <AppSelect v-model="form.openState" :options="OPEN_STATE_OPTIONS" class="w-44" />
                    <span
                      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600"
                      :class="[OPEN_STATE_META[form.openState].bg, OPEN_STATE_META[form.openState].text]"
                    >
                      <span class="h-1.5 w-1.5 rounded-full" :class="OPEN_STATE_META[form.openState].dot" />
                      {{ OPEN_STATE_META[form.openState].label }}
                    </span>
                    <HelpTip>
                      <span v-if="form.openState === 'open'">Na webu se otevřeno/zavřeno řídí otevírací dobou níže.</span>
                      <span v-else-if="form.openState === 'seasonal'">Sezónní provoz — otevírací doba platí v sezóně; mimo sezónu je objekt zavřený. Upřesněte v poznámce.</span>
                      <span v-else>Dočasně uzavřeno — na webu se objekt zobrazí jako zavřený bez ohledu na otevírací dobu. Doplňte poznámku (např. rekonstrukce).</span>
                    </HelpTip>
                  </div>

                  <!-- Poznámka k provozu (na web, ML) -->
                  <div class="mt-4">
                    <MlFieldHeader label="Poznámka k provozu (na web)" :lang="activeLang" tag="area-status_note" hint="Zobrazí se na webu u objektu (nepovinné). Vhodné hlavně při dočasném uzavření nebo sezónním provozu." @translate="translateField('statusNote')" />
                    <textarea
                      v-model="form.statusNote[activeLang]"
                      rows="2"
                      placeholder="Např. Zavřeno kvůli rekonstrukci do jara 2027."
                      class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </FormSection>

                <!-- Otevírací doba — neuplatní se, když je objekt uzavřený -->
                <FormSection title="Otevírací doba" tag="area-opening_hours">
                  <div v-if="form.openState === 'closed'" class="rounded-md border border-danger-500/25 bg-danger-500/5 px-3 py-2.5">
                    <p class="text-[12px] leading-relaxed text-danger-600">
                      Objekt je označen jako <strong>dočasně uzavřený</strong> — otevírací doba se na webu neuplatní. Provoz obnovíte přepnutím stavu výše.
                    </p>
                  </div>
                  <template v-else>
                    <div class="flex items-center justify-between rounded-md bg-steel-50 px-3 py-2.5">
                      <AppSwitch v-model="form.showOpeningHours" label="Zobrazovat otevírací dobu na webu" aria-label="Zobrazovat otevírací dobu" />
                      <span class="field-tag">area-show_hours</span>
                    </div>
                    <OpeningHoursEditor v-if="form.showOpeningHours" v-model="form.openingHours" class="mt-3" />
                    <p v-else class="mt-3 text-[12.5px] text-steel-400">Otevírací doba se na webu objektu nezobrazí.</p>
                  </template>
                </FormSection>

                <!-- Zařazení a vazby (bez ikony, konzistentní karta) -->
                <BackRefsCard title="Zařazení a vazby" icon="" :groups="backRefsForArea(form.id)" entity-label="tento objekt" />
              </TabsContent>

              <!-- Sekce: Galerie -->
              <TabsContent value="gallery" class="space-y-5 outline-none">
                <!-- Hlavní obrázek (náhledovka) = cover odvozený z galerie níže -->
                <div class="flex items-center gap-4 rounded-lg border border-steel-200 bg-steel-50/50 p-4">
                  <span class="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-steel-100">
                    <img v-if="coverImage" :src="coverImage.src" :alt="coverImage.alt" class="h-full w-full object-cover" />
                    <span v-else class="grid h-full w-full place-items-center text-steel-400"><Icon name="image" :size="22" /></span>
                    <span v-if="coverImage" class="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded bg-graphite-900/80 px-1.5 py-0.5 text-[10px] font-700 text-white">
                      <Icon name="star" :size="11" class="text-brand-400" /> Hlavní
                    </span>
                  </span>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="flex items-center gap-1.5 text-[13px] font-600 text-graphite-800">
                        Hlavní obrázek (náhledovka)
                        <HelpTip text="Náhledovka se bere z galerie níže — hlavní je fotka označená ★ (1. pozice). Pořadí a hlavní fotku nastavíš přetažením nebo tlačítkem „topovat nahoru“. Nenahrává se zvlášť." />
                      </span>
                      <span class="field-tag">area-image</span>
                    </div>
                  </div>
                </div>

                <GalleryField
                  v-model:galleries="form.galleryIds"
                  v-model:photos="form.photos"
                  link-tag="gallery-area_id"
                  photos-tag="area-photos"
                />
              </TabsContent>

              <!-- Sekce: Přidružené záložky budovy (kopírují FE web) — obsah přes ContentBuilder -->
              <TabsContent
                v-for="(p, i) in pageTabs"
                :key="`pgtabc-${i}`"
                :value="`pgtab-${i}`"
                class="outline-none"
              >
                <ContentBuilder v-model="p.contentBlocks" />
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <PublishCard
          :published="form.published"
          :langs="publishRows"
          updated-by="Jan Voznak"
          @toggle-lang="onToggleLang"
        />

        <!-- Štítky (sdílený TagPicker jako Aktuality) -->
        <FormSection title="Štítky" icon="filter" tag="area-tags">
          <TagPicker v-model="form.tags" :options="PREDEFINED_AREA_TAGS" />
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
