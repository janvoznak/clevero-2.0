<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppSwitch from '@/components/ui/AppSwitch.vue'
import FormSection from '@/components/admin/FormSection.vue'
import PublishCard from '@/components/admin/PublishCard.vue'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import GalleryManager from '@/components/admin/GalleryManager.vue'
import TagPicker from '@/components/admin/TagPicker.vue'
import LangMutationsCard from '@/components/admin/LangMutationsCard.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode, ML } from '@/data/types'
import {
  MOCK_GALLERIES,
  galleryState,
  GALLERY_STATE_META,
  sectionOptions,
  section as findSection,
  blankGallery,
  type Gallery,
} from '@/data/mockGalleries'
import { PREDEFINED_TAGS } from '@/data/mockNews'
import { PLACE_OPTIONS } from '@/data/mockVenues'

const props = defineProps<{ id?: string }>()
const route = useRoute()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_GALLERIES.find((g) => g.id === props.id))
function clone(): Gallery {
  const s = source.value
  if (s) return JSON.parse(JSON.stringify(s))
  return blankGallery(typeof route.query.section === 'string' ? route.query.section : '')
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
  { value: 'photos', label: 'Fotografie', icon: 'gallery' },
  { value: 'seo', label: 'Marketing (SEO)', icon: 'search' },
]

function langFilled(code: LangCode): boolean {
  return form.name[code].trim().length > 0
}
const filledLangs = computed(() => LANGS.filter((l) => langFilled(l.code)).map((l) => l.code))

/** Živý stav zveřejnění (odznak). */
const state = computed(() => galleryState(form))

/* ---------- SEO auto-generování (prototyp) ---------- */
const generating = ref(false)
function autoGenerate() {
  generating.value = true
  const l = activeLang.value
  window.setTimeout(() => {
    const title = form.name[l] || 'Galerie'
    const plain = form.description[l].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    form.metaTitle[l] = `${title} | Dolní Vítkovice`.slice(0, 60)
    form.metaDescription[l] = (plain || title).slice(0, 155)
    const words = (title + ' ' + plain)
      .toLowerCase()
      .replace(/[^\p{L}\s]/gu, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
    form.metaKeywords[l] = Array.from(new Set(words)).slice(0, 6).join(', ')
    generating.value = false
  }, 550)
}
const metaTitleLen = computed(() => form.metaTitle[activeLang.value].length)
const metaDescLen = computed(() => form.metaDescription[activeLang.value].length)

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}

/* ---------- AI překlad (prototyp — žádná reálná AI) ---------- */
const targetLangs = LANGS.filter((l) => l.code !== SOURCE_LANG)
const translating = ref(false)
const toast = ref('')
const mlFields: (keyof Gallery)[] = ['name', 'description', 'metaTitle', 'metaDescription', 'metaKeywords']
const sourceReady = computed(() => form.name[SOURCE_LANG].trim().length > 0)
function translateAll() {
  if (translating.value || !sourceReady.value) return
  translating.value = true
  window.setTimeout(() => {
    for (const field of mlFields) {
      const val = form[field] as ML
      const src = val[SOURCE_LANG]
      for (const t of targetLangs) if (src) val[t.code] = src
    }
    translating.value = false
    toast.value = `Přeloženo z CZ do ${targetLangs.map((l) => l.code.toUpperCase()).join(', ')}`
    window.setTimeout(() => (toast.value = ''), 3000)
  }, 1500)
}

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

        <TabsRoot :model-value="activeLang" class="hidden lg:block" @update:model-value="(v) => (activeLang = v as LangCode)">
          <TabsList class="inline-flex items-center gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1" aria-label="Jazyková mutace">
            <TabsTrigger v-for="l in LANGS" :key="l.code" :value="l.code" class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors hover:text-graphite-800 data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm">
              <span>{{ l.flag }}</span>{{ l.code.toUpperCase() }}
              <span class="h-1.5 w-1.5 rounded-full" :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'" />
            </TabsTrigger>
          </TabsList>
        </TabsRoot>

        <div class="h-6 w-px bg-steel-200" />
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
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Název galerie <span class="text-brand-500">*</span></span>
                      <span class="field-tag">gallery-name · {{ activeLang.toUpperCase() }}</span>
                    </label>
                    <input v-model="form.name[activeLang]" type="text" placeholder="Např. Malý svět techniky U6" class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                  </div>
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Popis</span>
                      <span class="field-tag">gallery-description · {{ activeLang.toUpperCase() }}</span>
                    </label>
                    <RichTextEditor v-model="form.description[activeLang]" />
                  </div>
                  <div>
                    <label class="mb-1.5 flex items-center justify-between">
                      <span class="text-[13px] font-600 text-graphite-800">Datum pořízení / konání</span>
                      <span class="field-tag">gallery-date</span>
                    </label>
                    <input v-model="form.date" type="date" class="h-10 rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none" />
                  </div>

                  <!-- Zařazení a vazby — dříve v pravém railu -->
                  <div class="rounded-md border border-steel-200 p-4">
                    <p class="mb-3 flex items-center gap-2 text-[13px] font-600 text-graphite-800"><Icon name="layers" :size="15" class="text-steel-400" /> Zařazení a vazby</p>
                    <div class="space-y-4">
                      <div>
                        <label class="mb-1.5 flex items-center justify-between">
                          <span class="text-[13px] font-600 text-graphite-800">Zařazení do sekce</span>
                          <span class="field-tag">gallery-section_id</span>
                        </label>
                        <AppSelect v-model="form.sectionId" :options="sectionSelectOptions" placeholder="Vyberte sekci…" />
                        <p class="mt-1 text-[11.5px] text-steel-500">Sekce určuje, kde se galerie na webu zobrazí.</p>
                      </div>
                      <div>
                        <label class="mb-1.5 flex items-center justify-between">
                          <span class="text-[13px] font-600 text-graphite-800">Objekt v areálu</span>
                          <span class="field-tag">gallery-area_id</span>
                        </label>
                        <AppSelect v-model="areaModel" :options="areaOptions" />
                        <p class="mt-1 text-[11.5px] text-steel-500">Na webu se galerie zobrazí u daného objektu (např. Bolt Tower). Nepovinné.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <!-- Sekce: Fotografie -->
              <TabsContent value="photos" class="outline-none">
                <p class="mb-4 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Fotografie jsou společné pro všechny jazyky. První obrázek = hlavní (náhled).
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">gallery-photos</span>
                </p>
                <GalleryManager v-model="form.photos" />
              </TabsContent>

              <!-- Sekce: Marketing (SEO) -->
              <TabsContent value="seo" class="outline-none">
                <p class="mb-4 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Meta údaje pro vyhledávače a sociální sítě — samostatně pro každý jazyk.
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">ML</span>
                </p>
                <div class="space-y-4">
                  <div class="flex items-center justify-between rounded-md border border-brand-500/20 bg-brand-50 px-4 py-3">
                    <div class="flex items-center gap-2.5">
                      <Icon name="sparkles" :size="18" class="text-brand-500" />
                      <div>
                        <p class="text-[13px] font-600 text-graphite-800">Automatické vygenerování</p>
                        <p class="text-[11.5px] text-steel-500">Titulek a popis z názvu a popisu ({{ activeLang.toUpperCase() }})</p>
                      </div>
                    </div>
                    <AppButton variant="primary" size="sm" :disabled="generating" @click="autoGenerate">
                      <Icon name="sparkles" :size="15" :class="generating && 'animate-pulse'" />
                      {{ generating ? 'Generuji…' : 'Vygenerovat' }}
                    </AppButton>
                  </div>

                  <div class="grid gap-4 md:grid-cols-2">
                    <div class="md:col-span-2">
                      <label class="mb-1.5 flex items-center justify-between">
                        <span class="text-[13px] font-600 text-graphite-800">Titulek stránky</span>
                        <span class="field-tag">gallery-meta_title · {{ activeLang.toUpperCase() }}</span>
                      </label>
                      <input v-model="form.metaTitle[activeLang]" type="text" placeholder="Meta title zobrazený ve výsledcích vyhledávání" class="h-10 w-full rounded-md border border-steel-200 px-3.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                      <div class="mt-1 flex justify-end">
                        <span class="font-mono text-[10.5px]" :class="metaTitleLen > 60 ? 'text-danger-500' : 'text-steel-400'">{{ metaTitleLen }} / 60</span>
                      </div>
                    </div>
                    <div class="md:col-span-2">
                      <label class="mb-1.5 flex items-center justify-between">
                        <span class="text-[13px] font-600 text-graphite-800">Meta description</span>
                        <span class="field-tag">gallery-meta_description · {{ activeLang.toUpperCase() }}</span>
                      </label>
                      <textarea v-model="form.metaDescription[activeLang]" rows="2" placeholder="Meta popis stránky" class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                      <div class="mt-1 flex justify-end">
                        <span class="font-mono text-[10.5px]" :class="metaDescLen > 155 ? 'text-danger-500' : 'text-steel-400'">{{ metaDescLen }} / 155</span>
                      </div>
                    </div>
                    <div>
                      <label class="mb-1.5 flex items-center justify-between">
                        <span class="text-[13px] font-600 text-graphite-800">Meta keywords</span>
                        <span class="field-tag">gallery-meta_keywords</span>
                      </label>
                      <input v-model="form.metaKeywords[activeLang]" type="text" placeholder="klíčová slova oddělená čárkou" class="h-10 w-full rounded-md border border-steel-200 px-3.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none" />
                    </div>
                    <div>
                      <label class="mb-1.5 flex items-center justify-between">
                        <span class="text-[13px] font-600 text-graphite-800">Obrázek pro sociální sítě</span>
                        <span class="field-tag">gallery-og_image</span>
                      </label>
                      <!-- prototyp — nahrání OG je nefunkční vizuální zástupka -->
                      <button class="flex w-full items-center gap-3 rounded-md border border-dashed border-steel-300 px-4 py-[9px] text-left transition-colors hover:border-brand-400 hover:bg-brand-50/40">
                        <span class="grid h-9 w-14 shrink-0 place-items-center rounded bg-steel-100 text-steel-400"><Icon name="image" :size="17" /></span>
                        <span>
                          <span class="block text-[12.5px] font-600 text-graphite-800">Nahrát OG obrázek</span>
                          <span class="block text-[11px] text-steel-500">1200 × 630 px</span>
                        </span>
                      </button>
                    </div>
                  </div>

                  <!-- SERP preview -->
                  <div class="rounded-md border border-steel-200 bg-steel-50 p-4">
                    <p class="mb-2 flex items-center gap-1.5 field-tag"><Icon name="globe" :size="13" /> Náhled ve vyhledávači</p>
                    <div class="rounded bg-white p-3 shadow-sm">
                      <p class="text-[12px] text-forge-600">dolnivitkovice.cz › galerie</p>
                      <p class="mt-0.5 text-[16px] font-500 text-[#1a0dab]">{{ form.metaTitle[activeLang] || form.name[activeLang] || 'Titulek stránky' }}</p>
                      <p class="mt-0.5 text-[12.5px] leading-snug text-steel-600">{{ form.metaDescription[activeLang] || 'Meta popis se zobrazí zde…' }}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail -->
      <aside class="space-y-5 xl:sticky xl:top-[92px] xl:self-start">
        <!-- Zveřejnění -->
        <PublishCard :published="form.published" updated-by="Petr Dvořák" />

        <!-- Štítky -->
        <FormSection title="Štítky" icon="filter" tag="gallery-tags">
          <TagPicker v-model="form.tags" :options="PREDEFINED_TAGS" />
        </FormSection>

        <LangMutationsCard
          v-model="activeLang"
          :filled="filledLangs"
          :source-ready="sourceReady"
          :translating="translating"
          @translate="translateAll"
        />
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
