<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CardActionsMenu from '@/components/admin/CardActionsMenu.vue'
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
import { useMlTranslate } from '@/utils/useMlTranslate'
import { LANGS } from '@/data/types'
import type { LangCode } from '@/data/types'
import {
  MOCK_VENUES,
  PREDEFINED_AREA_TAGS,
  OPEN_STATE_OPTIONS,
  OPEN_STATE_META,
  blankVenue,
  type AreaObject,
} from '@/data/mockVenues'
import { galleriesForVenue } from '@/data/mockGalleries'
import { toursForVenue, availability, AVAILABILITY_META, category } from '@/data/mockTours'

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

/* ---------- Sekce (podtržené záložky) ---------- */
const activeSection = ref('basic')
const sections = [
  { value: 'basic', label: 'Základní informace', icon: 'page' },
  { value: 'content', label: 'Obsah', icon: 'text' },
  { value: 'tours', label: 'Prohlídky', icon: 'ticket' },
  { value: 'gallery', label: 'Galerie', icon: 'gallery' },
  { value: 'hours', label: 'Provoz a otevírací doba', icon: 'clock' },
]

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
function goToGallery() {
  activeSection.value = 'gallery'
}

/* ---------- Nabízené prohlídky = odvozené z místa konání (read-only) ----------
   Jediný zdroj pravdy je `tour.areaId` (nastavuje se v modulu Prohlídky).
   Areál nabízené prohlídky needituje, jen zrcadlí — žádná dvojí správa. */
const venueTours = computed(() => toursForVenue(form.id))
function goToTour(id: string) {
  router.push({ name: 'tour-edit', params: { id } })
}


/* ---------- AI překlad mutací (prototyp) — sdílené řešení ---------- */
const mlFields: (keyof AreaObject)[] = ['title', 'summary', 'statusNote']
const { translating, toast, translateLang, translateField } = useMlTranslate(form, mlFields)

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
          :translating="translating"
          class="hidden lg:block"
          @translate="translateLang"
        />

        <div class="h-6 w-px bg-steel-200" />
        <CardActionsMenu
          v-if="isEdit"
          :name="form.title.cs"
          entity="objekt"
          @delete="router.push({ name: 'area-list' })"
        />
        <AppButton variant="secondary" @click="router.push({ name: 'area-list' })">Zrušit</AppButton>
        <AppButton variant="primary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit objekt' }}
        </AppButton>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <!-- LEVÝ sloupec: sekce -->
      <div class="min-w-0">
        <div class="rounded-lg border border-steel-200 bg-white">
          <TabsRoot v-model="activeSection">
            <TabsList class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2" aria-label="Sekce objektu">
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
                  <MlFieldHeader label="Název objektu" :lang="activeLang" tag="area-title" required @translate="translateField('title')" />
                  <input
                    v-model="form.title[activeLang]"
                    type="text"
                    placeholder="Např. Malý svět techniky U6"
                    class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>

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

                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Hlavní obrázek (náhledovka)</span>
                    <span class="field-tag">area-image</span>
                  </label>
                  <div class="flex items-center gap-4">
                    <span class="relative h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-steel-100">
                      <img v-if="coverImage" :src="coverImage.src" :alt="coverImage.alt" class="h-full w-full object-cover" />
                      <span v-else class="grid h-full w-full place-items-center text-steel-400"><Icon name="image" :size="22" /></span>
                      <span v-if="coverImage" class="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded bg-graphite-900/80 px-1.5 py-0.5 text-[10px] font-700 text-white">
                        <Icon name="star" :size="11" class="text-brand-400" /> Hlavní
                      </span>
                    </span>
                    <div class="min-w-0">
                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-md border border-steel-300 px-3.5 py-2.5 text-[13px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600"
                        @click="goToGallery"
                      >
                        <Icon name="gallery" :size="16" /> {{ coverImage ? 'Změnit v galerii' : 'Přidat fotky do galerie' }}
                      </button>
                      <p class="mt-1.5 text-[11.5px] leading-relaxed text-steel-500">
                        Náhledovka se bere z <button type="button" class="font-600 text-brand-600 hover:underline" @click="goToGallery">galerie</button> — hlavní je fotka označená ★ (1. pozice). Nenahrává se zvlášť.
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Zajímavá čísla (statistiky budovy) -->
                <div>
                  <div class="mb-2 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Zajímavá čísla</span>
                    <span class="field-tag">area-stats</span>
                  </div>
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
                </div>
              </TabsContent>

              <!-- Sekce: Obsah (jednotný ContentBuilder — nic dalšího pod ním) -->
              <TabsContent value="content" class="outline-none">
                <ContentBuilder v-model="form.contentBlocks" />
              </TabsContent>

              <!-- Sekce: Prohlídky (nabízené prohlídky — odvozené, read-only) -->
              <TabsContent value="tours" class="outline-none">
                <div class="mb-1.5 flex items-center justify-between">
                  <span class="text-[13px] font-600 text-graphite-800">Nabízené prohlídky</span>
                  <span class="field-tag">tour-area_id</span>
                </div>
                <p class="mb-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-steel-500">
                  <Icon name="ticket" :size="13" class="mt-0.5 shrink-0 text-steel-400" />
                  Odvozeno automaticky — jsou to prohlídky, které mají tento objekt jako
                  <span class="font-600 text-graphite-700">místo konání</span>. Nastavuje se v modulu
                  <span class="font-600 text-graphite-700">Prohlídky</span> (detail prohlídky → „Místo konání"), tady se jen zrcadlí.
                </p>
                <ul v-if="venueTours.length" class="grid gap-2 sm:grid-cols-2">
                  <li
                    v-for="t in venueTours"
                    :key="t.id"
                    class="group flex cursor-pointer items-center gap-2.5 rounded-lg border border-steel-200 bg-white px-2.5 py-2 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                    @click="goToTour(t.id)"
                  >
                    <span class="grid h-9 w-12 shrink-0 place-items-center overflow-hidden rounded bg-steel-100 text-steel-400">
                      <img v-if="t.image" :src="t.image" alt="" class="h-full w-full object-cover" />
                      <Icon v-else name="ticket" :size="14" />
                    </span>
                    <span class="min-w-0 flex-1">
                      <span class="block truncate text-[13px] font-600 text-graphite-800">{{ t.title.cs }}</span>
                      <span class="block truncate text-[11px] text-steel-400">{{ category(t.categoryId)?.name.cs }}</span>
                    </span>
                    <span
                      class="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-600"
                      :class="[AVAILABILITY_META[availability(t)].bg, AVAILABILITY_META[availability(t)].text]"
                    >
                      <span class="h-1.5 w-1.5 rounded-full" :class="AVAILABILITY_META[availability(t)].dot" />
                      {{ AVAILABILITY_META[availability(t)].label }}
                    </span>
                    <Icon name="chevronRight" :size="15" class="shrink-0 text-steel-300 transition-colors group-hover:text-brand-500" />
                  </li>
                </ul>
                <p v-else class="rounded-md bg-steel-50 px-3 py-4 text-center text-[12.5px] text-steel-500">
                  U tohoto objektu zatím není žádná prohlídka. Přidáš ji v modulu Prohlídky nastavením „Místo konání" na tento objekt.
                </p>
                <p class="mt-3 flex items-start gap-1.5 rounded-md bg-steel-50 px-3 py-2 text-[11.5px] leading-relaxed text-steel-500">
                  <Icon name="ticket" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
                  <span><strong class="font-600 text-graphite-700">Prodej vstupenek</strong> se řídí přes napojení jednotlivých prohlídek na Colosseum (ID se zadává u prohlídky, ne zde).</span>
                </p>
              </TabsContent>

              <!-- Sekce: Galerie -->
              <TabsContent value="gallery" class="outline-none">
                <GalleryField
                  v-model:galleries="form.galleryIds"
                  v-model:photos="form.photos"
                  link-tag="gallery-area_id"
                  photos-tag="area-photos"
                />
              </TabsContent>

              <!-- Sekce: Provoz a otevírací doba (sjednoceno) -->
              <TabsContent value="hours" class="space-y-4 outline-none">
                <!-- Provozní stav — nadřazený otevírací době -->
                <FormSection title="Provozní stav" icon="clock" hint="Nadřazený otevírací době — řídí, co se zobrazí na webu." tag="area-open_state">
                  <div class="flex flex-wrap items-center gap-3">
                    <AppSelect v-model="form.openState" :options="OPEN_STATE_OPTIONS" class="w-44" />
                    <span
                      class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600"
                      :class="[OPEN_STATE_META[form.openState].bg, OPEN_STATE_META[form.openState].text]"
                    >
                      <span class="h-1.5 w-1.5 rounded-full" :class="OPEN_STATE_META[form.openState].dot" />
                      {{ OPEN_STATE_META[form.openState].label }}
                    </span>
                  </div>
                  <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
                    <Icon name="integration" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
                    <span v-if="form.openState === 'open'">Na webu se otevřeno/zavřeno řídí otevírací dobou níže.</span>
                    <span v-else-if="form.openState === 'seasonal'">Sezónní provoz — otevírací doba platí v sezóně; mimo sezónu je objekt zavřený. Upřesněte v poznámce.</span>
                    <span v-else>Dočasně uzavřeno — na webu se objekt zobrazí jako zavřený bez ohledu na otevírací dobu. Doplňte poznámku (např. rekonstrukce).</span>
                  </p>

                  <!-- Poznámka k provozu (na web, ML) -->
                  <div class="mt-4">
                    <MlFieldHeader label="Poznámka k provozu (na web)" :lang="activeLang" tag="area-status_note" @translate="translateField('statusNote')" />
                    <textarea
                      v-model="form.statusNote[activeLang]"
                      rows="2"
                      placeholder="Např. Zavřeno kvůli rekonstrukci do jara 2027."
                      class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                    />
                    <p class="mt-1 text-[11.5px] text-steel-500">Zobrazí se na webu u objektu (nepovinné). Vhodné hlavně při dočasném uzavření nebo sezónním provozu.</p>
                  </div>
                </FormSection>

                <!-- Otevírací doba — neuplatní se, když je objekt uzavřený -->
                <FormSection title="Otevírací doba" icon="clock" tag="area-opening_hours">
                  <div v-if="form.openState === 'closed'" class="rounded-md border border-danger-500/25 bg-danger-500/5 px-3 py-2.5">
                    <p class="flex items-start gap-1.5 text-[12px] leading-relaxed text-danger-600">
                      <Icon name="clock" :size="14" class="mt-0.5 shrink-0" />
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
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <PublishCard :published="form.published" updated-by="Jan Voznak" />

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
