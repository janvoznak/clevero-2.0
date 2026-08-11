<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import CardActionsMenu from '@/components/admin/CardActionsMenu.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import BackRefsCard from '@/components/admin/BackRefsCard.vue'
import { backRefsForGallery } from '@/data/backrefs'
import ContentBuilder from '@/components/admin/ContentBuilder.vue'
import GalleryManager from '@/components/admin/GalleryManager.vue'
import SlugField from '@/components/admin/SlugField.vue'
import { useAutoSlug } from '@/utils/useAutoSlug'
import TagPicker from '@/components/admin/TagPicker.vue'
import LangBar from '@/components/admin/LangBar.vue'
import MlFieldHeader from '@/components/admin/MlFieldHeader.vue'
import { useMlTranslate } from '@/utils/useMlTranslate'
import { LANGS, defaultContentBlocks } from '@/data/types'
import type { LangCode } from '@/data/types'
import {
  MOCK_GALLERIES,
  galleryState,
  GALLERY_STATE_META,
  sectionOptions,
  section as findSection,
  blankGallery,
  type Gallery,
} from '@/data/mockGalleries'
import {
  filledLangsOf,
  publishedLangsOf,
  publishLangRows,
  toggleLangPublish,
} from '@/utils/langPublish'
import { PREDEFINED_TAGS } from '@/data/mockNews'
import { PLACE_OPTIONS } from '@/data/mockVenues'

const props = defineProps<{ id?: string }>()
const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_GALLERIES.find((g) => g.id === props.id))
function clone(): Gallery {
  const s = source.value
  if (s) {
    const c = JSON.parse(JSON.stringify(s)) as Gallery
    c.slug = c.slug ?? { cs: '', en: '', de: '', pl: '' }
    c.contentBlocks = c.contentBlocks ?? defaultContentBlocks()
    // Zhmotnit fallback do explicitního seznamu, aby šlo přepínat.
    c.publishedLangs = publishedLangsOf(filledLangsOf(c.name), c.publishedLangs)
    return c
  }
  const c = blankGallery(typeof route.query.section === 'string' ? route.query.section : '')
  c.contentBlocks = c.contentBlocks ?? defaultContentBlocks()
  // Nová galerie: každá mutace půjde živě, jakmile dostane obsah.
  c.publishedLangs = LANGS.map((l) => l.code)
  return c
}
const form = reactive<Gallery>(clone())
const activeLang = ref<LangCode>('cs')

const sectionSelectOptions = sectionOptions()

/** Objekt v areálu, pro který je galerie určená (vlastník vazby = Galerie).
    Reka Select nepovolí prázdnou hodnotu → sentinel + proxy na ''. */
const AREA_NONE = '__none__'
const areaOptions = [{ value: AREA_NONE, label: '— nepropojeno' }, ...PLACE_OPTIONS]
const areaModel = computed({
  get: () => form.areaId || AREA_NONE,
  set: (v: string) => (form.areaId = v === AREA_NONE ? '' : v),
})
const areaLabel = computed(() => PLACE_OPTIONS.find((o) => o.value === form.areaId)?.label ?? '')

/** Sekce detailu jako podtržené záložky. */
const activeSection = ref('basic')
const sections = [
  { value: 'basic', label: 'Základní informace', icon: 'page' },
  { value: 'content', label: 'Obsah', icon: 'text' },
  { value: 'relations', label: 'Zařazení a vazby', icon: 'layers' },
  { value: 'photos', label: 'Fotografie', icon: 'gallery' },
]

function langFilled(code: LangCode): boolean {
  return form.name[code].trim().length > 0
}
const filledLangs = computed(() => LANGS.filter((l) => langFilled(l.code)).map((l) => l.code))

/* ---------- Publikování per jazyk ----------
   Přepínač `published` řídí, ZDA je galerie živá; tyto přepínače řídí, KTERÉ
   mutace se na webu zobrazí. Prázdnou mutaci nelze zveřejnit. */
const liveLangs = computed(() => publishedLangsOf(filledLangsOf(form.name), form.publishedLangs))
const publishRows = computed(() => publishLangRows(form.name, form.publishedLangs))
function onToggleLang(code: LangCode) {
  form.publishedLangs = toggleLangPublish(form.publishedLangs, filledLangsOf(form.name), code)
}

/** Živý stav zveřejnění (odznak). */
const state = computed(() => galleryState(form))

/* ---------- URL slug (prototyp) — automaticky z názvu, dokud ho klient
   neupraví ručně. Titulek a meta se odvozují automaticky. ---------- */
const slugText = computed({
  get: () => form.slug?.[activeLang.value] ?? '',
  set: (v: string) => {
    if (!form.slug) form.slug = { cs: '', en: '', de: '', pl: '' }
    form.slug[activeLang.value] = v
  },
})
const { markManual } = useAutoSlug(
  () => form.name,
  () => (form.slug ??= { cs: '', en: '', de: '', pl: '' }),
)

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}

/* ---------- AI překlad mutací (prototyp) — sdílené řešení ---------- */
const mlFields: (keyof Gallery)[] = ['name']
const { translating, toast, translateLang, translateField } = useMlTranslate(form, mlFields)

function backToSection() {
  if (form.sectionId) router.push({ name: 'gallery-section-edit', params: { id: form.sectionId } })
  else router.push({ name: 'galleries-list' })
}
</script>

<template>
  <div class="pb-16">
    <!-- Sticky header -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800" @click="backToSection">
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">gallery</span>
            <span class="font-mono text-[11px] text-steel-400">{{ isEdit ? `/admin/galleries/${form.id}/edit` : '/admin/galleries/new' }}</span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.name.cs || 'Bez názvu' : 'Nová galerie' }}
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
        <CardActionsMenu
          v-if="isEdit"
          :name="form.name.cs"
          entity="galerii"
          @delete="backToSection()"
        />
        <AppButton variant="secondary" @click="backToSection">Zrušit</AppButton>
        <AppButton variant="primary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit galerii' }}
        </AppButton>
      </div>
    </div>

    <!-- Two-column body -->
    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <!-- LEVÝ sloupec: sekce v záložkách -->
      <div class="min-w-0">
        <div class="rounded-lg border border-steel-200 bg-white">
          <TabsRoot v-model="activeSection">
            <TabsList class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2" aria-label="Sekce galerie">
              <TabsTrigger
                v-for="s in sections"
                :key="s.value"
                :value="s.value"
                class="-mb-px inline-flex shrink-0 items-center gap-2 rounded-t-md border-b-2 border-transparent px-4 py-2.5 text-[13px] font-600 text-steel-500 outline-none transition-colors hover:bg-steel-100 hover:text-graphite-800 data-[state=active]:border-brand-500 data-[state=active]:bg-brand-50 data-[state=active]:text-brand-700"
              >
                <Icon :name="s.icon" :size="16" />
                {{ s.label }}
                <span v-if="s.value === 'photos'" class="rounded-full bg-steel-200 px-1.5 font-mono text-[10px] text-steel-600">{{ form.photos.length }}</span>
              </TabsTrigger>
            </TabsList>

            <div class="p-5">
              <!-- Sekce: Základní informace -->
              <TabsContent value="basic" class="outline-none">
                <p class="mb-4 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Název a popis existují samostatně v každé jazykové mutaci.
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">ML</span>
                </p>
                <div class="space-y-4">
                  <div>
                    <MlFieldHeader label="Název galerie" :lang="activeLang" tag="gallery-name" required @translate="translateField('name')" />
                    <input v-model="form.name[activeLang]" type="text" placeholder="Např. Malý svět techniky U6" class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                  </div>
                  <SlugField
                    v-model="slugText"
                    :tag="`gallery-url · ${activeLang.toUpperCase()}`"
                    @edit="markManual(activeLang)"
                  />
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Datum pořízení / konání</span>
                      <span class="field-tag">gallery-date</span>
                    </label>
                    <input v-model="form.date" type="date" class="h-10 rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
                  </div>

                </div>
              </TabsContent>

              <!-- Sekce: Obsah (jednotný ContentBuilder — nic dalšího pod ním) -->
              <TabsContent value="content" class="outline-none">
                <ContentBuilder v-model="form.contentBlocks" />
              </TabsContent>

              <!-- Sekce: Zařazení a vazby -->
              <TabsContent value="relations" class="space-y-4 outline-none">
                <FormSection title="Zařazení do sekce" icon="layers" hint="Sekce určuje, kde se galerie na webu zobrazí." tag="gallery-section_id">
                  <AppSelect v-model="form.sectionId" :options="sectionSelectOptions" placeholder="Vyberte sekci…" />
                </FormSection>
                <FormSection title="Objekt v areálu" icon="map" hint="Na webu se galerie zobrazí u daného objektu (např. Bolt Tower). Nepovinné." tag="gallery-area_id">
                  <AppSelect v-model="areaModel" :options="areaOptions" />
                </FormSection>
              </TabsContent>

              <!-- Sekce: Fotografie -->
              <TabsContent value="photos" class="outline-none">
                <p class="mb-4 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Fotografie jsou společné pro všechny jazyky. První obrázek = hlavní (náhled).
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">gallery-photos</span>
                </p>
                <GalleryManager v-model="form.photos" />
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[92px] xl:self-start">
        <!-- Zveřejnění -->
        <PublishCard :published="form.published" :langs="publishRows" updated-by="Petr Dvořák" @toggle-lang="onToggleLang" />

        <!-- Zpětné vazby (kdo galerii používá) -->
        <BackRefsCard :groups="backRefsForGallery(form.id)" entity-label="tuto galerii" />

        <!-- Štítky -->
        <FormSection title="Štítky" icon="filter" tag="gallery-tags">
          <TagPicker v-model="form.tags" :options="PREDEFINED_TAGS" />
        </FormSection>
      </aside>
    </div>

    <!-- Toast (potvrzení AI akce) -->
    <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-150" leave-to-class="opacity-0">
      <div v-if="toast" class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl">
        <Icon name="sparkles" :size="16" class="text-brand-400" />
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
