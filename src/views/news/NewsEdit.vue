<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { TabsRoot, TabsList, TabsTrigger, TabsContent } from 'reka-ui'
import Icon from '@/components/ui/Icon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import FormSection from '@/components/admin/FormSection.vue'
import RichTextEditor from '@/components/admin/RichTextEditor.vue'
import GalleryManager from '@/components/admin/GalleryManager.vue'
import AttachmentsManager from '@/components/admin/AttachmentsManager.vue'
import TagPicker from '@/components/admin/TagPicker.vue'
import RelationPicker from '@/components/admin/RelationPicker.vue'
import { LANGS, SOURCE_LANG } from '@/data/types'
import type { LangCode, NewsItem, ML } from '@/data/types'
import { MOCK_NEWS, publishState, STATE_META, PREDEFINED_TAGS, PREDEFINED_CATEGORIES } from '@/data/mockNews'
import { tourOptionsList } from '@/data/mockTours'
import { PLACE_OPTIONS } from '@/data/mockVenues'

const tourItems = tourOptionsList()

/** Výběr objektu v Areálu (stejně jako u akce; u novinky nepovinný).
    Reka Select nepovolí prázdnou hodnotu → sentinel + proxy na ''. */
const AREA_NONE = '__none__'
const areaOptions = [{ value: AREA_NONE, label: '— nepropojeno' }, ...PLACE_OPTIONS]

const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => !!props.id)
const source = computed(() => MOCK_NEWS.find((n) => n.id === props.id))

const empty = (): ML => ({ cs: '', en: '', de: '', pl: '' })
function clone(): NewsItem {
  const s = source.value
  if (s) return JSON.parse(JSON.stringify(s))
  return {
    id: 'nová',
    author: 'Jan Voznak',
    title: empty(),
    summary: empty(),
    text: empty(),
    videoLink: '',
    dateFrom: null,
    dateTo: null,
    metaTitle: empty(),
    metaDescription: empty(),
    metaKeywords: empty(),
    ogImage: null,
    gallery: [],
    attachments: [],
    tags: [],
    categories: [],
    areaId: '',
    tourIds: [],
  }
}

const form = reactive<NewsItem>(clone())
const activeLang = ref<LangCode>('cs')
const areaModel = computed({
  get: () => form.areaId || AREA_NONE,
  set: (v: string) => (form.areaId = v === AREA_NONE ? '' : v),
})

/** Sekce detailu jako záložky (jiná vizuální rovina než jazykové mutace). */
const activeSection = ref('basic')
const sections = [
  { value: 'basic', label: 'Základní informace', icon: 'news' },
  { value: 'gallery', label: 'Fotogalerie', icon: 'gallery' },
  { value: 'attachments', label: 'Přílohy', icon: 'paperclip' },
  { value: 'seo', label: 'Marketing (SEO)', icon: 'search' },
]

/** Indikátor vyplněnosti jazyka (podle nadpisu). */
function langFilled(code: LangCode): boolean {
  return form.title[code].trim().length > 0
}

/** Živý náhled stavu publikace z časového okna. */
const state = computed(() => publishState(form))

/** Auto-generování SEO polí z nadpisu + textu (prototyp). */
const generating = ref(false)
function autoGenerate() {
  generating.value = true
  const l = activeLang.value
  window.setTimeout(() => {
    const title = form.title[l] || 'Aktualita'
    const plain = form.text[l].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    form.metaTitle[l] = `${title} | Dolní Vítkovice`.slice(0, 60)
    form.metaDescription[l] = (form.summary[l] || plain || title).slice(0, 155)
    const words = (title + ' ' + plain)
      .toLowerCase()
      .replace(/[^\p{L}\s]/gu, '')
      .split(/\s+/)
      .filter((w) => w.length > 3)
    form.metaKeywords[l] = Array.from(new Set(words)).slice(0, 6).join(', ')
    generating.value = false
  }, 550)
}

const saved = ref(false)
function save() {
  saved.value = true
  window.setTimeout(() => (saved.value = false), 2200)
}

const metaTitleLen = computed(() => form.metaTitle[activeLang.value].length)
const metaDescLen = computed(() => form.metaDescription[activeLang.value].length)

/* ---------- AI překlad (prototyp — žádná reálná AI) ----------
   Přeloží obsah ze zdrojového jazyka (CZ) do všech cizích mutací (EN/DE/PL).
   V prototypu jen zkopíruje zdrojový text a předstírá překlad. */
const targetLangs = LANGS.filter((l) => l.code !== SOURCE_LANG)
const translating = ref(false)
const toast = ref('')
const mlFields: (keyof NewsItem)[] = [
  'title',
  'summary',
  'text',
  'metaTitle',
  'metaDescription',
  'metaKeywords',
]

/** Má zdroj (CZ) vůbec co překládat? */
const sourceReady = computed(() => form.title[SOURCE_LANG].trim().length > 0)

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
</script>

<template>
  <div class="pb-16">
    <!-- Sticky action header -->
    <div class="sticky top-0 z-30 border-b border-steel-200 bg-white/90 backdrop-blur-sm">
      <div class="flex items-center gap-4 px-8 py-3">
        <button
          class="grid h-9 w-9 place-items-center rounded-md border border-steel-200 text-steel-500 transition-colors hover:bg-steel-50 hover:text-graphite-800"
          @click="router.push({ name: 'news-list' })"
        >
          <Icon name="chevronLeft" :size="18" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">news</span>
            <span class="font-mono text-[11px] text-steel-400">
              {{ isEdit ? `/admin/news/${form.id}/edit` : '/admin/news/new' }}
            </span>
          </div>
          <h1 class="truncate font-display text-[19px] font-700 leading-tight tracking-tight text-graphite-900">
            {{ isEdit ? form.title.cs || 'Bez názvu' : 'Nová aktualita' }}
          </h1>
        </div>

        <!-- Language switcher (v hlavičce, globální) — Reka Tabs -->
        <TabsRoot
          :model-value="activeLang"
          class="hidden lg:block"
          @update:model-value="(v) => (activeLang = v as LangCode)"
        >
          <TabsList
            class="inline-flex items-center gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1"
            aria-label="Jazyková mutace"
          >
            <TabsTrigger
              v-for="l in LANGS"
              :key="l.code"
              :value="l.code"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors hover:text-graphite-800 data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm"
            >
              <span>{{ l.flag }}</span>
              {{ l.code.toUpperCase() }}
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'"
                :title="langFilled(l.code) ? 'Vyplněno' : 'Prázdné'"
              />
            </TabsTrigger>
          </TabsList>
        </TabsRoot>

        <div class="h-6 w-px bg-steel-200" />
        <AppButton variant="secondary" @click="router.push({ name: 'news-list' })">Zrušit</AppButton>
        <AppButton variant="primary" @click="save">
          <Icon :name="saved ? 'check' : 'save'" :size="16" />
          {{ saved ? 'Uloženo' : 'Uložit aktualitu' }}
        </AppButton>
      </div>

      <!-- Language switcher (mobil / <lg) — Reka Tabs -->
      <div class="px-8 pb-3 lg:hidden">
        <TabsRoot
          :model-value="activeLang"
          @update:model-value="(v) => (activeLang = v as LangCode)"
        >
          <TabsList class="inline-flex items-center gap-1 rounded-lg border border-steel-200 bg-steel-50 p-1">
            <TabsTrigger
              v-for="l in LANGS"
              :key="l.code"
              :value="l.code"
              class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-600 text-steel-500 outline-none transition-colors data-[state=active]:bg-white data-[state=active]:text-graphite-900 data-[state=active]:shadow-sm"
            >
              {{ l.flag }} {{ l.code.toUpperCase() }}
              <span class="h-1.5 w-1.5 rounded-full" :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'" />
            </TabsTrigger>
          </TabsList>
        </TabsRoot>
      </div>
    </div>

    <!-- Two-column body -->
    <div class="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <!-- LEVÝ sloupec: obsah v záložkách sekcí (Reka Tabs, podtržený styl) -->
      <div class="min-w-0">
        <div class="rounded-lg border border-steel-200 bg-white">
          <TabsRoot v-model="activeSection">
            <TabsList
              class="flex flex-wrap gap-1.5 overflow-x-auto border-b border-steel-200 bg-steel-50/60 px-3 pt-2"
              aria-label="Sekce aktuality"
            >
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
              <TabsContent value="basic" class="outline-none">
                <p class="mb-4 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Nadpis, perex a text existují samostatně v každé jazykové mutaci.
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">ML</span>
                </p>
                <div class="space-y-4">
            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">
                  Nadpis <span class="text-brand-500">*</span>
                </span>
                <span class="field-tag">news-title · {{ activeLang.toUpperCase() }}</span>
              </label>
              <input
                v-model="form.title[activeLang]"
                type="text"
                placeholder="Hlavní nadpis aktuality"
                class="h-11 w-full rounded-md border border-steel-200 px-3.5 text-[15px] font-500 text-graphite-900 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Shrnutí / PEREX</span>
                <span class="field-tag">news-summary · {{ activeLang.toUpperCase() }}</span>
              </label>
              <textarea
                v-model="form.summary[activeLang]"
                rows="2"
                placeholder="Krátký úvodní výtah zobrazený v seznamu a náhledech"
                class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[14px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Text</span>
                <span class="field-tag">news-text · {{ activeLang.toUpperCase() }}</span>
              </label>
              <RichTextEditor v-model="form.text[activeLang]" />
            </div>

            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Odkaz na video</span>
                <span class="field-tag">news-videoLink</span>
              </label>
              <div class="relative">
                <Icon name="link" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" />
                <input
                  v-model="form.videoLink"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=…"
                  class="h-10 w-full rounded-md border border-steel-200 pl-9 pr-3 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
                </div>
              </TabsContent>

              <!-- Sekce: Fotogalerie -->
              <TabsContent value="gallery" class="outline-none">
                <p class="mb-4 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Jednotná galerie pro celou aktualitu. První obrázek = hlavní.
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">news-gallery</span>
                </p>
                <GalleryManager v-model="form.gallery" />
              </TabsContent>

              <!-- Sekce: Přílohy -->
              <TabsContent value="attachments" class="outline-none">
                <p class="mb-4 flex items-center gap-2 text-[12.5px] text-steel-500">
                  Přílohy mohou být specifické pro jednotlivé jazykové mutace.
                  <span class="field-tag rounded bg-steel-100 px-1.5 py-0.5">news-attachments · ML</span>
                </p>
                <AttachmentsManager v-model="form.attachments" :lang="activeLang" />
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
                  <p class="text-[11.5px] text-steel-500">Titulek a popis z nadpisu a textu ({{ activeLang.toUpperCase() }})</p>
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
                  <span class="field-tag">news-meta_title · {{ activeLang.toUpperCase() }}</span>
                </label>
                <input
                  v-model="form.metaTitle[activeLang]"
                  type="text"
                  placeholder="Meta title zobrazený ve výsledcích vyhledávání"
                  class="h-10 w-full rounded-md border border-steel-200 px-3.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
                <div class="mt-1 flex justify-end">
                  <span class="font-mono text-[10.5px]" :class="metaTitleLen > 60 ? 'text-danger-500' : 'text-steel-400'">
                    {{ metaTitleLen }} / 60
                  </span>
                </div>
              </div>

              <div class="md:col-span-2">
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[13px] font-600 text-graphite-800">Meta description</span>
                  <span class="field-tag">news-meta_description · {{ activeLang.toUpperCase() }}</span>
                </label>
                <textarea
                  v-model="form.metaDescription[activeLang]"
                  rows="2"
                  placeholder="Meta popis stránky"
                  class="w-full resize-y rounded-md border border-steel-200 px-3.5 py-2.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
                <div class="mt-1 flex justify-end">
                  <span class="font-mono text-[10.5px]" :class="metaDescLen > 155 ? 'text-danger-500' : 'text-steel-400'">
                    {{ metaDescLen }} / 155
                  </span>
                </div>
              </div>

              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[13px] font-600 text-graphite-800">Meta keywords</span>
                  <span class="field-tag">news-meta_keywords</span>
                </label>
                <input
                  v-model="form.metaKeywords[activeLang]"
                  type="text"
                  placeholder="klíčová slova oddělená čárkou"
                  class="h-10 w-full rounded-md border border-steel-200 px-3.5 text-[13.5px] text-graphite-800 placeholder:text-steel-400 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="mb-1.5 flex items-center justify-between">
                  <span class="text-[13px] font-600 text-graphite-800">Obrázek pro sociální sítě</span>
                  <span class="field-tag">news-og_image</span>
                </label>
                <button
                  class="flex w-full items-center gap-3 rounded-md border border-dashed border-steel-300 px-4 py-[9px] text-left transition-colors hover:border-brand-400 hover:bg-brand-50/40"
                >
                  <span class="grid h-9 w-14 shrink-0 place-items-center rounded bg-steel-100 text-steel-400">
                    <Icon name="image" :size="17" />
                  </span>
                  <span>
                    <span class="block text-[12.5px] font-600 text-graphite-800">Nahrát OG obrázek</span>
                    <span class="block text-[11px] text-steel-500">1200 × 630 px</span>
                  </span>
                </button>
              </div>
            </div>

            <!-- SERP preview -->
            <div class="rounded-md border border-steel-200 bg-steel-50 p-4">
              <p class="mb-2 flex items-center gap-1.5 field-tag">
                <Icon name="globe" :size="13" /> Náhled ve vyhledávači
              </p>
              <div class="rounded bg-white p-3 shadow-sm">
                <p class="text-[12px] text-forge-600">dolnivitkovice.cz › aktuality</p>
                <p class="mt-0.5 text-[16px] font-500 text-[#1a0dab]">
                  {{ form.metaTitle[activeLang] || form.title[activeLang] || 'Titulek stránky' }}
                </p>
                <p class="mt-0.5 text-[12.5px] leading-snug text-steel-600">
                  {{ form.metaDescription[activeLang] || form.summary[activeLang] || 'Meta popis se zobrazí zde…' }}
                </p>
              </div>
            </div>
                </div>
              </TabsContent>
            </div>
          </TabsRoot>
        </div>
      </div>

      <!-- PRAVÝ rail: publikace + přehled -->
      <aside class="space-y-5 xl:sticky xl:top-[92px] xl:self-start">
        <!-- Publikace -->
        <FormSection title="Publikace" icon="calendar" tag="news-dateFrom / dateTo">
          <div class="space-y-4">
            <!-- Stav preview -->
            <div class="flex items-center justify-between rounded-md bg-steel-50 px-3 py-2.5">
              <span class="text-[12.5px] font-500 text-steel-600">Aktuální stav</span>
              <span
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-600"
                :class="[STATE_META[state].bg, STATE_META[state].text]"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="STATE_META[state].dot" />
                {{ STATE_META[state].label }}
              </span>
            </div>

            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Publikace OD</span>
                <span class="field-tag">dateFrom</span>
              </label>
              <input
                v-model="form.dateFrom"
                type="datetime-local"
                class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="mb-1.5 flex items-center justify-between">
                <span class="text-[13px] font-600 text-graphite-800">Publikace DO</span>
                <span class="field-tag">dateTo</span>
              </label>
              <input
                v-model="form.dateTo"
                type="datetime-local"
                class="h-10 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
              />
            </div>
            <p class="flex items-start gap-1.5 rounded-md bg-steel-50 px-3 py-2 text-[11.5px] leading-relaxed text-steel-500">
              <Icon name="calendar" :size="13" class="mt-0.5 shrink-0 text-steel-400" />
              Viditelnost na webu řídí okno OD–DO. Prázdné DO = neomezeně.
            </p>
          </div>
        </FormSection>

        <!-- Autor -->
        <FormSection title="Autor" icon="settings" tag="news-author">
          <div class="flex items-center gap-2.5">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-graphite-800 text-[12px] font-700 text-white">
              {{ (form.author.split(' ').map((w) => w[0] ?? '').slice(0, 2).join('') || '?').toUpperCase() }}
            </span>
            <input
              v-model="form.author"
              type="text"
              placeholder="Jméno autora"
              class="h-9 w-full rounded-md border border-steel-200 px-3 text-[13px] text-graphite-800 focus:border-brand-500 focus:outline-none"
            />
          </div>
        </FormSection>

        <!-- Štítky -->
        <FormSection title="Štítky" icon="filter" tag="news-tags">
          <TagPicker v-model="form.tags" :options="PREDEFINED_TAGS" />
        </FormSection>

        <!-- Objekt v areálu (kanonická vazba na modul Areál — stejně jako u akce) -->
        <FormSection title="Objekt v areálu" icon="map" tag="news-area_id">
          <AppSelect v-model="areaModel" :options="areaOptions" />
          <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
            <Icon name="map" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
            Napojí aktualitu na objekt v areálu (např. Bolt Tower) — na webu se pak zobrazí u daného objektu. Nepovinné.
          </p>
        </FormSection>

        <!-- Kategorie (obsahové štítky — sdílený TagPicker) -->
        <FormSection title="Kategorie" icon="layers" tag="news-categories">
          <TagPicker
            v-model="form.categories"
            :options="PREDEFINED_CATEGORIES"
            add-label="Přidat kategorii"
            empty-label="Zatím žádné kategorie."
            color-label="Barva kategorie"
          />
        </FormSection>

        <!-- Související prohlídky (vazba na modul Prohlídky) -->
        <FormSection title="Související prohlídky" icon="ticket" tag="news-tours">
          <RelationPicker
            v-model="form.tourIds"
            :items="tourItems"
            add-label="Přidat prohlídku"
            empty-label="Zatím žádné prohlídky."
            search-placeholder="Hledat prohlídku…"
            icon="ticket"
          />
        </FormSection>

        <!-- Jazykové mutace přehled -->
        <FormSection title="Jazykové mutace" icon="globe" tag="ML">
          <ul class="space-y-1.5">
            <li
              v-for="l in LANGS"
              :key="l.code"
              class="flex items-center justify-between rounded-md px-2.5 py-2 transition-colors"
              :class="activeLang === l.code ? 'bg-brand-50' : 'hover:bg-steel-50'"
            >
              <button class="flex items-center gap-2.5 text-left" @click="activeLang = l.code">
                <span>{{ l.flag }}</span>
                <span class="text-[13px] font-500 text-graphite-800">{{ l.label }}</span>
              </button>
              <span
                class="inline-flex items-center gap-1.5 font-mono text-[10.5px]"
                :class="langFilled(l.code) ? 'text-forge-600' : 'text-steel-400'"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="langFilled(l.code) ? 'bg-forge-500' : 'bg-steel-300'" />
                {{ langFilled(l.code) ? 'vyplněno' : 'prázdné' }}
              </span>
            </li>
          </ul>

          <!-- AI překlad (prototyp) -->
          <div class="mt-4 border-t border-steel-100 pt-4">
            <AppButton
              variant="primary"
              size="sm"
              class="w-full"
              :disabled="translating || !sourceReady"
              @click="translateAll"
            >
              <Icon name="sparkles" :size="15" :class="translating && 'animate-pulse'" />
              {{ translating ? 'Překládám…' : 'Přeložit z CZ přes AI' }}
            </AppButton>
            <p class="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-steel-500">
              <Icon name="sparkles" :size="13" class="mt-0.5 shrink-0 text-brand-500" />
              <span v-if="sourceReady">Vyplní mutace EN, DE, PL ze zdrojové české verze.</span>
              <span v-else>Nejdřív vyplňte českou verzi — z ní se překládá.</span>
            </p>
          </div>
        </FormSection>

        <!-- Obsah přehled -->
        <FormSection title="Obsah" icon="reference">
          <dl class="space-y-2.5 text-[13px]">
            <div class="flex items-center justify-between">
              <dt class="flex items-center gap-2 text-steel-500"><Icon name="image" :size="15" /> Fotografie</dt>
              <dd class="font-mono font-600 text-graphite-800">{{ form.gallery.length }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="flex items-center gap-2 text-steel-500"><Icon name="paperclip" :size="15" /> Přílohy</dt>
              <dd class="font-mono font-600 text-graphite-800">{{ form.attachments.length }}</dd>
            </div>
            <div class="flex items-center justify-between">
              <dt class="flex items-center gap-2 text-steel-500"><Icon name="link" :size="15" /> Video</dt>
              <dd class="font-mono font-600" :class="form.videoLink ? 'text-forge-600' : 'text-steel-400'">
                {{ form.videoLink ? 'ano' : '—' }}
              </dd>
            </div>
          </dl>
        </FormSection>
      </aside>
    </div>

    <!-- Toast (potvrzení AI akce) -->
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0 translate-y-2"
      leave-active-class="transition duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="toast"
        class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2.5 rounded-lg bg-graphite-900 px-4 py-3 text-[13px] font-500 text-white shadow-2xl"
      >
        <Icon name="sparkles" :size="16" class="text-brand-400" />
        {{ toast }}
      </div>
    </Transition>
  </div>
</template>
