<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import ContentBuilder from '@/components/admin/ContentBuilder.vue'
import OpeningHoursEditor from '@/components/admin/OpeningHoursEditor.vue'
import TagPicker from '@/components/admin/TagPicker.vue'
import RelationPicker, { type RelItem } from '@/components/admin/RelationPicker.vue'
import GalleryManager from '@/components/admin/GalleryManager.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  MOCK_VENUES,
  PREDEFINED_AREA_TAGS,
  OPEN_STATE_OPTIONS,
  blankVenue,
  type AreaObject,
} from '@/data/mockVenues'
import { galleriesForVenue, galleryCover, galleryCount } from '@/data/mockGalleries'
import { tourOptionsList } from '@/data/mockTours'

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_VENUES.find((v) => v.id === props.id))
function clone(): AreaObject {
  const s = source.value
  return s ? JSON.parse(JSON.stringify(s)) : blankVenue()
}
const form = reactive<AreaObject>(clone())
const activeLang = ref<LangCode>('cs')
function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
}

/* ---------- Sekce (podtržené záložky) ---------- */
const activeSection = ref('basic')
const sections = [
  { value: 'basic', label: 'Základní informace', icon: 'page' },
  { value: 'content', label: 'Popis a čísla', icon: 'text' },
  { value: 'gallery', label: 'Galerie', icon: 'gallery' },
  { value: 'hours', label: 'Otevírací doba', icon: 'clock' },
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

/* ---------- Galerie určené pro tento objekt (read-only zrcadlo) ----------
   Vazbu vlastní modul Galerie (Gallery.areaId) — tady se jen zobrazuje. */
const venueGalleries = computed(() => galleriesForVenue(form.id))
const tourItems = computed<RelItem[]>(() => tourOptionsList())


/* ---------- AI překlad (prototyp) ---------- */
const targetLangs = LANGS.filter((l) => l.code !== SOURCE_LANG)
const translating = ref(false)
const sourceReady = computed(() => form.title[SOURCE_LANG].trim().length > 0)
const mlFields: (keyof AreaObject)[] = ['title', 'summary']
const toast = ref('')
let toastTimer: number | undefined
function fireToast(msg: string) {
  toast.value = msg
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => (toast.value = ''), 3000)
}
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
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Název objektu <span class="text-brand-500">*</span></span>
                    <span class="field-tag">area-title · {{ activeLang.toUpperCase() }}</span>
                  </label>
                  <input
                    v-model="form.title[activeLang]"
                    type="text"
                    placeholder="Např. Malý svět techniky U6"
                    class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Krátký popis (perex)</span>
                    <span class="field-tag">area-summary · {{ activeLang.toUpperCase() }}</span>
                  </label>
                  <textarea
                    v-model="form.summary[activeLang]"
                    rows="3"
                    placeholder="Stručná charakteristika objektu do výpisu a náhledů"
                    class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-1.5 block text-[13px] font-600 text-graphite-800">Provozní stav</label>
                    <AppSelect v-model="form.openState" :options="OPEN_STATE_OPTIONS" />
                  </div>
                  <div class="flex items-end">
                    <div class="flex h-11 w-full items-center justify-between rounded-md border border-steel-200 px-3">
                      <AppSwitch v-model="form.accessible" label="Bezbariérový přístup" aria-label="Bezbariérový přístup" />
                      <span class="field-tag">area-accessible</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Hlavní obrázek</span>
                    <span class="field-tag">area-image</span>
                  </label>
                  <div class="flex items-center gap-4">
                    <span class="h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-steel-100">
                      <img v-if="form.image" :src="form.image" alt="" class="h-full w-full object-cover" />
                      <span v-else class="grid h-full w-full place-items-center text-steel-400"><Icon name="image" :size="22" /></span>
                    </span>
                    <button class="inline-flex items-center gap-2 rounded-md border border-dashed border-steel-300 px-3.5 py-2.5 text-[13px] font-500 text-graphite-700 transition-colors hover:border-brand-400 hover:bg-brand-50/40 hover:text-brand-600">
                      <Icon name="upload" :size="16" /> Nahrát obrázek
                    </button>
                  </div>
                </div>
              </TabsContent>

              <!-- Sekce: Popis a čísla -->
              <TabsContent value="content" class="space-y-6 outline-none">
                <div>
                  <label class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Popis budovy</span>
                    <span class="field-tag">area-content</span>
                  </label>
                  <ContentBuilder v-model="form.contentBlocks" />
                </div>

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

              <!-- Sekce: Galerie -->
              <TabsContent value="gallery" class="space-y-6 outline-none">
                <!-- Základní fotky objektu (inline, statické) -->
                <div>
                  <div class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Základní fotky objektu</span>
                    <span class="field-tag">area-photos</span>
                  </div>
                  <p class="mb-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-steel-500">
                    <Icon name="image" :size="13" class="mt-0.5 shrink-0 text-steel-400" />
                    Hlavní fotky budovy přímo tady — mění se málo. První (★) je hlavní.
                  </p>
                  <GalleryManager v-model="form.photos" />
                </div>

                <!-- Fotogalerie z modulu Galerie (read-only zrcadlo — vazbu vlastní Galerie) -->
                <div class="border-t border-steel-100 pt-5">
                  <div class="mb-1.5 flex items-center justify-between">
                    <span class="text-[13px] font-600 text-graphite-800">Fotogalerie objektu</span>
                    <span class="field-tag">gallery-area_id</span>
                  </div>
                  <p class="mb-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-steel-500">
                    <Icon name="gallery" :size="13" class="mt-0.5 shrink-0 text-steel-400" />
                    Galerie určené pro tento objekt. Přiřazení se nastavuje v modulu
                    <span class="font-600 text-graphite-700">Galerie</span> (detail galerie → „Objekt v areálu").
                  </p>
                  <ul v-if="venueGalleries.length" class="grid gap-2 sm:grid-cols-2">
                    <li v-for="g in venueGalleries" :key="g.id" class="flex items-center gap-2.5 rounded-lg border border-steel-200 bg-white px-2.5 py-2">
                      <span class="grid h-9 w-12 shrink-0 place-items-center overflow-hidden rounded bg-steel-100 text-steel-400">
                        <img v-if="galleryCover(g)" :src="galleryCover(g)" alt="" class="h-full w-full object-cover" />
                        <Icon v-else name="image" :size="14" />
                      </span>
                      <span class="min-w-0">
                        <span class="block truncate text-[13px] font-600 text-graphite-800">{{ g.name.cs }}</span>
                        <span class="block font-mono text-[10.5px] text-steel-400">{{ galleryCount(g) }} fotek</span>
                      </span>
                    </li>
                  </ul>
                  <p v-else class="rounded-md bg-steel-50 px-3 py-4 text-center text-[12.5px] text-steel-500">
                    Pro tento objekt zatím není určená žádná galerie.
                  </p>
                </div>
              </TabsContent>

              <!-- Sekce: Otevírací doba -->
              <TabsContent value="hours" class="space-y-4 outline-none">
                <div class="flex items-center justify-between rounded-md bg-steel-50 px-3 py-2.5">
                  <AppSwitch v-model="form.showOpeningHours" label="Zobrazovat otevírací dobu" aria-label="Zobrazovat otevírací dobu" />
                  <span class="field-tag">area-opening_hours</span>
                </div>
                <OpeningHoursEditor v-if="form.showOpeningHours" v-model="form.openingHours" />
                <p v-else class="text-[12.5px] text-steel-400">Otevírací doba se na webu objektu nezobrazí.</p>
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[76px] xl:self-start">
        <FormSection title="Publikace" icon="eye">
          <div class="flex items-center justify-between rounded-md border border-steel-200 px-3 py-2.5">
            <AppSwitch v-model="form.published" label="Zveřejnit na webu" aria-label="Zveřejnit na webu" />
            <span class="field-tag">area-published</span>
          </div>
        </FormSection>

        <!-- Štítky (sdílený TagPicker jako Aktuality) -->
        <FormSection title="Štítky" icon="filter" tag="area-tags">
          <TagPicker v-model="form.tags" :options="PREDEFINED_AREA_TAGS" />
        </FormSection>

        <!-- Nabízené prohlídky (vazba na modul Prohlídky) -->
        <FormSection title="Nabízené prohlídky" icon="ticket" tag="area-tours">
          <RelationPicker
            v-model="form.tourIds"
            :items="tourItems"
            add-label="Přidat prohlídku"
            empty-label="Zatím žádné prohlídky."
            search-placeholder="Hledat prohlídku…"
            icon="ticket"
          />
          <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
            <Icon name="ticket" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
            Na webu si u objektu návštěvník vybere z těchto prohlídek. <strong class="font-600 text-graphite-700">Prodej vstupenek</strong> se řídí přes napojení jednotlivých prohlídek na Colosseum (ID se zadává u prohlídky, ne zde).
          </p>
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
              <span v-if="sourceReady">Vyplní mutace EN, DE, PL (název, perex) ze zdrojové české verze.</span>
              <span v-else>Nejdřív vyplňte český název — z něj se překládá.</span>
            </p>
          </div>
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
